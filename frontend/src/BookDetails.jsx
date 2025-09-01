import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function BookDetails() {
  const { isbn } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchBook() {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_BASE}/books/${isbn}`);
        setBook(res.data);
      } catch (err) {
        setError('Failed to load book details');
      } finally {
        setLoading(false);
      }
    }
    fetchBook();
  }, [isbn]);

  if (loading) return <div>Loading book details...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!book) return <div>Book not found.</div>;

  // Extract details from Open Library data if available
  const desc = book.data?.description?.value || book.data?.description || 'No description available.';
  const genres = book.data?.subjects?.join(', ');
  const published = book.data?.publish_date || book.data?.publish_year?.[0];

  return (
    <div style={{ maxWidth: 600, margin: '32px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>&larr; Back to list</button>
      <div style={{ display: 'flex', gap: 24 }}>
        {book.cover && <img src={book.cover} alt="cover" style={{ maxWidth: 180, borderRadius: 8 }} />}
        <div>
          <h2>{book.title}</h2>
          <div style={{ fontSize: 15, color: '#555' }}>By {book.authors?.join(', ')}</div>
          <div style={{ fontSize: 14, color: '#888', margin: '8px 0' }}>ISBN: {book.isbn}</div>
          <div style={{ margin: '8px 0' }}><strong>Published:</strong> {published || 'Unknown'}</div>
          <div style={{ margin: '8px 0' }}><strong>Genres:</strong> {genres || 'N/A'}</div>
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <h3>Description</h3>
        <div style={{ whiteSpace: 'pre-line', color: '#333' }}>{desc}</div>
      </div>
    </div>
  );
}
