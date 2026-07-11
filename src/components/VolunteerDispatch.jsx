import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { useStadiumContext } from '../context/StadiumContext';
import { COLORS, PRIORITY_COLORS, PRIORITY_BG, LANG_FLAGS } from '../utils/styles';
import { getLoadBarColor } from '../utils/helpers';

const VOLUNTEER_STATUS_COLORS = {
  available: 'var(--color-status-nominal)',
  busy: 'var(--color-status-critical)',
  default: 'var(--color-status-busy)',
};

/**
 * Load bar showing current vs max capacity with color-coded fill.
 * @param {{ current: number, max: number }} props
 */
const LoadBar = memo(function LoadBar({ current, max }) {
  const pct = Math.round((current / max) * 100);
  const color = getLoadBarColor(current, max);
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Load ${current} out of ${max}`}
    >
      <div className="density-bar flex-1" style={{ height: '5px' }}>
        <div className="density-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span
        className="text-xs font-mono font-bold shrink-0"
        style={{ color, width: '32px', textAlign: 'right' }}
      >
        {current}/{max}
      </span>
    </div>
  );
});

LoadBar.propTypes = {
  current: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
};

/**
 * Volunteer card displaying name, zone, load, languages and skills.
 * @param {{ vol: object }} props
 */
const VolunteerCard = memo(function VolunteerCard({ vol }) {
  const statusColor = VOLUNTEER_STATUS_COLORS[vol.status] || VOLUNTEER_STATUS_COLORS.default;
  return (
    <div
      className="card p-4 flex flex-col gap-2"
      role="listitem"
      aria-label={`Volunteer ${vol.name}, ${vol.status}`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
          style={{ background: COLORS.gradientNavy }}
        >
          {vol.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate" style={{ color: COLORS.onSurface }}>
              {vol.name}
            </span>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: statusColor }}
              role="status"
              aria-label={`Status: ${vol.status}`}
            />
          </div>
          <div className="text-xs" style={{ color: COLORS.outline }}>
            Zone: {vol.zone}
          </div>
        </div>
      </div>
      <LoadBar current={vol.currentLoad} max={vol.maxLoad} />
      <div className="flex flex-wrap gap-1">
        {vol.languages.map((l) => (
          <span
            key={l}
            className="text-xs px-1.5 py-0.5 rounded-md font-medium"
            style={{ background: COLORS.surface, color: COLORS.onSurfaceVariant }}
          >
            {LANG_FLAGS[l]} {l.toUpperCase()}
          </span>
        ))}
        {vol.skills.map((s) => (
          <span
            key={s}
            className="text-xs px-1.5 py-0.5 rounded-md"
            style={{ background: COLORS.infoContainer, color: COLORS.info }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
});

VolunteerCard.propTypes = {
  vol: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    zone: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    currentLoad: PropTypes.number.isRequired,
    maxLoad: PropTypes.number.isRequired,
    languages: PropTypes.arrayOf(PropTypes.string).isRequired,
    skills: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
};

/**
 * Task card with priority, AI suggestion, assign and resolve actions.
 * @param {{ task: object, volunteers: Array, onAssign: Function, onResolve: Function }} props
 */
const TaskCard = memo(function TaskCard({ task, volunteers, onAssign, onResolve }) {
  const [assigning, setAssigning] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const assignedVol = useMemo(
    () => volunteers.find((v) => v.id === task.assignedTo),
    [volunteers, task.assignedTo],
  );

  const eligibleVols = useMemo(
    () =>
      volunteers.filter(
        (v) =>
          v.languages.includes(task.requiredLanguage) &&
          v.skills.includes(task.requiredSkill) &&
          v.currentLoad < v.maxLoad &&
          v.status !== 'busy',
      ),
    [volunteers, task.requiredLanguage, task.requiredSkill],
  );

  const suggestBestVolunteer = useCallback(() => {
    setAssigning(true);
    setTimeout(() => {
      const best = eligibleVols.toSorted((a, b) => a.currentLoad - b.currentLoad)[0];
      setAiSuggestion(best || null);
      setAssigning(false);
    }, 900);
  }, [eligibleVols]);

  return (
    <div
      className={`card p-4 border-l-4 animate-fade-in-up ${task.status === 'resolved' ? 'opacity-50' : ''}`}
      style={{ borderLeftColor: PRIORITY_COLORS[task.priority] }}
      role="listitem"
      aria-label={`Task ${task.id}: ${task.priority} priority, ${task.status}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono font-bold" style={{ color: COLORS.outline }}>
              {task.id}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide"
              style={{
                background: PRIORITY_BG[task.priority],
                color: PRIORITY_COLORS[task.priority],
              }}
            >
              {task.priority}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: COLORS.surface, color: COLORS.onSurfaceVariant }}
            >
              {task.zone} Zone
            </span>
            {task.status === 'resolved' && <span className="badge-success">Done</span>}
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: COLORS.onSurface }}>
            {task.description}
          </p>
          <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.outline }}>
            <span>
              {LANG_FLAGS[task.requiredLanguage]} {task.requiredLanguage.toUpperCase()}
            </span>
            <span>·</span>
            <span>{task.requiredSkill}</span>
          </div>
        </div>
      </div>

      {/* Assigned */}
      {assignedVol && task.status !== 'resolved' && (
        <div
          className="flex items-center gap-2 mb-2 p-2 rounded-lg"
          style={{ background: COLORS.successContainer }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-sm icon-fill"
            style={{ color: COLORS.success }}
          >
            person_check
          </span>
          <span className="text-xs font-medium" style={{ color: COLORS.success }}>
            Assigned to {assignedVol.name}
          </span>
          <button
            onClick={() => onResolve(task.id)}
            className="btn-ghost text-xs py-1 px-2 ml-auto"
            aria-label="Mark task as completed"
          >
            Complete
          </button>
        </div>
      )}

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div
          className="flex items-center gap-2 mb-2 p-2 rounded-lg animate-fade-in-up"
          style={{ background: COLORS.primaryFixed, border: `1px solid ${COLORS.outlineVariant}` }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-sm icon-fill"
            style={{ color: COLORS.primaryContainer }}
          >
            smart_toy
          </span>
          <div className="flex-1 text-xs" style={{ color: COLORS.primaryContainer }}>
            <span className="font-semibold">AI Suggests: </span>
            {aiSuggestion.name} — {aiSuggestion.currentLoad}/{aiSuggestion.maxLoad} tasks, speaks{' '}
            {aiSuggestion.languages.join(', ').toUpperCase()}
          </div>
          <button
            onClick={() => {
              onAssign(task.id, aiSuggestion.id);
              setAiSuggestion(null);
            }}
            className="text-xs font-bold px-2 py-1 rounded-lg"
            style={{ background: COLORS.primaryContainer, color: COLORS.onPrimary }}
            aria-label={`Assign to ${aiSuggestion.name}`}
          >
            Assign
          </button>
        </div>
      )}

      {/* Actions */}
      {task.status === 'open' && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={suggestBestVolunteer}
            disabled={assigning || eligibleVols.length === 0}
            className="btn-primary text-xs py-1.5 px-3"
            aria-label="Assign task to best available volunteer"
          >
            {assigning ? (
              <>
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-sm animate-spin-slow"
                >
                  refresh
                </span>{' '}
                Analyzing…
              </>
            ) : (
              <>
                <span aria-hidden="true" className="material-symbols-outlined text-sm icon-fill">
                  smart_toy
                </span>{' '}
                AI Assign
              </>
            )}
          </button>
          {eligibleVols.length === 0 && (
            <span className="text-xs flex items-center" style={{ color: COLORS.error }}>
              <span aria-hidden="true" className="material-symbols-outlined text-sm mr-1">
                warning
              </span>
              No eligible volunteers
            </span>
          )}
        </div>
      )}
    </div>
  );
});

