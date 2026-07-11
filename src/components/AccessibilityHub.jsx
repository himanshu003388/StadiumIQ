import React, { useState, useMemo, memo } from 'react';
import { useStadiumContext } from '../context/StadiumContext';
import { COLORS } from '../utils/styles';
import { getDemoResponse } from '../utils/helpers';

const ACCENT_COLORS = [
  COLORS.success,
  COLORS.tertiary,
  COLORS.secondaryContainer,
  COLORS.info,
  COLORS.secondary,
  COLORS.primaryContainer,
];

function AccessibilityHub() {
  const { contextData } = useStadiumContext();
  const { accessibilityServices, gates } = contextData;

  const accessibleGates = useMemo(() => gates.filter((g) => g.accessible), [gates]);
  const [aiTip, setAiTip] = useState(null);

  const handleAskAI = (query) => {
    const response = getDemoResponse(query, contextData, 'en');
    setAiTip(response);
  };

  const quickQueries = [
    { label: 'Wheelchair routes', query: 'accessible wheelchair route' },
    { label: 'Sign language', query: 'sign language interpreter' },
    { label: 'Service animals', query: 'service animal relief areas' },
  ];

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5" role="region" aria-label="Accessibility Hub">
      <div>
        <h2 className="font-bold text-base mb-0.5" style={{ color: COLORS.onSurface }}>
          Accessibility Hub
        </h2>
        <p className="text-sm" style={{ color: COLORS.outline }}>
          Inclusive access information & AI-powered assistance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Accessible Gates */}
        <div className="card p-4" role="region" aria-label="Accessible gates">
          <div className="flex items-center gap-2 mb-3">
            <span
              aria-hidden="true"
              className="material-symbols-outlined icon-fill"
              style={{ color: COLORS.info }}
            >
              accessible
            </span>
            <h3 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
              Accessible Gates ({accessibleGates.length}/{gates.length})
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {accessibleGates.map((gate) => (
              <div
                key={gate.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: COLORS.surfaceContainerLow }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{
                    background:
                      gate.status === 'critical'
                        ? COLORS.error
                        : gate.status === 'watch'
                          ? COLORS.warning
                          : COLORS.success,
                  }}
                >
                  {gate.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium" style={{ color: COLORS.onSurface }}>
                    {gate.direction} Side — {gate.waitTimeMinutes}min wait
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {gate.accessibleFeatures?.map((f) => (
                      <span
                        key={f}
                        className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                        style={{ background: COLORS.surface, color: COLORS.onSurfaceVariant }}
                      >
                        {f.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="card p-4" role="region" aria-label="Accessibility services">
          <div className="flex items-center gap-2 mb-3">
            <span
              aria-hidden="true"
              className="material-symbols-outlined icon-fill"
              style={{ color: COLORS.tertiary }}
            >
              hearing
            </span>
            <h3 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
              Available Services
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {accessibilityServices.map((svc, i) => (
              <div
                key={svc.type}
                className="p-3 rounded-xl"
                style={{ background: COLORS.surfaceContainerLow }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-sm font-bold"
                    style={{ background: ACCENT_COLORS[i % ACCENT_COLORS.length] }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold" style={{ color: COLORS.onSurface }}>
                      {svc.type.replace(/-/g, ' ')}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: COLORS.outline }}>
                      {Array.isArray(svc.locations) ? svc.locations.join(', ') : svc.locations}
                    </div>
                    <div className="text-xs mt-1" style={{ color: COLORS.onSurfaceVariant }}>
                      {svc.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Accessibility Assistant */}
      <div className="card p-4" style={{ background: COLORS.gradientNavy, border: 'none' }}>
        <div className="flex items-center gap-2 mb-3">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-white icon-fill"
            style={{ fontSize: '20px' }}
          >
            smart_toy
          </span>
          <h3 className="font-bold text-sm text-white">AI Accessibility Assistant</h3>
        </div>
        {aiTip ? (
          <div className="p-3 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="text-sm text-white whitespace-pre-wrap">{aiTip}</div>
            <button
              onClick={() => setAiTip(null)}
              className="text-xs mt-2 font-medium underline underline-offset-2"
              style={{ color: 'rgba(168,202,255,0.9)' }}
            >
              Ask something else
            </button>
          </div>
        ) : (
          <p className="text-sm mb-3" style={{ color: 'rgba(168,202,255,0.9)' }}>
            Ask about accessible routes, services, or get personalized assistance.
          </p>
        )}
        <div
          className="flex gap-2 flex-wrap"
          role="group"
          aria-label="Accessibility quick questions"
        >
          {quickQueries.map((q) => (
            <button
              key={q.query}
              onClick={() => handleAskAI(q.query)}
              aria-label={`Ask AI about ${q.label}`}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:scale-105"
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(AccessibilityHub);
