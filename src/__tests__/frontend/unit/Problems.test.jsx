import React from 'react';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import HomePage from '../../../frontend/pages/HomePage';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock data
const mockProblems = [
  { problemId: '1', title: 'Two Sum', difficulty: 'EASY', completionState: 'Completed' },
  { problemId: '2', title: 'Binary Search', difficulty: 'MEDIUM', completionState: 'Unattempted' },
  { problemId: '3', title: 'Longest Path', difficulty: 'HARD', completionState: 'Attempted' },
];

// Utility render function with router
const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockProblems),
    })
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe('HomePage Component', () => {
  test('fetches and displays problems correctly', async () => {
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
      expect(screen.getByText('Binary Search')).toBeInTheDocument();
      expect(screen.getByText('Longest Path')).toBeInTheDocument();
    });
  });

  test('filters problems based on difficulty toggle', async () => {
    renderWithRouter(<HomePage />);

    // Ensure initial list rendered
    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
      expect(screen.getByText('Binary Search')).toBeInTheDocument();
      expect(screen.getByText('Longest Path')).toBeInTheDocument();
    });

    // Open the filter panel
    fireEvent.click(screen.getByRole('button', { name: /toggle filters/i }));

    // Click EASY toggle
    fireEvent.click(screen.getByRole('button', { name: /easy/i }));
    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.queryByText('Binary Search')).not.toBeInTheDocument();
    expect(screen.queryByText('Longest Path')).not.toBeInTheDocument();

    // Click MEDIUM toggle，now both EASY and MEDIUM should be visible
    fireEvent.click(screen.getByRole('button', { name: /medium/i }));
    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByText('Binary Search')).toBeInTheDocument();
    expect(screen.queryByText('Longest Path')).not.toBeInTheDocument();

    // Untoggle EASY, so only MEDIUM remains
    fireEvent.click(screen.getByRole('button',  { name: /easy/i }));
    expect(screen.queryByText('Two Sum')).not.toBeInTheDocument();
    expect(screen.getByText('Binary Search')).toBeInTheDocument();
    expect(screen.queryByText('Longest Path')).not.toBeInTheDocument();

    // Click COMPLETED toggle, there is no completed & medium problem in the list
    fireEvent.click(screen.getByRole('button',  { name: /Completed/i }));
    expect(screen.queryByText('Two Sum')).not.toBeInTheDocument();
    expect(screen.queryByText('Binary Search')).not.toBeInTheDocument();
    expect(screen.queryByText('Longest Path')).not.toBeInTheDocument();
  });

  test('ProblemList component correctly renders chips based on difficulty', async () => {
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/easy/i)).toBeInTheDocument();
      expect(screen.getByText(/medium/i)).toBeInTheDocument();
      expect(screen.getByText(/hard/i)).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal Server Error' }),
      })
    );

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('handles empty problem list gracefully', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/no problems found/i)).toBeInTheDocument();
    });
  });
});
