import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function AuthForm() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-box" onSubmit={handleSubmit}>
        <div className="auth-logo">
          <div className="logo-icon">📚</div>
          <h1 className="app-title">Task Planner</h1>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={'auth-tab' + (mode === 'login' ? ' active' : '')}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Log In
          </button>
          <button
            type="button"
            className={'auth-tab' + (mode === 'signup' ? ' active' : '')}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        {mode === 'signup' && (
          <>
            <label className="modal-label">Name (optional)</label>
            <input
              className="modal-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </>
        )}

        <label className="modal-label">Email</label>
        <input
          className="modal-input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <label className="modal-label">Password</label>
        <input
          className="modal-input"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
        />

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="modal-btn confirm auth-submit" disabled={submitting}>
          {submitting ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
