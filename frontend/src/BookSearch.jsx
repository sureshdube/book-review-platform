import React, { useState } from 'react';
import axios from 'axios';

export default function BookSearch() {
  const [isbn, setIsbn] = useState('');
  const [book, setBook] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBook(null);
    try {
      const res = await axios.get(`/api/book/${isbn}`);
      setBook(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Book not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-search">
      <h2>Search Book by ISBN</h2>
      <form onSubmit={handleSearch} style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={isbn}
          onChange={e => setIsbn(e.target.value)}
          placeholder="Enter ISBN"
          required
          style={{ padding: 8, width: 200 }}
        />
        <button type="submit" style={{ marginLeft: 8, padding: 8 }} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {book && (
        <div className="book-result" style={{ border: '1px solid #ccc', padding: 16, borderRadius: 8 }}>
          <h3>{book.title}</h3>
          <p><strong>Authors:</strong> {book.authors?.join(', ')}</p>
          <p><strong>ISBN:</strong> {book.isbn}</p>
          <p><strong>Publish Date:</strong> {book.publish_date}</p>
          {book.cover && <img src={book.cover} alt="cover" style={{ maxWidth: 120, marginTop: 8 }} />}
        </div>
      )}
    </div>
  );
}
