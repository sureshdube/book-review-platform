import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AuthForm from './AuthForm';

function Root() {
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

  if (!user) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'sans-serif' }}>
        <h1>Book Review Platform (Vite + React)</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
          <button onClick={() => setMode('login')} style={{ padding: 8, fontWeight: mode==='login'?'bold':'normal' }}>Login</button>
          <button onClick={() => setMode('signup')} style={{ padding: 8, fontWeight: mode==='signup'?'bold':'normal' }}>Sign Up</button>
        </div>
        <AuthForm mode={mode} onAuth={handleAuth} />
      </div>
    );
  }

  return <App user={user} onLogout={handleLogout} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
