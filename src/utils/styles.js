// Theme Colors
const COLORS = {
  surface: 'var(--color-surface)',
  surfaceDim: 'var(--color-surface-dim)',
  surfaceBright: 'var(--color-surface-bright)',
  surfaceContainerLowest: 'var(--color-surface-container-lowest)',
  surfaceContainerLow: 'var(--color-surface-container-low)',
  surfaceContainer: 'var(--color-surface-container)',
  surfaceContainerHigh: 'var(--color-surface-container-high)',
  surfaceContainerHighest: 'var(--color-surface-container-highest)',
  onSurface: 'var(--color-on-surface)',
  onSurfaceVariant: 'var(--color-on-surface-variant)',
  outline: 'var(--color-outline)',
  outlineVariant: 'var(--color-outline-variant)',
  surfaceTint: 'var(--color-surface-tint)',
  primary: 'var(--color-primary)',
  onPrimary: 'var(--color-on-primary)',
  primaryContainer: 'var(--color-primary-container)',
  onPrimaryContainer: 'var(--color-on-primary-container)',
  inversePrimary: 'var(--color-inverse-primary)',
  secondary: 'var(--color-secondary)',
  onSecondary: 'var(--color-on-secondary)',
  secondaryContainer: 'var(--color-secondary-container)',
  onSecondaryContainer: 'var(--color-on-secondary-container)',
  tertiary: 'var(--color-tertiary)',
  onTertiary: 'var(--color-on-tertiary)',
  tertiaryContainer: 'var(--color-tertiary-container)',
  onTertiaryContainer: 'var(--color-on-tertiary-container)',
  error: 'var(--color-error)',
  errorContainer: 'var(--color-error-container)',
  onError: 'var(--color-on-error)',
  warning: 'var(--color-warning)',
  warningContainer: 'var(--color-warning-container)',
  onWarning: 'var(--color-on-warning)',
  onWarningContainer: 'var(--color-on-warning-container)',
  success: 'var(--color-success)',
  successContainer: 'var(--color-success-container)',
  onSuccess: 'var(--color-on-success)',
  onSuccessContainer: 'var(--color-on-success-container)',
  info: 'var(--color-info)',
  infoContainer: 'var(--color-info-container)',
  onInfo: 'var(--color-on-info)',
  onInfoContainer: 'var(--color-on-info-container)',
  primaryFixed: 'var(--color-primary-fixed)',
  primaryFixedDim: 'var(--color-primary-fixed-dim)',
  onPrimaryFixed: 'var(--color-on-primary-fixed)',
  secondaryFixed: 'var(--color-secondary-fixed)',
  secondaryFixedDim: 'var(--color-secondary-fixed-dim)',
  tertiaryFixed: 'var(--color-tertiary-fixed)',
  tertiaryFixedDim: 'var(--color-tertiary-fixed-dim)',
  background: 'var(--color-background)',
  onBackground: 'var(--color-on-background)',
  inverseSurface: 'var(--color-inverse-surface)',
  inverseOnSurface: 'var(--color-inverse-on-surface)',
  gradientNavy:
    'linear-gradient(135deg, var(--color-gradient-navy-start), var(--color-gradient-navy-end))',
  gradientGold: 'linear-gradient(135deg, var(--color-secondary), var(--color-secondary-fixed-dim))',
  gradientEmerald:
    'linear-gradient(135deg, var(--color-tertiary), var(--color-tertiary-fixed-dim))',
  gradientCritical: 'linear-gradient(135deg, var(--color-error), var(--color-error-container))',
};

// Typography
export const TYPOGRAPHY = {
  labelSm: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '11px',
    fontWeight: 500,
    lineHeight: '16px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  bodyMd: {
    fontSize: '15px',
    fontWeight: 400,
    lineHeight: '24px',
  },
  bodyLg: {
    fontSize: '17px',
    fontWeight: 400,
    lineHeight: '26px',
  },
  headlineSm: {
    fontFamily: '"Montserrat", sans-serif',
    fontSize: '20px',
    fontWeight: 600,
    lineHeight: '28px',
  },
  headlineMd: {
    fontFamily: '"Montserrat", sans-serif',
    fontSize: '26px',
    fontWeight: 700,
    lineHeight: '34px',
  },
  metricLg: {
    fontFamily: '"Montserrat", sans-serif',
    fontSize: '36px',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-0.02em',
  },
  metricXl: {
    fontFamily: '"Montserrat", sans-serif',
    fontSize: '54px',
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: '-0.04em',
  },
};

// Animation Delays
const ANIMATION_DELAYS = {
  stagger1: '0.05s',
  stagger2: '0.10s',
  stagger3: '0.15s',
  stagger4: '0.20s',
  stagger5: '0.25s',
  stagger6: '0.30s',
};

