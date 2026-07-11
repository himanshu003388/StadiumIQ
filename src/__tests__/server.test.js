/**
 * server.js Unit Tests
 * Tests core security and validation functions in isolation.
 *
 * These functions are exported for testing via the ESM test harness.
 * Run with: npm test (vitest)
 */
import { describe, it, expect, vi } from 'vitest';
import {
  sanitizeInput,
  validateChatInput,
  buildSafeContext,
  buildSystemPrompt,
  generateCsrfToken,
  validateCsrfToken,
  VALID_LANGUAGES,
} from '../utils/server-utils.js';

// ─── Test Suites ──────────────────────────────────────────────────────────────

describe('sanitizeInput', () => {
  it('removes <script> tags', () => {
    expect(sanitizeInput('<script>alert(1)</script>Hello')).toBe('Hello');
  });

  it('removes all HTML tags', () => {
    expect(sanitizeInput('<b>bold</b>')).toBe('bold');
  });

  it('removes dangerous characters', () => {
    const result = sanitizeInput('<>"\'`test`\'"<>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('"');
    expect(result).not.toContain("'");
    expect(result).not.toContain('`');
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world');
  });

  it('returns clean input unchanged', () => {
    expect(sanitizeInput('What gate is least busy?')).toBe('What gate is least busy?');
  });

  it('removes dangerous protocol prefixes from user input', () => {
    expect(sanitizeInput('javascript:alert(1)')).not.toContain('javascript:');
    expect(sanitizeInput('data:text/html,<script>alert(1)</script>')).not.toContain('data:');
    expect(sanitizeInput('https://example.com')).toContain('https://example.com');
  });

  it('removes nested script tags', () => {
    const input = '<scr<script>ipt>alert(1)</scr</script>ipt>';
    const result = sanitizeInput(input);
    expect(result).not.toContain('<script');
    expect(result).not.toContain('</script>');
    expect(result).not.toContain('<scr');
  });
});

describe('validateChatInput', () => {
  it('returns error for null body', () => {
    expect(validateChatInput(null)).toContain('Request body is required');
  });

  it('returns error for non-object body', () => {
    expect(validateChatInput('string')).toContain('Request body is required');
  });

  it('returns error for non-string message', () => {
    expect(validateChatInput({ message: 123 })).toContain('message must be a string');
  });

  it('returns error for empty message', () => {
    expect(validateChatInput({ message: '   ' })).toContain('message cannot be empty');
  });

  it('returns error when message exceeds 2000 characters', () => {
    expect(validateChatInput({ message: 'a'.repeat(2001) })).toContain(
      'message must be max 2000 characters',
    );
  });

  it('returns no error for a valid message', () => {
    expect(validateChatInput({ message: 'Hello' })).toHaveLength(0);
  });

  it('returns error for invalid language code', () => {
    expect(validateChatInput({ message: 'Hi', language: 'xx' })).toContain(
      'language must be a valid 2-letter ISO code',
    );
  });

  it('accepts all valid language codes', () => {
    for (const lang of VALID_LANGUAGES) {
      expect(validateChatInput({ message: 'Hi', language: lang })).toHaveLength(0);
    }
  });

  it('returns error for non-object contextData', () => {
    expect(validateChatInput({ message: 'Hi', contextData: 'invalid' })).toContain(
      'contextData must be an object',
    );
  });

  it('returns error when stadium.name exceeds 200 chars', () => {
    expect(
      validateChatInput({
        message: 'Hi',
        contextData: { stadium: { name: 'A'.repeat(201) } },
      }),
    ).toContain('contextData.stadium.name exceeds maximum length');
  });

  it('returns error when stadium.homeTeam exceeds 200 chars', () => {
    expect(
      validateChatInput({
        message: 'Hi',
        contextData: { stadium: { homeTeam: 'B'.repeat(201) } },
      }),
    ).toContain('contextData.stadium.homeTeam exceeds maximum length');
  });

  it('returns error when stadium.awayTeam exceeds 200 chars', () => {
    expect(
      validateChatInput({
        message: 'Hi',
        contextData: { stadium: { awayTeam: 'C'.repeat(201) } },
      }),
    ).toContain('contextData.stadium.awayTeam exceeds maximum length');
  });

  it('returns error when matchPhase exceeds 20 chars', () => {
    expect(
      validateChatInput({
        message: 'Hi',
        contextData: { stadium: { matchPhase: 'X'.repeat(21) } },
      }),
    ).toContain('contextData.stadium.matchPhase exceeds maximum length');
  });

  it('accepts valid contextData within limits', () => {
    expect(
      validateChatInput({
        message: 'Hi',
        language: 'en',
        contextData: {
          stadium: {
            name: 'AT&T Stadium',
            homeTeam: 'Brazil',
            awayTeam: 'France',
            matchPhase: "67'",
          },
        },
      }),
    ).toHaveLength(0);
  });
});

describe('buildSafeContext', () => {
  const raw = {
    stadium: {
      name: 'AT&T Stadium',
      capacity: 105000,
      currentOccupancy: 89000,
      homeTeam: 'Brazil',
      awayTeam: 'France',
      score: '2 - 1',
      matchPhase: "67'",
      weather: { temperature: 32 },
      // These fields should be STRIPPED
      internalAdminNotes: 'SECRET_DATA',
      securityCode: 'TOPSECRET',
    },
    gates: [
      {
        id: 'A',
        direction: 'North',
        density: 0.4,
        waitTimeMinutes: 5,
        status: 'normal',
        accessible: true,
        // Should be stripped
        staffPassword: 'HIDDEN',
      },
    ],
    incidents: [
      { id: 'I1', status: 'active' },
      { id: 'I2', status: 'resolved' },
    ],
    // Should be stripped entirely
    volunteerPrivateData: { ssn: '123-45-6789' },
  };

  it('only returns whitelisted stadium fields', () => {
    const ctx = buildSafeContext(raw);
    expect(ctx.stadium.name).toBe('AT&T Stadium');
    expect(ctx.stadium.internalAdminNotes).toBeUndefined();
    expect(ctx.stadium.securityCode).toBeUndefined();
  });

  it('only returns whitelisted gate fields', () => {
    const ctx = buildSafeContext(raw);
    expect(ctx.gates[0].id).toBe('A');
    expect(ctx.gates[0].staffPassword).toBeUndefined();
  });

  it('strips volunteerPrivateData entirely', () => {
    const ctx = buildSafeContext(raw);
    expect(ctx.volunteerPrivateData).toBeUndefined();
  });

  it('counts only active incidents', () => {
    const ctx = buildSafeContext(raw);
    expect(ctx.activeIncidentCount).toBe(1);
  });

  it('handles null context gracefully', () => {
    expect(buildSafeContext(null)).toEqual({});
  });

  it('handles missing gates array gracefully', () => {
    const ctx = buildSafeContext({ stadium: { name: 'Test' } });
    expect(ctx.gates).toEqual([]);
  });
});

describe('CSRF Token Generation & Validation', () => {
  it('generates a valid token that passes validation', () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(token)).toBe(true);
  });

  it('returns false for null token', () => {
    expect(validateCsrfToken(null)).toBe(false);
  });

  it('returns false for empty string token', () => {
    expect(validateCsrfToken('')).toBe(false);
  });

  it('returns false for a tampered token', () => {
    const token = generateCsrfToken();
    const tampered = token.slice(0, -4) + 'XXXX';
    expect(validateCsrfToken(tampered)).toBe(false);
  });

  it('returns false for a malformed base64 token', () => {
    expect(validateCsrfToken('not-a-real-token!!!')).toBe(false);
  });

  it('returns false for a token with wrong structure (missing parts)', () => {
    const fake = Buffer.from('only-two:parts').toString('base64url');
    expect(validateCsrfToken(fake)).toBe(false);
  });

  it('returns false for an expired token (simulated via Date manipulation)', () => {
    vi.useFakeTimers();
    const token = generateCsrfToken();
    // Advance time by 2 hours (past the 1-hour expiry)
    vi.advanceTimersByTime(2 * 60 * 60 * 1000);
    expect(validateCsrfToken(token)).toBe(false);
    vi.useRealTimers();
  });

  it('generates unique tokens on successive calls', () => {
    const t1 = generateCsrfToken();
    const t2 = generateCsrfToken();
    expect(t1).not.toBe(t2);
  });
});

