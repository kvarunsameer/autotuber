import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { T, PLANS } from '../theme.js';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/videos', icon: '🎬', label: 'My Videos' },
  { to: '/create', icon: '➕', label: 'New Video' },
  { to: '/published', icon: '📡', label: 'Published' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const plan = PLANS.find(p => p.id === user?.plan) || PLANS[0];

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <aside style={{
      width: collapsed ? 64 : 240, flexShrink: 0,
      background: T.bg1, borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      transition: 'width 0.25s ease', overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 16px' : '20px 20px',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: `linear-gradient(135deg,${T.orange},#F59E0B)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 16, color: '#fff',
        }}>A</div>
        {!collapsed && (
          <span style={{ fontFamily: T.display, fontSize: 22, letterSpacing: 2, color: T.text, whiteSpace: 'nowrap' }}>
            AUTOTUBER
          </span>
        )}
        <button
          onClick={onToggle}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: T.textDim, cursor: 'pointer', fontSize: 16, flexShrink: 0,
            display: 'flex', alignItems: 'center',
          }}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Plan badge */}
      {!collapsed && (
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${T.border}` }}>
          <div
            onClick={() => navigate('/subscription')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', background: plan.color + '15',
              border: `1px solid ${plan.color}30`, borderRadius: 9,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
          >
            <span style={{ fontSize: 14 }}>{plan.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: plan.color, fontFamily: T.mono, fontSize: 10, fontWeight: 700 }}>
                {plan.name.toUpperCase()} PLAN
              </div>
              {plan.id === 'free' && (
                <div style={{ color: T.textDim, fontSize: 9, fontFamily: T.mono }}>
                  {user?.billing?.videosUsedThisMonth || 0}/{plan.videosPerMonth} videos used
                </div>
              )}
            </div>
            <span style={{ color: T.textDim, fontSize: 10 }}>↗</span>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: collapsed ? '10px 16px' : '10px 12px',
              borderRadius: 9, textDecoration: 'none',
              color: isActive ? T.text : T.textMid,
              background: isActive ? T.bg3 : 'transparent',
              fontFamily: T.mono, fontSize: 12, fontWeight: isActive ? 700 : 400,
              transition: 'all 0.15s', whiteSpace: 'nowrap',
              borderLeft: isActive ? `3px solid ${T.orange}` : '3px solid transparent',
            })}
            title={collapsed ? label : undefined}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div style={{ padding: '12px 10px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        {!collapsed && user && (
          <div style={{ padding: '10px 12px', marginBottom: 6 }}>
            <div style={{ color: T.text, fontFamily: T.mono, fontSize: 11, fontWeight: 700, truncate: true }}>{user.name}</div>
            <div style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10, marginTop: 2 }}>{user.email}</div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '10px 16px' : '10px 12px',
            background: 'none', border: 'none',
            color: T.textMid, fontFamily: T.mono, fontSize: 12, cursor: 'pointer',
            borderRadius: 9, transition: 'background 0.15s',
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>🚪</span>
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}
