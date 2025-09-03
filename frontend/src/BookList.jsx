
import React, { useEffect, useState } from 'react';
import Recommendations from './Recommendations';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '';
function BookList() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      setError('');
      try {
        let url = `${API_BASE}/books?page=${page}&limit=${limit}`;
        if (search) url += `&q=${encodeURIComponent(search)}`;
        let res = await axios.get(url);
        // If no books, seed defaults
        if (res.data.books && res.data.books.length === 0 && page === 1 && !search) {
          await axios.post(`${API_BASE}/books/seed-defaults`);
          res = await axios.get(url);
        }
        setBooks(res.data.books || []);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      } catch (err) {
        setError('Failed to load books');
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, [page, limit, search]);

  const handlePrev = () => setPage(p => Math.max(1, p - 1));
  const handleNext = () => setPage(p => Math.min(totalPages, p + 1));
  const handleSearch = e => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div style={{ marginTop: 32 }}>
      {user && <Recommendations userId={user._id} />}
      <h2 style={{ marginTop: 24 }}>Cached Books</h2>
      <form onSubmit={handleSearch} style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search by title or author"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Search</button>
        {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>Clear</button>}
      </form>
      <div style={{ marginBottom: 16 }}>
        <label>
          Items per page:
          <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} style={{ marginLeft: 8 }}>
            {[5, 10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      {loading && <div>Loading books...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && books.length === 0 && <div>No books cached yet.</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {books.map(book => (
          <div key={book._id || book.isbn} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12, width: 200, cursor: 'pointer' }}
            onClick={() => navigate(`/books/${book.isbn}`)}>
            {book.cover && <img src={book.cover} alt="cover" style={{ maxWidth: '100%', marginBottom: 8 }} />}
            <div><strong>{book.title}</strong></div>
            <div style={{ fontSize: 13, color: '#555' }}>{book.authors?.join(', ')}</div>
            <div style={{ fontSize: 12, color: '#888' }}>ISBN: {book.isbn}</div>
            {book.ratingStats && (
              <div style={{ fontSize: 13, color: '#f39c12', marginTop: 4 }}>
                <span title="Average Rating">
                  {'★'.repeat(Math.round(book.ratingStats.avgRating || 0))}
                  {'☆'.repeat(5 - Math.round(book.ratingStats.avgRating || 0))}
                </span>
                <span style={{ color: '#555', marginLeft: 6 }}>
                  {book.ratingStats.avgRating !== null ? book.ratingStats.avgRating.toFixed(1) : 'N/A'} / 5
                  {' '}({book.ratingStats.reviewCount} review{book.ratingStats.reviewCount === 1 ? '' : 's'})
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={handlePrev} disabled={page === 1}>Prev</button>
        <span>Page {page} of {totalPages} ({total} books)</span>
        <button onClick={handleNext} disabled={page === totalPages}>Next</button>
      </div>
    </div>
  );
}

export default BookList;
