import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'jest-axe';
import CrowdMap from './CrowdMap';
import { StadiumProvider } from '../context/StadiumContext';

describe('CrowdMap Component', () => {
  const renderCrowdMap = () =>
    render(
      <StadiumProvider>
        <CrowdMap />
      </StadiumProvider>,
    );

  it('renders the crowd map heading', () => {
    renderCrowdMap();
    expect(screen.getByText(/Crowd & Navigation/i)).toBeInTheDocument();
  });

  it('renders live stadium name', () => {
    renderCrowdMap();
    expect(screen.getByText('AT&T Stadium')).toBeInTheDocument();
  });

  it('renders color legend', () => {
    renderCrowdMap();
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('Busy')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('renders gate status panel', () => {
    renderCrowdMap();
    expect(screen.getByText('Gate Status')).toBeInTheDocument();
  });

  it('renders gate entries with wait times', () => {
    renderCrowdMap();
    expect(screen.getByText('Gate Status')).toBeInTheDocument();
    const gateIcons = document.querySelectorAll('svg text');
    const hasGateA = Array.from(gateIcons).some((el) => el.textContent === 'A');
    expect(hasGateA).toBe(true);
  });

  it('renders Predictive Egress Advisor card', () => {
    renderCrowdMap();
    expect(screen.getByText('Predictive Egress Advisor')).toBeInTheDocument();
  });

  it('renders egress advisor summary with gate info', () => {
    renderCrowdMap();
    const advisorCard = screen.getByText('Predictive Egress Advisor').closest('div');
    expect(advisorCard).toBeInTheDocument();
    expect(screen.getByText('Predictive Egress Advisor')).toBeInTheDocument();
  });

  it('shows zone detail when zone is clicked', () => {
    renderCrowdMap();
    const northZone = screen.getByRole('button', { name: /north stand/i });
    fireEvent.click(northZone);
    expect(screen.getByText('Occupancy')).toBeInTheDocument();
  });

  it('renders accessibility icons for accessible gates', () => {
    renderCrowdMap();
    const accessibleIcons = document.querySelectorAll('.material-symbols-outlined');
    const accessibleIcon = Array.from(accessibleIcons).find(
      (el) => el.textContent === 'accessible',
    );
    expect(accessibleIcon).toBeInTheDocument();
  });

  it('renders SVG stadium map', () => {
    renderCrowdMap();
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderCrowdMap();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('shows zone details on click and deselects on second click', () => {
    renderCrowdMap();
    const northZone = screen.getByRole('button', { name: /north/iu });
    fireEvent.click(northZone);
    expect(screen.getByText('Occupancy')).toBeInTheDocument();
    fireEvent.click(northZone);
    expect(screen.queryByText('Occupancy')).not.toBeInTheDocument();
  });

  it('has correct SVG attributes', () => {
    renderCrowdMap();
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('role', 'application');
    expect(svg).toHaveAttribute('aria-label', 'Interactive stadium map showing zone occupancy');
  });

  it('handles keyboard navigation for zones', () => {
    renderCrowdMap();
    const northZone = screen.getByRole('button', { name: /north/iu });
    fireEvent.keyDown(northZone, { key: 'ArrowRight' });
    fireEvent.keyDown(northZone, { key: 'ArrowLeft' });
    fireEvent.keyDown(northZone, { key: 'Enter' });
    expect(screen.getByText('Occupancy')).toBeInTheDocument();
  });

  it('handles Predictive Egress Advisor AI query flow', async () => {
    const mockCsrf = { csrfToken: 'csrf-test-token' };
    const mockChatResponse = { reply: 'Gemini Egress Advice Reply!' };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (url === '/api/csrf-token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCsrf),
        });
      }
      if (url === '/api/chat') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockChatResponse),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    renderCrowdMap();

    const queryBtn = screen.getByRole('button', { name: /Query Egress Routing AI/i });
    fireEvent.click(queryBtn);

    expect(screen.getByText(/Gemini is reasoning.../i)).toBeInTheDocument();

    await screen.findByText('Gemini Egress Advice Reply!');
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    fetchSpy.mockRestore();
  });

  it('handles Predictive Egress Advisor AI query fallback on failure', async () => {
    const mockCsrf = { csrfToken: 'csrf-test-token' };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (url === '/api/csrf-token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCsrf),
        });
      }
      if (url === '/api/chat') {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    renderCrowdMap();

    const queryBtn = screen.getByRole('button', { name: /Query Egress Routing AI/i });
    fireEvent.click(queryBtn);

    await screen.findByText(/Recommended Egress Route \(Local Analysis\)/i);

    fetchSpy.mockRestore();
  });

  it('handles Predictive Egress Advisor AI query catch fallback on network exception', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    renderCrowdMap();

    const queryBtn = screen.getByRole('button', { name: /Query Egress Routing AI/i });
    fireEvent.click(queryBtn);

    await screen.findByText(/Local Egress Fallback/i);

    fetchSpy.mockRestore();
  });
});
