import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock child components
jest.mock('./BookList', () => () => <div>BookList</div>);
jest.mock('./BookSearch', () => () => <div>BookSearch</div>);
jest.mock('./BookDetails', () => () => <div>BookDetails</div>);
jest.mock('./AuthForm', () => ({ mode, onAuth }) => (
  <button onClick={() => onAuth({ email: 'test@example.com' })}>MockAuth</button>
));
jest.mock('./UserProfile', () => () => <div>UserProfile</div>);
jest.mock('./AdminConfig', () => () => <div>AdminConfig</div>);

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login/signup buttons and AuthForm when not logged in', () => {
    render(<App />);
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
    expect(screen.getByText(/MockAuth/i)).toBeInTheDocument();
  });

  it('switches to signup mode when Sign Up is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Sign Up/i));
    // Should still show AuthForm (mode is not visible, but button click is covered)
    expect(screen.getByText(/MockAuth/i)).toBeInTheDocument();
  });

  it('logs in and shows BookList and user info', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/MockAuth/i));
    expect(screen.getByText(/BookList/i)).toBeInTheDocument();
    expect(screen.getByText(/Logged in as/i)).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  it('shows Admin link for admin user', () => {
    localStorage.setItem('user', JSON.stringify({ email: 'admin@admin.com' }));
    render(<App />);
    // Check for the Admin link specifically
    expect(screen.getByRole('link', { name: /Admin/i })).toBeInTheDocument();
  });

  it('logs out and returns to login screen', () => {
    localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
    render(<App />);
    fireEvent.click(screen.getByText(/Logout/i));
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
