import React from 'react';
import { render, screen, waitFor, cleanup, fireEvent, within } from '@testing-library/react';
import LanguageAdmin from '../../../frontend/pages/LanguageAdmin';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useLanguages } from '../../../frontend/hooks/useLanguages';

// Mock the useLanguages hook
vi.mock('../../../frontend/hooks/useLanguages', () => ({
  useLanguages: vi.fn()
}));

// Mock data
const mockLanguages = [
  {
    languageId: 1,
    name: 'Python',
    compilerCmd: null,
    runtimeCmd: 'python',
    suffix: '.py',
    version: '3.9',
    isDefault: true
  },
  {
    languageId: 2,
    name: 'JavaScript',
    compilerCmd: null,
    runtimeCmd: 'node',
    suffix: '.js',
    version: '16.0',
    isDefault: false
  }
];

// Utility render function with router
const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  // Mock the useLanguages hook implementation
  vi.mocked(useLanguages).mockReturnValue({
    languages: mockLanguages,
    loading: false,
    error: null,
    fetchLanguages: vi.fn().mockResolvedValue(mockLanguages),
    addLanguage: vi.fn().mockResolvedValue({ ...mockLanguages[0], languageId: 3, name: 'New Language' }),
    updateLanguage: vi.fn().mockResolvedValue({ ...mockLanguages[0], name: 'Updated Python' }),
    deleteLanguage: vi.fn().mockResolvedValue(true)
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
    const { addLanguage } = useLanguages();
    renderWithRouter(<LanguageAdmin />);

    // Click Add button
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    // Fill in the form
    const form = screen.getByRole('dialog');
    const nameInput = within(form).getByLabelText(/language/i);
    const runCmdInput = within(form).getByLabelText(/run cmd/i);
    const suffixInput = within(form).getByLabelText(/suffix/i);

    fireEvent.change(nameInput, { target: { value: 'New Language' } });
    fireEvent.change(runCmdInput, { target: { value: 'run' } });
    fireEvent.change(suffixInput, { target: { value: '.ext' } });

    // Submit the form
    fireEvent.click(within(form).getByRole('button', { name: /add/i }));

    // Verify addLanguage was called with correct data
    await waitFor(() => {
      expect(addLanguage).toHaveBeenCalledWith({
        name: 'New Language',
        runtimeCmd: 'run',
        suffix: '.ext',
        compilerCmd: '',
        version: ''
      });
    });

    // Verify success message
    expect(screen.getByText(/added/i)).toBeInTheDocument();
  });

  test('edits an existing language successfully', async () => {
    const { updateLanguage } = useLanguages();
    renderWithRouter(<LanguageAdmin />);

    // Wait for languages to load
    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    // Enable edit mode
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Click edit button for Python
    fireEvent.click(screen.getAllByTestId('EditIcon')[0]);

    // Update the name
    const form = screen.getByRole('dialog');
    const nameInput = within(form).getByLabelText(/language/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Python' } });

    // Save changes
    fireEvent.click(within(form).getByRole('button', { name: /save/i }));

    // Verify updateLanguage was called with correct data
    await waitFor(() => {
      expect(updateLanguage).toHaveBeenCalledWith(1, {
        name: 'Updated Python',
        runtimeCmd: 'python',
        suffix: '.py',
        compilerCmd: '',
        version: '3.9'
      });
    });

    // Verify success message
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });

  test('deletes a language successfully', async () => {
    const { deleteLanguage } = useLanguages();
    renderWithRouter(<LanguageAdmin />);

    // Wait for languages to load
    await waitFor(() => {
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });

    // Enable delete mode
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    // Click delete button for JavaScript (not Python because it's isDefault)
    fireEvent.click(screen.getAllByTestId('DeleteIcon')[0]);

    // Confirm deletion
    const confirmDialog = screen.getByRole('dialog');
    fireEvent.click(within(confirmDialog).getByRole('button', { name: /delete/i }));

    // Verify deleteLanguage was called with correct ID
    await waitFor(() => {
      expect(deleteLanguage).toHaveBeenCalledWith(2);
    });

    // Verify success message
    expect(screen.getByText(/deleted/i)).toBeInTheDocument();
  });

  test('cannot delete default language', async () => {
    renderWithRouter(<LanguageAdmin />);

    // Wait for languages to load
    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    // Enable delete mode
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    // Verify delete button is not present for Python (default language)
    const deleteButtons = screen.getAllByTestId('DeleteIcon');
    expect(deleteButtons).toHaveLength(1); // Only JavaScript should have delete button
  });

  test('handles API error gracefully', async () => {
    // Mock useLanguages to return an error
    const mockError = new Error('API Error');
    vi.mocked(useLanguages).mockReturnValue({
      languages: [],
      loading: false,
      error: mockError,
      fetchLanguages: vi.fn().mockResolvedValue([]),
      addLanguage: vi.fn().mockResolvedValue(null),
      updateLanguage: vi.fn().mockResolvedValue(null),
      deleteLanguage: vi.fn().mockResolvedValue(false)
    });

    renderWithRouter(<LanguageAdmin />);

    // Check for error message in Alert
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  test('shows loading state', async () => {
    // Mock useLanguages to return loading state
    vi.mocked(useLanguages).mockReturnValue({
      languages: mockLanguages,
      loading: true,
      error: null,
      fetchLanguages: vi.fn().mockResolvedValue(mockLanguages),
      addLanguage: vi.fn().mockResolvedValue(null),
      updateLanguage: vi.fn().mockResolvedValue(null),
      deleteLanguage: vi.fn().mockResolvedValue(false)
    });

    renderWithRouter(<LanguageAdmin />);

    // Check for loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('validates required fields when adding language', async () => {
    renderWithRouter(<LanguageAdmin />);

    // Click Add button
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    // Try to submit without required fields
    const form = screen.getByRole('dialog');
    fireEvent.click(within(form).getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(within(form).getByText(/please fill all required fields/i)).toBeInTheDocument();
    });
  });

  test('validates duplicate language name', async () => {
    renderWithRouter(<LanguageAdmin />);

    // Click Add button
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    // Try to add a language with existing name
    const form = screen.getByRole('dialog');
    const nameInput = within(form).getByLabelText(/language/i);
    const runCmdInput = within(form).getByLabelText(/run cmd/i);
    const suffixInput = within(form).getByLabelText(/suffix/i);

    fireEvent.change(nameInput, { target: { value: 'Python' } });
    fireEvent.change(runCmdInput, { target: { value: 'run' } });
    fireEvent.change(suffixInput, { target: { value: '.ext' } });

    // Submit the form
    fireEvent.click(within(form).getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });
}); 