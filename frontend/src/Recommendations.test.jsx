import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Recommendations from './Recommendations';
import axios from 'axios';

jest.mock('axios');

describe('Recommendations', () => {
  const userId = 'user123';
  const apiBase = '';
  beforeAll(() => {
    // Mock import.meta.env for Vite
    if (!global.importMeta) global.importMeta = {};
    if (!global.importMeta.env) global.importMeta.env = { VITE_API_BASE: apiBase };
    Object.defineProperty(global, 'import', {
      value: { meta: { env: { VITE_API_BASE: apiBase } } },
      configurable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing if no userId', () => {
    const { container } = render(<Recommendations />);
    expect(container.firstChild).toBeNull();
  });

  it('shows loading and then recommendations', async () => {
    axios.get.mockResolvedValueOnce({ data: { recommendations: ['Book 1', 'Book 2'] } });
    render(<Recommendations userId={userId} />);
    expect(screen.getByText(/loading recommendations/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Book 1')).toBeInTheDocument();
      expect(screen.getByText('Book 2')).toBeInTheDocument();
    });
  });

  it('shows error on fetch failure', async () => {
    axios.get.mockRejectedValueOnce(new Error('fail'));
    render(<Recommendations userId={userId} />);
    expect(screen.getByText(/loading recommendations/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch recommendations/i)).toBeInTheDocument();
    });
  });

  it('shows no recommendations message if list is empty', async () => {
    axios.get.mockResolvedValueOnce({ data: { recommendations: [] } });
    render(<Recommendations userId={userId} />);
    expect(screen.getByText(/loading recommendations/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/no recommendations yet/i)).toBeInTheDocument();
    });
  });
});
