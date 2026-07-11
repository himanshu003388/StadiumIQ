import { memo } from 'react';
import PropTypes from 'prop-types';
import { COLORS } from '../utils/styles';
import { STATUS_DOT_COLORS } from '../utils/constants';

/**
 * Status dot indicator component — uses color + accessible text label
 * to satisfy WCAG 1.4.1 (Use of Color).
 * @param {object} props - Component props
 * @param {string} props.status - Status level
 */
const StatusDot = memo(function StatusDot({ status }) {
  return (
    <span
      className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0"
      role="status"
      aria-label={`Status: ${status}`}
    >
      {status !== 'resolved' && (
        <span
          className="absolute w-full h-full rounded-full animate-ping opacity-50"
          aria-hidden="true"
          style={{ background: STATUS_DOT_COLORS[status] || COLORS.outline }}
        />
      )}
      <span
        className="w-2 h-2 rounded-full"
        aria-hidden="true"
        style={{ background: STATUS_DOT_COLORS[status] || COLORS.outline }}
      />
      {/* Visually-hidden text: ensures status is not conveyed by color alone (WCAG 1.4.1) */}
      <span className="sr-only">{status}</span>
    </span>
  );
});
StatusDot.propTypes = { status: PropTypes.string.isRequired };

export default StatusDot;