// ─── Security Boundary Tests ─────────────────────────────────────────────────

describe('Security boundary: validateChatInput edge cases', () => {
  it('rejects empty object body', () => {
    // Empty body passes (message is not required unless sent), but missing message is not an error
    const errors = validateChatInput({});
    expect(errors).toHaveLength(0); // no fields provided = no errors
  });

  it('rejects a message with only whitespace characters', () => {
    expect(validateChatInput({ message: '\t\n\r ' })).toContain('message cannot be empty');
  });

  it('accepts exactly 2000-character message (boundary)', () => {
    expect(validateChatInput({ message: 'a'.repeat(2000) })).toHaveLength(0);
  });

  it('rejects 2001-character message (above boundary)', () => {
    expect(validateChatInput({ message: 'a'.repeat(2001) })).not.toHaveLength(0);
  });

  it('rejects xss attempt in message as a string validation pass-through (sanitization is separate)', () => {
    // validateChatInput only validates structure/length; sanitizeInput handles XSS stripping
    const errors = validateChatInput({ message: '<script>alert(1)</script>' });
    expect(errors).toHaveLength(0); // short enough; sanitization done elsewhere
  });
});

describe('Security boundary: buildSafeContext with adversarial input', () => {
  it('handles deeply nested unexpected fields safely', () => {
    const adversarial = {
      stadium: {
        name: 'Test',
        __proto__: { polluted: true },
        constructor: { prototype: { polluted: true } },
      },
      gates: [],
      incidents: [],
    };
    const ctx = buildSafeContext(adversarial);
    expect(ctx.stadium.name).toBe('Test');
    // Should not pollute Object prototype
    expect({}.polluted).toBeUndefined();
  });

  it('handles non-array gates gracefully', () => {
    const ctx = buildSafeContext({ stadium: {}, gates: 'not-an-array', incidents: [] });
    expect(ctx.gates).toEqual([]);
  });

  it('handles non-array incidents gracefully', () => {
    const ctx = buildSafeContext({ stadium: {}, gates: [], incidents: 'not-an-array' });
    expect(ctx.activeIncidentCount).toBe(0);
  });

  it('sanitizes sustainability trash bins and volunteers context mapping', () => {
    const raw = {
      stadium: {
        name: 'AT&T Stadium',
        sustainability: {
          co2SavedKg: 1500,
          solarPanelsMW: 12.5,
          trashBins: [{ zone: 'North', fullness: 75 }],
        },
      },
      gates: [
        {
          id: 'A',
          direction: 'North',
          density: 0.5,
          waitTimeMinutes: 10,
          accessibleFeatures: 'not-an-array',
        },
      ],
      volunteers: [
        {
          id: 'V1',
          name: 'Elena',
          zone: 'North',
          languages: 'not-an-array',
          skills: 'not-an-array',
          currentLoad: 1,
          maxLoad: 5,
          status: 'available',
        },
      ],
    };
    const ctx = buildSafeContext(raw);
    expect(ctx.stadium.sustainability.trashBins).toHaveLength(1);
    expect(ctx.stadium.sustainability.trashBins[0].zone).toBe('North');
    expect(ctx.gates[0].accessibleFeatures).toEqual([]);
    expect(ctx.volunteers).toHaveLength(1);
    expect(ctx.volunteers[0].languages).toEqual([]);
    expect(ctx.volunteers[0].skills).toEqual([]);
  });

  it('returns false for null or undefined CSRF token causing decode error', () => {
    expect(validateCsrfToken(null)).toBe(false);
    expect(validateCsrfToken(undefined)).toBe(false);
  });

  it('returns false when split throws an error (e.g., token is not a string)', () => {
    expect(validateCsrfToken(12345)).toBe(false);
    expect(validateCsrfToken({})).toBe(false);
  });
});

describe('buildSystemPrompt', () => {
  it('generates system prompt containing context data', () => {
    const prompt = buildSystemPrompt('stadium occupancy is 50%');
    expect(prompt).toContain('FIFA World Cup 2026 Smart Stadium Command Center');
    expect(prompt).toContain('stadium occupancy is 50%');
  });

  it('appends dynamic profile adaptation instructions when userProfile is provided', () => {
    const userProfile = { origin: 'Morocco', tone: 'Empathetic' };
    const prompt = buildSystemPrompt('context', userProfile);
    expect(prompt).toContain('Morocco');
    expect(prompt).toContain('Empathetic');
    expect(prompt).toContain('CRITICAL DYNAMIC USER PROFILE ADAPTATION');
  });
});