// Zone Colors — using theme-aware status colors for fills, custom for bg/text
const ZONE_COLORS = {
  nominal: {
    fill: 'var(--color-status-nominal)',
    text: 'var(--color-status-nominal)',
    bg: 'color-mix(in srgb, var(--color-status-nominal) 12%, transparent)',
    label: 'Clear',
  },
  moderate: {
    fill: 'var(--color-status-moderate)',
    text: 'var(--color-status-moderate)',
    bg: 'color-mix(in srgb, var(--color-status-moderate) 12%, transparent)',
    label: 'Moderate',
  },
  busy: {
    fill: 'var(--color-status-busy)',
    text: 'var(--color-status-busy)',
    bg: 'color-mix(in srgb, var(--color-status-busy) 12%, transparent)',
    label: 'Busy',
  },
  critical: {
    fill: 'var(--color-status-critical)',
    text: 'var(--color-status-critical)',
    bg: 'color-mix(in srgb, var(--color-status-critical) 12%, transparent)',
    label: 'Critical',
  },
};

// Gate Status Colors
const GATE_STATUS_COLORS = {
  normal: { bg: 'var(--color-status-nominal)', text: '#ffffff', waitThreshold: 10 },
  watch: { bg: 'var(--color-status-busy)', text: '#ffffff', waitThreshold: 20 },
  critical: { bg: 'var(--color-status-critical)', text: '#ffffff', waitThreshold: 30 },
};

// Priority Colors
const PRIORITY_COLORS = {
  high: 'var(--color-status-critical)',
  medium: 'var(--color-status-busy)',
  low: 'var(--color-info)',
};

// Priority Backgrounds
const PRIORITY_BG = {
  high: 'color-mix(in srgb, var(--color-status-critical) 12%, transparent)',
  medium: 'color-mix(in srgb, var(--color-status-busy) 12%, transparent)',
  low: 'color-mix(in srgb, var(--color-info) 12%, transparent)',
};

// Language Flags
const LANG_FLAGS = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  ar: '🇸🇦',
  pt: '🇧🇷',
  ja: '🇯🇵',
  hi: '🇮🇳',
};

// Quick Prompts
const QUICK_PROMPTS = [
  { icon: 'sensor_door', text: 'Which gate is least crowded?' },
  { icon: 'commute', text: 'Best transport option after the match?' },
  { icon: 'accessible', text: 'Wheelchair-accessible entrance?' },
  { icon: 'restaurant', text: 'Where are the nearest food stalls?' },
  { icon: 'eco', text: "What's the stadium's carbon footprint?" },
  { icon: 'emergency', text: 'Where is the nearest first aid station?' },
  { icon: 'accessible', text: 'Accessibility services available?' },
  { icon: 'translate', text: 'ASL interpreter on site?' },
];

// Transport Icons
const TRANSPORT_ICONS = {
  subway: 'subway',
  train: 'train',
  directions_bus: 'directions_bus',
  local_taxi: 'local_taxi',
  pedal_bike: 'pedal_bike',
};

// Navbar Items
const NAV_ITEMS = [
  {
    id: 'command',
    label: 'WC 26 Ops Center',
    icon: 'dashboard',
    desc: 'Live ops overview',
    allowedRoles: ['Organizer', 'Staff'],
  },
  {
    id: 'ai',
    label: 'GenAI Assistant',
    icon: 'smart_toy',
    desc: 'Gemini-powered chat',
    allowedRoles: ['Organizer', 'Staff', 'Volunteer', 'Fan'],
  },
  {
    id: 'crowd',
    label: 'Crowd & Navigation',
    icon: 'map',
    desc: 'Stadium zone map',
    allowedRoles: ['Organizer', 'Staff', 'Fan'],
  },
  {
    id: 'volunteers',
    label: 'Resource Dispatch',
    icon: 'groups',
    desc: 'Task & crew assignment',
    allowedRoles: ['Organizer', 'Volunteer'],
  },
  {
    id: 'upload',
    label: 'Upload Center',
    icon: 'upload_file',
    desc: 'CSV / PDF Data Import',
    allowedRoles: ['Organizer'],
  },
  {
    id: 'transport',
    label: 'Transport Hub',
    icon: 'commute',
    desc: 'Departure options',
    allowedRoles: ['Organizer', 'Staff', 'Fan'],
  },
  {
    id: 'sustain',
    label: 'Sustainability',
    icon: 'eco',
    desc: 'Energy & environment',
    allowedRoles: ['Organizer', 'Staff'],
  },
  {
    id: 'accessibility',
    label: 'Accessibility',
    icon: 'accessible',
    desc: 'Inclusive access info',
    allowedRoles: ['Organizer', 'Staff', 'Volunteer', 'Fan'],
  },
];

export {
  COLORS,
  ANIMATION_DELAYS,
  ZONE_COLORS,
  GATE_STATUS_COLORS,
  PRIORITY_COLORS,
  PRIORITY_BG,
  LANG_FLAGS,
  QUICK_PROMPTS,
  TRANSPORT_ICONS,
  NAV_ITEMS,
};
