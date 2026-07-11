import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StadiumProvider } from '../../context/StadiumContext';
import Sustainability from '../Sustainability';

function renderWithContext(component) {
  return render(<StadiumProvider>{component}</StadiumProvider>);
}

describe('Sustainability edge cases', () => {
  it('renders without crashing', () => {
    renderWithContext(<Sustainability />);
    expect(screen.getByText('Sustainability Dashboard')).toBeInTheDocument();
  });

  it('toggles eco mode', () => {
    renderWithContext(<Sustainability />);
    const toggle = screen.getByText(/Enable Eco Mode|Eco Mode: ON/);
    fireEvent.click(toggle);
  });

  it('displays energy metrics', () => {
    renderWithContext(<Sustainability />);
    expect(screen.getByText('Energy Draw')).toBeInTheDocument();
  });

  it('displays water usage', () => {
    renderWithContext(<Sustainability />);
    expect(screen.getByText('Water Usage')).toBeInTheDocument();
  });

  it('displays waste diversion', () => {
    renderWithContext(<Sustainability />);
    expect(screen.getByText('Waste Diverted')).toBeInTheDocument();
  });

  it('displays solar output', () => {
    renderWithContext(<Sustainability />);
    expect(screen.getByText('Solar Output')).toBeInTheDocument();
  });

  it('shows FIFA sustainability goals', () => {
    renderWithContext(<Sustainability />);
    expect(screen.getByText('FIFA World Cup 2026 Sustainability Goals')).toBeInTheDocument();
  });

  it('shows CO2 savings section', () => {
    renderWithContext(<Sustainability />);
    expect(screen.getByText('CO₂ Savings Today')).toBeInTheDocument();
  });

  it('shows energy mix chart', () => {
    renderWithContext(<Sustainability />);
    expect(screen.getByText('Energy Mix')).toBeInTheDocument();
  });

  it('shows AI insight panel', () => {
    renderWithContext(<Sustainability />);
    expect(screen.getByText(/AI Insight/)).toBeInTheDocument();
  });
});
