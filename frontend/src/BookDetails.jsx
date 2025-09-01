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
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [editing, setEditing] = useState(false);
  const [editReviewId, setEditReviewId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Get user from localStorage (MVP, not secure)
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  })();

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
    async function fetchReviews() {
      try {
        const res = await axios.get(`${API_BASE}/books/${isbn}/reviews`);
        setReviews(res.data || []);
      } catch {}
    }
    fetchBook();
    fetchReviews();
  }, [isbn]);

  // Find the user's own review, if any
  const userReview = user && reviews.find(r => r.user === user._id);

  const handleReviewSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    if (!user?._id || !user?.email) {
      setSubmitError('User info missing. Please log out and log in again.');
      setSubmitting(false);
      return;
    }
    try {
      await axios.post(`${API_BASE}/books/${isbn}/reviews`, {
        rating,
        text: reviewText,
        user: user._id,
        userEmail: user.email,
      });
      setSubmitSuccess('Review submitted!');
      setReviewText('');
      setRating(5);
      // Refresh reviews
      const res = await axios.get(`${API_BASE}/books/${isbn}/reviews`);
      setReviews(res.data || []);
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = review => {
    setEditReviewId(review._id);
    setEditText(review.text || '');
    setEditRating(review.rating);
    setEditing(true);
    setEditError('');
    setEditSuccess('');
  };

  const handleEditCancel = () => {
    setEditing(false);
    setEditReviewId(null);
    setEditText('');
    setEditRating(5);
    setEditError('');
    setEditSuccess('');
  };

  const handleEditSubmit = async e => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    if (!user?._id) {
      setEditError('User info missing.');
      return;
    }
    try {
      await axios.patch(`${API_BASE}/books/${isbn}/reviews/${editReviewId}`, {
        rating: editRating,
        text: editText,
        user: user._id,
      });
      setEditSuccess('Review updated!');
      setEditing(false);
      setEditReviewId(null);
      setEditText('');
      setEditRating(5);
      // Refresh reviews
      const res = await axios.get(`${API_BASE}/books/${isbn}/reviews`);
      setReviews(res.data || []);
    } catch (err) {
      setEditError(err?.response?.data?.message || 'Failed to update review');
    }
  };

  const handleDelete = async reviewId => {
    if (!window.confirm('Delete your review?')) return;
    setEditError('');
    setEditSuccess('');
    try {
      await axios.delete(`${API_BASE}/books/${isbn}/reviews/${reviewId}`, {
        data: { user: user._id },
      });
      // Refresh reviews
      const res = await axios.get(`${API_BASE}/books/${isbn}/reviews`);
      setReviews(res.data || []);
    } catch (err) {
      setEditError(err?.response?.data?.message || 'Failed to delete review');
    }
  };

  // Extract details from Open Library data if available
  if (loading) return <div>Loading book details...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!book) return <div>Book not found.</div>;
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

      <div style={{ marginTop: 32 }}>
        <h3>Reviews</h3>
        {reviews.length === 0 && <div>No reviews yet.</div>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {reviews.map(r => (
            <li key={r._id} style={{ borderBottom: '1px solid #eee', marginBottom: 12, paddingBottom: 8 }}>
              <div style={{ fontWeight: 'bold' }}>{r.userEmail || 'User'} <span style={{ color: '#f39c12' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span></div>
              <div style={{ fontSize: 13, color: '#555' }}>{r.text}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{new Date(r.createdAt).toLocaleString()}</div>
              {user && r.user === user._id && !editing && (
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => handleEditClick(r)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(r._id)} style={{ color: 'red' }}>Delete</button>
                </div>
              )}
              {editing && editReviewId === r._id && (
                <form onSubmit={handleEditSubmit} style={{ marginTop: 8 }}>
                  <div>
                    <label>Rating: </label>
                    <select value={editRating} onChange={e => setEditRating(Number(e.target.value))} style={{ marginLeft: 8 }}>
                      {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}
                    </select>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      style={{ width: '100%', padding: 8 }}
                    />
                  </div>
                  <button type="submit" style={{ marginTop: 8, marginRight: 8 }}>Save</button>
                  <button type="button" onClick={handleEditCancel} style={{ marginTop: 8 }}>Cancel</button>
                  {editError && <div style={{ color: 'red', marginTop: 8 }}>{editError}</div>}
                  {editSuccess && <div style={{ color: 'green', marginTop: 8 }}>{editSuccess}</div>}
                </form>
              )}
            </li>
          ))}
        </ul>
      </div>

      {user && !userReview && (
        <form onSubmit={handleReviewSubmit} style={{ marginTop: 24, border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
          <h4>Write a Review</h4>
          <div style={{ marginBottom: 8 }}>
            <label>Rating: </label>
            <select value={rating} onChange={e => setRating(Number(e.target.value))} style={{ marginLeft: 8 }}>
              {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Write your review (optional)"
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <button type="submit" disabled={submitting} style={{ padding: 8 }}>Submit Review</button>
          {submitError && <div style={{ color: 'red', marginTop: 8 }}>{submitError}</div>}
          {submitSuccess && <div style={{ color: 'green', marginTop: 8 }}>{submitSuccess}</div>}
        </form>
      )}
      {user && userReview && (
        <div style={{ marginTop: 24, color: '#888' }}>You have already reviewed this book. You can edit or delete your review above.</div>
      )}
      {!user && <div style={{ marginTop: 24, color: '#888' }}>Login to write a review.</div>}
    </div>
  );
}
