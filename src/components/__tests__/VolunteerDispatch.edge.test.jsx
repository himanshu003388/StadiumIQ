import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StadiumProvider } from '../../context/StadiumContext';
import VolunteerDispatch from '../VolunteerDispatch';

function renderWithContext(component) {
  return render(<StadiumProvider>{component}</StadiumProvider>);
}

describe('VolunteerDispatch edge cases', () => {
  it('renders without crashing', () => {
    renderWithContext(<VolunteerDispatch />);
    expect(screen.getByText('Volunteer Dispatch')).toBeInTheDocument();
  });

  it('shows task board', () => {
    renderWithContext(<VolunteerDispatch />);
    expect(screen.getByText(/Tasks requiring assignment/i)).toBeInTheDocument();
  });

  it('shows volunteer roster', () => {
    renderWithContext(<VolunteerDispatch />);
    expect(screen.getByText('Volunteer Roster')).toBeInTheDocument();
  });

  it('shows task counts', () => {
    renderWithContext(<VolunteerDispatch />);
    expect(screen.getByText('Open Tasks')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('handles AI assign button click', () => {
    renderWithContext(<VolunteerDispatch />);
    const assignButtons = screen.queryAllByText('AI Assign');
    if (assignButtons.length > 0) {
      fireEvent.click(assignButtons[0]);
    }
  });

  it('shows task cards', () => {
    renderWithContext(<VolunteerDispatch />);
    const taskCards = screen.getAllByRole('listitem');
    expect(taskCards.length).toBeGreaterThan(0);
  });
});
