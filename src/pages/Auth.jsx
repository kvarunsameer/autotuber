import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { T } from '../theme.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { Spinner } from '../components/ui/index.jsx';

export default function Auth() {
  const [params] = useSearchParams();
  const mode = params.get('mode') || 'login';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup, user } = useAuth();
  const { toast } = useApp();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup' && !form.name.trim()) { setError('Name is required.'); return; }
    if (!form.email.trim()) { setError('Email is required.'); return; }
    if (!form.password.trim()) { setError('Password is required.'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        login({ email: form.email.trim(), password: form.password });
        toast('Welcome back!', 'success');
      } else {
        signup({ name: form.name.trim(), email: form.email.trim(), password: form.password });
        toast('Account created — welcome to AutoTuber!', 'success');
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%', background: T.bg1, border: `1px solid ${T.border}`,
    borderRadius: 9, padding: '12px 14px', color: T.text,
    fontFamily: T.mono, fontSize: 13, outline: 'none',
    transition: 'border-color 0.2s',
  };
  const labelStyle = { color: T.textMid, fontFamily: T.mono, fontSize: 11, letterSpacing: 1, display: 'block', marginBottom: 6 };

  return (
    <div style={{
      minHeight: '100vh', background: T.bg0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 440, animation: 'fadeIn 0.3s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', width: 52, height: 52, borderRadius: 14,
            background: `linear-gradient(135deg,${T.orange},#F59E0B)`,
            alignItems: 'center', justifyContent: 'center',
            fontFamily: T.display, fontSize: 28, color: '#fff', marginBottom: 14,
          }}>A</div>
          <h1 style={{ fontFamily: T.display, fontSize: 32, letterSpacing: 3, color: T.text, marginBottom: 6 }}>
            {mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}
          </h1>
          <p style={{ color: T.textMid, fontFamily: T.mono, fontSize: 12 }}>
            {mode === 'login' ? 'Sign in to your AutoTuber account' : 'Create your free account — no credit card'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 18, padding: 30,
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {mode === 'signup' && (
              <div>
                <label style={labelStyle}>FULL NAME</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" style={inputStyle} />
              </div>
            )}
            <div>
              <label style={labelStyle}>EMAIL</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>PASSWORD</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" style={inputStyle} />
            </div>

            {error && (
              <div style={{ padding: '9px 12px', background: T.red + '15', border: `1px solid ${T.red}40`, borderRadius: 8, color: T.red, fontFamily: T.mono, fontSize: 11 }}>
                ✗ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: `linear-gradient(135deg,${T.orange},#F59E0B)`,
                border: 'none', borderRadius: 10, padding: '14px',
                color: '#fff', fontFamily: T.mono, fontSize: 13, fontWeight: 700,
                letterSpacing: 2, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {loading && <Spinner size={16} color="#fff" />}
              {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <span style={{ color: T.textDim, fontFamily: T.mono, fontSize: 11 }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              onClick={() => navigate(`/auth?mode=${mode === 'login' ? 'signup' : 'login'}`)}
              style={{ background: 'none', border: 'none', color: T.orange, fontFamily: T.mono, fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: T.textDim, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
