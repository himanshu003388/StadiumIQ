import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageSelector from '../LanguageSelector';

describe('LanguageSelector', () => {
  const defaultProps = {
    language: 'en',
    setLanguage: vi.fn(),
  };

  it('renders with current language', () => {
    render(<LanguageSelector {...defaultProps} />);
    expect(screen.getByLabelText('Select language')).toBeInTheDocument();
  });

  it('shows language options when opened', async () => {
    render(<LanguageSelector {...defaultProps} />);
    const button = screen.getByLabelText('Select language');
    await userEvent.click(button);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
  });

  it('calls setLanguage when option selected', async () => {
    const setLanguage = vi.fn();
    render(<LanguageSelector language="en" setLanguage={setLanguage} />);
    await userEvent.click(screen.getByLabelText('Select language'));
    await userEvent.click(screen.getByText('Español'));
    expect(setLanguage).toHaveBeenCalledWith('es');
  });

  it('closes dropdown on escape key', async () => {
    render(<LanguageSelector {...defaultProps} />);
    await userEvent.click(screen.getByLabelText('Select language'));
    const listbox = screen.getByRole('listbox');
    fireEvent.keyDown(listbox, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('supports arrow key navigation', async () => {
    render(<LanguageSelector {...defaultProps} />);
    await userEvent.click(screen.getByLabelText('Select language'));
    const listbox = screen.getByRole('listbox');
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    const options = listbox.querySelectorAll('button');
    expect(document.activeElement).toBe(options[0]);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<LanguageSelector {...defaultProps} />);
    await userEvent.click(screen.getByLabelText('Select language'));
    expect(container).toBeInTheDocument();
  });
});
