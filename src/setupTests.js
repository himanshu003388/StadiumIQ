/**
 * Test setup file
 * Configures testing-library matchers, jest-axe, and global mocks
 */
/* eslint-disable no-console */
import '@testing-library/jest-dom';
import { toHaveNoViolations, configureAxe } from 'jest-axe';

expect.extend(toHaveNoViolations);

/**
 * Configure axe for accessibility testing
 */
const axe = configureAxe({
  rules: [
    // Disable rules that require a full document context
    { id: 'document-title', enabled: false },
    { id: 'html-has-lang', enabled: false },
    { id: 'page-has-heading-one', enabled: false },
    { id: 'landmark-one-main', enabled: false },
    { id: 'region', enabled: false },
    { id: 'bypass', enabled: false },
    // Enable all other rules
  ],
});

export { axe };

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = () => {};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock fetch for CSRF token
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ csrfToken: 'test-csrf-token' }),
});

// Mock serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({}),
  },
});

// Suppress specific react console errors in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('React does not recognize')) return;
  if (args[0]?.includes?.('Unknown prop')) return;
  if (args[0]?.includes?.('inside a test was not wrapped in act')) return;
  if (args[0]?.includes?.('validateDOMNesting')) return;
  originalConsoleError(...args);
};

// Mock SpeechRecognition for Web Speech API testing
class MockSpeechRecognition {
  constructor() {
    this.lang = '';
    this.continuous = false;
    this.interimResults = false;
    this.start = () => {
      MockSpeechRecognition.lastInstance = this;
      if (MockSpeechRecognition.onStartCalled) MockSpeechRecognition.onStartCalled(this);
    };
    this.stop = () => {
      if (MockSpeechRecognition.onStopCalled) MockSpeechRecognition.onStopCalled(this);
    };
    this.onresult = null;
    this.onend = null;
    this.onerror = null;
  }
}
MockSpeechRecognition.lastInstance = null;
MockSpeechRecognition.onStartCalled = null;
MockSpeechRecognition.onStopCalled = null;

window.SpeechRecognition = MockSpeechRecognition;
window.webkitSpeechRecognition = MockSpeechRecognition;
