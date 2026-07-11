import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import BeforeAfterImpact from '../BeforeAfterImpact';
import KPICard from '../KPICard';
import SeverityBadge from '../SeverityBadge';
import StatusDot from '../StatusDot';
import GateRow from '../GateRow';

describe('Common Presentation Components', () => {
  describe('BeforeAfterImpact', () => {
    it('renders heading and AI impact metrics', () => {
      render(<BeforeAfterImpact />);
      expect(screen.getByText('AI Impact Overview')).toBeInTheDocument();
      expect(screen.getByText('Avg gate decision time')).toBeInTheDocument();
      expect(screen.getByText('Language coverage')).toBeInTheDocument();
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<BeforeAfterImpact />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('KPICard', () => {
    it('renders label, value, unit, and subtitle', () => {
      render(
        <KPICard
          label="Test Label"
          value="99"
          unit="%"
          icon="groups"
          color="#ff0000"
          sub="Subtitle text"
          delay={1}
        />,
      );
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByText('99')).toBeInTheDocument();
      expect(screen.getByText('%')).toBeInTheDocument();
      expect(screen.getByText('Subtitle text')).toBeInTheDocument();
      expect(screen.getByText('groups')).toBeInTheDocument();
    });

    it('handles numeric value and no unit or subtitle', () => {
      render(
        <KPICard label="Numeric Label" value={42} icon="emergency" color="#00ff00" delay={2} />,
      );
      expect(screen.getByText('Numeric Label')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });
  });

  describe('SeverityBadge', () => {
    it('renders with standard severity classes', () => {
      const { rerender } = render(<SeverityBadge severity="critical" />);
      expect(screen.getByText('critical')).toHaveClass('badge-critical');

      rerender(<SeverityBadge severity="medium" />);
      expect(screen.getByText('medium')).toHaveClass('badge-warning');

      rerender(<SeverityBadge severity="low" />);
      expect(screen.getByText('low')).toHaveClass('badge-info');
    });

    it('falls back to badge-info for unknown severity', () => {
      render(<SeverityBadge severity="unknown-level" />);
      expect(screen.getByText('unknown-level')).toHaveClass('badge-info');
    });
  });

  describe('StatusDot', () => {
    it('renders resolved status without pulsing animation', () => {
      const { container } = render(<StatusDot status="resolved" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('resolved')).toBeInTheDocument();
      // No ping element when resolved
      expect(container.querySelectorAll('.animate-ping')).toHaveLength(0);
    });

    it('renders active or watch status with pulsing animation', () => {
      const { container } = render(<StatusDot status="active" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(container.querySelectorAll('.animate-ping')).toHaveLength(1);
    });

    it('falls back to default color for unknown status', () => {
      render(<StatusDot status="unknown-status" />);
      expect(screen.getByText('unknown-status')).toBeInTheDocument();
    });
  });

  describe('GateRow', () => {
    const defaultGate = {
      id: 'A',
      direction: 'North',
      density: 0.75,
      waitTimeMinutes: 12,
      accessible: true,
      accessibleFeatures: ['wheelchair-ramp', 'hearing-loop'],
    };

    it('renders gate status, wait time, accessibility indicators', () => {
      render(<GateRow gate={defaultGate} reasoning="Divert 10%" />);
      expect(screen.getByText('Gate A — North')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('12m')).toBeInTheDocument();
      expect(screen.getByText('Divert 10%')).toBeInTheDocument();
      expect(screen.getByTitle('Wheelchair accessible')).toBeInTheDocument();
      expect(screen.getByTitle('Hearing loop')).toBeInTheDocument();
    });

    it('handles gate without reasoning or accessibility features', () => {
      const basicGate = {
        id: 'B',
        direction: 'South',
        density: 0.25,
        waitTimeMinutes: 2,
        accessible: false,
        accessibleFeatures: [],
      };
      render(<GateRow gate={basicGate} />);
      expect(screen.getByText('Gate B — South')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('2m')).toBeInTheDocument();
      expect(screen.queryByTitle('Wheelchair accessible')).not.toBeInTheDocument();
    });
  });
});
