import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from '../ChatInput';

describe('ChatInput', () => {
  const defaultProps = {
    input: '',
    setInput: vi.fn(),
    handleSend: vi.fn(),
    isLoading: false,
    language: 'en',
    inputRef: { current: null },
  };

  it('renders textarea and send button', () => {
    render(<ChatInput {...defaultProps} />);
    expect(screen.getByLabelText('Type your message to Stadium IQ')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('calls setInput on type', async () => {
    const setInput = vi.fn();
    render(<ChatInput {...defaultProps} setInput={setInput} />);
    const textarea = screen.getByLabelText('Type your message to Stadium IQ');
    await userEvent.type(textarea, 'h');
    expect(setInput).toHaveBeenCalled();
  });

  it('calls handleSend on Enter', () => {
    const handleSend = vi.fn();
    const setInput = vi.fn();
    render(
      <ChatInput {...defaultProps} setInput={setInput} handleSend={handleSend} input="hello" />,
    );
    const textarea = screen.getByLabelText('Type your message to Stadium IQ');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(handleSend).toHaveBeenCalled();
  });

  it('does not send on Shift+Enter', () => {
    const handleSend = vi.fn();
    render(<ChatInput {...defaultProps} handleSend={handleSend} input="hello" />);
    const textarea = screen.getByLabelText('Type your message to Stadium IQ');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(handleSend).not.toHaveBeenCalled();
  });

  it('disables send button when input is empty', () => {
    render(<ChatInput {...defaultProps} input="" />);
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('disables send button when loading', () => {
    render(<ChatInput {...defaultProps} input="hello" isLoading={true} />);
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('enables send button when input has text', () => {
    render(<ChatInput {...defaultProps} input="hello" />);
    expect(screen.getByLabelText('Send message')).not.toBeDisabled();
  });

  it('toggles speech recognition when voice button is clicked', () => {
    const setInput = vi.fn();
    const mockStart = vi.fn();
    const mockStop = vi.fn();

    // Attach hooks to the global mock
    window.SpeechRecognition.onStartCalled = mockStart;
    window.SpeechRecognition.onStopCalled = mockStop;

    render(<ChatInput {...defaultProps} setInput={setInput} />);

    // Get the start voice input button
    const voiceBtn = screen.getByLabelText('Start voice input');
    expect(voiceBtn).toBeInTheDocument();

    // Click it to start
    fireEvent.click(voiceBtn);
    expect(mockStart).toHaveBeenCalled();

    // Verify it is now "Stop voice input"
    expect(screen.getByLabelText('Stop voice input')).toBeInTheDocument();

    // Trigger onresult callback using the captured instance
    const instance = window.SpeechRecognition.lastInstance;
    expect(instance).not.toBeNull();

    instance.onresult({
      results: [[{ transcript: 'test voice input' }]],
    });
    expect(setInput).toHaveBeenCalled();

    // Trigger onerror callback
    instance.onerror();

    // Click it to stop
    fireEvent.click(voiceBtn);
    expect(mockStop).toHaveBeenCalled();

    // Reset hooks
    window.SpeechRecognition.onStartCalled = null;
    window.SpeechRecognition.onStopCalled = null;
    window.SpeechRecognition.lastInstance = null;
  });
});
