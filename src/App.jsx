import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AppProvider } from './context/AppContext.jsx';

import AppLayout from './components/AppLayout.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Videos from './pages/Videos.jsx';
import Editor from './pages/Editor.jsx';
import Published from './pages/Published.jsx';
import Settings from './pages/Settings.jsx';
import Subscription from './pages/Subscription.jsx';

// ── Route guards ──────────────────────────────────────────────────────────────

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#05050f' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #FF6B3525', borderTop: '3px solid #FF6B35', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth?mode=login" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

// ── YouTube OAuth callback handler ───────────────────────────────────────────
function OAuthCallbackHandler() {
  const { user, patchUser } = useAuth();
  React.useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    const state = params.get('state');
    if (token && state === 'yt_auth' && user) {
      // Clear hash
      window.history.replaceState({}, document.title, window.location.pathname);
      // Fetch channel info
      fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(d => {
          const c = d.items?.[0]?.snippet;
          const channel = c ? { name: c.title, thumbnail: c.thumbnails?.default?.url } : null;
          patchUser({ services: { ...user.services, ytToken: token, ytChannel: channel } });
        })
        .catch(() => {
          patchUser({ services: { ...user.services, ytToken: token, ytChannel: null } });
        });
    }
  }, [user, patchUser]);
  return null;
}

// ── App root ──────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <>
      <OAuthCallbackHandler />
      <Routes>
        {/* Public */}
        <Route path="/" element={<GuestOnly><Landing /></GuestOnly>} />
        <Route path="/auth" element={<GuestOnly><Auth /></GuestOnly>} />

        {/* Protected — inside app shell */}
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/create" element={<Editor />} />
          <Route path="/editor/:id" element={<Editor />} />
          <Route path="/published" element={<Published />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/subscription" element={<Subscription />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
