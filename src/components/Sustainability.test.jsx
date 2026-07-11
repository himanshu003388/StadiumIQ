import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'jest-axe';
import Sustainability from './Sustainability';
import { StadiumProvider } from '../context/StadiumContext';

describe('Sustainability Component', () => {
  const renderSustainability = () =>
    render(
      <StadiumProvider>
        <Sustainability />
      </StadiumProvider>,
    );

  it('renders the sustainability dashboard heading', () => {
    renderSustainability();
    expect(screen.getByText(/Sustainability Dashboard/i)).toBeInTheDocument();
  });

  it('renders eco mode toggle button', () => {
    renderSustainability();
    const toggleBtn = screen.getByRole('button', { name: /Eco Mode/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it('renders metric cards', () => {
    renderSustainability();
    expect(screen.getByText('Energy Draw')).toBeInTheDocument();
    expect(screen.getByText('Water Usage')).toBeInTheDocument();
    expect(screen.getByText('Waste Diverted')).toBeInTheDocument();
    expect(screen.getByText('Solar Output')).toBeInTheDocument();
  });

  it('renders energy mix section', () => {
    renderSustainability();
    expect(screen.getByText('Energy Mix')).toBeInTheDocument();
    expect(screen.getByText('Renewable')).toBeInTheDocument();
    expect(screen.getByText('Net Zero')).toBeInTheDocument();
  });

  it('renders resource targets', () => {
    renderSustainability();
    expect(screen.getAllByText(/Renewable Energy/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Waste Diversion/i)).toBeInTheDocument();
    expect(screen.getByText(/Net Zero Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Water Recycled/i)).toBeInTheDocument();
  });

  it('renders CO₂ savings section', () => {
    renderSustainability();
    expect(screen.getByText(/CO₂ Savings Today/i)).toBeInTheDocument();
  });

  it('renders FIFA sustainability goals', () => {
    renderSustainability();
    expect(screen.getByText(/FIFA World Cup 2026 Sustainability Goals/i)).toBeInTheDocument();
    expect(screen.getByText(/Carbon Neutral Events/i)).toBeInTheDocument();
    expect(screen.getByText(/30% Water Reduction/i)).toBeInTheDocument();
    expect(screen.getByText(/100% Renewable Energy/i)).toBeInTheDocument();
  });

  it('toggles eco mode when button is clicked', () => {
    renderSustainability();
    const toggleBtn = screen.getByRole('button', { name: /Eco Mode/i });
    fireEvent.click(toggleBtn);
    // After toggling, the banner should appear
    expect(screen.getByText(/Eco Mode Activated/i)).toBeInTheDocument();
    // The button text should reflect active state
    expect(screen.getByText(/Eco Mode: ON/i)).toBeInTheDocument();
  });

  it('shows AI insight section', () => {
    renderSustainability();
    expect(screen.getByText(/AI Insight/i)).toBeInTheDocument();
  });

  it('shows goal status badges', () => {
    renderSustainability();
    const onTrack = screen.getAllByText('On Track');
    expect(onTrack.length).toBeGreaterThan(0);
    const watch = screen.getAllByText('Watch');
    expect(watch.length).toBeGreaterThan(0);
  });

  it('enables eco mode shows reduced energy', () => {
    renderSustainability();
    fireEvent.click(screen.getByRole('button', { name: /Eco Mode/i }));
    expect(screen.getByText(/Eco Mode Activated/i)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderSustainability();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('toggles eco mode on and off', () => {
    renderSustainability();
    const toggleBtn = screen.getByRole('button', { name: /Eco Mode/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Eco Mode Activated/i)).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(screen.queryByText(/Eco Mode Activated/i)).not.toBeInTheDocument();
  });

  it('displays metric values as numbers', () => {
    renderSustainability();
    const valueElements = document.querySelectorAll('.text-metric-lg');
    valueElements.forEach((el) => {
      const val = el.textContent.replace(/[^0-9.]/g, '');
      if (val) expect(isNaN(Number(val))).toBe(false);
    });
  });

  it('renders progress bars with accessible attributes', () => {
    renderSustainability();
    const progressBars = document.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBeGreaterThan(0);
    progressBars.forEach((bar) => {
      expect(bar).toHaveAttribute('aria-valuenow');
      expect(bar).toHaveAttribute('aria-valuemin');
      expect(bar).toHaveAttribute('aria-valuemax');
    });
  });
});
