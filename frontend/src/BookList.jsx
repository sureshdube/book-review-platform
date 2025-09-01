import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function BookList() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      setError('');
      try {
        let res = await axios.get(`${API_BASE}/books?page=${page}&limit=${limit}`);
        // If no books, seed defaults
        if (res.data.books && res.data.books.length === 0 && page === 1) {
          await axios.post(`${API_BASE}/books/seed-defaults`);
          res = await axios.get(`${API_BASE}/books?page=${page}&limit=${limit}`);
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
  }, [page, limit]);

  const handlePrev = () => setPage(p => Math.max(1, p - 1));
  const handleNext = () => setPage(p => Math.min(totalPages, p + 1));

  return (
    <div style={{ marginTop: 32 }}>
      <h2>Cached Books</h2>
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
          <div key={book._id || book.isbn} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12, width: 200 }}>
            {book.cover && <img src={book.cover} alt="cover" style={{ maxWidth: '100%', marginBottom: 8 }} />}
            <div><strong>{book.title}</strong></div>
            <div style={{ fontSize: 13, color: '#555' }}>{book.authors?.join(', ')}</div>
            <div style={{ fontSize: 12, color: '#888' }}>ISBN: {book.isbn}</div>
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