/**
 * Transport Hub Component
 * Post-match departure options with AI recommendations, eco sorting, and navigation.
 * @module TransportHub
 */
import React, { useState, useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { useStadiumContext } from '../context/StadiumContext';
import { COLORS, TRANSPORT_ICONS } from '../utils/styles';
import { ECO_SCORE_THRESHOLDS } from '../utils/constants';
import { getCO2Color, getCapacityColor } from '../utils/helpers';

/**
 * @typedef {object} TransportOption
 * @property {string} id - Unique transport option ID
 * @property {string} type - Transport mode (e.g. 'Subway', 'Bus')
 * @property {string} line - Route/line name
 * @property {number} etaMinutes - Estimated departure time in minutes
 * @property {number} co2e - CO₂ emissions in g/km
 * @property {number} capacityLeft - Remaining seats
 * @property {boolean} recommended - Whether AI recommends this option
 * @property {string} [icon] - Material symbol icon name
 */

/**
 * Eco score badge based on CO₂ emissions.
 * @param {{ co2e: number }} props
 */
const EcoScore = memo(function EcoScore({ co2e }) {
  if (co2e === ECO_SCORE_THRESHOLDS.zero)
    return <span className="badge-success">Zero Emission</span>;
  if (co2e <= ECO_SCORE_THRESHOLDS.low) return <span className="badge-success">Eco ♻️</span>;
  if (co2e <= ECO_SCORE_THRESHOLDS.moderate) return <span className="badge-info">Low CO₂</span>;
  if (co2e <= ECO_SCORE_THRESHOLDS.high) return <span className="badge-warning">Moderate</span>;
  return <span className="badge-critical">High CO₂</span>;
});

EcoScore.propTypes = {
  co2e: PropTypes.number.isRequired,
};

/**
 * CO₂ impact bar with color-coded fill.
 * @param {{ co2e: number, maxCo2?: number }} props
 */
const CO2Bar = memo(function CO2Bar({ co2e, maxCo2 = 50 }) {
  const pct = Math.min((co2e / maxCo2) * 100, 100);
  const color = getCO2Color(co2e);
  return (
    <div
      className="density-bar"
      style={{ height: '5px' }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`CO₂ impact at ${Math.round(pct)}%`}
    >
      <div className="density-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
});

CO2Bar.propTypes = {
  co2e: PropTypes.number.isRequired,
  maxCo2: PropTypes.number,
};

/**
 * Capacity indicator showing remaining seats with color coding.
 * @param {{ left: number }} props
 */
const CapacityIndicator = memo(function CapacityIndicator({ left }) {
  const color = getCapacityColor(left);
  return (
    <span
      className="text-xs font-medium"
      style={{ color }}
      role="status"
      aria-live="polite"
      aria-label={`${left} seats left`}
    >
      {left <= 5 ? '⚠️' : '✓'} {left} seats left
    </span>
  );
});

CapacityIndicator.propTypes = {
  left: PropTypes.number.isRequired,
};

/**
 * Transport Hub panel — post-match departure options with sorting and eco insights.
 */
function TransportHub() {
  const { contextData, deployShuttle, divertSurgeRideshare, increaseTrainFrequency, role } =
    useStadiumContext();
  const { transportOptions, stadium } = contextData;
  const [sortBy, setSortBy] = useState('recommended');
  const [sortAnnouncement, setSortAnnouncement] = useState('');

  const handleSortChange = useCallback((key, label) => {
    setSortBy(key);
    setSortAnnouncement(`Transport options sorted by ${label}`);
  }, []);

  const sorted = useMemo(
    () =>
      [...transportOptions].sort((a, b) => {
        if (sortBy === 'recommended') return (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0);
        if (sortBy === 'eta') return a.etaMinutes - b.etaMinutes;
        if (sortBy === 'eco') return a.co2e - b.co2e;
        if (sortBy === 'capacity') return b.capacityLeft - a.capacityLeft;
        return 0;
      }),
    [transportOptions, sortBy],
  );

  const bestEco = useMemo(
    () => [...transportOptions].sort((a, b) => a.co2e - b.co2e)[0],
    [transportOptions],
  );
  const fastest = useMemo(
    () => [...transportOptions].sort((a, b) => a.etaMinutes - b.etaMinutes)[0],
    [transportOptions],
  );

  const showControlPanel = role === 'Organizer' || role === 'Staff';

  /**
   * Opens Google Maps navigation to the stadium with a deep-link.
   * Falls back to a generic maps search if coordinates are unavailable.
   * @param {string} type - Transport mode label
   * @param {string} line - Route/line name
   */
  const handleNavigate = useCallback((type, line) => {
    // AT&T Stadium, Arlington TX — hardcoded for FIFA WC 2026 quarter-final venue
    const STADIUM_LAT = 32.7479;
    const STADIUM_LNG = -97.0945;
    const STADIUM_NAME = encodeURIComponent('AT&T Stadium, Arlington, TX');
    const destination = `${STADIUM_LAT},${STADIUM_LNG}`;
    const query = encodeURIComponent(`${type} ${line} to AT&T Stadium Arlington TX`);

    // Use Google Maps directions on mobile/desktop, falling back to query search
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const url = isMobile
      ? `https://maps.google.com/?saddr=My+Location&daddr=${destination}&mode=transit`
      : `https://www.google.com/maps/dir/?api=1&destination=${STADIUM_NAME}&travelmode=transit&q=${query}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5" role="region" aria-label="Transport Hub">
      <div>
        <h2 className="font-bold text-base mb-0.5" style={{ color: COLORS.onSurface }}>
          Transport Hub
        </h2>
        <p className="text-sm" style={{ color: COLORS.outline }}>
          Post-match departure options · Real-time availability
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center animate-fade-in-up stagger-1">
          <div className="text-2xl font-bold" style={{ color: COLORS.primary }}>
            {fastest.etaMinutes}m
          </div>
          <div className="text-xs mt-1" style={{ color: COLORS.outline }}>
            Fastest Option
          </div>
          <div className="text-xs font-medium mt-0.5" style={{ color: COLORS.onSurfaceVariant }}>
            {fastest.type}
          </div>
        </div>
        <div className="card p-4 text-center animate-fade-in-up stagger-2">
          <div className="text-2xl font-bold" style={{ color: COLORS.success }}>
            {bestEco.co2e}g
          </div>
          <div className="text-xs mt-1" style={{ color: COLORS.outline }}>
            Lowest CO₂/km
          </div>
          <div className="text-xs font-medium mt-0.5" style={{ color: COLORS.onSurfaceVariant }}>
            {bestEco.type}
          </div>
        </div>
        <div className="card p-4 text-center animate-fade-in-up stagger-3">
          <div className="text-2xl font-bold" style={{ color: COLORS.secondary }}>
            {transportOptions.reduce((s, t) => s + t.capacityLeft, 0).toLocaleString()}
          </div>
          <div className="text-xs mt-1" style={{ color: COLORS.outline }}>
            Total Seats Left
          </div>
          <div className="text-xs font-medium mt-0.5" style={{ color: COLORS.onSurfaceVariant }}>
            across all modes
          </div>
        </div>
      </div>

      {/* AI Departure Tip */}
      <div
        className="card p-4 animate-fade-in-up"
        style={{ background: COLORS.gradientNavy, border: 'none' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,200,66,0.2)', border: '1px solid rgba(245,200,66,0.4)' }}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined icon-fill"
              style={{ color: COLORS.secondaryContainer }}
            >
              smart_toy
            </span>
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-white mb-1">AI Departure Recommendation</div>
            <p className="text-sm" style={{ color: 'rgba(168,202,255,0.9)' }}>
              With {Math.round((stadium.currentOccupancy / stadium.capacity) * 100)}% capacity and
              match ending soon, expect heavy foot traffic.{' '}
              <strong className="text-white">Take the {bestEco.type}</strong> ({bestEco.line}) for
              the greenest option, or the <strong className="text-white">{fastest.type}</strong> for
              speed. Departure crowds will peak in approximately{' '}
              <strong className="text-white">25 minutes</strong> — consider leaving early or staying
              for post-match events.
            </p>
          </div>
        </div>
      </div>

      {/* Last-Mile Logistics & Resource Control (Organizer / Staff only) */}
      {showControlPanel && (
        <div className="card p-5 animate-fade-in-up stagger-4">
          <div
            className="flex items-center gap-2 mb-4 border-b pb-2"
            style={{ borderColor: COLORS.outlineVariant }}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-sm font-semibold text-blue-500"
            >
              hvac
            </span>
            <span className="text-sm font-semibold" style={{ color: COLORS.onSurface }}>
              Last-Mile Logistics & Demand Forecasting
            </span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-mono font-bold text-blue-500 bg-blue-500/10">
              Control Panel
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demand Table */}
            <div>
              <h3
                className="text-xs font-bold mb-2 uppercase tracking-wide"
                style={{ color: COLORS.outline }}
              >
                Post-Match Egress Demand Forecast
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr
                      style={{
                        color: COLORS.outline,
                        borderBottom: `1px solid ${COLORS.outlineVariant}`,
                      }}
                    >
                      <th scope="col" className="pb-1.5 font-medium">
                        Mode
                      </th>
                      <th scope="col" className="pb-1.5 font-medium">
                        Predicted Load
                      </th>
                      <th scope="col" className="pb-1.5 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${COLORS.outlineVariant}50` }}>
                      <td className="py-2 text-white font-medium">Red Line Subway</td>
                      <td className="py-2 text-white">12,500 passengers</td>
                      <td className="py-2">
                        <span className="badge-success">Stable</span>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${COLORS.outlineVariant}50` }}>
                      <td className="py-2 text-white font-medium">Stadium Shuttle</td>
                      <td className="py-2 text-white">4,200 passengers</td>
                      <td className="py-2">
                        {transportOptions.find((t) => t.id === 'TR2')?.capacityLeft > 20 ? (
                          <span className="badge-success">Cleared</span>
                        ) : (
                          <span className="badge-critical">Bottleneck</span>
                        )}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${COLORS.outlineVariant}50` }}>
                      <td className="py-2 text-white font-medium">Rideshare Pickups</td>
                      <td className="py-2 text-white">8,400 passengers</td>
                      <td className="py-2">
                        {transportOptions.find((t) => t.id === 'TR3')?.surgeActivated ? (
                          <span className="badge-info">Surge Routed</span>
                        ) : (
                          <span className="badge-warning">Congested</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Logistics Control Actions */}
            <div className="flex flex-col justify-between">
              <div>
                <h3
                  className="text-xs font-bold mb-2.5 uppercase tracking-wide"
                  style={{ color: COLORS.outline }}
                >
                  Fleet Resource Deployment
                </h3>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white">Shuttle Fleet (Lot C):</span>
                    <button
                      type="button"
                      onClick={deployShuttle}
                      className="text-xs font-bold px-2.5 py-1 rounded bg-[#1e40af] text-white hover:bg-[#1d4ed8] transition-all"
                    >
                      Deploy Extra Shuttle (+15 capacity){' '}
                      {transportOptions.find((t) => t.id === 'TR2')?.deployedCount
                        ? `[x${transportOptions.find((t) => t.id === 'TR2').deployedCount}]`
                        : ''}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white">Rideshare Pickup Surge Routing:</span>
                    <button
                      type="button"
                      onClick={divertSurgeRideshare}
                      disabled={transportOptions.find((t) => t.id === 'TR3')?.surgeActivated}
                      className="text-xs font-bold px-2.5 py-1 rounded bg-[#1e40af] text-white hover:bg-[#1d4ed8] transition-all disabled:opacity-50"
                    >
                      {transportOptions.find((t) => t.id === 'TR3')?.surgeActivated
                        ? 'Surge Route Active'
                        : 'Activate Surge Route'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white">Amtrak Train Frequency:</span>
                    <button
                      type="button"
                      onClick={increaseTrainFrequency}
                      disabled={transportOptions.find((t) => t.id === 'TR4')?.frequencyBoosted}
                      className="text-xs font-bold px-2.5 py-1 rounded bg-[#1e40af] text-white hover:bg-[#1d4ed8] transition-all disabled:opacity-50"
                    >
                      {transportOptions.find((t) => t.id === 'TR4')?.frequencyBoosted
                        ? 'Train Boosted (ETA -4m)'
                        : 'Boost Frequency'}
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="mt-4 p-2.5 rounded-lg text-xs border flex items-start gap-2"
                style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.2)' }}
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-sm text-blue-400 mt-0.5"
                >
                  psychology
                </span>
                <p style={{ color: COLORS.onSurfaceVariant }}>
                  {transportOptions.find((t) => t.id === 'TR2')?.capacityLeft > 10
                    ? 'AI logistics shows that deploying extra shuttles has successfully reduced egress queues. Commute times are currently within safe operational limits.'
                    : 'AI Analysis: Shuttle capacity is currently critically low (5 seats left). Deploy extra shuttles immediately to avoid heavy post-match delays at South Stand exits.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility: Sort order announcer for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {sortAnnouncement}
      </div>

      {/* Sort Controls */}
      <div
        className="flex items-center gap-2 flex-wrap"
        role="radiogroup"
        aria-label="Sort transport options"
      >
        <span className="text-xs font-medium" style={{ color: COLORS.outline }}>
          Sort by:
        </span>
        {[
          { key: 'recommended', label: 'AI Recommended' },
          { key: 'eta', label: 'Fastest' },
          { key: 'eco', label: 'Most Eco' },
          { key: 'capacity', label: 'Most Seats' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => handleSortChange(s.key, s.label)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            role="radio"
            aria-checked={sortBy === s.key}
            aria-label={`Sort by ${s.label}`}
            style={{
              background: sortBy === s.key ? COLORS.primary : COLORS.surface,
              color: sortBy === s.key ? COLORS.onPrimary : COLORS.onSurfaceVariant,
              border: `1px solid ${sortBy === s.key ? COLORS.primary : COLORS.outlineVariant}`,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Transport Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        role="list"
        aria-label="Transport options"
      >
        {sorted.map((t, i) => (
          <div
            key={t.id}
            className={`card p-5 animate-fade-in-up stagger-${i + 1} relative overflow-hidden`}
            role="listitem"
          >
            {t.recommended && (
              <div className="absolute top-3 right-3">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: COLORS.gradientGold, color: COLORS.onSecondaryContainer }}
                >
                  ⭐ Recommended
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: COLORS.surface }}
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-2xl icon-fill"
                  style={{ color: COLORS.primary }}
                >
                  {TRANSPORT_ICONS[t.icon] || t.icon}
                </span>
              </div>
              <div>
                <div className="font-bold text-base" style={{ color: COLORS.onSurface }}>
                  {t.type}
                </div>
                <div className="text-xs" style={{ color: COLORS.outline }}>
                  {t.line}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-2.5 rounded-xl text-center" style={{ background: COLORS.surface }}>
                <div className="text-xl font-bold" style={{ color: COLORS.primary }}>
                  {t.etaMinutes}m
                </div>
                <div className="text-xs" style={{ color: COLORS.outline }}>
                  ETA
                </div>
              </div>
              <div className="p-2.5 rounded-xl text-center" style={{ background: COLORS.surface }}>
                <div
                  className="text-xl font-bold"
                  style={{ color: t.co2e === 0 ? COLORS.success : COLORS.onSurfaceVariant }}
                >
                  {t.co2e}
                  <span className="text-xs font-normal">g</span>
                </div>
                <div className="text-xs" style={{ color: COLORS.outline }}>
                  CO₂/km
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: COLORS.outline }}>CO₂ Impact</span>
                <EcoScore co2e={t.co2e} />
              </div>
              <CO2Bar co2e={t.co2e} />
            </div>

            <div className="flex items-center justify-between">
              <CapacityIndicator left={t.capacityLeft} />
              <button
                onClick={() => handleNavigate(t.type, t.line)}
                className="btn-primary text-xs py-1.5 px-3"
                aria-label={`Get directions for ${t.type}`}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-sm">
                  directions
                </span>
                Navigate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(TransportHub);
