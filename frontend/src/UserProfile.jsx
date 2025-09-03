import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let u = null;
    try {
      u = JSON.parse(localStorage.getItem('user'));
    } catch {}
    setUser(u);
    if (!u?._id) {
      setLoading(false);
      return;
    }
    async function fetchProfile() {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_BASE}/users/${u._id}/profile`);
        setReviews(res.data.reviews || []);
        setFavourites(res.data.favourites || []);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) return <div>Loading profile...</div>;
  if (!user) return <div>Please log in to view your profile.</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 600, margin: '32px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <img src="https://ui-avatars.com/api/?name=User&background=eee&color=555" alt="profile" style={{ width: 64, height: 64, borderRadius: '50%' }} />
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 20 }}>{user.email}</div>
          <div style={{ color: '#888', fontSize: 14 }}>User ID: {user._id}</div>
        </div>
      </div>
      <h3>Your Reviews</h3>
      {reviews.length === 0 && <div style={{ color: '#888' }}>No reviews yet.</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {reviews.map(r => (
          <li key={r._id} style={{ borderBottom: '1px solid #eee', marginBottom: 12, paddingBottom: 8 }}>
            <div style={{ fontWeight: 'bold' }}>{r.bookTitle || r.isbn} <span style={{ color: '#f39c12' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span></div>
            <div style={{ fontSize: 13, color: '#555' }}>{r.text}</div>
            <div style={{ fontSize: 11, color: '#888' }}>{new Date(r.createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
      <h3 style={{ marginTop: 32 }}>Favourites ({favourites.length}/20)</h3>
      {favourites.length === 0 && <div style={{ color: '#888' }}>No favourites yet.</div>}
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {favourites.map(b => (
          <li key={b.isbn} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, width: 120 }}>
            {b.cover && <img src={b.cover} alt="cover" style={{ width: '100%', borderRadius: 4, marginBottom: 4 }} />}
            <div style={{ fontWeight: 'bold', fontSize: 14 }}>{b.title}</div>
            <div style={{ fontSize: 12, color: '#555' }}>{b.authors?.join(', ')}</div>
            <div style={{ fontSize: 11, color: '#888' }}>ISBN: {b.isbn}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
