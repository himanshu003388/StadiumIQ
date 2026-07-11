/**
 * AIAssistant Integration Tests
 * Tests full render + useGemini hook integration
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'jest-axe';
import AIAssistant from './AIAssistant';
import { StadiumProvider } from '../context/StadiumContext';
import { AppProvider } from '../context/AppContext';

global.fetch = vi.fn();

const renderAIAssistant = () =>
  render(
    <AppProvider>
      <StadiumProvider>
        <AIAssistant />
      </StadiumProvider>
    </AppProvider>,
  );

describe('AIAssistant Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockImplementation((url) => {
      if (url === '/api/csrf-token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'test-token' }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'API Key is missing' }),
      });
    });
  });

  it('renders the GenAI Assistant heading', () => {
    renderAIAssistant();
    expect(screen.getByText(/FIFA World Cup 2026 GenAI Assistant/i)).toBeInTheDocument();
  });

  it('renders the welcome message from useGemini hook', () => {
    renderAIAssistant();
    expect(screen.getByText(/Hello! I'm/i)).toBeInTheDocument();
  });

  it('renders the language selector', () => {
    renderAIAssistant();
    expect(screen.getByRole('button', { name: /Select language/i })).toBeInTheDocument();
  });

  it('renders quick prompt buttons', () => {
    renderAIAssistant();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders the chat input field', () => {
    renderAIAssistant();
    expect(screen.getByPlaceholderText(/Ask Stadium IQ/i)).toBeInTheDocument();
  });

  it('sends a message when send button is clicked', async () => {
    renderAIAssistant();
    const input = screen.getByPlaceholderText(/Ask Stadium IQ/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: 'What gate is least busy?' } });
    });

    const sendBtn = screen.getByRole('button', { name: /send/i });
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    // User message should now appear in chat
    await waitFor(() => {
      expect(screen.getByText('What gate is least busy?')).toBeInTheDocument();
    });
  });

  it('shows AI demo response after sending message', async () => {
    renderAIAssistant();
    const input = screen.getByPlaceholderText(/Ask Stadium IQ/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: 'gate entrance' } });
      const sendBtn = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendBtn);
    });

    await waitFor(
      () => {
        // Demo response should contain gate info
        const messages = screen.getAllByText(/Gate/i);
        expect(messages.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
  });

  it('clears input after sending message', async () => {
    renderAIAssistant();
    const input = screen.getByPlaceholderText(/Ask Stadium IQ/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test message' } });
      const sendBtn = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendBtn);
    });

    expect(input.value).toBe('');
  });

  it('send button is disabled when input is empty', () => {
    renderAIAssistant();
    const sendBtn = screen.getByRole('button', { name: /send/i });
    expect(sendBtn).toBeDisabled();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderAIAssistant();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('chat log region has aria-live=polite', () => {
    renderAIAssistant();
    const log = screen.getByRole('log');
    expect(log).toHaveAttribute('aria-live', 'polite');
  });

  it('toggles the AI settings panel and changes dialect and tone values', () => {
    renderAIAssistant();

    expect(screen.queryByLabelText(/Origin\/Dialect Context/i)).not.toBeInTheDocument();

    const toggleBtn = screen.getByRole('button', { name: /AI Dialect & Tone Profile/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByLabelText(/Origin\/Dialect Context/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tone Register/i)).toBeInTheDocument();

    const originSelect = screen.getByLabelText(/Origin\/Dialect Context/i);
    fireEvent.change(originSelect, { target: { value: 'Mexico' } });
    expect(originSelect.value).toBe('Mexico');

    const toneSelect = screen.getByLabelText(/Tone Register/i);
    fireEvent.change(toneSelect, { target: { value: 'Direct & Urgent' } });
    expect(toneSelect.value).toBe('Direct & Urgent');

    fireEvent.click(toggleBtn);
    expect(screen.queryByLabelText(/Origin\/Dialect Context/i)).not.toBeInTheDocument();
  });
});
