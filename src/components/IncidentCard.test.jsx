import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IncidentCard from './IncidentCard';

describe('IncidentCard Component', () => {
  const mockOnResolve = vi.fn();
  const mockOnAssignVolunteer = vi.fn();

  const mockIncident = {
    id: 'INC-001',
    type: 'medical',
    zone: 'East Wing',
    severity: 'critical',
    description: 'Fan reported heat exhaustion',
    timestamp: new Date().toISOString(),
    status: 'active',
    aiRecommendedAction: 'Dispatch cooling team.',
  };

  const mockContextData = {
    gates: [],
    stadium: { name: 'AT&T Stadium', capacity: 80000, currentOccupancy: 50000 },
    volunteers: [
      {
        id: 'V1',
        name: 'Elena Vargas',
        zone: 'East Wing',
        languages: ['en'],
        skills: ['first-aid'],
        currentLoad: 0,
        maxLoad: 5,
        avatar: 'EV',
        status: 'available',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url) => {
        if (url === '/api/csrf-token') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'fake-csrf' }),
          });
        }
        if (url === '/api/chat') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ reply: 'AI Analysis: Assign Elena Vargas.' }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders active incident details', () => {
    render(
      <IncidentCard
        incident={mockIncident}
        contextData={mockContextData}
        onResolve={mockOnResolve}
        onAssignVolunteer={mockOnAssignVolunteer}
      />,
    );
    expect(screen.getByText('INC-001')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('Fan reported heat exhaustion')).toBeInTheDocument();
    expect(screen.getByText('Query AI Advisor')).toBeInTheDocument();
  });

  it('handles volunteer assignment dispatch click', async () => {
    render(
      <IncidentCard
        incident={mockIncident}
        contextData={mockContextData}
        onResolve={mockOnResolve}
        onAssignVolunteer={mockOnAssignVolunteer}
      />,
    );

    // Trigger AI query
    const queryBtn = screen.getByLabelText(/Query AI analysis/i);
    fireEvent.click(queryBtn);

    // Verify suggested volunteer panel is rendered
    await waitFor(() => {
      expect(screen.getByText('Best Match: Elena Vargas')).toBeInTheDocument();
    });
    const dispatchBtn = screen.getByText('Dispatch');
    fireEvent.click(dispatchBtn);

    expect(mockOnAssignVolunteer).toHaveBeenCalledWith('INC-001', 'V1');
  });

  it('queries AI Advisor and displays reasoning', async () => {
    render(
      <IncidentCard
        incident={mockIncident}
        contextData={mockContextData}
        onResolve={mockOnResolve}
        onAssignVolunteer={mockOnAssignVolunteer}
      />,
    );

    const queryBtn = screen.getByLabelText(/Query AI analysis/i);
    fireEvent.click(queryBtn);

    expect(screen.getByText('Analyzing...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('AI Analysis: Assign Elena Vargas.')).toBeInTheDocument();
    });
  });

  it('falls back to default recommendation when AI query fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url) => {
        if (url === '/api/csrf-token') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'fake-csrf' }),
          });
        }
        if (url === '/api/chat') {
          return Promise.resolve({ ok: false }); // fails
        }
        return Promise.reject(new Error('Unknown URL'));
      }),
    );

    render(
      <IncidentCard
        incident={mockIncident}
        contextData={mockContextData}
        onResolve={mockOnResolve}
        onAssignVolunteer={mockOnAssignVolunteer}
      />,
    );

    const queryBtn = screen.getByLabelText(/Query AI analysis/i);
    fireEvent.click(queryBtn);

    await waitFor(() => {
      expect(screen.getByText('Dispatch cooling team.')).toBeInTheDocument();
    });
  });

  it('handles network error in AI query safely', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url) => {
        if (url === '/api/csrf-token') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'fake-csrf' }),
          });
        }
        if (url === '/api/chat') {
          return Promise.reject(new Error('Network disconnected'));
        }
        return Promise.reject(new Error('Unknown URL'));
      }),
    );

    render(
      <IncidentCard
        incident={mockIncident}
        contextData={mockContextData}
        onResolve={mockOnResolve}
        onAssignVolunteer={mockOnAssignVolunteer}
      />,
    );

    const queryBtn = screen.getByLabelText(/Query AI analysis/i);
    fireEvent.click(queryBtn);

    await waitFor(() => {
      expect(screen.getByText('Dispatch cooling team.')).toBeInTheDocument();
    });
  });
});
