/**
 * App Root Component Tests
 * Covers initial render, BrowserRouter integration, and Layout presence
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  it('renders default layout and dashboard view components', async () => {
    render(<App />);

    // Verify all parts of the application shell and Command Center render correctly
    await waitFor(
      () => {
        // 1. Banner/Header
        expect(screen.getByRole('banner')).toBeInTheDocument();
        // 2. Main content region
        expect(screen.getByRole('main')).toBeInTheDocument();
        // 3. Navigation Sidebar
        const navElements = screen.getAllByRole('navigation');
        expect(navElements.length).toBeGreaterThanOrEqual(1);
        // 4. KPIs of CommandCenter
        expect(screen.getByText('Crowd Density')).toBeInTheDocument();
        expect(screen.getByText('Occupancy')).toBeInTheDocument();
        // 5. AI Active Status indicator
        expect(screen.getByText('AI Active')).toBeInTheDocument();
        // 6. Accessible Skip-to-content Link
        const skipLink = document.querySelector('a[href="#main-content"]');
        expect(skipLink).not.toBeNull();
      },
      { timeout: 15000 },
    );
  });
});
