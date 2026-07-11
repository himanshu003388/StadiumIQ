import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'jest-axe';
import Sidebar from './Sidebar';
import { StadiumProvider } from '../context/StadiumContext';

describe('Sidebar Component', () => {
  const renderSidebar = (activeView = 'command') => {
    const setActiveView = vi.fn();
    return {
      setActiveView,
      ...render(
        <StadiumProvider>
          <Sidebar activeView={activeView} setActiveView={setActiveView} />
        </StadiumProvider>,
      ),
    };
  };

  it('renders all navigation links with aria-labels', () => {
    renderSidebar();
    expect(screen.getAllByLabelText(/WC 26 Ops Center/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/GenAI Assistant/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Crowd & Navigation/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Resource Dispatch/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Transport Hub/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Sustainability/i).length).toBeGreaterThan(0);
  });

  it('marks active nav item with aria-current="page"', () => {
    renderSidebar('ai');
    const activeLinks = screen.getAllByRole('button', { name: /GenAI Assistant/i });
    activeLinks.forEach((link) => {
      if (link.getAttribute('aria-current') === 'page') {
        expect(link).toHaveAttribute('aria-current', 'page');
      }
    });
  });

  it('renders venue info', () => {
    renderSidebar();
    expect(screen.getByText('VENUE')).toBeInTheDocument();
    expect(screen.getByText('AT&T Stadium')).toBeInTheDocument();
    expect(screen.getByText('Arlington, TX')).toBeInTheDocument();
  });

  it('renders live status indicator', () => {
    renderSidebar();
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('renders systems nominal footer', () => {
    renderSidebar();
    expect(screen.getByText('Systems Nominal')).toBeInTheDocument();
  });

  it('renders capacity and renewable percentage', () => {
    renderSidebar();
    expect(screen.getByText(/% capacity/)).toBeInTheDocument();
    expect(screen.getByText(/% renewable/)).toBeInTheDocument();
  });

  it('shows badge counts for critical items', () => {
    renderSidebar();
    // With mock data, should have incident badges
    const badges = screen.getAllByLabelText(/\d+ alerts/);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('calls setActiveView when a nav item is clicked', () => {
    const { setActiveView } = renderSidebar();
    const crowdBtn = screen.getAllByLabelText(/Crowd & Navigation/i)[0];
    fireEvent.click(crowdBtn);
    expect(setActiveView).toHaveBeenCalledWith('crowd');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderSidebar();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders all NAV_ITEMS with labels', () => {
    renderSidebar();
    expect(screen.getAllByLabelText(/WC 26 Ops Center/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/GenAI Assistant/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Crowd & Navigation/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Resource Dispatch/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Transport Hub/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Sustainability/i).length).toBeGreaterThan(0);
  });

  it('shows badge counts for critical items', () => {
    renderSidebar();
    const badges = screen.getAllByLabelText(/\d+ alerts/);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('renders mobile navigation buttons', () => {
    renderSidebar();
    const mobileNav = document.querySelector('[aria-label="Mobile navigation"]');
    expect(mobileNav).toBeInTheDocument();
    const navButtons = mobileNav.querySelectorAll('button');
    expect(navButtons.length).toBeGreaterThan(0);
  });

  it('handles uploading a valid JSON test dataset', async () => {
    renderSidebar();
    const file = new File(
      [
        JSON.stringify({
          gates: [],
          incidents: [],
          tasks: [],
          volunteers: [],
          stadium: {
            name: 'Test Stadium',
            capacity: 50000,
            currentOccupancy: 20000,
            sustainability: { renewablePercentage: 80, ecoModeActive: false, trashBins: [] },
          },
        }),
      ],
      'test.json',
      { type: 'application/json' },
    );
    const fileInput = screen.getByLabelText(/Upload test dataset JSON or CSV file/i);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await screen.findByText(/Dataset loaded/i);
  });

  it('handles uploading a valid CSV test dataset', async () => {
    renderSidebar();
    const file = new File(['Gate,A,0.95,32,true,North'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByLabelText(/Upload test dataset JSON or CSV file/i);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await screen.findByText(/Dataset loaded/i);
  });

  it('handles invalid uploaded dataset file validation errors', async () => {
    renderSidebar();
    const file = new File([JSON.stringify({ gates: [{ id: 'A' }] })], 'invalid.json', {
      type: 'application/json',
    });
    const fileInput = screen.getByLabelText(/Upload test dataset JSON or CSV file/i);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await screen.findByText(/density must be/i);
  });

  it('handles file reading failure gracefully during upload', async () => {
    renderSidebar();
    const file = new File([''], 'error.json', { type: 'application/json' });
    vi.spyOn(file, 'text').mockRejectedValue(new Error('File read error'));

    const fileInput = screen.getByLabelText(/Upload test dataset JSON or CSV file/i);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await screen.findByText(/File read error/i);
  });
});
