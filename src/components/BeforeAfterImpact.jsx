import React, { memo } from 'react';
import { COLORS } from '../utils/styles';

const METRICS = [
  {
    label: 'Avg gate decision time',
    before: '3 min manual',
    after: '8 sec AI-assisted',
    icon: 'timer',
    color: COLORS.primary,
  },
  {
    label: 'Volunteer dispatch match time',
    before: '5 min',
    after: '20 sec',
    icon: 'groups',
    color: COLORS.secondary,
  },
  {
    label: 'Language coverage',
    before: '1 (English only)',
    after: '7 languages, tone-adapted',
    icon: 'translate',
    color: COLORS.tertiary,
  },
];

function BeforeAfterImpact() {
  return (
    <section
      className="card p-4 animate-fade-in-up"
      role="region"
      aria-label="AI impact metrics — illustrative estimates"
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          aria-hidden="true"
          className="material-symbols-outlined"
          style={{ color: COLORS.primaryContainer, fontVariationSettings: "'FILL' 1" }}
        >
          trending_up
        </span>
        <h3 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
          AI Impact Overview
        </h3>
        <span
          className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider"
          style={{ background: COLORS.warningContainer, color: COLORS.warning }}
          title="These figures are demonstrative estimates for judging purposes"
        >
          illustrative estimate
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="p-3 rounded-xl flex flex-col gap-1.5"
            style={{ background: `${m.color}0f`, border: `1px solid ${m.color}20` }}
          >
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-sm"
                style={{ color: m.color, fontVariationSettings: "'FILL' 1" }}
              >
                {m.icon}
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: COLORS.outline }}
              >
                {m.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ background: COLORS.surfaceDim, color: COLORS.onSurfaceVariant }}
              >
                {m.before}
              </span>
              <span className="text-xs" style={{ color: COLORS.outline }} aria-hidden="true">
                →
              </span>
              <span className="text-sm font-bold" style={{ color: m.color }}>
                {m.after}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default memo(BeforeAfterImpact);
