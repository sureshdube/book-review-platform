import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function BookList() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      setError('');
      try {
        let res = await axios.get('/books');
        if (res.data.length === 0) {
          // Seed default books if cache is empty
          await axios.post('/books/seed-defaults');
          res = await axios.get('/books');
        }
        setBooks(res.data);
      } catch (err) {
        setError('Failed to load books');
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  return (
    <div style={{ marginTop: 32 }}>
      <h2>Cached Books</h2>
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
    </div>
  );
}