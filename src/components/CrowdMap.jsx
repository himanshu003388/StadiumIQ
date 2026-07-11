/**
 * Crowd & Navigation Map Component
 * Interactive SVG stadium map with keyboard navigation and gate wayfinding.
 * @component
 *
 * @typedef {object} Zone
 * @property {string} id - Zone identifier (north/south/east/west)
 * @property {string} name - Display name
 * @property {number} occupancy - Occupancy ratio 0–1
 * @property {number} capacity - Maximum fan capacity
 * @property {string} status - 'nominal' | 'moderate' | 'busy' | 'critical'
 *
 * @typedef {object} Gate
 * @property {string} id - Gate letter (A–F)
 * @property {string} direction - Compass direction
 * @property {number} density - Crowd density 0–1
 * @property {number} waitTimeMinutes - Estimated wait time
 * @property {string} status - 'normal' | 'watch' | 'critical'
 * @property {boolean} accessible - Wheelchair accessible
 * @property {string[]} [accessibleFeatures] - List of accessibility features
 */
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useStadiumContext } from '../context/StadiumContext';
import { COLORS, ZONE_COLORS, GATE_STATUS_COLORS } from '../utils/styles';
import { generateXaiReasoning } from '../utils/helpers';
import StadiumSVG from './StadiumSVG';

/**
 * Crowd map main component
 */
