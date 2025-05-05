import React from 'react';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import HomePage from '../../../frontend/pages/HomePage';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock data
const mockProblems = [
  { problemId: '1', title: 'Two Sum', difficulty: 'EASY' },
  { problemId: '2', title: 'Binary Search', difficulty: 'MEDIUM' },
  { problemId: '3', title: 'Longest Path', difficulty: 'HARD' },
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

  test('filters problems based on difficulty selection', async () => {
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: /Easy/i }));
    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.queryByText('Binary Search')).not.toBeInTheDocument();
    expect(screen.queryByText('Longest Path')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Medium/i }));
    expect(screen.getByText('Binary Search')).toBeInTheDocument();
    expect(screen.queryByText('Two Sum')).not.toBeInTheDocument();
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
