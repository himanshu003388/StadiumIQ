import React from 'react';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StadiumProvider } from '../context/StadiumContext';
import TransportHub from '../components/TransportHub';
import { buildSafeContext, buildSystemPrompt } from '../utils/server-utils';
import { useGemini } from '../hooks/useGemini';
import IncidentCard from '../components/IncidentCard';

// Mock fetch
global.fetch = vi.fn();

describe('Coverage Gap Fillers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  // 1. server-utils.js Coverage
  it('covers server-utils.js default fallbacks and array mappings', () => {
    const rawCtx = {
      stadium: {
        sustainability: {
          trashBins: [{ zone: 'North Stand', fullness: 30 }],
        },
      },
      gates: [],
      incidents: [],
      volunteers: [
        {
          id: 'v1',
          name: 'Yuki',
          zone: 'East Wing',
          languages: ['en', 'ja'], // tests array paths (lines 176-177)
          skills: ['first-aid'],
          currentLoad: 0,
          maxLoad: 3,
          status: 'available',
        },
      ],
    };
    const ctx = buildSafeContext(rawCtx);
    expect(ctx.volunteers[0].languages).toEqual(['en', 'ja']);
    expect(ctx.volunteers[0].skills).toEqual(['first-aid']);

    // prompt with profile missing origin and tone (lines 191-192)
    const prompt = buildSystemPrompt(ctx, {});
    expect(prompt).toContain('User Dialect/Origin: Not specified');
    expect(prompt).toContain('Desired Tone Register: Culturally Appropriate');
  });

  // 2. useGemini.js SSE lines parsing exceptions (SyntaxError)
  it('covers useGemini.js stream syntax errors and custom errors', async () => {
    const mockContext = {
      gates: [],
      stadium: {
        name: 'Test',
        currentOccupancy: 1000,
        capacity: 50000,
        weather: { temperature: 20, conditions: 'clear', humidity: 50 },
        sustainability: { trashBins: [] },
      },
      incidents: [],
      transportOptions: [],
      tasks: [],
      volunteers: [],
    };

    fetch.mockImplementation((url) => {
      if (url === '/api/csrf-token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'test-csrf' }),
        });
      }
      if (url === '/api/chat/stream') {
        return Promise.resolve({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('data: {invalid-json\n\n'));
              controller.enqueue(new TextEncoder().encode('data: {"chunk":"Hello chunk"}\n\n'));
              controller.enqueue(new TextEncoder().encode('data: {"done":true}\n\n'));
              controller.close();
            },
          }),
        });
      }
      return Promise.reject(new Error('Unknown'));
    });

    const { result } = renderHook(() => useGemini(mockContext));
    await act(async () => {
      await result.current.sendMessage('Stream test');
    });

    // Check that we got the chunk despite the invalid JSON syntax error line
    expect(result.current.messages.some((m) => m.text.includes('Hello chunk'))).toBe(true);
  });

  // 3. TransportHub Control Actions and Navigation
  it('covers TransportHub navigation (mobile & desktop) and control panel clicks', () => {
    const openMock = vi.spyOn(window, 'open').mockImplementation(() => {});

    // Test Desktop navigation
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' });
    render(
      <StadiumProvider>
        <TransportHub />
      </StadiumProvider>,
    );

    const navButtons = screen.getAllByRole('button', { name: /directions/i });
    fireEvent.click(navButtons[0]);
    expect(openMock).toHaveBeenCalled();

    // Test Mobile navigation
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    fireEvent.click(navButtons[0]);
    expect(openMock).toHaveBeenCalledTimes(2);

    // Test Organizer control clicks
    const deployShuttleBtn = screen.getByRole('button', { name: /Deploy Extra Shuttle/i });
    const surgeBtn = screen.getByRole('button', { name: /Activate Surge Route/i });
    const trainBtn = screen.getByRole('button', { name: /Boost Frequency/i });

    fireEvent.click(deployShuttleBtn);
    fireEvent.click(surgeBtn);
    fireEvent.click(trainBtn);

    openMock.mockRestore();
  });

  // 4. IncidentCard Query AI analysis mock trigger
  it('covers IncidentCard AI Query triggers', async () => {
    const incident = {
      id: 'INC-777',
      type: 'medical',
      zone: 'North Stand',
      severity: 'critical',
      description: 'An incident description',
      status: 'active',
    };
    const contextData = { gates: [], stadium: {}, incidents: [incident], volunteers: [] };
    const onResolve = vi.fn();
    const onAssignVolunteer = vi.fn();

    // Mock API
    fetch.mockImplementation((url) => {
      if (url === '/api/csrf-token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'token' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ reply: 'AI Analysis Completed' }),
      });
    });

    render(
      <IncidentCard
        incident={incident}
        contextData={contextData}
        onResolve={onResolve}
        onAssignVolunteer={onAssignVolunteer}
      />,
    );

    const queryBtn = screen.getByRole('button', { name: /Query AI analysis for/i });
    await act(async () => {
      fireEvent.click(queryBtn);
    });

    expect(screen.getByText(/AI Analysis Completed/i)).toBeInTheDocument();
  });
});
