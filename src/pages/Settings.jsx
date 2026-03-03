import React, { useState } from 'react';
import { T, PLANS } from '../theme.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { updateUser } from '../lib/storage.js';
import {
  testElevenLabsKey, buildYTAuthUrl, fetchYTChannel, fetchIGAccount,
} from '../lib/api.js';
import { Card, SLabel, Btn, StatusBox, Spinner, Toggle } from '../components/ui/index.jsx';

export default function Settings() {
  const { user, patchUser, refreshUser } = useAuth();
  const { toast } = useApp();

  // ElevenLabs
  const [elKey, setElKey] = useState(user?.services?.elKey || '');
  const [elTesting, setElTesting] = useState(false);
  const [elStatus, setElStatus] = useState(user?.services?.elKey ? 'ok' : null);

  // YouTube
  const [ytClientId, setYtClientId] = useState(user?.services?.ytClientId || '');
  const [ytLoading, setYtLoading] = useState(false);

  // Instagram
  const [igToken, setIgToken] = useState(user?.services?.igToken || '');
  const [igLoading, setIgLoading] = useState(false);
  const [igError, setIgError] = useState('');

  // Claude API key (optional override)
  const [claudeKey, setClaudeKey] = useState(user?.services?.claudeKey || '');

  // Profile
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [tab, setTab] = useState('apis');

  const testEL = async () => {
    if (!elKey.trim()) return;
    setElTesting(true);
    try {
      await testElevenLabsKey(elKey.trim());
      setElStatus('ok');
      const updated = { ...user.services, elKey: elKey.trim() };
      patchUser({ services: updated });
      toast('ElevenLabs connected!', 'success');
    } catch (err) {
      setElStatus('err');
      toast(err.message, 'error');
    }
    setElTesting(false);
  };

  const connectYT = () => {
    if (!ytClientId.trim()) return;
    const updated = { ...user.services, ytClientId: ytClientId.trim() };
    patchUser({ services: updated });
    window.location.href = buildYTAuthUrl(ytClientId.trim());
  };

  const disconnectYT = () => {
    patchUser({ services: { ...user.services, ytToken: null, ytChannel: null, ytClientId: '' } });
    setYtClientId('');
    toast('YouTube disconnected.', 'info');
  };

  const connectIG = async () => {
    if (!igToken.trim()) return;
    setIgLoading(true);
    setIgError('');
    try {
      const account = await fetchIGAccount(igToken.trim());
      patchUser({ services: { ...user.services, igToken: igToken.trim(), igAccount: account } });
      toast('Instagram connected!', 'success');
    } catch (err) {
      setIgError(err.message);
      toast(err.message, 'error');
    }
    setIgLoading(false);
  };

  const disconnectIG = () => {
    patchUser({ services: { ...user.services, igToken: '', igAccount: null } });
    setIgToken('');
    toast('Instagram disconnected.', 'info');
  };

  const saveClaudeKey = () => {
    patchUser({ services: { ...user.services, claudeKey: claudeKey.trim() } });
    toast('Claude API key saved.', 'success');
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    patchUser({ name: name.trim() });
    toast('Profile updated.', 'success');
    setSavingProfile(false);
  };

  const TABS = [
    { id: 'apis', label: '🔑 API Services', ok: true },
    { id: 'profile', label: '👤 Profile', ok: true },
  ];

  const inputStyle = {
    flex: 1, background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '10px 14px', color: T.text, fontFamily: T.mono, fontSize: 12, outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div>
        <h1 style={{ fontFamily: T.display, fontSize: 36, letterSpacing: 3, color: T.text }}>SETTINGS</h1>
        <p style={{ color: T.textMid, fontFamily: T.mono, fontSize: 12, marginTop: 4 }}>
          Connect services, manage your profile and subscription
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? T.bg3 : 'transparent',
            border: `1px solid ${tab === t.id ? T.border : 'transparent'}`,
            borderRadius: 8, padding: '9px 18px', cursor: 'pointer',
            color: tab === t.id ? T.text : T.textMid,
            fontFamily: T.mono, fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── API Services ────────────────────────────────────────────────────── */}
      {tab === 'apis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Claude AI */}
          <Card>
            <SLabel icon="🤖">CLAUDE AI — SCRIPT GENERATION</SLabel>
            <StatusBox type="ok" text="Claude AI is always active for script generation" />
            <div style={{ marginTop: 12 }}>
              <label style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10, marginBottom: 6, display: 'block' }}>
                OPTIONAL: YOUR OWN CLAUDE API KEY (uses your quota)
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input type="password" value={claudeKey} onChange={e => setClaudeKey(e.target.value)}
                  placeholder="sk-ant-..." style={inputStyle} />
                <Btn variant="ghost" size="sm" onClick={saveClaudeKey}>Save</Btn>
              </div>
            </div>
          </Card>

          {/* ElevenLabs */}
          <Card>
            <SLabel icon="🎙">ELEVENLABS — AI VOICE SYNTHESIS</SLabel>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <input type="password" value={elKey} onChange={e => { setElKey(e.target.value); setElStatus(null); }}
                placeholder="Paste ElevenLabs API key..." style={inputStyle} />
              <button onClick={testEL} disabled={!elKey.trim() || elTesting} style={{
                background: T.orange, border: 'none', borderRadius: 8, padding: '10px 16px',
                color: '#fff', fontFamily: T.mono, fontSize: 11, fontWeight: 700,
                cursor: !elKey.trim() ? 'not-allowed' : 'pointer',
                opacity: !elKey.trim() ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              }}>
                {elTesting ? <><Spinner size={14} color="#fff" /> Testing...</> : 'TEST KEY'}
              </button>
            </div>
            {elStatus === 'ok' && <StatusBox type="ok" text="ElevenLabs connected — 6 premium voices available" />}
            {elStatus === 'err' && <StatusBox type="err" text="Invalid ElevenLabs API key. Please check and retry." />}
            <p style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10, marginTop: 10, lineHeight: 1.8 }}>
              Get key: <span style={{ color: T.orange }}>elevenlabs.io</span> → Sign up free → Profile → API Key
            </p>
          </Card>

          {/* YouTube */}
          <Card>
            <SLabel icon="▶️">YOUTUBE — AUTO-UPLOAD</SLabel>
            {user?.services?.ytChannel ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: T.blue + '12', border: `1px solid ${T.blue}40`, borderRadius: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {user.services.ytChannel.thumbnail && <img src={user.services.ytChannel.thumbnail} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />}
                  <div>
                    <div style={{ color: T.blue, fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>✓ {user.services.ytChannel.name}</div>
                    <div style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10 }}>Connected · Videos upload directly</div>
                  </div>
                </div>
                <Btn variant="ghost" size="sm" onClick={disconnectYT}>Disconnect</Btn>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <input value={ytClientId} onChange={e => setYtClientId(e.target.value)}
                    placeholder="Google OAuth Client ID" style={inputStyle} />
                  <button onClick={connectYT} disabled={!ytClientId.trim()} style={{
                    background: T.blue, border: 'none', borderRadius: 8, padding: '10px 16px',
                    color: '#fff', fontFamily: T.mono, fontSize: 11, fontWeight: 700,
                    cursor: !ytClientId.trim() ? 'not-allowed' : 'pointer', opacity: !ytClientId.trim() ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                  }}>🔗 CONNECT</button>
                </div>
                {ytLoading && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner size={14} color={T.blue} /><span style={{ color: T.blue, fontFamily: T.mono, fontSize: 11 }}>Fetching channel...</span></div>}
              </>
            )}
            <div style={{ padding: '11px 14px', background: T.bg1, borderRadius: 9, border: `1px solid ${T.border}`, marginTop: 8 }}>
              <p style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10, lineHeight: 2, margin: 0 }}>
                <span style={{ color: T.text }}>One-time setup:</span><br />
                1. <span style={{ color: T.blue }}>console.cloud.google.com</span> → New Project<br />
                2. APIs → Enable <span style={{ color: T.blue }}>YouTube Data API v3</span><br />
                3. Credentials → OAuth 2.0 → Web App<br />
                4. Redirect URI → this page's URL → Copy Client ID
              </p>
            </div>
          </Card>

          {/* Instagram */}
          <Card>
            <SLabel icon="📸">INSTAGRAM — REELS AUTO-PUBLISH</SLabel>
            {user?.services?.igAccount ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: T.pink + '12', border: `1px solid ${T.pink}40`, borderRadius: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ color: T.pink, fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>✓ @{user.services.igAccount.username}</div>
                  <div style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10 }}>Reels publish directly to Instagram</div>
                </div>
                <Btn variant="ghost" size="sm" onClick={disconnectIG}>Disconnect</Btn>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input type="password" value={igToken} onChange={e => { setIgToken(e.target.value); setIgError(''); }}
                    placeholder="Facebook Page Access Token" style={inputStyle} />
                  <button onClick={connectIG} disabled={!igToken.trim() || igLoading} style={{
                    background: 'linear-gradient(135deg,#f09433,#dc2743,#bc1888)',
                    border: 'none', borderRadius: 8, padding: '10px 16px',
                    color: '#fff', fontFamily: T.mono, fontSize: 11, fontWeight: 700,
                    cursor: !igToken.trim() ? 'not-allowed' : 'pointer', opacity: !igToken.trim() ? 0.5 : 1, whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {igLoading ? <Spinner size={14} color="#fff" /> : null}
                    🔗 CONNECT
                  </button>
                </div>
                {igError && <StatusBox type="err" text={igError} />}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Profile ─────────────────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <SLabel icon="👤">PROFILE</SLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10, letterSpacing: 1, display: 'block', marginBottom: 6 }}>FULL NAME</label>
                <input value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, flex: 'none', width: '100%' }} />
              </div>
              <div>
                <label style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10, letterSpacing: 1, display: 'block', marginBottom: 6 }}>EMAIL</label>
                <input value={user?.email || ''} disabled style={{ ...inputStyle, flex: 'none', width: '100%', opacity: 0.5 }} />
              </div>
              <div>
                <label style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10, letterSpacing: 1, display: 'block', marginBottom: 6 }}>PLAN</label>
                <input value={`${user?.plan?.toUpperCase() || 'FREE'} PLAN`} disabled style={{ ...inputStyle, flex: 'none', width: '100%', opacity: 0.5 }} />
              </div>
              <Btn onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </Btn>
            </div>
          </Card>

          <Card>
            <SLabel icon="🗓">ACCOUNT INFO</SLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
                { label: 'Videos this month', value: `${user?.billing?.videosUsedThisMonth || 0}` },
                { label: 'User ID', value: user?.id?.slice(0, 8) + '...' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ color: T.textMid, fontFamily: T.mono, fontSize: 11 }}>{label}</span>
                  <span style={{ color: T.text, fontFamily: T.mono, fontSize: 11, fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
