import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, PLANS, CATEGORIES } from '../theme.js';
import { useApp } from '../context/AppContext.jsx';

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useApp();
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: T.bg0, overflowX: 'hidden' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 40px', borderBottom: `1px solid ${T.border}`,
        position: 'sticky', top: 0, background: T.bg0blur, zIndex: 100, backdropFilter: 'blur(8px)',
      }}>
        <div style={{ fontFamily: T.display, fontSize: 28, letterSpacing: 3, color: T.orange }}>
          AUTOTUBER
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.textMid, fontFamily: T.mono, fontSize: 14, cursor: 'pointer' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={() => navigate('/auth?mode=login')}
            style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 18px', color: T.text, fontFamily: T.mono, fontSize: 12, cursor: 'pointer' }}>
            Sign In
          </button>
          <button onClick={() => navigate('/auth?mode=signup')}
            style={{ background: `linear-gradient(135deg,${T.orange},#F59E0B)`, border: 'none', borderRadius: 8, padding: '8px 18px', color: '#fff', fontFamily: T.mono, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '80px 24px 60px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: T.orange + '15', border: `1px solid ${T.orange}30`, borderRadius: 20,
          padding: '5px 16px', marginBottom: 28,
        }}>
          <span style={{ color: T.orange, fontFamily: T.mono, fontSize: 11, fontWeight: 700 }}>🚀 AI-POWERED VIDEO ENGINE</span>
        </div>

        <h1 style={{ fontFamily: T.display, fontSize: 80, letterSpacing: 4, color: T.text, lineHeight: 1, marginBottom: 24 }}>
          FACELESS YOUTUBE <br />
          <span style={{ background: `linear-gradient(135deg,${T.orange},#F59E0B)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ON AUTOPILOT
          </span>
        </h1>

        <p style={{ color: T.textMid, fontSize: 18, lineHeight: 1.7, marginBottom: 40, maxWidth: 620, margin: '0 auto 40px' }}>
          Claude AI writes your scripts. ElevenLabs voices your content. Canvas renders your videos.
          YouTube &amp; Instagram upload automatically. <strong style={{ color: T.text }}>You just approve and publish.</strong>
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 50 }}>
          <button
            onClick={() => navigate('/auth?mode=signup')}
            className="glow-btn"
            style={{
              background: `linear-gradient(135deg,${T.orange},#F59E0B)`,
              border: 'none', borderRadius: 12, padding: '16px 40px',
              color: '#fff', fontFamily: T.mono, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 2,
            }}
          >
            START FREE — NO CREDIT CARD
          </button>
          <button
            onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
            style={{
              background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 12,
              padding: '16px 30px', color: T.textMid, fontFamily: T.mono, fontSize: 15, cursor: 'pointer',
            }}
          >
            SEE PRICING ↓
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { n: '10K+', label: 'Videos Created' },
            { n: '$0', label: 'Starting Cost' },
            { n: '8', label: 'Niches Supported' },
            { n: '6', label: 'AI Voices' },
          ].map(({ n, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: T.display, fontSize: 36, color: T.orange, letterSpacing: 2 }}>{n}</div>
              <div style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10, letterSpacing: 1 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '60px 40px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontFamily: T.display, fontSize: 42, letterSpacing: 3, color: T.text, marginBottom: 40 }}>
            HOW IT WORKS
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
            {[
              { step: '01', icon: '🎯', title: 'Pick a Niche', desc: 'Choose from 8 proven viral categories' },
              { step: '02', icon: '🤖', title: 'AI Generates Scripts', desc: 'Claude writes 6 viral ideas + full scripts' },
              { step: '03', icon: '🎙', title: 'Voice Synthesis', desc: 'ElevenLabs converts text to real AI voice' },
              { step: '04', icon: '🎬', title: 'Canvas Renders Video', desc: '1080×1920 short-form video, done in seconds' },
              { step: '05', icon: '✅', title: 'Review & Approve', desc: 'Preview before publishing — you stay in control' },
              { step: '06', icon: '🚀', title: 'Auto-Publish', desc: 'Uploads to YouTube + Instagram automatically' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{
                background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, padding: '22px 18px',
              }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.orange, fontWeight: 700, marginBottom: 10 }}>{step}</div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
                <div style={{ color: T.text, fontFamily: T.mono, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{title}</div>
                <div style={{ color: T.textMid, fontSize: 12, lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Niches */}
      <section style={{ padding: '60px 40px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontFamily: T.display, fontSize: 42, letterSpacing: 3, color: T.text, marginBottom: 8 }}>
            8 VIRAL NICHES
          </h2>
          <p style={{ textAlign: 'center', color: T.textMid, marginBottom: 32, fontFamily: T.mono, fontSize: 12 }}>
            Claude AI crafts targeted scripts for each category
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {CATEGORIES.map(cat => (
              <div key={cat.id} style={{
                background: T.bg2, border: `1px solid ${cat.color}30`, borderRadius: 12,
                padding: '16px', textAlign: 'center', transition: 'transform 0.15s',
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{cat.emoji}</div>
                <div style={{ color: cat.color, fontFamily: T.mono, fontSize: 11, fontWeight: 700 }}>{cat.label}</div>
                <div style={{ color: T.textDim, fontSize: 10, marginTop: 4 }}>{cat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '60px 40px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontFamily: T.display, fontSize: 42, letterSpacing: 3, color: T.text, marginBottom: 8 }}>
            SIMPLE PRICING
          </h2>
          <p style={{ textAlign: 'center', color: T.textMid, marginBottom: 36, fontFamily: T.mono, fontSize: 12 }}>
            Start free — upgrade when you're ready to scale
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
            {PLANS.map(plan => (
              <div key={plan.id} style={{
                background: T.bg2,
                border: `1px solid ${plan.popular ? plan.color : T.border}`,
                borderRadius: 16, padding: '24px 20px',
                boxShadow: plan.popular ? `0 0 30px ${plan.color}20` : 'none',
                position: 'relative', overflow: 'hidden',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    background: plan.color, color: '#fff',
                    fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: 1,
                    padding: '5px 14px', borderBottomLeftRadius: 10,
                  }}>POPULAR</div>
                )}
                <div style={{ fontSize: 28, marginBottom: 8 }}>{plan.emoji}</div>
                <div style={{ color: plan.color, fontFamily: T.mono, fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>
                  {plan.name.toUpperCase()}
                </div>
                <div style={{ color: T.text, fontFamily: T.display, fontSize: 36, letterSpacing: 1, marginBottom: 16 }}>
                  {plan.price === 0 ? 'FREE' : `$${plan.price}/mo`}
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ color: T.textMid, fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                      <span style={{ color: plan.color, flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(plan.id === 'free' ? '/auth?mode=signup' : `/auth?mode=signup&plan=${plan.id}`)}
                  style={{
                    width: '100%', background: plan.popular ? `linear-gradient(135deg,${plan.color},#F59E0B)` : T.bg3,
                    border: plan.popular ? 'none' : `1px solid ${T.border}`,
                    borderRadius: 10, padding: '11px', color: plan.popular ? '#fff' : T.text,
                    fontFamily: T.mono, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {plan.price === 0 ? 'Get Started Free' : `Start ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 40px', borderTop: `1px solid ${T.border}`, textAlign: 'center' }}>
        <div style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10 }}>
          AUTOTUBER v6.0 — Built with Claude AI · ElevenLabs · Canvas API
        </div>
      </footer>
    </div>
  );
}
