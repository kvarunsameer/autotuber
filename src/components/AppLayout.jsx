import React, { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { T } from '../theme.js';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top header bar */}
        <header style={{
          height: 56, background: T.bg1, borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', paddingInline: 24, gap: 16, flexShrink: 0,
        }}>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => navigate('/create')}
            style={{
              background: `linear-gradient(135deg,${T.orange},#F59E0B)`,
              border: 'none', borderRadius: 8, padding: '7px 16px',
              color: '#fff', fontFamily: T.mono, fontSize: 11, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            ＋ NEW VIDEO
          </button>

          {/* Upgrade CTA for free users */}
          {user?.plan === 'free' && (
            <button
              onClick={() => navigate('/subscription')}
              style={{
                background: T.purple + '20', border: `1px solid ${T.purple}40`,
                borderRadius: 8, padding: '7px 14px',
                color: T.purple, fontFamily: T.mono, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', letterSpacing: 1,
              }}
            >
              ⚡ Upgrade
            </button>
          )}

          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: `linear-gradient(135deg,${T.orange},#8B5CF6)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: T.mono, fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </header>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 28px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