TaskCard.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    priority: PropTypes.string.isRequired,
    zone: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    requiredLanguage: PropTypes.string.isRequired,
    requiredSkill: PropTypes.string.isRequired,
    assignedTo: PropTypes.string,
  }).isRequired,
  volunteers: PropTypes.arrayOf(PropTypes.object).isRequired,
  onAssign: PropTypes.func.isRequired,
  onResolve: PropTypes.func.isRequired,
};

/**
 * Volunteer Dispatch panel — AI-powered task assignment and volunteer roster.
 */
function VolunteerDispatch() {
  const { contextData, assignVolunteer, resolveTask, emptyTrashBin, dispatchCleaningTask } =
    useStadiumContext();
  const { volunteers, tasks, stadium } = contextData;
  const trashBins = stadium?.sustainability?.trashBins || [];

  const openTasks = useMemo(() => tasks.filter((t) => t.status === 'open'), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter((t) => t.status === 'in-progress'), [tasks]);
  const resolvedTasks = useMemo(() => tasks.filter((t) => t.status === 'resolved'), [tasks]);
  const availableVols = useMemo(
    () => volunteers.filter((v) => v.currentLoad < v.maxLoad && v.status !== 'busy'),
    [volunteers],
  );

  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const topPriorityTask = useMemo(
    () =>
      tasks
        .filter((t) => t.status === 'open')
        .sort((a, b) => {
          const prio = { high: 3, medium: 2, low: 1 };
          return (prio[b.priority] || 0) - (prio[a.priority] || 0);
        })[0],
    [tasks],
  );

  useEffect(() => {
    if (!topPriorityTask) return;
    let cancelled = false;
    async function fetchRecommendation() {
      setIsAiLoading(true);
      try {
        const csrfRes = await fetch('/api/csrf-token');
        if (!csrfRes.ok) throw new Error('CSRF fetch failed');
        const { csrfToken } = await csrfRes.json();

        const volsSummary = availableVols
          .map(
            (v) =>
              `${v.name} (${v.zone}): loads ${v.currentLoad}/${v.maxLoad}, langs: ${v.languages.join(',')}, skills: ${v.skills.join(',')}`,
          )
          .join('\n');

        const message = `VOLUNTEER DISPATCH RECOMMENDATION for ${topPriorityTask.id}:
Task: ${topPriorityTask.description} | Priority: ${topPriorityTask.priority}
Zone: ${topPriorityTask.zone} | Required: ${topPriorityTask.requiredLanguage.toUpperCase()} + ${topPriorityTask.requiredSkill}

Available Volunteers:\n${volsSummary}

Recommend the single best volunteer for this task. Cite their name, zone, current load, and why they are the optimal choice.`;

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
          body: JSON.stringify({ message, contextData: { volunteers, tasks }, language: 'en' }),
        });

        if (res.ok && !cancelled) {
          const data = await res.json();
          setAiRecommendation(`**Auto-Recommendation for ${topPriorityTask.id}:** ` + data.reply);
        } else if (!cancelled) {
          const best = availableVols.toSorted((a, b) => a.currentLoad - b.currentLoad)[0];
          setAiRecommendation(
            best
              ? `**Local Match:** Assign ${best.name} (${best.zone}) — lowest load ${best.currentLoad}/${best.maxLoad}, speaks ${best.languages.join(', ').toUpperCase()}`
              : 'No eligible volunteers available for auto-assignment.',
          );
        }
      } catch {
        if (!cancelled) {
          const best = availableVols.toSorted((a, b) => a.currentLoad - b.currentLoad)[0];
          setAiRecommendation(
            best
              ? `**Local Match:** Assign ${best.name} (${best.zone}) — lowest load ${best.currentLoad}/${best.maxLoad}`
              : 'No eligible volunteers available.',
          );
        }
      } finally {
        if (!cancelled) setIsAiLoading(false);
      }
    }
    fetchRecommendation();
    return () => {
      cancelled = true;
    };
  }, [topPriorityTask, availableVols, volunteers, tasks]);

  // Sort bins by fullness descending for priority routing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sortedBins = useMemo(
    () => [...trashBins].sort((a, b) => b.fullness - a.fullness),
    // trashBins is derived from contextData.stadium.sustainability.trashBins;
    // depend on contextData to avoid stale sort when bins update
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contextData],
  );

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5" role="region" aria-label="Volunteer Dispatch">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-base mb-0.5" style={{ color: COLORS.onSurface }}>
            Volunteer Dispatch
          </h2>
          <p className="text-sm" style={{ color: COLORS.outline }}>
            AI-powered task assignment & volunteer management
          </p>
        </div>
        <div className="flex gap-3">
          <div className="text-center card px-4 py-2">
            <div className="text-xl font-bold" style={{ color: COLORS.error }}>
              {openTasks.length}
            </div>
            <div className="text-xs" style={{ color: COLORS.outline }}>
              Open Tasks
            </div>
          </div>
          <div className="text-center card px-4 py-2">
            <div className="text-xl font-bold" style={{ color: COLORS.success }}>
              {availableVols.length}
            </div>
            <div className="text-xs" style={{ color: COLORS.outline }}>
              Available
            </div>
          </div>
        </div>
      </div>

      {/* AI Dispatch Recommendation Banner */}
      {isAiLoading && (
        <div
          className="rounded-xl p-3 flex items-center gap-2 animate-fade-in-up"
          style={{ background: `${COLORS.primary}15`, border: `1px solid ${COLORS.primary}30` }}
        >
          <span
            className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full shrink-0"
            style={{ color: COLORS.primary }}
          />
          <span className="text-xs" style={{ color: COLORS.primaryContainer }}>
            Gemini is analyzing optimal task assignments...
          </span>
        </div>
      )}
      {aiRecommendation && !isAiLoading && (
        <div
          className="rounded-xl p-3 flex items-start gap-2 animate-fade-in-up"
          style={{ background: `${COLORS.secondary}12`, border: `1px solid ${COLORS.secondary}30` }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-sm shrink-0 mt-0.5 icon-fill"
            style={{ color: COLORS.secondary }}
          >
            recommend
          </span>
          <p className="text-xs whitespace-pre-line" style={{ color: COLORS.onSurfaceVariant }}>
            {aiRecommendation}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Task Board */}
        <div className="flex flex-col gap-4" role="list" aria-label="Task board">
          {/* Open */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="badge-critical">{openTasks.length} Open</span>
              <span className="text-sm font-semibold" style={{ color: COLORS.onSurface }}>
                Tasks requiring assignment
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {openTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  volunteers={volunteers}
                  onAssign={assignVolunteer}
                  onResolve={resolveTask}
                />
              ))}
              {openTasks.length === 0 && (
                <div className="card p-6 text-center" style={{ color: COLORS.outline }}>
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-3xl mb-2 block icon-fill"
                    style={{ color: COLORS.success }}
                  >
                    task_alt
                  </span>
                  All tasks assigned!
                </div>
              )}
            </div>
          </div>

          {/* In Progress */}
          {inProgressTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-warning">{inProgressTasks.length} In Progress</span>
              </div>
              <div className="flex flex-col gap-3">
                {inProgressTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    volunteers={volunteers}
                    onAssign={assignVolunteer}
                    onResolve={resolveTask}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resolved */}
          {resolvedTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-success">{resolvedTasks.length} Resolved</span>
              </div>
              <div className="flex flex-col gap-3">
                {resolvedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    volunteers={volunteers}
                    onAssign={assignVolunteer}
                    onResolve={resolveTask}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Predictive Waste Routing */}
        <div className="card p-5 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 mb-4">
            <span
              aria-hidden="true"
              className="material-symbols-outlined icon-fill"
              style={{ color: COLORS.success }}
            >
              delete_sweep
            </span>
            <span className="text-sm font-semibold" style={{ color: COLORS.onSurface }}>
              Predictive Waste Routing
            </span>
            <span
              className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono"
              style={{ background: `${COLORS.success}20`, color: COLORS.success }}
            >
              Live
            </span>
          </div>

          {sortedBins.length === 0 ? (
            <p className="text-xs" style={{ color: COLORS.outline }}>
              No bin data available.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedBins.map((bin) => {
                const urgentColor =
                  bin.fullness >= 90
                    ? COLORS.error
                    : bin.fullness >= 70
                      ? COLORS.warning
                      : COLORS.success;

                // Auto-suggest: pick available vol by proximity (zone keyword match)
                const suggestedCrew =
                  availableVols.find((v) =>
                    v.zone?.toLowerCase().includes(bin.zone.split(' ')[0].toLowerCase()),
                  ) || availableVols[0];

                const isDispatched = tasks.some(
                  (t) =>
                    t.description === `Empty trash bin at ${bin.zone}` &&
                    (t.status === 'in-progress' || t.status === 'open'),
                );

                return (
                  <div
                    key={bin.zone}
                    className="rounded-xl p-3"
                    style={{ background: COLORS.surfaceContainer }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold" style={{ color: COLORS.onSurface }}>
                          {bin.zone}
                        </p>
                        {bin.fullness >= 90 && (
                          <p className="text-[10px] font-semibold" style={{ color: COLORS.error }}>
                            ⚠️ OVERFLOW RISK — Dispatch immediately
                          </p>
                        )}
                        {suggestedCrew && (
                          <p className="text-[10px]" style={{ color: COLORS.outline }}>
                            AI: Send{' '}
                            <strong style={{ color: COLORS.secondary }}>
                              {suggestedCrew.name}
                            </strong>{' '}
                            (closest available)
                          </p>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <p className="text-xl font-bold font-mono" style={{ color: urgentColor }}>
                          {bin.fullness}%
                        </p>
                        <div className="flex gap-1.5">
                          {suggestedCrew && !isDispatched && (
                            <button
                              onClick={() => dispatchCleaningTask(bin.zone, suggestedCrew.id)}
                              className="text-[10px] px-2 py-1 rounded-lg font-semibold transition-all hover:scale-105"
                              style={{
                                background: COLORS.primary,
                                color: COLORS.onPrimary,
                                border: 'none',
                              }}
                            >
                              Dispatch Crew
                            </button>
                          )}
                          {isDispatched && (
                            <span
                              className="text-[10px] px-2 py-1 rounded-lg font-semibold"
                              style={{
                                background: `${COLORS.secondary}20`,
                                color: COLORS.secondary,
                                border: `1px solid ${COLORS.secondary}40`,
                              }}
                            >
                              ⏳ Dispatched
                            </span>
                          )}
                          <button
                            onClick={() => emptyTrashBin(bin.zone)}
                            className="text-[10px] px-2 py-1 rounded-lg font-semibold transition-all hover:scale-105"
                            style={{
                              background: `${urgentColor}20`,
                              color: urgentColor,
                              border: `1px solid ${urgentColor}40`,
                            }}
                          >
                            Mark Emptied
                          </button>
                        </div>
                      </div>
                    </div>
                    <div
                      className="density-bar"
                      style={{ height: '6px' }}
                      role="progressbar"
                      aria-valuenow={bin.fullness}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${bin.zone} bin ${bin.fullness}% full`}
                    >
                      <div
                        className="density-fill"
                        style={{
                          width: `${bin.fullness}%`,
                          background: urgentColor,
                          borderRadius: '4px',
                          transition: 'width 1s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Volunteer Roster */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              aria-hidden="true"
              className="material-symbols-outlined icon-fill"
              style={{ color: COLORS.primaryContainer }}
            >
              badge
            </span>
            <span className="text-sm font-semibold" style={{ color: COLORS.onSurface }}>
              Volunteer Roster
            </span>
            <span className="text-xs ml-auto" style={{ color: COLORS.outline }}>
              {volunteers.length} total
            </span>
          </div>
          {/* Volunteer roster — bounded height prevents layout issues with large rosters */}
          <div
            className="flex flex-col gap-3 overflow-y-auto custom-scrollbar"
            style={{ maxHeight: '480px' }}
            role="list"
            aria-label="Volunteer roster"
          >
            {volunteers.map((vol) => (
              <VolunteerCard key={vol.id} vol={vol} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(VolunteerDispatch);
