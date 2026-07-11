/**
 * Sustainability Dashboard Component
 * Live energy, water, waste, and environmental metrics for FIFA WC 2026.
 * @module Sustainability
 *
 * @typedef {object} SustainabilityData
 * @property {number} energyDrawMW - Current energy draw in MW
 * @property {number} waterUsageKLH - Water usage in kL/h
 * @property {number} wasteDiversionRate - Waste diverted percentage
 * @property {number} solarPanelsMW - Solar output in MW
 * @property {number} renewablePercentage - Renewable energy percentage
 * @property {number} netZeroProgress - Net zero progress percentage
 * @property {number} co2SavedKg - CO₂ saved in kg
 * @property {boolean} ecoModeActive - Whether eco mode is currently active
 */
import React, { memo, useMemo, useState, useEffect } from 'react';
import { useStadiumContext } from '../context/StadiumContext';
import PropTypes from 'prop-types';
import { COLORS } from '../utils/styles';

/**
 * SVG donut chart displaying a percentage with an optional label.
 * @param {{ percentage: number, color: string, size?: number, strokeWidth?: number, label?: string, sublabel?: string }} props
 */
const DonutChart = memo(function DonutChart({
  percentage,
  color,
  size = 120,
  strokeWidth = 14,
  label,
  sublabel,
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - percentage / 100);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      className="flex flex-col items-center gap-1"
      role="img"
      aria-label={`${label || 'Chart'}: ${percentage}%`}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={COLORS.outlineVariant}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.5s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div className="text-xl font-bold" style={{ color }}>
            {percentage}%
          </div>
        </div>
      </div>
      {label && (
        <div
          className="text-xs font-semibold text-center"
          style={{ color: COLORS.onSurfaceVariant }}
        >
          {label}
        </div>
      )}
      {sublabel && (
        <div className="text-xs text-center" style={{ color: COLORS.outline }}>
          {sublabel}
        </div>
      )}
    </div>
  );
});
DonutChart.propTypes = {
  percentage: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  size: PropTypes.number,
  strokeWidth: PropTypes.number,
  label: PropTypes.string,
  sublabel: PropTypes.string,
};

/**
 * Metric card displaying a KPI with icon, value, and optional sub-text.
 * @param {{ icon: string, label: string, value: (string|number), unit?: string, sub?: string, color: string, bg: string, delay?: number }} props
 */
const MetricCard = memo(function MetricCard({ icon, label, value, unit, sub, color, bg, delay }) {
  return (
    <div
      className={`card p-5 animate-fade-in-up stagger-${delay}`}
      role="figure"
      aria-label={`${label}: ${value}${unit || ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-label-sm mb-1" style={{ color: COLORS.outline }}>
            {label}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-metric-lg" style={{ color }}>
              {value}
            </span>
            {unit && (
              <span className="text-sm font-semibold" style={{ color: COLORS.onSurfaceVariant }}>
                {unit}
              </span>
            )}
          </div>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: bg }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-xl icon-fill"
            style={{ color }}
          >
            {icon}
          </span>
        </div>
      </div>
      {sub && (
        <p className="text-xs" style={{ color: COLORS.outline }}>
          {sub}
        </p>
      )}
    </div>
  );
});
MetricCard.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  unit: PropTypes.string,
  sub: PropTypes.string,
  color: PropTypes.string.isRequired,
  bg: PropTypes.string.isRequired,
  delay: PropTypes.number,
};

/**
 * Progress bar with label and value display.
 * @param {{ label: string, value: number, max: number, color: string, unit?: string }} props
 */
const ProgressBar = memo(function ProgressBar({ label, value, max, color, unit }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span style={{ color: COLORS.onSurfaceVariant }} className="font-medium">
          {label}
        </span>
        <span className="font-mono font-bold" style={{ color }}>
          {value}
          {unit}{' '}
          <span style={{ color: COLORS.outline, fontWeight: 400 }}>
            / {max}
            {unit}
          </span>
        </span>
      </div>
      <div
        className="density-bar"
        style={{ height: '8px' }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${value}${unit || ''} out of ${max}${unit || ''}`}
      >
        <div
          className="density-fill"
          style={{ width: `${pct}%`, background: color, borderRadius: '4px' }}
        />
      </div>
    </div>
  );
});
ProgressBar.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  unit: PropTypes.string,
};

/**
 * Sustainability Dashboard — live energy, water, waste, and environmental metrics.
 */
