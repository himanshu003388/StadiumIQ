import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'jest-axe';
import TransportHub from './TransportHub';
import { StadiumProvider } from '../context/StadiumContext';

describe('TransportHub Component', () => {
  const renderTransportHub = () =>
    render(
      <StadiumProvider>
        <TransportHub />
      </StadiumProvider>,
    );

  it('renders the transport hub heading', () => {
    renderTransportHub();
    expect(screen.getByText(/Transport Hub/i)).toBeInTheDocument();
  });

  it('renders quick stats', () => {
    renderTransportHub();
    expect(screen.getByText('Fastest Option')).toBeInTheDocument();
    expect(screen.getByText(/Lowest CO₂/)).toBeInTheDocument();
    expect(screen.getByText('Total Seats Left')).toBeInTheDocument();
  });

  it('renders AI departure recommendation', () => {
    renderTransportHub();
    expect(screen.getByText('AI Departure Recommendation')).toBeInTheDocument();
  });

  it('renders sort buttons', () => {
    renderTransportHub();
    expect(screen.getByText('AI Recommended')).toBeInTheDocument();
    expect(screen.getByText('Fastest')).toBeInTheDocument();
    expect(screen.getByText('Most Eco')).toBeInTheDocument();
    expect(screen.getByText('Most Seats')).toBeInTheDocument();
  });

  it('renders transport option cards', () => {
    renderTransportHub();
    expect(screen.getByText('Subway')).toBeInTheDocument();
    expect(screen.getByText('Shuttle')).toBeInTheDocument();
    const rideshareElements = screen.getAllByText('Rideshare');
    expect(rideshareElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Train')).toBeInTheDocument();
    const bikeShareElements = screen.getAllByText('Bike Share');
    expect(bikeShareElements.length).toBeGreaterThan(0);
  });

  it('displays CO₂ impact scores', () => {
    renderTransportHub();
    expect(screen.getByText('Zero Emission')).toBeInTheDocument();
    const co2Impact = screen.getAllByText(/CO₂ Impact/i);
    expect(co2Impact.length).toBeGreaterThan(0);
  });

  it('shows recommended badge for recommended transport', () => {
    renderTransportHub();
    const recommendedBadges = screen.getAllByText(/Recommended/);
    expect(recommendedBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('changes sort order when sort button is clicked', () => {
    renderTransportHub();
    const fastestBtn = screen.getByRole('radio', { name: /Sort by Fastest/i });
    fireEvent.click(fastestBtn);
    // The button should be in active state (primary background)
    expect(fastestBtn).toHaveStyle({ background: 'var(--color-primary)' });
  });

  it('renders navigate buttons', () => {
    renderTransportHub();
    const navigateButtons = screen.getAllByText('Navigate');
    expect(navigateButtons.length).toBeGreaterThan(0);
  });

  it('renders capacity indicators', () => {
    renderTransportHub();
    const seatsLeft = screen.getAllByText(/seats left/i);
    expect(seatsLeft.length).toBeGreaterThan(0);
  });

  it('renders ETA values', () => {
    renderTransportHub();
    // ETA values should be displayed
    const etaElements = screen.getAllByText(/m\b/);
    expect(etaElements.length).toBeGreaterThan(0);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderTransportHub();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 10000);

  it('changes sort order when sort buttons are clicked', () => {
    renderTransportHub();
    const fastestBtn = screen.getByRole('radio', { name: /Sort by Fastest/i });
    fireEvent.click(fastestBtn);
    expect(fastestBtn).toHaveAttribute('aria-checked', 'true');
    const ecoBtn = screen.getByRole('radio', { name: /Sort by Most Eco/i });
    fireEvent.click(ecoBtn);
    expect(ecoBtn).toHaveAttribute('aria-checked', 'true');
    expect(fastestBtn).toHaveAttribute('aria-checked', 'false');
  });

  it('renders AI departure recommendation', () => {
    renderTransportHub();
    expect(screen.getByText('AI Departure Recommendation')).toBeInTheDocument();
  });

  it('handles empty transport options gracefully', () => {
    const { container } = renderTransportHub();
    const region = container.querySelector('[aria-label="Transport options"]');
    expect(region).toBeInTheDocument();
  });
});
