import { memo } from 'react';
import PropTypes from 'prop-types';
import { SEVERITY_BADGE_MAP } from '../utils/constants';

/**
 * Severity badge component
 * @param {object} props - Component props
 * @param {string} props.severity - Severity level
 */
const SeverityBadge = memo(function SeverityBadge({ severity }) {
  return <span className={SEVERITY_BADGE_MAP[severity] || 'badge-info'}>{severity}</span>;
});
SeverityBadge.propTypes = { severity: PropTypes.string.isRequired };

export default SeverityBadge;
