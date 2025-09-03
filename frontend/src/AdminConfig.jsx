import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function AdminConfig() {
  const [key, setKey] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async e => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      await axios.post(`${API_BASE}/admin/config/openai-key`, { key });
      setStatus('API key saved!');
    } catch {
      setStatus('Failed to save key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '32px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Admin: OpenAI API Key Config</h2>
      <form onSubmit={handleSave}>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="Enter OpenAI API Key"
          style={{ width: '100%', padding: 8, marginBottom: 12 }}
        />
        <button type="submit" disabled={loading || !key} style={{ padding: 8 }}>
          {loading ? 'Saving...' : 'Save Key'}
        </button>
      </form>
      {status && <div style={{ marginTop: 12, color: status.includes('fail') ? 'red' : 'green' }}>{status}</div>}
    </div>
  );
}
