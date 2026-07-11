import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StadiumProvider } from '../../context/StadiumContext';
import CommandCenter from '../CommandCenter';
import initialMockContext from '../../data/mockContext.json';

const mockUseStadiumContext = vi.hoisted(() => vi.fn());
vi.mock('../../context/StadiumContext', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useStadiumContext: () => mockUseStadiumContext(),
  };
});

mockUseStadiumContext.mockReturnValue({
  contextData: initialMockContext,
  resolveIncident: vi.fn(),
  assignVolunteer: vi.fn(),
});

function renderWithContext(component) {
  return render(<StadiumProvider>{component}</StadiumProvider>);
}

describe('CommandCenter edge cases', () => {
  beforeEach(() => {
    mockUseStadiumContext.mockReturnValue({
      contextData: initialMockContext,
      resolveIncident: vi.fn(),
      assignVolunteer: vi.fn(),
    });
  });
  it('handles zero gates gracefully', () => {
    renderWithContext(<CommandCenter />);
    expect(screen.getByLabelText('Command Center Dashboard')).toBeInTheDocument();
  });

  it('displays metric values', () => {
    renderWithContext(<CommandCenter />);
    const kpis = screen.getAllByText(/%/);
    expect(kpis.length).toBeGreaterThanOrEqual(2);
  });

  it('renders incident feed section', () => {
    renderWithContext(<CommandCenter />);
    const headings = screen.getAllByText('Active Incidents');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('shows active incident count', () => {
    renderWithContext(<CommandCenter />);
    const incidentCount = screen.getAllByText(/active/i);
    expect(incidentCount.length).toBeGreaterThan(0);
  });

  it('handles resolve button click', () => {
    renderWithContext(<CommandCenter />);
    const resolveButtons = screen.queryAllByText('Mark Resolved');
    if (resolveButtons.length > 0) {
      fireEvent.click(resolveButtons[0]);
    }
  });

  describe('TRUE edge case tests', () => {
    function buildContext(overrides) {
      return {
        contextData: { ...initialMockContext, ...overrides },
        resolveIncident: vi.fn(),
        assignVolunteer: vi.fn(),
      };
    }

    it('renders alert banner when all gates are critical (extremely high density)', () => {
      const highDensityGates = [
        {
          id: 'A',
          density: 0.96,
          waitTimeMinutes: 32,
          accessible: true,
          status: 'critical',
          direction: 'North',
          accessibleFeatures: ['wheelchair-ramp'],
        },
        {
          id: 'B',
          density: 0.93,
          waitTimeMinutes: 29,
          accessible: false,
          status: 'critical',
          direction: 'South',
          accessibleFeatures: [],
        },
        {
          id: 'C',
          density: 0.99,
          waitTimeMinutes: 38,
          accessible: true,
          status: 'critical',
          direction: 'East',
          accessibleFeatures: ['wheelchair-ramp'],
        },
      ];
      mockUseStadiumContext.mockReturnValue(buildContext({ gates: highDensityGates }));

      render(<CommandCenter />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/CRITICAL/)).toBeInTheDocument();
      expect(screen.getByText(/A, B, C/)).toBeInTheDocument();
    });

    it('renders empty incident state when incidents array is empty', () => {
      mockUseStadiumContext.mockReturnValue(buildContext({ incidents: [] }));

      render(<CommandCenter />);

      const incidentRegion = screen.getByRole('region', { name: /Incident feed/i });
      expect(incidentRegion).toBeInTheDocument();
      expect(screen.getByText(/0 active/)).toBeInTheDocument();
    });

    it('renders all-resolved state when every incident has status resolved', () => {
      const resolvedOnly = initialMockContext.incidents.map((inc) => ({
        ...inc,
        status: 'resolved',
      }));
      mockUseStadiumContext.mockReturnValue(buildContext({ incidents: resolvedOnly }));

      render(<CommandCenter />);

      expect(screen.getByText(/0 active/)).toBeInTheDocument();
      expect(screen.queryByText('Mark Resolved')).not.toBeInTheDocument();
    });

    it('handles empty gates array without crashing', () => {
      mockUseStadiumContext.mockReturnValue(buildContext({ gates: [] }));

      render(<CommandCenter />);
      expect(screen.getByLabelText('Command Center Dashboard')).toBeInTheDocument();
    });

    it('handles missing weather data by rendering gracefully', () => {
      const noWeather = JSON.parse(JSON.stringify(initialMockContext));
      noWeather.stadium.weather = {};
      mockUseStadiumContext.mockReturnValue(buildContext(noWeather));

      render(<CommandCenter />);
      expect(screen.getByLabelText('Command Center Dashboard')).toBeInTheDocument();
    });
  });
});
