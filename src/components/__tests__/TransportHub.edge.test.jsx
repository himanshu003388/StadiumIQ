import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StadiumProvider } from '../../context/StadiumContext';
import TransportHub from '../TransportHub';

function renderWithContext(component) {
  return render(<StadiumProvider>{component}</StadiumProvider>);
}

describe('TransportHub edge cases', () => {
  it('renders without crashing', () => {
    renderWithContext(<TransportHub />);
    expect(screen.getByText('Transport Hub')).toBeInTheDocument();
  });

  it('shows departure options', () => {
    renderWithContext(<TransportHub />);
    const cards = screen.getAllByRole('listitem');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('sorts by fastest', () => {
    renderWithContext(<TransportHub />);
    fireEvent.click(screen.getByLabelText('Sort by Fastest'));
    expect(screen.getByText('Fastest')).toBeInTheDocument();
  });

  it('sorts by most eco', () => {
    renderWithContext(<TransportHub />);
    fireEvent.click(screen.getByLabelText('Sort by Most Eco'));
    expect(screen.getByText('Most Eco')).toBeInTheDocument();
  });

  it('sorts by most seats', () => {
    renderWithContext(<TransportHub />);
    fireEvent.click(screen.getByLabelText('Sort by Most Seats'));
    expect(screen.getByText('Most Seats')).toBeInTheDocument();
  });

  it('displays AI departure recommendation', () => {
    renderWithContext(<TransportHub />);
    expect(screen.getByText('AI Departure Recommendation')).toBeInTheDocument();
  });

  it('displays quick stats', () => {
    renderWithContext(<TransportHub />);
    expect(screen.getByText('Fastest Option')).toBeInTheDocument();
    expect(screen.getByText('Lowest CO₂/km')).toBeInTheDocument();
    expect(screen.getByText('Total Seats Left')).toBeInTheDocument();
  });

  it('has navigate buttons on transport cards', () => {
    renderWithContext(<TransportHub />);
    const navigateButtons = screen.getAllByText('Navigate');
    expect(navigateButtons.length).toBeGreaterThan(0);
  });
});