function CrowdMap() {
  const { contextData } = useStadiumContext();
  const { gates, stadium } = contextData;
  const [selectedZone, setSelectedZone] = useState();
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const handleZoneClick = useCallback((zone) => {
    setSelectedZone((prev) => (prev === zone.id ? undefined : zone.id));
  }, []);

  const selectedZoneData = selectedZone
    ? stadium.zones.find((z) => z.id === selectedZone)
    : undefined;
  const bestGate = useMemo(() => [...gates].sort((a, b) => a.density - b.density)[0], [gates]);
  const worstGate = useMemo(() => [...gates].sort((a, b) => b.density - a.density)[0], [gates]);
  const worstZone = useMemo(
    () => [...stadium.zones].sort((a, b) => b.occupancy - a.occupancy)[0],
    [stadium.zones],
  );
  const xaiReasoning = useMemo(() => generateXaiReasoning(gates), [gates]);

  const [egressAdvice, setEgressAdvice] = useState(null);
  const [isEgressLoading, setIsEgressLoading] = useState(false);

  const handleQueryEgress = useCallback(async () => {
    setIsEgressLoading(true);
    setEgressAdvice(null);
    try {
      const csrfRes = await fetch('/api/csrf-token');
      if (!csrfRes.ok) throw new Error('CSRF fetch failed');
      const { csrfToken } = await csrfRes.json();

      const gatesSummary = gates
        .map(
          (g) =>
            `Gate ${g.id} (${g.direction}): ${Math.round(g.density * 100)}% full, ${g.waitTimeMinutes}min wait, status: ${g.status}`,
        )
        .join('\n');
      const zonesSummary = stadium.zones
        .map((z) => `${z.name}: ${Math.round(z.occupancy * 100)}% occupancy, status: ${z.status}`)
        .join('\n');

      const message = `PREDICTIVE EGRESS ROUTING REQUEST:

Current Gate Status:\n${gatesSummary}

Zone Occupancy:\n${zonesSummary}

Match phase: ${stadium.matchPhase}. Fans are beginning to leave or entering for the second half.

Alex needs a precise reasoning-backed routing plan:
1. Which gate(s) should fans be directed to RIGHT NOW and WHY (cite exact density %, wait time, and estimated time saved vs alternatives)?
2. Which zones are at risk of becoming critical in the next 10 minutes?
3. What specific signage or public announcement instruction should Alex broadcast?
Be highly specific with numbers. Use bullet points.`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          message,
          contextData: { gates, stadium },
          language: 'en',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEgressAdvice(data.reply);
      } else {
        // Offline fallback: compute locally
        const sorted = [...gates].sort((a, b) => a.density - b.density);
        const top2 = sorted.slice(0, 2);
        const critical = gates.filter((g) => g.status === 'critical');
        setEgressAdvice(
          `**Recommended Egress Route (Local Analysis):**\n` +
            `• Route fans to Gate ${top2[0].id} (${top2[0].direction}) — ${Math.round(top2[0].density * 100)}% full, only ${top2[0].waitTimeMinutes}min wait.\n` +
            (top2[1]
              ? `• Secondary: Gate ${top2[1].id} (${top2[1].direction}) — ${Math.round(top2[1].density * 100)}% full, ${top2[1].waitTimeMinutes}min wait.\n`
              : '') +
            (critical.length > 0
              ? `• ⚠️ AVOID Gate(s) ${critical.map((g) => g.id).join(', ')} — currently CRITICAL capacity.`
              : ''),
        );
      }
    } catch {
      const sorted = [...gates].sort((a, b) => a.density - b.density);
      const best = sorted[0];
      const critical = gates.filter((g) => g.status === 'critical');
      setEgressAdvice(
        `**Local Egress Fallback:**\n• Direct fans to Gate ${best.id} — lowest density at ${Math.round(best.density * 100)}%.` +
          (critical.length > 0
            ? `\n• Avoid: Gate(s) ${critical.map((g) => g.id).join(', ')} (CRITICAL).`
            : ''),
      );
    } finally {
      setIsEgressLoading(false);
    }
  }, [gates, stadium]);

  return (
    <div
      className="p-4 md:p-6 flex flex-col gap-5"
      role="region"
      aria-label="Crowd and navigation map"
    >
      <div>
        <h2 className="font-bold text-base mb-0.5" style={{ color: COLORS.onSurface }}>
          Crowd & Navigation
        </h2>
        <p className="text-sm" style={{ color: COLORS.outline }}>
          Live stadium map · Use arrow keys to navigate zones, Enter to select
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map */}
        <div
          className="lg:col-span-2 card p-5 animate-fade-in-up"
          role="group"
          aria-label="Interactive stadium map"
        >
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
              {stadium.name}
            </span>
            <div className="flex items-center gap-1.5 ml-auto">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: COLORS.error }}
              />
              <span className="text-xs font-medium" style={{ color: COLORS.error }}>
                Live
              </span>
            </div>
          </div>

          {/* Legend */}
          <div
            className="flex items-center gap-3 flex-wrap mb-3"
            role="list"
            aria-label="Zone status legend"
          >
            {Object.entries(ZONE_COLORS).map(([key, c]) => (
              <div key={key} className="flex items-center gap-1.5" role="listitem">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: c.fill }}
                  aria-hidden="true"
                />
                <span className="text-xs" style={{ color: COLORS.onSurfaceVariant }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>

          <StadiumSVG
            zones={stadium.zones}
            gates={gates}
            onZoneClick={handleZoneClick}
            selectedZone={selectedZone}
            reducedMotion={reducedMotion}
          />

          {/* Selected Zone Detail */}
          {selectedZoneData && (
            <div
              className="mt-4 p-4 rounded-xl animate-fade-in-up"
              role="region"
              aria-label={`${selectedZoneData.name} details`}
              style={{
                background: (ZONE_COLORS[selectedZoneData.status] || ZONE_COLORS.nominal).bg,
                border: `1.5px solid ${(ZONE_COLORS[selectedZoneData.status] || ZONE_COLORS.nominal).fill}40`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="font-bold text-sm"
                  style={{
                    color: (ZONE_COLORS[selectedZoneData.status] || ZONE_COLORS.nominal).text,
                  }}
                >
                  {selectedZoneData.name}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: (ZONE_COLORS[selectedZoneData.status] || ZONE_COLORS.nominal).fill,
                    color: 'white',
                  }}
                >
                  {(ZONE_COLORS[selectedZoneData.status] || ZONE_COLORS.nominal).label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div
                    className="text-xl font-bold"
                    style={{
                      color: (ZONE_COLORS[selectedZoneData.status] || ZONE_COLORS.nominal).text,
                    }}
                  >
                    {Math.round(selectedZoneData.occupancy * 100)}%
                  </div>
                  <div className="text-xs" style={{ color: COLORS.outline }}>
                    Occupancy
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold" style={{ color: COLORS.onSurface }}>
                    {(selectedZoneData.capacity * selectedZoneData.occupancy).toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 },
                    )}
                  </div>
                  <div className="text-xs" style={{ color: COLORS.outline }}>
                    Fans
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold" style={{ color: COLORS.onSurface }}>
                    {((1 - selectedZoneData.occupancy) * selectedZoneData.capacity).toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 },
                    )}
                  </div>
                  <div className="text-xs" style={{ color: COLORS.outline }}>
                    Available
                  </div>
                </div>
              </div>
              {selectedZoneData.status === 'critical' && (
                <div
                  className="mt-2 flex items-center gap-2 text-xs"
                  role="alert"
                  style={{ color: COLORS.error }}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-sm icon-fill">
                    warning
                  </span>
                  Crowd control deployed. Avoid this zone if possible.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gates Panel */}
        <div className="flex flex-col gap-4">
          <div
            className="card p-4 animate-fade-in-up stagger-1"
            role="region"
            aria-label="Gate status panel"
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                aria-hidden="true"
                className="material-symbols-outlined icon-fill"
                style={{ color: COLORS.primaryContainer }}
              >
                sensor_door
              </span>
              <h3 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
                Gate Status
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              {gates.map((gate) => {
                const color = GATE_STATUS_COLORS[gate.status]?.bg || COLORS.success;
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('AT&T Stadium, Arlington, TX')}&travelmode=walking&q=${encodeURIComponent(`Gate ${gate.id} AT&T Stadium Arlington TX`)}`;
                return (
                  <div
                    key={gate.id}
                    className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ background: `${color}0f`, border: `1px solid ${color}28` }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: color }}
                    >
                      {gate.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="font-medium" style={{ color: COLORS.onSurface }}>
                          {gate.direction} — {gate.waitTimeMinutes}m wait
                        </span>
                        <span className="font-mono font-bold" style={{ color }}>
                          {Math.round(gate.density * 100)}%
                        </span>
                      </div>
                      <div className="density-bar" style={{ height: '4px' }}>
                        <div
                          className="density-fill"
                          style={{ width: `${gate.density * 100}%`, background: color }}
                        />
                      </div>
                      <div
                        className="flex justify-between text-[10px] mt-1 opacity-80"
                        style={{ color: COLORS.outline }}
                      >
                        <span>
                          CCTV:{' '}
                          {Math.round(
                            (gate.cctvCongestionIndex !== undefined
                              ? gate.cctvCongestionIndex
                              : gate.density * 0.95) * 100,
                          )}
                          %
                        </span>
                        <span>
                          Flow:{' '}
                          {gate.flowRatePerMin !== undefined
                            ? gate.flowRatePerMin
                            : Math.round(gate.density * 60 + 10)}
                          /m
                        </span>
                        <span>
                          Peak:{' '}
                          {gate.historicalPeakWaitMinutes !== undefined
                            ? gate.historicalPeakWaitMinutes
                            : Math.round(gate.waitTimeMinutes * 1.2 + 5)}
                          m
                        </span>
                      </div>
                    </div>
                    {gate.accessible && (
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-sm shrink-0 icon-fill"
                        style={{ color: COLORS.info }}
                        title="Wheelchair accessible"
                        aria-label="Wheelchair accessible"
                      >
                        accessible
                      </span>
                    )}
                    {gate.accessibleFeatures?.includes('hearing-loop') && (
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-sm shrink-0 icon-fill"
                        style={{ color: COLORS.secondary }}
                        title="Hearing loop available"
                        aria-label="Hearing loop available"
                      >
                        hearing
                      </span>
                    )}
                    {/* Navigate to Gate button */}
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Navigate to Gate ${gate.id} via Google Maps`}
                      title={`Navigate to Gate ${gate.id}`}
                      className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md"
                      style={{ background: `${COLORS.primary}22`, color: COLORS.primary }}
                    >
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined icon-fill"
                        style={{ fontSize: '14px' }}
                      >
                        directions
                      </span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Predictive Egress Routing Advisor */}
          <div
            className="card p-4 animate-fade-in-up stagger-2"
            style={{ background: COLORS.gradientNavy, border: 'none' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-white icon-fill"
                style={{ fontSize: '20px' }}
              >
                alt_route
              </span>
              <span className="text-white font-bold text-sm">Predictive Egress Advisor</span>
              <span
                className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
              >
                XAI
              </span>
            </div>

            {/* Quick Gate Summary */}
            <div className="mb-3">
              <p className="text-xs mb-1" style={{ color: 'rgba(168,202,255,0.9)' }}>
                🟢 Fastest: <strong className="text-white">Gate {bestGate.id}</strong> —{' '}
                {bestGate.waitTimeMinutes}min wait ({Math.round(bestGate.density * 100)}% full)
              </p>
              <p className="text-xs mb-1" style={{ color: 'rgba(168,202,255,0.9)' }}>
                🔴 Heaviest: <strong className="text-white">Gate {worstGate.id}</strong> (
                {worstGate.direction}) at {Math.round(worstGate.density * 100)}% —{' '}
                {worstGate.waitTimeMinutes}min wait
              </p>
              {xaiReasoning && (
                <p
                  className="text-[10px] italic flex items-start gap-1"
                  style={{ color: 'rgba(168,202,255,0.7)' }}
                >
                  <span
                    className="material-symbols-outlined text-[10px] shrink-0 mt-px"
                    aria-hidden="true"
                  >
                    psychology_alt
                  </span>
                  <span>{xaiReasoning}</span>
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: 'rgba(168,202,255,0.9)' }}>
                🔴 Heaviest zone: <strong className="text-white">{worstZone.name}</strong> at{' '}
                {Math.round(worstZone.occupancy * 100)}% capacity
              </p>
            </div>

            {/* Dynamic AI Reasoning Output */}
            {egressAdvice && (
              <div
                className="rounded-lg p-3 mb-3 text-xs whitespace-pre-line"
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  color: 'rgba(200,220,255,0.95)',
                  lineHeight: 1.6,
                }}
                aria-live="polite"
              >
                {egressAdvice}
              </div>
            )}

            <button
              onClick={handleQueryEgress}
              disabled={isEgressLoading}
              className="w-full text-xs py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: isEgressLoading ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.18)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              {isEgressLoading ? (
                <>
                  <span className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full" />
                  Gemini is reasoning...
                </>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined icon-fill"
                    style={{ fontSize: '14px' }}
                  >
                    psychology
                  </span>
                  {egressAdvice ? 'Re-analyze Egress' : 'Query Egress Routing AI'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(CrowdMap);
