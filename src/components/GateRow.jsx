import { memo } from 'react';
import PropTypes from 'prop-types';
import { COLORS } from '../utils/styles';
import { getStatusColor, getDensityColor } from '../utils/helpers';

/**
 * Gate status row component
 * @param {object} props - Component props
 * @param {object} props.gate - Gate data
 */
const GateRow = memo(function GateRow({ gate, reasoning }) {
  const statusColor = getStatusColor(gate.status);
  const fillColor = getDensityColor(gate.density);

  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ background: statusColor }}
      >
        {gate.id}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium" style={{ color: COLORS.onSurface }}>
            Gate {gate.id} — {gate.direction}
          </span>
          <span className="font-mono font-semibold" style={{ color: fillColor }}>
            {Math.round(gate.density * 100)}%
          </span>
        </div>
        <div className="density-bar">
          <div
            className="density-fill"
            style={{ width: `${gate.density * 100}%`, background: fillColor }}
          />
        </div>
        {reasoning && (
          <p
            className="text-[9px] mt-0.5 italic opacity-70"
            style={{ color: COLORS.onSurfaceVariant }}
          >
            {reasoning}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <div
          className="text-xs font-bold font-mono"
          style={{ color: gate.waitTimeMinutes > 15 ? COLORS.error : COLORS.onSurfaceVariant }}
        >
          {gate.waitTimeMinutes}m
        </div>
        {gate.accessible && (
          <span
            aria-hidden="true"
            className="material-symbols-outlined icon-fill text-sm"
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
            className="material-symbols-outlined icon-fill text-sm"
            style={{ color: COLORS.secondary }}
            title="Hearing loop"
            aria-label="Hearing loop available"
          >
            hearing
          </span>
        )}
      </div>
    </div>
  );
});

GateRow.propTypes = {
  gate: PropTypes.object.isRequired,
  reasoning: PropTypes.string,
};

export default GateRow;
