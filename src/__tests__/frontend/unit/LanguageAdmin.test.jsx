import React from 'react';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import LanguageAdmin from '../../../frontend/pages/LanguageAdmin';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useApi } from '../../../frontend/hooks/useApi';

// Mock the useApi hook
vi.mock('../../../frontend/hooks/useApi', () => ({
  useApi: vi.fn()
}));

// Mock data
const mockLanguages = [
  {
    languageId: 1,
    name: 'Python',
    compile_command: null,
    run_command: 'python',
    suffix: '.py',
    version: '3.9'
  },
  {
    languageId: 2,
    name: 'JavaScript',
    compile_command: null,
    run_command: 'node',
    suffix: '.js',
    version: '16.0'
  }
];

// Utility render function with router
const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  // Mock the useApi hook implementation
  vi.mocked(useApi).mockReturnValue({
    getLanguages: vi.fn().mockResolvedValue(mockLanguages),
    addLanguage: vi.fn().mockResolvedValue({ ...mockLanguages[0], languageId: 3 }),
    updateLanguage: vi.fn().mockResolvedValue({ ...mockLanguages[0], name: 'Updated Python' }),
    deleteLanguage: vi.fn().mockResolvedValue(true),
    loading: false,
    error: null
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe('LanguageAdmin Component', () => {
  test('fetches and displays languages correctly', async () => {
    renderWithRouter(<LanguageAdmin />);

    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });
  });

  test('adds a new language successfully', async () => {
    const { getLanguages } = useApi();
    renderWithRouter(<LanguageAdmin />);

    // Click Add button
    fireEvent.click(screen.getByRole('button', { name: /add new language/i }));

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Language Name'), { target: { value: 'New Language' } });
    fireEvent.change(screen.getByLabelText('Run Command'), { target: { value: 'run' } });
    fireEvent.change(screen.getByLabelText('Suffix'), { target: { value: '.ext' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText('Added "New Language"')).toBeInTheDocument();
    });

    // Verify getLanguages was called to refresh the list
    expect(getLanguages).toHaveBeenCalled();
  });

  test('edits an existing language successfully', async () => {
    const { getLanguages } = useApi();
    renderWithRouter(<LanguageAdmin />);

    // Wait for languages to load
    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    // Enable edit mode
    fireEvent.click(screen.getByRole('button', { name: /toggle edit mode/i }));

    // Click edit button for Python
    fireEvent.click(screen.getAllByTestId('EditIcon')[0]);

    // Update the name
    fireEvent.change(screen.getByLabelText('Language Name'), { target: { value: 'Updated Python' } });

    // Save changes
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('Updated "Updated Python"')).toBeInTheDocument();
    });

    // Verify getLanguages was called to refresh the list
    expect(getLanguages).toHaveBeenCalled();
  });

  test('deletes a language successfully', async () => {
    const { getLanguages } = useApi();
    renderWithRouter(<LanguageAdmin />);

    // Wait for languages to load
    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    // Enable delete mode
    fireEvent.click(screen.getByRole('button', { name: /toggle delete mode/i }));

    // Click delete button for Python
    fireEvent.click(screen.getAllByTestId('DeleteIcon')[0]);

    // Confirm deletion
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(screen.getByText('Deleted "Python"')).toBeInTheDocument();
    });

    // Verify getLanguages was called to refresh the list
    expect(getLanguages).toHaveBeenCalled();
  });

  test('handles API error gracefully', async () => {
    // Mock useApi to return an error
    const mockError = new Error('API Error');
    vi.mocked(useApi).mockReturnValue({
      getLanguages: vi.fn().mockResolvedValue([]),
      addLanguage: vi.fn().mockResolvedValue(null),
      updateLanguage: vi.fn().mockResolvedValue(null),
      deleteLanguage: vi.fn().mockResolvedValue(false),
      loading: false,
      error: mockError
    });

    renderWithRouter(<LanguageAdmin />);

    // Check for error message in Snackbar
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  test('shows loading state', async () => {
    // Mock useApi to return loading state
    vi.mocked(useApi).mockReturnValue({
      getLanguages: vi.fn().mockResolvedValue(mockLanguages),
      addLanguage: vi.fn().mockResolvedValue(null),
      updateLanguage: vi.fn().mockResolvedValue(null),
      deleteLanguage: vi.fn().mockResolvedValue(false),
      loading: true,
      error: null
    });

    renderWithRouter(<LanguageAdmin />);

    // Check for loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('validates required fields when adding language', async () => {
    renderWithRouter(<LanguageAdmin />);

    // Click Add button
    fireEvent.click(screen.getByRole('button', { name: /add new language/i }));

    // Try to submit without required fields
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a language name')).toBeInTheDocument();
    });
  });
}); 