function Sustainability() {
  const { contextData, toggleEcoMode } = useStadiumContext();
  const { stadium } = contextData;
  const s = stadium.sustainability;

  const [aiInsight, setAiInsight] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchInsight() {
      setIsAiLoading(true);
      try {
        const csrfRes = await fetch('/api/csrf-token');
        if (!csrfRes.ok) throw new Error('CSRF fetch failed');
        const { csrfToken } = await csrfRes.json();

        const message = `SUSTAINABILITY ANALYSIS:
Energy Draw: ${s.energyDrawMW} MW
Water Usage: ${s.waterUsageKLH} kL/h
Waste Diversion: ${s.wasteDiversionRate}%
Solar Output: ${s.solarPanelsMW} MW
Renewable: ${s.renewablePercentage}%
Net Zero Progress: ${s.netZeroProgress}%
CO₂ Saved Today: ${s.co2SavedKg} kg
Eco Mode: ${s.ecoModeActive ? 'ACTIVE' : 'INACTIVE'}

Provide a brief sustainability insight (2-3 sentences) with:
1. Most impactful action Alex can take right now
2. Specific estimated CO₂ or energy savings
3. A concrete recommendation tied to current metrics`;

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
          body: JSON.stringify({ message, contextData: { stadium }, language: 'en' }),
        });

        if (res.ok && !cancelled) {
          const data = await res.json();
          setAiInsight(data.reply);
        } else if (!cancelled) {
          setAiInsight(
            `Enabling Eco Mode could reduce energy draw by ~22% and save an additional ${Math.round(s.co2SavedKg * 0.22).toLocaleString()} kg CO₂ for this event.`,
          );
        }
      } catch {
        if (!cancelled) {
          setAiInsight(
            `Enabling Eco Mode could reduce energy draw by ~22% and save an additional ${Math.round(s.co2SavedKg * 0.22).toLocaleString()} kg CO₂ for this event.`,
          );
        }
      } finally {
        if (!cancelled) setIsAiLoading(false);
      }
    }
    fetchInsight();
    return () => {
      cancelled = true;
    };
  }, [
    stadium,
    s.energyDrawMW,
    s.waterUsageKLH,
    s.wasteDiversionRate,
    s.solarPanelsMW,
    s.renewablePercentage,
    s.netZeroProgress,
    s.co2SavedKg,
    s.ecoModeActive,
  ]);

  const netZeroColor =
    s.netZeroProgress >= 80
      ? COLORS.success
      : s.netZeroProgress >= 50
        ? COLORS.secondaryContainer
        : COLORS.warning;

  // Destructure primitives to give useMemo stable, scalar dependencies
  const { solarPanelsMW, wasteDiversionRate } = s;
  const co2SavingsData = useMemo(
    () => [
      { icon: 'solar_power', label: 'Solar panels', val: `${solarPanelsMW} MW active` },
      { icon: 'commute', label: 'Public transit', val: '68% fans used transit' },
      {
        icon: 'recycling',
        label: 'Waste reduction',
        val: `${wasteDiversionRate}% diverted`,
      },
    ],
    [solarPanelsMW, wasteDiversionRate],
  );

  const sustainabilityGoals = useMemo(
    () => [
      { icon: 'co2', label: 'Carbon Neutral Events', status: 'on-track', progress: 74 },
      { icon: 'water_drop', label: '30% Water Reduction', status: 'on-track', progress: 78 },
      { icon: 'solar_power', label: '100% Renewable Energy', status: 'watch', progress: 94 },
    ],
    [],
  );

  return (
    <div
      className="p-4 md:p-6 flex flex-col gap-5"
      role="region"
      aria-label="Sustainability Dashboard"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-base mb-0.5" style={{ color: COLORS.onSurface }}>
            Sustainability Dashboard
          </h2>
          <p className="text-sm" style={{ color: COLORS.outline }}>
            Live energy, water & environmental metrics
          </p>
        </div>
        <button
          onClick={toggleEcoMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 ${s.ecoModeActive ? 'btn-primary' : 'btn-ghost'}`}
          style={
            s.ecoModeActive
              ? {
                  background: COLORS.gradientEmerald,
                  boxShadow: '0 4px 16px rgba(61,196,122,0.4)',
                }
              : {}
          }
          aria-label={
            s.ecoModeActive
              ? 'Eco mode is active, click to disable'
              : 'Enable eco mode to save energy'
          }
        >
          <span aria-hidden="true" className="material-symbols-outlined icon-fill">
            eco
          </span>
          {s.ecoModeActive ? 'Eco Mode: ON ⚡' : 'Enable Eco Mode'}
        </button>
      </div>

      {/* Eco Mode Active Banner */}
      {s.ecoModeActive && (
        <div
          className="rounded-xl p-4 flex items-center gap-3 animate-slide-right"
          style={{
            background: COLORS.gradientEmerald,
            boxShadow: '0 4px 16px rgba(61,196,122,0.3)',
          }}
          role="alert"
          aria-live="polite"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-white text-2xl icon-fill"
          >
            eco
          </span>
          <div>
            <p className="text-white font-bold">🌱 Eco Mode Activated</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
              AI has dimmed non-essential lighting, reduced HVAC output by 22%, and optimized
              chiller plant operation. Estimated energy saving:{' '}
              <strong className="text-white">~{(s.energyDrawMW * 0.22).toFixed(1)} MW</strong>.
            </p>
          </div>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon="bolt"
          label="Energy Draw"
          value={s.energyDrawMW}
          unit=" MW"
          color={COLORS.secondary}
          bg={COLORS.secondaryContainer}
          delay={1}
          sub={s.ecoModeActive ? '⬇️ Reduced by eco mode' : 'Peak demand active'}
        />
        <MetricCard
          icon="water_drop"
          label="Water Usage"
          value={s.waterUsageKLH}
          unit=" kL/h"
          color={COLORS.info}
          bg={COLORS.infoContainer}
          delay={2}
          sub="Recirculation active"
        />
        <MetricCard
          icon="recycling"
          label="Waste Diverted"
          value={s.wasteDiversionRate}
          unit="%"
          color={COLORS.success}
          bg={COLORS.successContainer}
          delay={3}
          sub="Composting + recycling"
        />
        <MetricCard
          icon="solar_power"
          label="Solar Output"
          value={s.solarPanelsMW}
          unit=" MW"
          color={COLORS.tertiaryContainer}
          bg={COLORS.successContainer}
          delay={4}
          sub={`${Math.round((s.solarPanelsMW / s.energyDrawMW) * 100)}% of demand`}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Donut Charts */}
        <div className="card p-5 flex flex-col items-center gap-6 animate-fade-in-up stagger-2">
          <h3 className="font-bold text-sm self-start" style={{ color: COLORS.onSurface }}>
            Energy Mix
          </h3>
          <div className="flex justify-around w-full gap-4 flex-wrap">
            <DonutChart
              percentage={s.renewablePercentage}
              color={COLORS.success}
              label="Renewable"
              sublabel="Wind + Solar"
            />
            <DonutChart
              percentage={s.netZeroProgress}
              color={netZeroColor}
              label="Net Zero"
              sublabel="Progress"
            />
          </div>
        </div>

        {/* Resource Usage Bars */}
        <div className="card p-5 flex flex-col gap-4 animate-fade-in-up stagger-3">
          <h3 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
            Resource Targets
          </h3>
          <ProgressBar
            label="Renewable Energy"
            value={s.renewablePercentage}
            max={100}
            color={COLORS.success}
            unit="%"
          />
          <ProgressBar
            label="Waste Diversion"
            value={s.wasteDiversionRate}
            max={100}
            color={COLORS.info}
            unit="%"
          />
          <ProgressBar
            label="Net Zero Progress"
            value={s.netZeroProgress}
            max={100}
            color={netZeroColor}
            unit="%"
          />
          <ProgressBar
            label="Water Recycled"
            value={78}
            max={100}
            color={COLORS.primary}
            unit="%"
          />
        </div>

        {/* CO₂ Savings */}
        <div
          className="card p-5 animate-fade-in-up stagger-4"
          style={{
            background: `linear-gradient(135deg, ${COLORS.tertiary}, ${COLORS.tertiaryContainer})`,
            border: 'none',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span aria-hidden="true" className="material-symbols-outlined text-white icon-fill">
              co2
            </span>
            <span className="text-white font-bold text-sm">CO₂ Savings Today</span>
          </div>
          <div className="text-center mb-4" aria-live="polite">
            <div className="text-4xl font-bold text-white">{s.co2SavedKg.toLocaleString()}</div>
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              kg CO₂ prevented
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            {co2SavingsData.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-sm icon-fill"
                  style={{ color: COLORS.success }}
                >
                  {item.icon}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>{item.label}</span>
                <span
                  className="ml-auto text-xs font-mono"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  {item.val}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-sm shrink-0 mt-0.5 icon-fill"
                style={{ color: COLORS.secondaryContainer }}
              >
                smart_toy
              </span>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                <span className="font-bold text-white">AI Insight: </span>
                {isAiLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full" />
                    Analyzing...
                  </span>
                ) : (
                  aiInsight
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sustainability Goals */}
      <div className="card p-5 animate-fade-in-up stagger-5">
        <h3 className="font-bold text-sm mb-4" style={{ color: COLORS.onSurface }}>
          FIFA World Cup 2026 Sustainability Goals
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sustainabilityGoals.map((goal) => (
            <div
              key={goal.label}
              className="p-3 rounded-xl"
              style={{
                background: COLORS.background,
                border: `1px solid ${COLORS.outlineVariant}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-lg icon-fill"
                  style={{ color: COLORS.primaryContainer }}
                >
                  {goal.icon}
                </span>
                <span className="text-xs font-semibold" style={{ color: COLORS.onSurface }}>
                  {goal.label}
                </span>
                <span
                  className={goal.status === 'on-track' ? 'badge-success' : 'badge-warning'}
                  style={{ fontSize: '9px', marginLeft: 'auto' }}
                >
                  {goal.status === 'on-track' ? 'On Track' : 'Watch'}
                </span>
              </div>
              <div className="density-bar mb-1" style={{ height: '6px' }}>
                <div
                  className="density-fill"
                  style={{
                    width: `${goal.progress}%`,
                    background:
                      goal.status === 'on-track' ? COLORS.success : COLORS.secondaryContainer,
                  }}
                />
              </div>
              <div
                className="text-right text-xs font-mono font-bold"
                style={{ color: goal.status === 'on-track' ? COLORS.success : COLORS.secondary }}
              >
                {goal.progress}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(Sustainability);
