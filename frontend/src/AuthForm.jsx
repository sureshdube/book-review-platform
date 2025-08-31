import React, { useState } from 'react';
import axios from 'axios';

export default function AuthForm({ onAuth, mode = 'login' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = mode === 'signup' ? '/auth/test-user' : '/auth/login';
      const res = await axios.post(url, { email, password });
      onAuth(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Auth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: '24px auto', padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>{mode === 'signup' ? 'Sign Up' : 'Login'}</h2>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        required
        style={{ width: '100%', marginBottom: 8, padding: 8 }}
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        required
        style={{ width: '100%', marginBottom: 8, padding: 8 }}
      />
      <button type="submit" style={{ width: '100%', padding: 8 }} disabled={loading}>
        {loading ? (mode === 'signup' ? 'Signing up...' : 'Logging in...') : (mode === 'signup' ? 'Sign Up' : 'Login')}
      </button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </form>
  );
}
