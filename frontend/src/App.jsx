



import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import BookSearch from './BookSearch';
import BookList from './BookList';
import BookDetails from './BookDetails';
import AuthForm from './AuthForm';
import UserProfile from './UserProfile';

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
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16, gap: 12 }}>
              <span>Logged in as <b>{user.user?.email || user.email}</b></span>
              <Link to="/profile" style={{ textDecoration: 'none', color: '#0074d9', fontWeight: 'bold', marginLeft: 8 }}>Profile</Link>
              <button onClick={handleLogout} style={{ padding: 8, marginLeft: 8 }}>Logout</button>
            </div>
            <Routes>
              <Route path="/" element={<BookList />} />
              <Route path="/search" element={<BookSearch />} />
              <Route path="/books/:isbn" element={<BookDetails />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </>
        )}
      </div>
    </BrowserRouter>
  );
}
