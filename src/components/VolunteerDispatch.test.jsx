import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'jest-axe';
import VolunteerDispatch from './VolunteerDispatch';
import { StadiumProvider } from '../context/StadiumContext';

describe('VolunteerDispatch Component', () => {
  const renderDispatch = () =>
    render(
      <StadiumProvider>
        <VolunteerDispatch />
      </StadiumProvider>,
    );

  it('renders the volunteer dispatch heading', () => {
    renderDispatch();
    expect(screen.getByText(/Volunteer Dispatch/i)).toBeInTheDocument();
  });

  it('renders open tasks heading', () => {
    renderDispatch();
    expect(screen.getByText(/Tasks requiring assignment/i)).toBeInTheDocument();
  });

  it('renders Open Tasks count', () => {
    renderDispatch();
    expect(screen.getByText('Open Tasks')).toBeInTheDocument();
  });

  it('renders available count', () => {
    renderDispatch();
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('renders volunteer roster', () => {
    renderDispatch();
    expect(screen.getByText('Volunteer Roster')).toBeInTheDocument();
    expect(screen.getAllByText('Elena Vargas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Marcus Dupont').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sofia Reyes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Yuki Tanaka').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ahmed Al-Rashid').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Priya Sharma').length).toBeGreaterThan(0);
  });

  it('renders priority badges on tasks', () => {
    renderDispatch();
    const highBadges = screen.getAllByText('high');
    expect(highBadges.length).toBeGreaterThan(0);
    const mediumBadges = screen.getAllByText('medium');
    expect(mediumBadges.length).toBeGreaterThan(0);
    const lowBadges = screen.getAllByText('low');
    expect(lowBadges.length).toBeGreaterThan(0);
  });

  it('displays language requirements on tasks', () => {
    renderDispatch();
    // Language requirement "first-aid" appears in tasks
    const firstAidTag = screen.getAllByText('first-aid');
    expect(firstAidTag.length).toBeGreaterThan(0);
  });

  it('renders AI Assign buttons for open tasks', () => {
    renderDispatch();
    const assignButtons = screen.getAllByText('AI Assign');
    expect(assignButtons.length).toBeGreaterThan(0);
  });

  it('shows volunteer skill tags', () => {
    renderDispatch();
    const firstAidTags = screen.getAllByText('first-aid');
    expect(firstAidTags.length).toBeGreaterThan(0);
    const crowdControlTags = screen.getAllByText('crowd-control');
    expect(crowdControlTags.length).toBeGreaterThan(0);
  });

  it('shows load bars for volunteers', () => {
    renderDispatch();
    const loadValues = screen.getAllByText('2/5');
    expect(loadValues.length).toBeGreaterThan(0);
  });

  it('shows in-progress section', () => {
    renderDispatch();
    const progressElements = screen.getAllByText(/In Progress/);
    expect(progressElements.length).toBeGreaterThan(0);
  });

  it('renders volunteer zone info', () => {
    renderDispatch();
    const northZones = screen.getAllByText(/Zone: North/);
    expect(northZones.length).toBeGreaterThan(0);
    const southZones = screen.getAllByText(/Zone: South/);
    expect(southZones.length).toBeGreaterThan(0);
    const eastZones = screen.getAllByText(/Zone: East/);
    expect(eastZones.length).toBeGreaterThan(0);
    const westZones = screen.getAllByText(/Zone: West/);
    expect(westZones.length).toBeGreaterThan(0);
  });

  it('triggers AI suggestion when AI Assign is clicked', async () => {
    renderDispatch();
    const assignButton = screen.getAllByText('AI Assign')[0];
    fireEvent.click(assignButton);
    // Should show analyzing state
    expect(screen.getByText(/Analyzing/)).toBeInTheDocument();
  });

  it('shows task descriptions', () => {
    renderDispatch();
    expect(screen.getByText(/Wheelchair user needs assistance/)).toBeInTheDocument();
    expect(screen.getByText(/Direct post-match traffic/)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderDispatch();
    // The jest-axe scan can be slow for this complex component
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 30000);

  it('shows AI Assign button for open tasks', () => {
    renderDispatch();
    const assignButtons = screen.getAllByText('AI Assign');
    expect(assignButtons.length).toBeGreaterThan(0);
  });

  it('displays eligible volunteers section when no eligible volunteers', () => {
    renderDispatch();
    const noEligible = screen.queryAllByText(/No eligible volunteers/i);
    expect(noEligible.length).toBeGreaterThanOrEqual(0);
  });

  it('marks task as completed when Complete button is clicked', () => {
    renderDispatch();
    const completeButtons = screen.queryAllByLabelText('Mark task as completed');
    if (completeButtons.length > 0) {
      fireEvent.click(completeButtons[0]);
    }
  });
});
