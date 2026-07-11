import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import UploadCenter from './UploadCenter';
import { StadiumProvider } from '../context/StadiumContext';

describe('UploadCenter Component - Detailed Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Prevent JSDOM from trying to navigate on drop events
    window.addEventListener('dragover', (e) => e.preventDefault(), false);
    window.addEventListener('drop', (e) => e.preventDefault(), false);

    // Stub global fetch
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url) => {
        if (url === '/api/csrf-token') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'csrf-test-token' }),
          });
        }
        if (url === '/api/parse-document') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: {
                  gates: [
                    {
                      id: 'A',
                      density: 0.95,
                      waitTimeMinutes: 32,
                      accessible: true,
                      direction: 'North',
                      accessibleFeatures: ['wheelchair-ramp'],
                    },
                  ],
                  incidents: [
                    {
                      id: 'INC-101',
                      type: 'medical',
                      zone: 'South Stand',
                      severity: 'critical',
                      description: 'Fan heat exhaustion',
                      status: 'active',
                    },
                    {
                      id: 'INC-102',
                      type: 'equipment',
                      zone: 'North Stand',
                      severity: 'medium',
                      description: 'Scanner offline',
                      status: 'active',
                    },
                    {
                      id: 'INC-103',
                      type: 'crowd',
                      zone: 'East Wing',
                      severity: 'low',
                      description: 'Corridor density',
                      status: 'active',
                    },
                  ],
                  volunteers: [
                    {
                      id: 'V7',
                      name: 'Carlos Gomez',
                      zone: 'North Stand',
                      languages: ['en'],
                      skills: ['first-aid'],
                    },
                  ],
                },
              }),
          });
        }
        return Promise.reject(new Error('Unknown API endpoint'));
      }),
    );

    // Stub global URL
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:sample-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = () =>
    render(
      <StadiumProvider>
        <UploadCenter />
      </StadiumProvider>,
    );

  it('has no accessibility violations', async () => {
    const { container } = renderComponent();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders correctly and has download sample CSV button', () => {
    renderComponent();
    expect(screen.getByText('Upload Center')).toBeInTheDocument();
    expect(screen.getByText('Download Sample CSV')).toBeInTheDocument();
  });

  it('downloads sample CSV when clicking the button', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    renderComponent();
    const downloadBtn = screen.getByText('Download Sample CSV');
    fireEvent.click(downloadBtn);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });

  it('handles invalid file format rejection', () => {
    renderComponent();
    const file = new File(['hello'], 'invalid.png', { type: 'image/png' });
    const input = document.getElementById('file-upload-input');

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/Unsupported file format/i)).toBeInTheDocument();
  });

  it('handles file size limit rejection', () => {
    renderComponent();
    const largeFile = new File(['hello'], 'large.csv', { type: 'text/csv' });
    Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 }); // 3MB

    const input = document.getElementById('file-upload-input');
    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(screen.getByText(/File too large/i)).toBeInTheDocument();
  });

  it('allows selecting a valid CSV file', () => {
    renderComponent();
    const file = new File(['Gate,A,0.95,32,true,North'], 'ops.csv', { type: 'text/csv' });
    const input = document.getElementById('file-upload-input');

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('ops.csv')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('handles drag over and drop events', () => {
    renderComponent();
    const dropzone = screen.getByText(/Drag and drop file here/i);

    const dragOverEvent = fireEvent.dragOver(dropzone);
    expect(dragOverEvent).toBe(false);

    const file = new File(['Gate,A,0.95,32,true,North'], 'dragged.csv', { type: 'text/csv' });
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    expect(screen.getByText('dragged.csv')).toBeInTheDocument();
  });

  it('performs file upload, parsing, and committing successfully', async () => {
    class MockFileReader {
      constructor() {
        this.result = 'data:text/csv;base64,R2F0ZSxBLDAuOTUsMzIsdHJ1ZSxOb3J0aA==';
        this.onload = null;
        this.onerror = null;
      }
      readAsDataURL() {
        if (this.onload) this.onload();
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    renderComponent();

    // Select file
    const file = new File(['Gate,A,0.95,32,true,North'], 'ops.csv', { type: 'text/csv' });
    const input = document.getElementById('file-upload-input');
    fireEvent.change(input, { target: { files: [file] } });

    // Click Parse Button
    const parseBtn = screen.getByText('Extract & Parse with GenAI');
    fireEvent.click(parseBtn);

    // Wait for the parsing results preview to be visible
    await waitFor(() => {
      expect(screen.getByText('Extracted Dataset Preview')).toBeInTheDocument();
    });

    expect(screen.getByText('Gate A')).toBeInTheDocument();
    expect(screen.getByText('Fan heat exhaustion')).toBeInTheDocument();
    expect(screen.getByText('Scanner offline')).toBeInTheDocument();
    expect(screen.getByText('Corridor density')).toBeInTheDocument();
    expect(screen.getByText('Carlos Gomez')).toBeInTheDocument();

    // Click Commit Button
    const commitBtn = screen.getByText('Commit to Simulator');
    fireEvent.click(commitBtn);

    // Wait for success alert
    await waitFor(() => {
      expect(screen.getByText('Data Committed Successfully!')).toBeInTheDocument();
    });
  });

  it('handles parsing failure and error message rendering', async () => {
    // Override fetch to reject parse document request
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url) => {
        if (url === '/api/csrf-token') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'csrf-test-token' }),
          });
        }
        if (url === '/api/parse-document') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Gemini extraction failed' }),
          });
        }
        return Promise.reject(new Error('Unknown API endpoint'));
      }),
    );

    class MockFileReader {
      constructor() {
        this.result = 'data:text/csv;base64,R2F0ZSxBLDAuOTUsMzIsdHJ1ZSxOb3J0aA==';
        this.onload = null;
        this.onerror = null;
      }
      readAsDataURL() {
        if (this.onload) this.onload();
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    renderComponent();

    const file = new File(['Gate,A,0.95,32,true,North'], 'ops.csv', { type: 'text/csv' });
    const input = document.getElementById('file-upload-input');
    fireEvent.change(input, { target: { files: [file] } });

    const parseBtn = screen.getByText('Extract & Parse with GenAI');
    fireEvent.click(parseBtn);

    await waitFor(() => {
      expect(screen.getByText('Gemini extraction failed')).toBeInTheDocument();
    });
  });
});
