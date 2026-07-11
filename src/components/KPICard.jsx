import { memo } from 'react';
import PropTypes from 'prop-types';
import { COLORS } from '../utils/styles';

/**
 * Key Performance Indicator (KPI) card component
 * @param {object} props - Component props
 * @param {string} props.label - KPI label
 * @param {number|string} props.value - KPI value
 * @param {string} [props.unit] - Unit of measurement
 * @param {string} props.icon - Material symbol icon name
 * @param {string} props.color - Color for the value
 * @param {string} [props.sub] - Subtitle text
 * @param {number} props.delay - Stagger delay for animation
 */
const KPICard = memo(function KPICard({ label, value, unit, icon, color, sub, delay }) {
  return (
    <div className={`card p-5 animate-fade-in-up stagger-${delay}`}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-label-sm" style={{ color: COLORS.outline }}>
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined icon-fill text-xl"
            style={{ color }}
          >
            {icon}
          </span>
        </div>
      </div>
      <div className="flex items-baseline gap-1" aria-live="polite" aria-atomic="true">
        <span className="text-metric-lg animate-count-up" style={{ color }}>
          {value}
        </span>
        {unit && (
          <span className="text-xl font-bold" style={{ color: COLORS.onSurfaceVariant }}>
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <p className="text-xs mt-1.5" style={{ color: COLORS.outline }}>
          {sub}
        </p>
      )}
    </div>
  );
});
KPICard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  unit: PropTypes.string,
  icon: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  sub: PropTypes.string,
  delay: PropTypes.number.isRequired,
};

export default KPICard;
