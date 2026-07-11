/**
 * Command Center Component - Real-time stadium operations dashboard
 * Displays KPIs, zone status, gate information, and active incidents.
 *
 * @component
 * @typedef {object} Incident
 * @property {string} id - Unique incident ID
 * @property {string} description - Human-readable description
 * @property {'critical'|'medium'|'low'} severity - Severity level
 * @property {'active'|'resolved'} status - Current status
 * @property {string} type - Incident category (crowd, medical, security, etc.)
 * @property {string} timestamp - ISO timestamp
 * @property {string} aiRecommendedAction - AI-suggested mitigation action
 */
import React, { useMemo, memo } from 'react';
import { useStadiumContext } from '../context/StadiumContext';
import { COLORS, ZONE_COLORS } from '../utils/styles';
import { generateXaiReasoning, generateGateReasoningLines } from '../utils/helpers';
import BeforeAfterImpact from './BeforeAfterImpact';
import StatusDot from './StatusDot';
import KPICard from './KPICard';
import GateRow from './GateRow';
import IncidentCard from './IncidentCard';

function CommandCenter() {
  const { contextData, resolveIncident, assignVolunteer, uiLanguage = 'en' } = useStadiumContext();
  const { gates, stadium, incidents } = contextData;

  const avgDensity = useMemo(
    () =>
      gates.length > 0
        ? Math.round((gates.reduce((s, g) => s + g.density, 0) / gates.length) * 100)
        : 0,
    [gates],
  );
  const occupancyPct = useMemo(
    () =>
      stadium.capacity > 0 ? Math.round((stadium.currentOccupancy / stadium.capacity) * 100) : 0,
    [stadium.currentOccupancy, stadium.capacity],
  );
  const activeIncidents = useMemo(
    () => incidents.filter((i) => i.status === 'active'),
    [incidents],
  );
  const criticalGates = useMemo(() => gates.filter((g) => g.status === 'critical'), [gates]);
  const recommendedGatesText = useMemo(() => {
    return gates
      .filter((g) => g.status === 'normal')
      .map((g) => g.id)
      .slice(0, 2)
      .join(', ');
  }, [gates]);

  const gateReasonings = useMemo(() => generateGateReasoningLines(gates), [gates]);
  const xaiSummary = useMemo(() => generateXaiReasoning(gates, uiLanguage), [gates, uiLanguage]);

  // Multilingual alerts map
  const alertTranslations = useMemo(() => {
    const criticalText = criticalGates.length > 1 ? 's' : '';
    const gatesList = criticalGates.map((g) => g.id).join(', ');
    return {
      en: {
        critical: `⚠️ CRITICAL: High congestion at Gate${criticalText} ${gatesList}`,
        recommend: `AI recommends redirecting fans to Gates ${recommendedGatesText}`,
      },
      es: {
        critical: `⚠️ CRÍTICO: Alta congestión en Puerta${criticalText} ${gatesList}`,
        recommend: `El IA recomienda redirigir a los aficionados a las Puertas ${recommendedGatesText}`,
      },
      fr: {
        critical: `⚠️ CRITIQUE: Forte congestion à la Porte${criticalText} ${gatesList}`,
        recommend: `L'IA recommande de rediriger les supporters vers les Portes ${recommendedGatesText}`,
      },
      ar: {
        critical: `⚠️ حرج: ازدحام شديد عند البوابة${criticalText} ${gatesList}`,
        recommend: `ينصح الذكاء الاصطناعي بتوجيه الجماهير إلى البوابات ${recommendedGatesText}`,
      },
      pt: {
        critical: `⚠️ CRÍTICO: Congestionamento alto no Portão${criticalText} ${gatesList}`,
        recommend: `O IA recomenda redirecionar os torcedores para os Portões ${recommendedGatesText}`,
      },
      ja: {
        critical: `⚠️ 危機的: ゲート${gatesList}で深刻な混雑が発生しています`,
        recommend: `AIはゲート${recommendedGatesText}への誘導を推奨しています`,
      },
      hi: {
        critical: `⚠️ गंभीर: गेट ${gatesList} पर अत्यधिक भीड़ है`,
        recommend: `AI प्रशंसकों को गेट ${recommendedGatesText} पर भेजने की सलाह देता है`,
      },
    };
  }, [criticalGates, recommendedGatesText]);

  const activeAlert = alertTranslations[uiLanguage] || alertTranslations.en;

  return (
    <div
      className="p-4 md:p-6 flex flex-col gap-5"
      role="region"
      aria-label="Command Center Dashboard"
    >
      {/* Alert Banner */}
      {criticalGates.length > 0 && (
        <div
          className="rounded-xl p-3.5 flex items-center gap-3 animate-slide-right"
          role="alert"
          aria-live="assertive"
          style={{
            background: COLORS.gradientCritical,
            boxShadow: '0 4px 20px rgba(198,40,40,0.3)',
          }}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-white icon-fill">
            campaign
          </span>
          <div>
            <p className="text-white font-bold text-sm">{activeAlert.critical}</p>
            <p className="text-white text-xs opacity-80">{activeAlert.recommend}</p>
            {xaiSummary && (
              <p className="text-white text-[10px] mt-1 opacity-70 italic">{xaiSummary}</p>
            )}
          </div>
        </div>
      )}

      {/* Before/After Impact Panel (Task 4) */}
      <BeforeAfterImpact />

      {/* KPI Cards */}
      <section
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        aria-label="Key Performance Indicators"
      >
        <KPICard
          label="Crowd Density"
          value={avgDensity}
          unit="%"
          icon="groups"
          color={COLORS.primary}
          delay={1}
          sub={`${criticalGates.length} critical gate${criticalGates.length !== 1 ? 's' : ''}`}
        />
        <KPICard
          label="Occupancy"
          value={occupancyPct}
          unit="%"
          icon="people"
          color={COLORS.tertiary}
          delay={2}
          sub={`${stadium.currentOccupancy.toLocaleString()} of ${stadium.capacity.toLocaleString()}`}
        />
        <KPICard
          label="Active Incidents"
          value={activeIncidents.length}
          icon="emergency"
          color={activeIncidents.length > 2 ? COLORS.error : COLORS.warning}
          delay={3}
          sub={`${incidents.filter((i) => i.status === 'resolved').length} resolved today`}
        />
        <KPICard
          label="Temperature"
          value={stadium.weather.temperature}
          unit="°C"
          icon="thermometer"
          color={COLORS.secondary}
          delay={4}
          sub={`${stadium.weather.conditions} · ${stadium.weather.humidity}% humidity`}
        />
      </section>

      {/* Zones + Gates */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        role="region"
        aria-label="Zone and Gate Status"
      >
        {/* Zone Occupancy */}
        <div className="card p-5 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-4">
            <span
              aria-hidden="true"
              className="material-symbols-outlined icon-fill"
              style={{ color: COLORS.primaryContainer }}
            >
              grid_view
            </span>
            <h2 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
              Zone Occupancy
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stadium.zones.map((zone) => {
              const zColor =
                ZONE_COLORS[
                  zone.status === 'nominal'
                    ? 'nominal'
                    : zone.status === 'busy'
                      ? 'busy'
                      : zone.status === 'moderate'
                        ? 'moderate'
                        : 'critical'
                ];
              return (
                <div
                  key={zone.id}
                  className="p-3 rounded-xl"
                  style={{ background: `${zColor.fill}12`, border: `1.5px solid ${zColor.fill}30` }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: COLORS.onSurfaceVariant }}
                    >
                      {zone.name}
                    </span>
                    <StatusDot
                      status={
                        zone.status === 'nominal'
                          ? 'resolved'
                          : zone.status === 'busy'
                            ? 'active'
                            : zone.status
                      }
                    />
                  </div>
                  <div className="text-2xl font-bold" style={{ color: zColor.fill }}>
                    {Math.round(zone.occupancy * 100)}%
                  </div>
                  <div className="density-bar mt-1.5">
                    <div
                      className="density-fill"
                      style={{
                        width: `${Math.round(zone.occupancy * 100)}%`,
                        background: zColor.fill,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gate Status */}
        <div className="card p-5 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 mb-4">
            <span
              aria-hidden="true"
              className="material-symbols-outlined icon-fill"
              style={{ color: COLORS.primaryContainer }}
            >
              sensor_door
            </span>
            <h2 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
              Gate Status
            </h2>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full font-mono"
              style={{ background: COLORS.warningContainer, color: COLORS.warning }}
            >
              Live
            </span>
          </div>
          <div className="flex flex-col">
            {gates.map((gate, idx) => (
              <div
                key={gate.id}
                style={{ borderTop: idx > 0 ? `1px solid ${COLORS.surface}` : 'none' }}
              >
                <GateRow
                  gate={gate}
                  reasoning={gateReasonings.find((r) => r.gateId === gate.id)?.text}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incident Feed */}
      <div
        className="animate-fade-in-up stagger-4"
        role="region"
        aria-label="Incident feed"
        aria-live="assertive"
        aria-relevant="additions removals"
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            aria-hidden="true"
            className="material-symbols-outlined icon-fill"
            style={{ color: COLORS.error }}
          >
            emergency
          </span>
          <h2 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
            Active Incidents
          </h2>
          <span className="badge-critical ml-1" aria-live="polite" aria-atomic="true">
            {activeIncidents.length} active
          </span>
        </div>
        {/* Incident list — bounded height prevents layout thrashing with large incident volumes */}
        <div
          className="flex flex-col gap-3 overflow-y-auto custom-scrollbar"
          style={{ maxHeight: '520px' }}
        >
          {incidents.map((inc, idx) => (
            <IncidentCard
              key={inc.id}
              incident={inc}
              onResolve={resolveIncident}
              contextData={contextData}
              onAssignVolunteer={assignVolunteer}
              autoQuery={idx === 0 && inc.status === 'active' && inc.severity === 'critical'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(CommandCenter);
