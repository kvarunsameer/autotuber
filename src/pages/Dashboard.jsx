import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T, PLANS, CATEGORIES } from '../theme.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useVideos } from '../hooks/useVideos.js';
import { Card, SLabel, PBar, StatusBadge, Btn, EmptyState, Spinner } from '../components/ui/index.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const plan = PLANS.find(p => p.id === user?.plan) || PLANS[0];
  const { videos, loading } = useVideos();

  const drafts = videos.filter(v => v.status === 'draft');
  const published = videos.filter(v => v.status === 'published');
  const rendering = videos.filter(v => v.status === 'rendering');
  const usedPct = plan.videosPerMonth === Infinity ? 0 : Math.round(((user?.billing?.videosUsedThisMonth || 0) / plan.videosPerMonth) * 100);

  // Niche breakdown
  const nicheBreakdown = CATEGORIES.map(cat => ({
    ...cat,
    count: videos.filter(v => v.niche === cat.id).length,
  })).filter(c => c.count > 0).slice(0, 5);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: T.display, fontSize: 36, letterSpacing: 3, color: T.text, marginBottom: 4 }}>
            DASHBOARD
          </h1>
          <p style={{ color: T.textMid, fontFamily: T.mono, fontSize: 12 }}>
            Welcome back, <span style={{ color: T.text }}>{user?.name}</span> · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Btn onClick={() => navigate('/create')} size="lg">
          ＋ NEW VIDEO
        </Btn>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { icon: '🎬', label: 'Total Videos', value: videos.length, color: T.blue },
          { icon: '📝', label: 'Drafts', value: drafts.length, color: T.gold },
          { icon: '📡', label: 'Published', value: published.length, color: T.green },
          { icon: '⚙️', label: 'Rendering', value: rendering.length, color: T.orange },
        ].map(({ icon, label, value, color }) => (
          <Card key={label} glow={color} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontFamily: T.display, fontSize: 36, color, letterSpacing: 1 }}>{value}</div>
            <div style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10, letterSpacing: 1, marginTop: 4 }}>{label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Usage */}
        <Card>
          <SLabel icon="📊">MONTHLY USAGE</SLabel>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
            <span style={{ fontFamily: T.display, fontSize: 42, color: plan.color, letterSpacing: 1 }}>
              {user?.billing?.videosUsedThisMonth || 0}
            </span>
            <span style={{ color: T.textDim, fontFamily: T.mono, fontSize: 12 }}>
              / {plan.videosPerMonth === Infinity ? '∞' : plan.videosPerMonth} videos
            </span>
          </div>
          {plan.videosPerMonth !== Infinity && <PBar pct={usedPct} color={usedPct > 80 ? T.red : plan.color} h={6} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', background: plan.color + '15', border: `1px solid ${plan.color}30`, borderRadius: 8 }}>
              <span style={{ fontSize: 14 }}>{plan.emoji}</span>
              <span style={{ color: plan.color, fontFamily: T.mono, fontSize: 11, fontWeight: 700 }}>{plan.name} Plan</span>
            </div>
            {plan.id !== 'enterprise' && (
              <button onClick={() => navigate('/subscription')}
                style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 14px', color: T.textMid, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>
                Upgrade ↗
              </button>
            )}
          </div>
        </Card>

        {/* Quick actions */}
        <Card>
          <SLabel icon="⚡">QUICK ACTIONS</SLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: '🎯', label: 'Create new video', desc: 'AI generates script ideas', onClick: () => navigate('/create'), color: T.orange },
              { icon: '📡', label: 'View published videos', desc: 'Read-only published library', onClick: () => navigate('/published'), color: T.green },
              { icon: '⚙️', label: 'Connect services', desc: 'ElevenLabs · YouTube · Instagram', onClick: () => navigate('/settings'), color: T.blue },
            ].map(({ icon, label, desc, onClick, color }) => (
              <button key={label} onClick={onClick} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 10,
                textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.15s', width: '100%',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ color: T.text, fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>{label}</div>
                  <div style={{ color: T.textDim, fontSize: 11, marginTop: 2 }}>{desc}</div>
                </div>
                <span style={{ marginLeft: 'auto', color: color, fontFamily: T.mono, fontSize: 14 }}>→</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent videos */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <SLabel icon="🎬" style={{ marginBottom: 0 }}>RECENT VIDEOS</SLabel>
          <button onClick={() => navigate('/videos')} style={{ background: 'none', border: 'none', color: T.textMid, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>
            View all →
          </button>
        </div>

        {videos.length === 0 ? (
          <EmptyState icon="🎬" title="NO VIDEOS YET" subtitle="Create your first AI-generated video"
            action={<Btn onClick={() => navigate('/create')} size="md">＋ Create First Video</Btn>} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {videos.slice(-5).reverse().map(v => (
              <div key={v.id} onClick={() => v.status !== 'published' ? navigate(`/editor/${v.id}`) : navigate('/published')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px', background: T.bg3, borderRadius: 10,
                  border: `1px solid ${T.border}`, cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 9, flexShrink: 0,
                  background: `linear-gradient(135deg,${T.orange}40,${T.purple}40)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {CATEGORIES.find(c => c.id === v.niche)?.emoji || '🎬'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.text, fontFamily: T.mono, fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.title}
                  </div>
                  <div style={{ color: T.textDim, fontSize: 10, marginTop: 3 }}>
                    {new Date(v.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <StatusBadge status={v.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Niche breakdown */}
      {nicheBreakdown.length > 0 && (
        <Card>
          <SLabel icon="📈">CONTENT BREAKDOWN BY NICHE</SLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {nicheBreakdown.map(({ id, emoji, label, color, count }) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16, width: 24, flexShrink: 0 }}>{emoji}</span>
                <span style={{ color: T.textMid, fontFamily: T.mono, fontSize: 11, width: 100, flexShrink: 0 }}>{label}</span>
                <div style={{ flex: 1 }}>
                  <PBar pct={Math.round((count / videos.length) * 100)} color={color} h={6} />
                </div>
                <span style={{ color, fontFamily: T.mono, fontSize: 11, fontWeight: 700, width: 24, textAlign: 'right' }}>{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
