import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function Recommendations({ userId }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError('');
    axios.get(`${API_BASE}/recommendations?userId=${userId}`)
      .then(res => setRecs(res.data.recommendations || []))
      .catch(() => setError('Failed to fetch recommendations'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;
  return (
    <div style={{ marginTop: 32 }}>
      <h3>AI Recommendations</h3>
      {loading && <div>Loading recommendations...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && recs.length === 0 && <div>No recommendations yet.</div>}
      <ul style={{ listStyle: 'disc inside', paddingLeft: 16 }}>
        {recs.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    </div>
  );
}
