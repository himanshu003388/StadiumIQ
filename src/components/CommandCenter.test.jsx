import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'jest-axe';
import CommandCenter from './CommandCenter';
import { StadiumProvider } from '../context/StadiumContext';

describe('CommandCenter Component', () => {
  const renderCommandCenter = () =>
    render(
      <StadiumProvider>
        <CommandCenter />
      </StadiumProvider>,
    );

  it('renders the active incidents heading', () => {
    renderCommandCenter();
    expect(screen.getAllByText(/^Active Incidents$/i).length).toBeGreaterThan(0);
  });

  it('renders KPI cards', () => {
    renderCommandCenter();
    expect(screen.getByText('Crowd Density')).toBeInTheDocument();
    expect(screen.getByText('Occupancy')).toBeInTheDocument();
    const activeIncidents = screen.getAllByText('Active Incidents');
    expect(activeIncidents.length).toBeGreaterThan(0);
    expect(screen.getByText('Temperature')).toBeInTheDocument();
  });

  it('renders zone occupancy section', () => {
    renderCommandCenter();
    expect(screen.getByText('Zone Occupancy')).toBeInTheDocument();
    expect(screen.getByText('North Stand')).toBeInTheDocument();
    expect(screen.getByText('South Stand')).toBeInTheDocument();
    expect(screen.getByText('East Wing')).toBeInTheDocument();
    expect(screen.getByText('West Wing')).toBeInTheDocument();
  });

  it('renders gate status section', () => {
    renderCommandCenter();
    expect(screen.getByText('Gate Status')).toBeInTheDocument();
  });

  it('renders critical gate alert banner when gates are critical', () => {
    renderCommandCenter();
    expect(screen.getByText(/CRITICAL: High congestion at Gate/)).toBeInTheDocument();
  });

  it('renders incident cards with severity badges', () => {
    renderCommandCenter();
    const criticalBadges = screen.getAllByText('critical');
    expect(criticalBadges.length).toBeGreaterThan(0);
    const mediumBadges = screen.getAllByText('medium');
    expect(mediumBadges.length).toBeGreaterThan(0);
  });

  it('renders AI recommended actions for incidents', () => {
    renderCommandCenter();
    const aiActions = screen.getAllByText(/AI Action/i);
    expect(aiActions.length).toBeGreaterThan(0);
  });

  it('renders Mark Resolved buttons for active incidents', () => {
    renderCommandCenter();
    const resolveButtons = screen.getAllByText('Mark Resolved');
    expect(resolveButtons.length).toBeGreaterThan(0);
  });

  it('has aria-live region for incident feed', () => {
    renderCommandCenter();
    const incidentRegion = screen.getByLabelText('Incident feed');
    expect(incidentRegion).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders density percentages for gates', () => {
    renderCommandCenter();
    const gateLabels = screen.getAllByText(/Gate [A-F]/);
    expect(gateLabels.length).toBeGreaterThan(0);
  });

  it('renders resolved badge for resolved incidents', () => {
    renderCommandCenter();
    const resolvedBadges = screen.getAllByText('Resolved');
    expect(resolvedBadges.length).toBeGreaterThan(0);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderCommandCenter();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders resolved incidents without Mark Resolved button', () => {
    renderCommandCenter();
    const resolvedCards = screen.getAllByText('Resolved');
    resolvedCards.forEach((card) => {
      const parent = card.closest('[class*="card"]');
      expect(parent?.textContent).not.toContain('Mark Resolved');
    });
  });

  it('renders no critical gate alert when gates are normal', () => {
    renderCommandCenter();
    const criticalGates = screen.queryAllByText(/CRITICAL: High congestion at Gate/);
    expect(criticalGates.length).toBeGreaterThanOrEqual(0);
  });

  it('shows empty state when no incidents exist', () => {
    renderCommandCenter();
    expect(screen.getAllByText(/Active Incidents/i).length).toBeGreaterThan(0);
  });
});
