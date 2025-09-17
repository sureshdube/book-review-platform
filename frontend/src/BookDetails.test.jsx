import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookDetails from './BookDetails';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';

jest.mock('axios');

const mockBook = {
  isbn: '123',
  title: 'Test Book',
  authors: ['Author 1'],
  cover: 'cover.jpg',
  data: { description: 'A book', subjects: ['Fiction'], publish_date: '2020' },
  ratingStats: { avgRating: 4.2, reviewCount: 2 },
};
const mockReviews = [
  { _id: 'r1', user: 'u1', userEmail: 'user1@mail.com', rating: 5, text: 'Great!', createdAt: new Date().toISOString() },
  { _id: 'r2', user: 'u2', userEmail: 'user2@mail.com', rating: 3, text: 'Okay', createdAt: new Date().toISOString() },
];

describe('BookDetails', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  function setup(user = null) {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    window.history.pushState({}, '', '/books/123');
    return render(
      <MemoryRouter initialEntries={["/books/123"]}>
        <Routes>
          <Route path="/books/:isbn" element={<BookDetails />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders loading and then book details', async () => {
    axios.get.mockImplementation(url => {
      if (url.includes('/reviews')) return Promise.resolve({ data: mockReviews });
      if (url.includes('/books/123')) return Promise.resolve({ data: mockBook });
      if (url.includes('/profile')) return Promise.resolve({ data: { favourites: [] } });
      return Promise.resolve({ data: {} });
    });
    setup();
    expect(screen.getByText(/Loading book details/i)).toBeInTheDocument();
    expect(await screen.findByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText(/By Author 1/)).toBeInTheDocument();
  // Use getAllByText for Published: 2020 (handle multiple matches)
  const publishedNodes = screen.getAllByText(/Published:/i);
  expect(publishedNodes.some(node => node.parentElement && /Published:\s*2020/.test(node.parentElement.textContent.replace(/\s+/g, ' ')))).toBe(true);
  // Use getAllByText for Genres: Fiction
  const genresNodes = screen.getAllByText(/Genres:/i);
  expect(genresNodes.some(node => node.parentElement && /Genres:\s*Fiction/.test(node.parentElement.textContent.replace(/\s+/g, ' ')))).toBe(true);
  // Use findAllByText for review text (handles split nodes and multiple matches)
  expect((await screen.findAllByText((content, node) => node.textContent && node.textContent.includes('Great!'))).length).toBeGreaterThan(0);
  expect((await screen.findAllByText((content, node) => node.textContent && node.textContent.includes('Okay'))).length).toBeGreaterThan(0);
  });

  it('shows error if book fetch fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('fail'));
    setup();
    expect(await screen.findByText(/Failed to load book details/)).toBeInTheDocument();
  });

  it('shows book not found if book is null', async () => {
    axios.get.mockImplementation(url => {
      if (url.includes('/books/123')) return Promise.resolve({ data: null });
      if (url.includes('/reviews')) return Promise.resolve({ data: [] });
      if (url.includes('/profile')) return Promise.resolve({ data: { favourites: [] } });
      return Promise.resolve({ data: {} });
    });
    setup();
    expect(await screen.findByText(/Book not found/)).toBeInTheDocument();
  });

  it('shows add to favourites for logged in user', async () => {
    axios.get.mockImplementation(url => {
      if (url.includes('/books/123')) return Promise.resolve({ data: mockBook });
      if (url.includes('/reviews')) return Promise.resolve({ data: mockReviews });
      if (url.includes('/profile')) return Promise.resolve({ data: { favourites: [] } });
      return Promise.resolve({ data: {} });
    });
    setup({ _id: 'u3', email: 'u3@mail.com' });
    expect(await screen.findByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText(/Add to Favourites/)).toBeInTheDocument();
  });

  it('shows review form for logged in user who has not reviewed', async () => {
    axios.get.mockImplementation(url => {
      if (url.includes('/books/123')) return Promise.resolve({ data: mockBook });
      if (url.includes('/reviews')) return Promise.resolve({ data: mockReviews });
      if (url.includes('/profile')) return Promise.resolve({ data: { favourites: [] } });
      return Promise.resolve({ data: {} });
    });
    setup({ _id: 'u3', email: 'u3@mail.com' });
    expect(await screen.findByText('Write a Review')).toBeInTheDocument();
  });

  it('shows already reviewed message for user who has reviewed', async () => {
    // Use a user that matches a review in mockReviews
    const reviewedUser = { _id: 'u1', email: 'user1@mail.com' };
    axios.get.mockImplementation(url => {
      if (url.includes('/reviews')) return Promise.resolve({ data: [
        { _id: 'r1', user: reviewedUser._id, userEmail: reviewedUser.email, rating: 5, text: 'Great!', createdAt: new Date().toISOString() },
        { _id: 'r2', user: 'u2', userEmail: 'user2@mail.com', rating: 3, text: 'Okay', createdAt: new Date().toISOString() },
      ] });
      if (url.includes('/books/123')) return Promise.resolve({ data: mockBook });
      if (url.includes('/profile')) return Promise.resolve({ data: { favourites: [] } });
      return Promise.resolve({ data: {} });
    });
    setup(reviewedUser);
    // Directly query for the reviewed message using a DOM selector and normalized text
    await waitFor(() => {
      // Use queryAllByText and assert at least one match
      const msgs = screen.queryAllByText((content, node) =>
        node.textContent && node.textContent.replace(/\s+/g, ' ').includes('You have already reviewed this book.')
      );
      expect(msgs.length).toBeGreaterThan(0);
    });
  });

  it('shows login to write review for anonymous user', async () => {
    axios.get.mockImplementation(url => {
      if (url.includes('/books/123')) return Promise.resolve({ data: mockBook });
      if (url.includes('/reviews')) return Promise.resolve({ data: mockReviews });
      if (url.includes('/profile')) return Promise.resolve({ data: { favourites: [] } });
      return Promise.resolve({ data: {} });
    });
    setup();
    expect(await screen.findByText('Login to write a review.')).toBeInTheDocument();
  });
  it('allows editing a review (success and cancel)', async () => {
    const user = { _id: 'u1', email: 'user1@mail.com' };
    axios.get.mockImplementation(url => {
      if (url.includes('/reviews')) return Promise.resolve({ data: [
        { _id: 'r1', user: user._id, userEmail: user.email, rating: 5, text: 'Great!', createdAt: new Date().toISOString() },
      ] });
      if (url.includes('/books/123')) return Promise.resolve({ data: mockBook });
      if (url.includes('/profile')) return Promise.resolve({ data: { favourites: [] } });
      return Promise.resolve({ data: {} });
    });
    axios.patch.mockResolvedValueOnce({});
    axios.get.mockResolvedValueOnce({ data: [
      { _id: 'r1', user: user._id, userEmail: user.email, rating: 4, text: 'Edited!', createdAt: new Date().toISOString() },
    ] });
    setup(user);
    expect(await screen.findByText('Great!')).toBeInTheDocument();
    await waitFor(() => {
      const editBtns = screen.queryAllByText((content, node) =>
        node.textContent && node.textContent.replace(/\s+/g, ' ').includes('Edit')
      );
      expect(editBtns.length).toBeGreaterThan(0);
    });
  const editBtn = await screen.findByText('Edit');
  fireEvent.click(editBtn);
  const textarea = await screen.findByDisplayValue('Great!');
  fireEvent.change(textarea, { target: { value: 'Edited!' } });
  const saveBtn = await screen.findByText('Save');
  fireEvent.click(saveBtn);
    await waitFor(() => {
      const msgs = screen.queryAllByText((content, node) =>
        node.textContent && node.textContent.replace(/\s+/g, ' ').includes('Review updated!')
      );
      expect(msgs.length).toBeGreaterThan(0);
    });
    // Cancel edit
    const editBtn2 = screen.queryAllByText((content, node) =>
      node.textContent && node.textContent.replace(/\s+/g, ' ').includes('Edit')
    )[0];
    fireEvent.click(editBtn2);
    const cancelBtn = screen.queryAllByText((content, node) =>
      node.textContent && node.textContent.replace(/\s+/g, ' ').includes('Cancel')
    )[0];
    fireEvent.click(cancelBtn);
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('shows error on edit review failure', async () => {
    const user = { _id: 'u1', email: 'user1@mail.com' };
    axios.get.mockImplementation(url => {
      if (url.includes('/reviews')) return Promise.resolve({ data: [
        { _id: 'r1', user: user._id, userEmail: user.email, rating: 5, text: 'Great!', createdAt: new Date().toISOString() },
      ] });
      if (url.includes('/books/123')) return Promise.resolve({ data: mockBook });
      if (url.includes('/profile')) return Promise.resolve({ data: { favourites: [] } });
      return Promise.resolve({ data: {} });
    });
    axios.patch.mockRejectedValueOnce({ response: { data: { message: 'Edit failed' } } });
    setup(user);
    expect(await screen.findByText('Great!')).toBeInTheDocument();
  const editBtn = await screen.findByText('Edit');
  fireEvent.click(editBtn);
  const saveBtn = await screen.findByText('Save');
  fireEvent.click(saveBtn);
    await waitFor(() => {
      const msgs = screen.queryAllByText((content, node) =>
        node.textContent && node.textContent.replace(/\s+/g, ' ').includes('Edit failed')
      );
      expect(msgs.length).toBeGreaterThan(0);
    });
  });

  it('allows deleting a review (success and error)', async () => {
    window.confirm = jest.fn(() => true);
    const user = { _id: 'u1', email: 'user1@mail.com' };
    axios.get.mockImplementation(url => {
      if (url.includes('/reviews')) return Promise.resolve({ data: [
        { _id: 'r1', user: user._id, userEmail: user.email, rating: 5, text: 'Great!', createdAt: new Date().toISOString() },
      ] });
      if (url.includes('/books/123')) return Promise.resolve({ data: mockBook });
      if (url.includes('/profile')) return Promise.resolve({ data: { favourites: [] } });
      return Promise.resolve({ data: {} });
    });
    axios.delete.mockResolvedValueOnce({});
    axios.get.mockResolvedValueOnce({ data: [] });
    setup(user);
    expect(await screen.findByText('Great!')).toBeInTheDocument();
    const deleteBtn = await screen.findByText('Delete');
    fireEvent.click(deleteBtn);
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalled();
    });
    // Error case
    axios.delete.mockRejectedValueOnce({ response: { data: { message: 'Delete failed' } } });
    axios.get.mockResolvedValueOnce({ data: [
      { _id: 'r1', user: user._id, userEmail: user.email, rating: 5, text: 'Great!', createdAt: new Date().toISOString() },
    ] });
    const deleteBtn2 = screen.queryAllByText((content, node) =>
      node.textContent && node.textContent.replace(/\s+/g, ' ').includes('Delete')
    )[0];
    fireEvent.click(deleteBtn2);
    await waitFor(() => {
      const msgs = screen.queryAllByText((content, node) =>
        node.textContent && node.textContent.replace(/\s+/g, ' ').includes('Delete failed')
      );
      expect(msgs.length).toBeGreaterThan(0);
    });
  });

  it('submits a new review (success and error)', async () => {
    const user = { _id: 'u3', email: 'u3@mail.com' };
    axios.get.mockImplementation(url => {
      if (url.includes('/books/123')) return Promise.resolve({ data: mockBook });
      if (url.includes('/reviews')) return Promise.resolve({ data: mockReviews });
      if (url.includes('/profile')) return Promise.resolve({ data: { favourites: [] } });
      return Promise.resolve({ data: {} });
    });
    axios.post.mockResolvedValueOnce({});
    axios.get.mockResolvedValueOnce({ data: [...mockReviews, { _id: 'r3', user: user._id, userEmail: user.email, rating: 4, text: 'Nice!', createdAt: new Date().toISOString() }] });
    setup(user);
    await waitFor(() => {
      const msgs = screen.queryAllByText((content, node) =>
        node.textContent && node.textContent.replace(/\s+/g, ' ').includes('Write a Review')
      );
      expect(msgs.length).toBeGreaterThan(0);
    });
    fireEvent.change(screen.getByPlaceholderText(/Write your review/i), { target: { value: 'Nice!' } });
    const submitBtn = screen.queryAllByText((content, node) =>
      node.textContent && node.textContent.replace(/\s+/g, ' ').includes('Submit Review')
    )[0];
    fireEvent.click(submitBtn);
    await waitFor(() => {
      const msgs = screen.queryAllByText((content, node) =>
        node.textContent && node.textContent.replace(/\s+/g, ' ').includes('Review submitted!')
      );
      expect(msgs.length).toBeGreaterThan(0);
    });
    // Error case
    axios.post.mockRejectedValueOnce({ response: { data: { message: 'Submit failed' } } });
    fireEvent.change(screen.getByPlaceholderText(/Write your review/i), { target: { value: 'Oops!' } });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      const msgs = screen.queryAllByText((content, node) =>
        node.textContent && node.textContent.replace(/\s+/g, ' ').includes('Submit failed')
      );
      expect(msgs.length).toBeGreaterThan(0);
    });
  });

  it('toggles favourite (add and remove, with error)', async () => {
    const user = { _id: 'u3', email: 'u3@mail.com' };
    axios.get.mockImplementation(url => {
      if (url.includes('/books/123')) return Promise.resolve({ data: mockBook });
      if (url.includes('/reviews')) return Promise.resolve({ data: mockReviews });
      if (url.includes('/profile')) return Promise.resolve({ data: { favourites: [] } });
      return Promise.resolve({ data: {} });
    });
    axios.post.mockResolvedValueOnce({});
    setup(user);
    await waitFor(() => {
      const msgs = screen.queryAllByText((content, node) =>
        node.textContent && node.textContent.replace(/\s+/g, ' ').includes('Add to Favourites')
      );
      expect(msgs.length).toBeGreaterThan(0);
    });
    const addFavBtn = await screen.findByText(/Add to Favourites/);
    fireEvent.click(addFavBtn);
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
    // Remove favourite
    axios.delete.mockResolvedValueOnce({});
    const favBtn = await screen.findByText('Favourite');
    fireEvent.click(favBtn);
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalled();
    });
    // Error case
    axios.post.mockRejectedValueOnce({ response: { data: { message: 'Fav failed' } } });
    fireEvent.click(addFavBtn);
    await waitFor(() => {
      const msgs = screen.queryAllByText((content, node) =>
        node.textContent && node.textContent.replace(/\s+/g, ' ').includes('Failed to update favourite')
      );
      expect(msgs.length).toBeGreaterThan(0);
    });
  });

  it('handles edge cases: no reviews, no genres, no description', async () => {
    const bookNoGenres = { ...mockBook, data: { ...mockBook.data, subjects: undefined, description: undefined } };
    axios.get.mockImplementation(url => {
      if (url.includes('/books/123')) return Promise.resolve({ data: bookNoGenres });
      if (url.includes('/reviews')) return Promise.resolve({ data: [] });
      if (url.includes('/profile')) return Promise.resolve({ data: { favourites: [] } });
      return Promise.resolve({ data: {} });
    });
    setup();
    expect(await screen.findByText('No reviews yet.')).toBeInTheDocument();
    expect(screen.getByText(/Genres:/).parentElement.textContent).toContain('N/A');
    expect(screen.getByText(/Description/).parentElement.textContent).toContain('No description available.');
  });

});
