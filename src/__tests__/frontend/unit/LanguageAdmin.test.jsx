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

let mockHookValue;

beforeEach(() => {
  // Mock the useLanguages hook implementation
  mockHookValue = {
    languages: mockLanguages,
    loading: false,
    error: null,
    fetchLanguages: vi.fn().mockResolvedValue(mockLanguages),
    addLanguage: vi.fn().mockResolvedValue({ ...mockLanguages[0], languageId: 3, name: 'New Language' }),
    updateLanguage: vi.fn().mockResolvedValue({ ...mockLanguages[0], name: 'Updated Python' }),
    deleteLanguage: vi.fn().mockResolvedValue(true)
  };

  vi.mocked(useLanguages).mockReturnValue(mockHookValue);
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
      expect(mockHookValue.addLanguage).toHaveBeenCalledWith({
        name: 'New Language',
        runtimeCmd: 'run',
        suffix: '.ext',
        compilerCmd: '',
        version: ''
      });
    }, { timeout: 10000 });

    // Verify success message
    expect(await screen.findByText(/added/i)).toBeInTheDocument();
  }, 15000);

  test('edits an existing language successfully', async () => {
    renderWithRouter(<LanguageAdmin />);

    // Wait for languages to load
    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    // Enable edit mode and wait for it to take effect
    fireEvent.click(screen.getByRole('button', { name: /edit mode/i }));
    await waitFor(() => {
      const table = screen.getByRole('table');
      const editButtons = within(table).getAllByTestId('EditIcon');
      expect(editButtons).toHaveLength(2);
    });

    // Click edit button for Python
    const table = screen.getByRole('table');
    const editButtons = within(table).getAllByTestId('EditIcon');
    fireEvent.click(editButtons[0]);

    // Wait for dialog to appear and update the form
    await waitFor(() => {
      const dialog = screen.getByRole('dialog', { hidden: true });
      expect(dialog).toBeInTheDocument();
      const nameInput = within(dialog).getByLabelText(/language/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Python' } });
      fireEvent.click(within(dialog).getByRole('button', { name: /save/i }));
    });

    // Verify updateLanguage was called with correct data
    await waitFor(() => {
      expect(mockHookValue.updateLanguage).toHaveBeenCalledWith(1, {
        name: 'Updated Python',
        runtimeCmd: 'python',
        suffix: '.py',
        compilerCmd: '',
        version: '3.9'
      });
    });

    // Verify success message
    expect(screen.getByText(/Updated "Updated Python"/)).toBeInTheDocument();
  });

  test('deletes a language successfully', async () => {
    renderWithRouter(<LanguageAdmin />);

    // Wait for languages to load
    await waitFor(() => {
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });

    // Enable delete mode and wait for it to take effect
    fireEvent.click(screen.getByRole('button', { name: /delete mode/i }));
    await waitFor(() => {
      const table = screen.getByRole('table');
      const deleteButtons = within(table).getAllByTestId('DeleteIcon');
      expect(deleteButtons).toHaveLength(1);
    });

    // Click delete button for JavaScript (not Python because it's isDefault)
    const table = screen.getByRole('table');
    const deleteButtons = within(table).getAllByTestId('DeleteIcon');
    fireEvent.click(deleteButtons[0]);

    // Wait for dialog to appear and confirm deletion
    await waitFor(() => {
      const dialog = screen.getByRole('dialog', { hidden: true });
      expect(dialog).toBeInTheDocument();
      const confirmButton = within(dialog).getByRole('button', { name: /delete/i });
      fireEvent.click(confirmButton);
    });

    // Verify deleteLanguage was called with correct ID
    await waitFor(() => {
      expect(mockHookValue.deleteLanguage).toHaveBeenCalledWith(2);
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
    fireEvent.click(screen.getByRole('button', { name: /delete mode/i }));

    // Find the JavaScript row and verify it has a delete button
    const jsRow = screen.getByText('JavaScript').closest('tr');
    const jsDeleteButton = within(jsRow).getByTestId('DeleteIcon');
    expect(jsDeleteButton).toBeInTheDocument();

    // Find the Python row and verify it doesn't have a delete button
    const pythonRow = screen.getByText('Python').closest('tr');
    const pythonDeleteButton = within(pythonRow).queryByTestId('DeleteIcon');
    expect(pythonDeleteButton).toBeNull();
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
