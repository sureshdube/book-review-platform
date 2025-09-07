import React from 'react';
import AuthForm from './AuthForm';

export default function SignupScreen({ onAuth }) {
  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Sign Up</h2>
      <AuthForm mode="signup" onAuth={onAuth} />
    </div>
  );
}
