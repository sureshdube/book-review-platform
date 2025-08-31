


import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BookSearch from './BookSearch';
import BookList from './BookList';
import AuthForm from './AuthForm';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [mode, setMode] = useState('login');

  const handleAuth = (data) => {
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
  };
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <BrowserRouter>
      <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'sans-serif' }}>
        <h1>Book Review Platform (Vite + React)</h1>
        {!user ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
              <button onClick={() => setMode('login')} style={{ padding: 8, fontWeight: mode==='login'?'bold':'normal' }}>Login</button>
              <button onClick={() => setMode('signup')} style={{ padding: 8, fontWeight: mode==='signup'?'bold':'normal' }}>Sign Up</button>
            </div>
            <AuthForm mode={mode} onAuth={handleAuth} />
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <span style={{ marginRight: 16 }}>Logged in as <b>{user.user?.email || user.email}</b></span>
              <button onClick={handleLogout} style={{ padding: 8 }}>Logout</button>
            </div>
            <Routes>
              <Route path="/" element={<BookList />} />
              <Route path="/search" element={<BookSearch />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </>
        )}
      </div>
    </BrowserRouter>
  );
}
