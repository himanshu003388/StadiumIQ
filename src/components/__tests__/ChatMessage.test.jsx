import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatMessage from '../ChatMessage';

describe('ChatMessage', () => {
  const createMsg = (overrides = {}) => ({
    id: 'msg1',
    role: 'user',
    text: 'Hello',
    timestamp: new Date(),
    ...overrides,
  });

  it('renders user message', () => {
    render(<ChatMessage msg={createMsg()} index={0} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders AI message with markdown styling', () => {
    const msg = createMsg({ role: 'ai', text: '**bold** response' });
    render(<ChatMessage msg={msg} index={0} />);
    expect(screen.getByText('bold', { exact: false })).toBeInTheDocument();
  });

  it('shows timestamp', () => {
    const msg = createMsg({ text: 'Test', timestamp: new Date('2026-07-08T12:00:00') });
    render(<ChatMessage msg={msg} index={0} />);
    expect(screen.getByText(/12:00/)).toBeInTheDocument();
  });

  it('renders AI icon for AI messages', () => {
    render(<ChatMessage msg={createMsg({ role: 'ai' })} index={0} />);
    expect(screen.getByText('smart_toy')).toBeInTheDocument();
  });

  it('renders user icon for user messages', () => {
    render(<ChatMessage msg={createMsg({ role: 'user' })} index={0} />);
    expect(screen.getByText('person')).toBeInTheDocument();
  });

  it('toggles context grounding list when Why? button is clicked', () => {
    const contextData = {
      gates: [{ id: 'A' }, { id: 'B' }],
      incidents: [{ id: 'INC-1', type: 'medical', status: 'active' }],
      volunteers: [{ id: 'V1' }],
    };
    const msg = createMsg({ role: 'ai', text: 'Response' });
    render(<ChatMessage msg={msg} index={0} contextData={contextData} />);

    // Get the Why? button
    const whyBtn = screen.getByLabelText('Show what context data grounded this response');
    expect(whyBtn).toBeInTheDocument();

    // Click it to expand
    fireEvent.click(whyBtn);

    // Verify it is expanded and has Grounded in: header
    expect(screen.getByLabelText('Hide context grounding')).toBeInTheDocument();
    expect(screen.getByText('Grounded in:')).toBeInTheDocument();
    expect(screen.getByText(/2 gates/)).toBeInTheDocument();
    expect(screen.getByText(/1 active incidents/)).toBeInTheDocument();
    expect(screen.getByText(/1 volunteers/)).toBeInTheDocument();

    // Click again to hide
    fireEvent.click(screen.getByLabelText('Hide context grounding'));
    expect(screen.queryByText('Grounded in:')).not.toBeInTheDocument();
  });
});
