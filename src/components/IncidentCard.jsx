import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { COLORS } from '../utils/styles';
import { INCIDENT_ICON_MAP } from '../utils/constants';
import { timeAgo, getSeverityColor, generateIncidentReasoning } from '../utils/helpers';
import SeverityBadge from './SeverityBadge';

/**
 * Incident card component with dynamic AI reasoning
 * @param {object} props - Component props
 * @param {object} props.incident - Incident data
 * @param {function} props.onResolve - Resolve callback
 * @param {object} props.contextData - Full stadium context for AI reasoning
 * @param {function} props.onAssignVolunteer - Volunteer assignment callback
 * @param {boolean} props.autoQuery - Auto-trigger AI analysis on mount
 */
const IncidentCard = memo(function IncidentCard({
  incident,
  onResolve,
  contextData,
  onAssignVolunteer,
  autoQuery,
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [suggestedVolunteer, setSuggestedVolunteer] = useState(null);

  const severityColor = getSeverityColor(incident.severity);
  const severityBg =
    incident.severity === 'critical'
      ? 'var(--color-error-container)'
      : incident.severity === 'medium'
        ? 'var(--color-warning-container)'
        : 'var(--color-info-container)';

  // Find best matching volunteer using local scoring (O(n) over volunteers)
  const incidentReasoning = useMemo(
    () => generateIncidentReasoning(incident, contextData?.volunteers || []),
    [incident, contextData?.volunteers],
  );

  const findBestVolunteer = useCallback(() => {
    if (!contextData?.volunteers) return null;
    const available = contextData.volunteers.filter(
      (v) => v.status !== 'busy' && v.currentLoad < v.maxLoad,
    );
    if (available.length === 0) return null;

    const scored = available.map((v) => {
      let score = 0;
      // Zone proximity — same zone is highest value
      const zoneKeyword = incident.zone?.split(' ')[0].toLowerCase();
      if (v.zone?.toLowerCase().includes(zoneKeyword)) score += 10;
      // Skill match
      const requiredSkill =
        incident.type === 'medical'
          ? 'first-aid'
          : incident.type === 'crowd'
            ? 'crowd-control'
            : incident.type === 'security'
              ? 'security'
              : incident.type === 'equipment'
                ? 'tech-support'
                : 'guest-services';
      if (v.skills?.includes(requiredSkill)) score += 8;
      // Workload — lighter load is better
      score += (v.maxLoad - v.currentLoad) * 2;
      return { volunteer: v, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.volunteer || null;
  }, [contextData, incident]);

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    setSuggestedVolunteer(null);

    // Always run local volunteer matching (O(n))
    const bestV = findBestVolunteer();
    setSuggestedVolunteer(bestV);

    try {
      const csrfRes = await fetch('/api/csrf-token');
      if (!csrfRes.ok) throw new Error('CSRF fetch failed');
      const { csrfToken } = await csrfRes.json();

      const safeCtx = {
        gates: contextData?.gates?.map((g) => ({
          id: g.id,
          density: g.density,
          waitTimeMinutes: g.waitTimeMinutes,
          status: g.status,
        })),
        incidents: [
          {
            id: incident.id,
            type: incident.type,
            zone: incident.zone,
            severity: incident.severity,
            description: incident.description,
          },
        ],
        volunteers: contextData?.volunteers?.map((v) => ({
          id: v.id,
          name: v.name,
          zone: v.zone,
          skills: v.skills,
          currentLoad: v.currentLoad,
          maxLoad: v.maxLoad,
        })),
        stadium: {
          name: contextData?.stadium?.name,
          capacity: contextData?.stadium?.capacity,
          currentOccupancy: contextData?.stadium?.currentOccupancy,
        },
      };

      const message = `INCIDENT ANALYSIS REQUIRED for ${incident.id}:
Type: ${incident.type} | Zone: ${incident.zone} | Severity: ${incident.severity}
Description: ${incident.description}

Provide:
1. Root cause analysis (2 lines max)
2. Immediate action steps with specific volunteer/resource assignments — cite zone, names, and reason why
3. Predicted escalation risk if not handled in 5 minutes
Be direct and authoritative. Alex needs this NOW.`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ message, contextData: safeCtx, language: 'en' }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.reply || incident.aiRecommendedAction);
      } else {
        setAiAnalysis(incident.aiRecommendedAction);
      }
    } catch {
      setAiAnalysis(incident.aiRecommendedAction);
    } finally {
      setIsAnalyzing(false);
    }
  }, [incident, contextData, findBestVolunteer]);

  const autoQueryRan = useRef(false);
  useEffect(() => {
    if (autoQuery && !autoQueryRan.current) {
      autoQueryRan.current = true;
      handleAnalyze();
    }
  }, [autoQuery, handleAnalyze]);

  return (
    <div
      className={`card p-4 animate-fade-in-up border-l-4 ${incident.status === 'resolved' ? 'opacity-60' : ''}`}
      style={{ borderLeftColor: severityColor }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
          style={{ background: severityBg }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined icon-fill text-xl"
            style={{ color: severityColor }}
          >
            {INCIDENT_ICON_MAP[incident.type] || 'warning'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono font-bold" style={{ color: COLORS.outline }}>
              {incident.id}
            </span>
            <SeverityBadge severity={incident.severity} />
            {incident.status === 'resolved' && <span className="badge-success">Resolved</span>}
            <span className="text-xs ml-auto" style={{ color: COLORS.outline }}>
              {timeAgo(incident.timestamp)}
            </span>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: COLORS.onSurface }}>
            {incident.description}
          </p>
          <div
            className="flex items-start gap-1.5 p-2 rounded-lg"
            style={{ background: COLORS.surface }}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined icon-fill text-sm shrink-0 mt-0.5"
              style={{ color: COLORS.primaryContainer }}
            >
              smart_toy
            </span>
            <p className="text-xs whitespace-pre-line" style={{ color: COLORS.onSurfaceVariant }}>
              <span className="font-semibold" style={{ color: COLORS.primaryContainer }}>
                AI Action:{' '}
              </span>
              {aiAnalysis || incident.aiRecommendedAction}
            </p>
          </div>

          {/* XAI Reasoning Line */}
          {incident.status === 'active' && incidentReasoning && (
            <div
              className="mt-1.5 text-[10px] italic flex items-start gap-1"
              style={{ color: COLORS.outline }}
            >
              <span
                className="material-symbols-outlined text-[10px] shrink-0 mt-px"
                aria-hidden="true"
              >
                psychology_alt
              </span>
              <span>{incidentReasoning}</span>
            </div>
          )}

          {/* Suggested Volunteer Panel */}
          {suggestedVolunteer && (
            <div
              className="mt-2 flex items-center gap-2 p-2 rounded-lg border"
              style={{ background: `${COLORS.secondary}12`, borderColor: `${COLORS.secondary}30` }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: COLORS.secondary, color: COLORS.onSecondary }}
              >
                {suggestedVolunteer.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold" style={{ color: COLORS.onSurface }}>
                  Best Match: {suggestedVolunteer.name}
                </p>
                <p className="text-[10px]" style={{ color: COLORS.outline }}>
                  {suggestedVolunteer.zone} · Load {suggestedVolunteer.currentLoad}/
                  {suggestedVolunteer.maxLoad} · {suggestedVolunteer.skills?.join(', ')}
                </p>
              </div>
              <button
                className="shrink-0 text-[11px] px-2 py-1 rounded-lg font-semibold"
                style={{ background: COLORS.secondary, color: COLORS.onSecondary }}
                onClick={() =>
                  onAssignVolunteer && onAssignVolunteer(incident.id, suggestedVolunteer.id)
                }
              >
                Dispatch
              </button>
            </div>
          )}
        </div>
      </div>
      {incident.status === 'active' && (
        <div className="mt-3 flex justify-end gap-2">
          {!aiAnalysis && !isAnalyzing && (
            <button
              className="btn-ghost text-xs py-1.5 px-3"
              onClick={handleAnalyze}
              aria-label={`Query AI analysis for ${incident.id}`}
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined icon-fill text-sm"
                style={{ color: COLORS.primary }}
              >
                psychology
              </span>
              Query AI Advisor
            </button>
          )}
          {isAnalyzing && (
            <span className="text-xs flex items-center gap-1.5" style={{ color: COLORS.outline }}>
              <span className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
              Analyzing...
            </span>
          )}
          <button className="btn-ghost text-xs py-1.5 px-3" onClick={() => onResolve(incident.id)}>
            <span aria-hidden="true" className="material-symbols-outlined text-sm">
              check_circle
            </span>
            Mark Resolved
          </button>
        </div>
      )}
    </div>
  );
});

IncidentCard.propTypes = {
  incident: PropTypes.object.isRequired,
  onResolve: PropTypes.func.isRequired,
  contextData: PropTypes.object.isRequired,
  onAssignVolunteer: PropTypes.func.isRequired,
  autoQuery: PropTypes.bool,
};

export default IncidentCard;
