/**
 * Severity badge mapping
 */
export const SEVERITY_BADGE_MAP = {
  critical: 'badge-critical',
  medium: 'badge-warning',
  low: 'badge-info',
  resolved: 'badge-success',
};

/**
 * Status dot colors — theme-aware
 */
export const STATUS_DOT_COLORS = {
  critical: 'var(--color-status-critical)',
  active: 'var(--color-status-moderate)',
  resolved: 'var(--color-status-nominal)',
  watch: 'var(--color-status-busy)',
};

/**
 * Available languages
 */
export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
];

/**
 * Incident type icons
 */
export const INCIDENT_ICON_MAP = {
  crowd: 'groups',
  facility: 'home_repair_service',
  equipment: 'build_circle',
  medical: 'medical_services',
  security: 'security',
};

/**
 * Eco score thresholds
 */
export const ECO_SCORE_THRESHOLDS = {
  zero: 0,
  low: 10,
  moderate: 20,
  high: 40,
};

/**
 * Time formatting constants
 */
export const TIME_FORMAT_OPTIONS = {
  hour: '2-digit',
  minute: '2-digit',
};
