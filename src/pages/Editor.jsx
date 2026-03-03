import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { T, CATEGORIES, VOICES, VIDEO_STYLES, PLANS } from '../theme.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import {
  getVideos, saveVideo, publishVideo,
  createDraftVideo, incrementVideoUsage,
} from '../lib/db.js';
import {
  claudeScriptIdeas, claudeGenerateScript, claudeThumbnailOptions,
  generateVoice, renderVideoOnCanvas, generateBackgroundMusic,
  ytUpload, fetchIGAccount,
} from '../lib/api.js';
import {
  Card, SLabel, Btn, Spinner, PBar, StatusBox, StatusBadge,
  Toggle, Pill, Modal, Confirm,
} from '../components/ui/index.jsx';

// ── Step header ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'niche', label: 'Niche', icon: '🎯' },
  { id: 'ideas', label: 'Script Ideas', icon: '📝' },
  { id: 'script', label: 'Full Script', icon: '✍️' },
  { id: 'style', label: 'Style', icon: '🎨' },
  { id: 'render', label: 'Render', icon: '🎬' },
  { id: 'publish', label: 'Publish', icon: '🚀' },
];

function StepBar({ current }) {
  const idx = STEPS.findIndex(s => s.id === current);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28, overflowX: 'auto' }}>
      {STEPS.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={step.id}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              opacity: done || active ? 1 : 0.35,
              transition: 'opacity 0.2s',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: done ? T.green + '25' : active ? T.orange + '25' : T.bg3,
                border: `2px solid ${done ? T.green : active ? T.orange : T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>
                {done ? '✓' : step.icon}
              </div>
              <span style={{
                color: done ? T.green : active ? T.orange : T.textDim,
                fontFamily: T.mono, fontSize: 9, fontWeight: active ? 700 : 400, letterSpacing: 1,
                whiteSpace: 'nowrap',
              }}>{step.label.toUpperCase()}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 28, height: 2, background: done ? T.green + '60' : T.border, flexShrink: 0, margin: '0 2px', marginBottom: 20 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────
export default function Editor() {
  const { id } = useParams();
  const { user, patchUser } = useAuth();
  const { toast } = useApp();
  const navigate = useNavigate();
  const plan = PLANS.find(p => p.id === user?.plan) || PLANS[0];

  // Video state
  const [video, setVideo] = useState(null);
  const [step, setStep] = useState('niche');
  const [loading, setLoading] = useState(true);

  // Step-specific state
  const [ideas, setIdeas] = useState([]);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [ideasError, setIdeasError] = useState(null);

  const [fullScript, setFullScript] = useState('');
  const [loadingScript, setLoadingScript] = useState(false);
  const [scriptError, setScriptError] = useState(null);
  const [thumbOptions, setThumbOptions] = useState([]);
  const [selectedThumb, setSelectedThumb] = useState('');

  const [videoStyle, setVideoStyle] = useState('cinematic');
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [platforms, setPlatforms] = useState([]);
  const [renderPlatform, setRenderPlatform] = useState('shorts');
  const [autoPublishYT, setAutoPublishYT] = useState(false);
  const [autoPublishIG, setAutoPublishIG] = useState(false);

  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState('idle');
  const [renderBlob, setRenderBlob] = useState(null);
  const [renderUrl, setRenderUrl] = useState(null);
  const videoRef = useRef(null);
  const [vidPlaying, setVidPlaying] = useState(false);
  const [vidTime, setVidTime] = useState(0);
  const [vidDuration, setVidDuration] = useState(0);

  const [publishStatus, setPublishStatus] = useState({});
  const [publishing, setPublishing] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);

  // Load existing video or prepare new
  useEffect(() => {
    if (id) {
      getVideos(user?.id || '').then(vids => {
        const found = vids.find(v => v.id === id);
        if (!found) { navigate('/videos'); return; }
        if (found.status === 'published') { navigate('/published'); return; }
        setVideo(found);
        setFullScript(found.fullScript || '');
        setVideoStyle(found.videoStyle || 'cinematic');
        setVoiceId(found.voiceId || VOICES[0].id);
        if (found.fullScript) setStep('style');
        else if (found.title) setStep('script');
        else setStep('niche');
      });
    }
    setLoading(false);
  }, [id, user?.id, navigate]);

  // ── PLAN LIMIT CHECK ────────────────────────────────────────────────────────
  const canCreateVideo = () => {
    if (plan.limits.videos === Infinity) return true;
    return (user?.billing?.videosUsedThisMonth || 0) < plan.limits.videos;
  };

  // ── NICHE STEP ──────────────────────────────────────────────────────────────
  const handleNicheSelect = async (cat) => {
    if (!canCreateVideo() && !id) {
      toast(`You've reached your ${plan.name} plan limit (${plan.videosPerMonth} videos/month). Upgrade to create more.`, 'warn');
      navigate('/subscription');
      return;
    }
    // Create a temporary shell or use existing
    const draft = id ? video : await createDraftVideo({
      userId: user.id, title: `New ${cat.label} Video`,
      niche: cat.id, hook: '', description: '',
    });
    setVideo({ ...draft, niche: cat.id });
    setStep('ideas');
    // Generate ideas
    setLoadingIdeas(true);
    setIdeasError(null);
    claudeScriptIdeas(cat.label, user?.services?.claudeKey)
      .then(data => { setIdeas(data); setLoadingIdeas(false); })
      .catch(err => { setIdeasError(err.message); setLoadingIdeas(false); });
  };

  // ── IDEAS STEP ──────────────────────────────────────────────────────────────
  const handleIdeaSelect = async (idea) => {
    setSelectedIdea(idea);
    // Update video with chosen idea
    const updatedVideo = {
      ...video,
      title: idea.title,
      hook: idea.hook,
      description: idea.description,
      tags: idea.tags,
      thumbnailText: idea.thumbnail_text,
      viewsPotential: idea.views_potential,
      updatedAt: new Date().toISOString(),
    };
    await saveVideo(updatedVideo);
    setVideo(updatedVideo);
    // Load full script
    setStep('script');
    setLoadingScript(true);
    setScriptError(null);
    try {
      const [script, thumbs] = await Promise.all([
        claudeGenerateScript(idea.title, idea.hook, idea.id, user?.services?.claudeKey),
        claudeThumbnailOptions(idea.title, idea.id, user?.services?.claudeKey),
      ]);
      setFullScript(script);
      setThumbOptions(thumbs);
      setSelectedThumb(thumbs[0] || idea.thumbnail_text);
      const withScript = { ...updatedVideo, fullScript: script, thumbnailText: thumbs[0] || idea.thumbnail_text, updatedAt: new Date().toISOString() };
      await saveVideo(withScript);
      setVideo(withScript);
    } catch (err) {
      setScriptError(err.message);
    }
    setLoadingScript(false);
  };

  // ── SCRIPT STEP ─────────────────────────────────────────────────────────────
  const handleScriptSave = async () => {
    const updated = { ...video, fullScript, thumbnailText: selectedThumb || video.thumbnailText, updatedAt: new Date().toISOString() };
    await saveVideo(updated);
    setVideo(updated);
    setStep('style');
    toast('Script saved.', 'success');
  };

  // ── STYLE STEP ──────────────────────────────────────────────────────────────
  const handleStyleSave = async () => {
    const updated = { ...video, videoStyle, voiceId, updatedAt: new Date().toISOString() };
    await saveVideo(updated);
    setVideo(updated);
    setStep('render');
  };

  // ── RENDER STEP ─────────────────────────────────────────────────────────────
  const handleRender = async () => {
    setRenderStatus('running');
    setRenderProgress(0);
    let audioBlob = null;
    let musicBlob = null;

    // Generate voice — tries ElevenLabs first, auto-falls back to HuggingFace TTS (free)
    if (fullScript) {
      try {
        const { blob } = await generateVoice(fullScript, voiceId, user?.services?.elKey || null);
        audioBlob = blob;
      } catch (e) { console.warn('Voice generation skipped:', e.message); /* render without voice */ }
    }

    // Generate AI background music based on niche (always runs, no API key needed)
    try {
      const cfg = { shorts: 45, youtube: 60, instagram: 45, reels: 45 };
      musicBlob = await generateBackgroundMusic(video?.niche || '', cfg[renderPlatform] || 45);
    } catch { /* skip music */ }

    try {
      const { blob, url } = await renderVideoOnCanvas({
        script: video,
        settings: { videoStyle },
        audioBlob,
        musicBlob,
        onProgress: setRenderProgress,
        platform: renderPlatform,
      });
      setRenderBlob(blob);
      setRenderUrl(url);
      setRenderStatus('done');
      const updated = { ...video, status: 'rendering', renderUrl: url, updatedAt: new Date().toISOString() };
      await saveVideo(updated);
      setVideo(updated);
      toast('Video rendered successfully!', 'success');
    } catch (err) {
      setRenderStatus('error');
      toast(`Render failed: ${err.message}`, 'error');
    }
  };

  const handleDownload = () => {
    if (!renderBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(renderBlob);
    a.download = `${video.title?.slice(0, 40).replace(/[^a-z0-9]/gi, '-') || 'video'}.webm`;
    a.click();
  };

  // ── PUBLISH STEP ────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    setPublishing(true);
    const results = {};

    // YouTube
    if (autoPublishYT && user?.services?.ytToken && renderBlob) {
      if (!plan.limits.autoPublish) {
        results.youtube = { status: 'error', msg: 'Auto-publish requires Starter plan or above.' };
      } else {
        try {
          const ytId = await ytUpload({
            token: user.services.ytToken,
            blob: renderBlob,
            title: video.title,
            description: `${video.description}\n\n${video.hook}`,
            tags: video.tags || [],
          });
          results.youtube = { status: 'ok', id: ytId };
        } catch (err) {
          results.youtube = { status: 'error', msg: err.message };
        }
      }
    }

    // Mark as published (locks editing)
    try {
      const published = await publishVideo(video.id);
      setVideo(published);
      // Increment usage counter (Supabase RPC or local)
      await incrementVideoUsage(user.id);
      await patchUser({ billing: { ...user.billing, videosUsedThisMonth: (user.billing?.videosUsedThisMonth || 0) + 1 } });
    } catch (err) {
      toast(err.message, 'error');
    }

    setPublishStatus(results);
    setPublishing(false);
    setStep('publish');
    toast('Video published! Editing is now locked.', 'success');
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <StepBar current={step} />

      {/* ── NICHE ─────────────────────────────────────────────────────────── */}
      {step === 'niche' && (
        <div className="fade-in">
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: T.display, fontSize: 36, letterSpacing: 3, color: T.text, marginBottom: 6 }}>CHOOSE YOUR NICHE</h2>
            <p style={{ color: T.textMid, fontFamily: T.mono, fontSize: 12 }}>
              Claude AI generates 6 viral video ideas tailored to your niche
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {CATEGORIES.map(cat => (
              <div key={cat.id} onClick={() => handleNicheSelect(cat)}
                style={{
                  background: T.bg2, border: `1px solid ${cat.color}30`, borderRadius: 14,
                  padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{cat.emoji}</div>
                <div style={{ color: cat.color, fontFamily: T.mono, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{cat.label}</div>
                <div style={{ color: T.textDim, fontSize: 11, lineHeight: 1.4 }}>{cat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── IDEAS ─────────────────────────────────────────────────────────── */}
      {step === 'ideas' && (
        <div className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setStep('niche')} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 14px', color: T.textMid, cursor: 'pointer', fontFamily: T.mono, fontSize: 11 }}>← Back</button>
            <h2 style={{ fontFamily: T.display, fontSize: 32, letterSpacing: 2, color: T.text, margin: 0 }}>SCRIPT IDEAS</h2>
          </div>
          {loadingIdeas && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spinner size={48} />
              <div style={{ color: T.orange, fontFamily: T.mono, fontSize: 11, letterSpacing: 3, marginTop: 16 }}>
                CLAUDE IS GENERATING IDEAS...
              </div>
            </div>
          )}
          {ideasError && (
            <Card>
              <StatusBox type="err" text={ideasError} />
              <Btn style={{ marginTop: 12 }} onClick={() => { setLoadingIdeas(true); setIdeasError(null); const cat = CATEGORIES.find(c => c.id === video?.niche); claudeScriptIdeas(cat?.label || 'Motivation', user?.services?.claudeKey).then(setIdeas).catch(e => setIdeasError(e.message)).finally(() => setLoadingIdeas(false)); }}>
                Retry
              </Btn>
            </Card>
          )}
          {!loadingIdeas && !ideasError && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ideas.map(idea => (
                <div key={idea.id} onClick={() => handleIdeaSelect(idea)}
                  style={{
                    background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12,
                    padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                  }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ color: T.text, fontFamily: T.mono, fontSize: 13, fontWeight: 700, margin: 0 }}>{idea.title}</h3>
                      <span style={{
                        background: (idea.views_potential === 'Very High' ? T.green : idea.views_potential === 'High' ? T.gold : T.textMid) + '20',
                        color: idea.views_potential === 'Very High' ? T.green : idea.views_potential === 'High' ? T.gold : T.textMid,
                        border: `1px solid ${(idea.views_potential === 'Very High' ? T.green : idea.views_potential === 'High' ? T.gold : T.textMid)}40`,
                        borderRadius: 6, padding: '2px 8px', fontFamily: T.mono, fontSize: 9, fontWeight: 700,
                      }}>📈 {idea.views_potential}</span>
                    </div>
                    <div style={{ color: T.textMid, fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
                      <span style={{ color: T.orange, fontFamily: T.mono, fontSize: 10 }}>HOOK: </span>{idea.hook}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {idea.tags?.map(t => (
                        <span key={t} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 5, padding: '2px 7px', color: T.textDim, fontFamily: T.mono, fontSize: 9 }}>#{t}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ color: T.orange, fontSize: 18, flexShrink: 0, paddingTop: 4 }}>→</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SCRIPT ────────────────────────────────────────────────────────── */}
      {step === 'script' && (
        <div className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setStep('ideas')} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 14px', color: T.textMid, cursor: 'pointer', fontFamily: T.mono, fontSize: 11 }}>← Back</button>
            <h2 style={{ fontFamily: T.display, fontSize: 32, letterSpacing: 2, color: T.text, margin: 0 }}>FULL SCRIPT</h2>
          </div>

          {loadingScript && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spinner size={48} />
              <div style={{ color: T.orange, fontFamily: T.mono, fontSize: 11, letterSpacing: 3, marginTop: 16 }}>CLAUDE IS WRITING YOUR SCRIPT...</div>
            </div>
          )}
          {scriptError && <StatusBox type="err" text={scriptError} />}

          {!loadingScript && !scriptError && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card>
                <SLabel icon="📋">VIDEO DETAILS</SLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: T.textMid, fontFamily: T.mono, fontSize: 10, letterSpacing: 1, display: 'block', marginBottom: 6 }}>TITLE</label>
                    <input
                      value={video?.title || ''}
                      onChange={e => setVideo(v => ({ ...v, title: e.target.value }))}
                      style={{ width: '100%', background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', color: T.text, fontFamily: T.mono, fontSize: 12, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: T.textMid, fontFamily: T.mono, fontSize: 10, letterSpacing: 1, display: 'block', marginBottom: 6 }}>THUMBNAIL TEXT</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {thumbOptions.slice(0, 3).map(t => (
                        <button key={t} onClick={() => setSelectedThumb(t)} style={{
                          flex: 1, background: selectedThumb === t ? T.orange + '25' : T.bg1,
                          border: `1px solid ${selectedThumb === t ? T.orange : T.border}`, borderRadius: 7,
                          padding: '7px 5px', color: selectedThumb === t ? T.orange : T.textMid,
                          fontFamily: T.mono, fontSize: 9, fontWeight: 700, cursor: 'pointer', textAlign: 'center',
                        }}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <SLabel icon="✍️" right={`${fullScript.length} chars`}>VOICEOVER SCRIPT</SLabel>
                <textarea
                  value={fullScript}
                  onChange={e => setFullScript(e.target.value)}
                  rows={18}
                  style={{
                    width: '100%', background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 9,
                    padding: '14px', color: T.text, fontFamily: T.mono, fontSize: 12,
                    resize: 'vertical', lineHeight: 1.7, outline: 'none',
                  }}
                />
              </Card>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Btn onClick={handleScriptSave} size="lg" disabled={!fullScript.trim()}>
                  SAVE & CONTINUE →
                </Btn>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STYLE ─────────────────────────────────────────────────────────── */}
      {step === 'style' && (
        <div className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setStep('script')} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 14px', color: T.textMid, cursor: 'pointer', fontFamily: T.mono, fontSize: 11 }}>← Back</button>
            <h2 style={{ fontFamily: T.display, fontSize: 32, letterSpacing: 2, color: T.text, margin: 0 }}>STYLE & SETTINGS</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Video Style */}
            <Card>
              <SLabel icon="🎨">VIDEO STYLE</SLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {VIDEO_STYLES.map(vs => (
                  <div key={vs.id} onClick={() => setVideoStyle(vs.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                      background: videoStyle === vs.id ? T.orange + '15' : T.bg3,
                      border: `1px solid ${videoStyle === vs.id ? T.orange + '60' : T.border}`,
                      borderRadius: 9, cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: videoStyle === vs.id ? T.orange : T.text, fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>{vs.label}</div>
                      <div style={{ color: T.textDim, fontSize: 11, marginTop: 2 }}>{vs.desc}</div>
                    </div>
                    {videoStyle === vs.id && <span style={{ color: T.orange }}>✓</span>}
                  </div>
                ))}
              </div>
            </Card>

            {/* Voice */}
            <Card>
              <SLabel icon="🎙" right={user?.services?.elKey ? '✓ ElevenLabs' : '⚠ No EL key'}>AI VOICE</SLabel>
              {!user?.services?.elKey && (
                <StatusBox type="warn" text="Connect ElevenLabs in Settings for real AI voice" />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: user?.services?.elKey ? 0 : 10 }}>
                {VOICES.map(v => (
                  <div key={v.id} onClick={() => setVoiceId(v.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                      background: voiceId === v.id ? T.blue + '15' : T.bg3,
                      border: `1px solid ${voiceId === v.id ? T.blue + '60' : T.border}`,
                      borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: voiceId === v.id ? T.blue : T.text, fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>{v.name}</div>
                      <div style={{ color: T.textDim, fontSize: 10 }}>{v.desc} · Best for: {v.best}</div>
                    </div>
                    {voiceId === v.id && <span style={{ color: T.blue, fontSize: 12 }}>✓</span>}
                  </div>
                ))}
              </div>
            </Card>

            {/* Publish platforms */}
            <Card style={{ gridColumn: '1 / -1' }}>
              <SLabel icon="📤">AUTO-PUBLISH PLATFORMS</SLabel>
              {!plan.limits.autoPublish && (
                <div style={{ marginBottom: 12 }}>
                  <StatusBox type="warn" text="Auto-publish requires Starter plan or above. You can still download and upload manually." />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{
                  padding: '14px', background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10, opacity: (!user?.services?.ytToken || !plan.limits.autoPublish) ? 0.6 : 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>▶️</span>
                      <div>
                        <div style={{ color: T.text, fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>YouTube</div>
                        <div style={{ color: T.textDim, fontSize: 10 }}>
                          {user?.services?.ytChannel?.name || (user?.services?.ytToken ? 'Connected' : 'Not connected — go to Settings')}
                        </div>
                      </div>
                    </div>
                    <Toggle value={autoPublishYT && !!user?.services?.ytToken && plan.limits.autoPublish} onChange={v => setAutoPublishYT(v && !!user?.services?.ytToken && plan.limits.autoPublish)} />
                  </div>
                </div>
                <div style={{
                  padding: '14px', background: T.bg3, border: `1px solid ${T.border}`,
                  borderRadius: 10, opacity: (!user?.services?.igAccount || !plan.limits.autoPublish) ? 0.6 : 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>📸</span>
                      <div>
                        <div style={{ color: T.text, fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>Instagram</div>
                        <div style={{ color: T.textDim, fontSize: 10 }}>
                          {user?.services?.igAccount ? `@${user.services.igAccount.username}` : 'Not connected — go to Settings'}
                        </div>
                      </div>
                    </div>
                    <Toggle value={autoPublishIG && !!user?.services?.igAccount && plan.limits.autoPublish} onChange={v => setAutoPublishIG(v && !!user?.services?.igAccount && plan.limits.autoPublish)} />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Btn onClick={handleStyleSave} size="lg">RENDER VIDEO →</Btn>
          </div>
        </div>
      )}

      {/* ── RENDER ────────────────────────────────────────────────────────── */}
      {step === 'render' && (
        <div className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setStep('style')} disabled={renderStatus === 'running'}
              style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 14px', color: T.textMid, cursor: renderStatus === 'running' ? 'not-allowed' : 'pointer', fontFamily: T.mono, fontSize: 11, opacity: renderStatus === 'running' ? 0.5 : 1 }}>← Back</button>
            <h2 style={{ fontFamily: T.display, fontSize: 32, letterSpacing: 2, color: T.text, margin: 0 }}>RENDER VIDEO</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card>
              <SLabel icon="📋">PREVIEW SUMMARY</SLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[
                  { label: 'Title', value: video?.title },
                  { label: 'Style', value: VIDEO_STYLES.find(s => s.id === videoStyle)?.label },
                  { label: 'Voice', value: VOICES.find(v => v.id === voiceId)?.name },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '10px 14px', background: T.bg3, borderRadius: 9, border: `1px solid ${T.border}` }}>
                    <div style={{ color: T.textDim, fontFamily: T.mono, fontSize: 9, letterSpacing: 1, marginBottom: 4 }}>{label.toUpperCase()}</div>
                    <div style={{ color: T.text, fontFamily: T.mono, fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SLabel icon="📐">OUTPUT FORMAT</SLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 4 }}>
                {[
                  { id: 'shorts',    label: 'YT Shorts',  icon: '📱', dims: '1080×1920', note: '9:16 · 45s' },
                  { id: 'youtube',   label: 'YouTube',    icon: '🖥',  dims: '1920×1080', note: '16:9 · 60s' },
                  { id: 'instagram', label: 'Instagram',  icon: '📷', dims: '1080×1080', note: '1:1 · 45s' },
                  { id: 'reels',     label: 'IG Reels',   icon: '🎞',  dims: '1080×1920', note: '9:16 · 45s' },
                ].map(p => (
                  <button key={p.id} onClick={() => renderStatus !== 'running' && setRenderPlatform(p.id)} style={{
                    background: renderPlatform === p.id ? T.orange + '18' : T.bg3,
                    border: `1px solid ${renderPlatform === p.id ? T.orange + '80' : T.border}`,
                    borderRadius: 10, padding: '10px 6px', cursor: renderStatus === 'running' ? 'not-allowed' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ fontSize: 20 }}>{p.icon}</span>
                    <span style={{ color: renderPlatform === p.id ? T.orange : T.text, fontFamily: T.mono, fontSize: 10, fontWeight: 700 }}>{p.label}</span>
                    <span style={{ color: T.textDim, fontFamily: T.mono, fontSize: 9 }}>{p.dims}</span>
                    <span style={{ color: T.textDim, fontFamily: T.mono, fontSize: 9 }}>{p.note}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <SLabel icon="🎬">RENDER ENGINE</SLabel>
              {renderStatus === 'idle' && (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
                  <p style={{ color: T.textMid, fontFamily: T.mono, fontSize: 12, marginBottom: 6 }}>
                    AI backgrounds · Ken Burns · 30 FPS · AI music matched to niche
                  </p>
                  <p style={{ color: T.textDim, fontFamily: T.mono, fontSize: 11, marginBottom: 20 }}>
                    Loading background images + generating music before render starts
                  </p>
                  <Btn size="lg" onClick={handleRender}>▶ START RENDER</Btn>
                </div>
              )}
              {renderStatus === 'running' && (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <Spinner size={48} />
                  <div style={{ color: T.orange, fontFamily: T.mono, fontSize: 11, letterSpacing: 3, marginTop: 14 }}>RENDERING... {renderProgress}%</div>
                  <div style={{ marginTop: 16, maxWidth: 400, margin: '16px auto 0' }}>
                    <PBar pct={renderProgress} h={8} />
                  </div>
                </div>
              )}
              {renderStatus === 'error' && (
                <div style={{ padding: '20px 0' }}>
                  <StatusBox type="err" text="Render failed. Make sure you're using Chrome or Edge." />
                  <div style={{ marginTop: 12 }}><Btn onClick={handleRender}>↺ Retry</Btn></div>
                </div>
              )}
              {renderStatus === 'done' && renderUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <StatusBox type="ok" text={`Video rendered! ${renderPlatform === 'youtube' ? '1920×1080 (YouTube)' : renderPlatform === 'instagram' ? '1080×1080 (Instagram)' : '1080×1920 (Shorts/Reels)'} · WebM`} />

                  {/* Custom video player with working seekbar */}
                  <div style={{ position: 'relative', background: '#000', borderRadius: 10, overflow: 'hidden' }}>
                    <video
                      ref={videoRef}
                      src={renderUrl}
                      style={{ width: '100%', maxHeight: 360, display: 'block' }}
                      onTimeUpdate={() => setVidTime(videoRef.current?.currentTime || 0)}
                      onDurationChange={() => setVidDuration(videoRef.current?.duration || 0)}
                      onLoadedMetadata={() => setVidDuration(videoRef.current?.duration || 0)}
                      onPlay={() => setVidPlaying(true)}
                      onPause={() => setVidPlaying(false)}
                      onEnded={() => setVidPlaying(false)}
                    />
                    {/* Custom controls */}
                    <div style={{ background: 'rgba(0,0,0,0.75)', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {/* Seekbar */}
                      <input
                        type="range" min={0} max={vidDuration || 100}
                        value={vidTime}
                        step={0.1}
                        onChange={e => {
                          const t = parseFloat(e.target.value);
                          if (videoRef.current) videoRef.current.currentTime = t;
                          setVidTime(t);
                        }}
                        style={{ width: '100%', accentColor: T.orange, cursor: 'pointer', height: 4 }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => vidPlaying ? videoRef.current?.pause() : videoRef.current?.play()}
                          style={{ background: T.orange, border: 'none', borderRadius: 6, padding: '5px 14px', color: '#fff', cursor: 'pointer', fontFamily: T.mono, fontSize: 13, fontWeight: 700 }}>
                          {vidPlaying ? '⏸' : '▶'}
                        </button>
                        <span style={{ color: T.textMid, fontFamily: T.mono, fontSize: 11 }}>
                          {Math.floor(vidTime / 60)}:{String(Math.floor(vidTime % 60)).padStart(2, '0')}
                          {' / '}
                          {isFinite(vidDuration) ? `${Math.floor(vidDuration / 60)}:${String(Math.floor(vidDuration % 60)).padStart(2, '0')}` : '--:--'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                    <Btn variant="secondary" onClick={handleDownload}>⬇ Download Video</Btn>
                    <Btn size="lg" onClick={() => setConfirmPublish(true)}>
                      🚀 PUBLISH & LOCK →
                    </Btn>
                  </div>
                  <StatusBox type="warn" text="⚠ Once published, this video cannot be edited." />
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ── PUBLISHED ─────────────────────────────────────────────────────── */}
      {step === 'publish' && (
        <div className="fade-in" style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: T.display, fontSize: 40, letterSpacing: 3, color: T.green }}>PUBLISHED!</h2>
          <p style={{ color: T.textMid, fontFamily: T.mono, fontSize: 12, marginTop: 8, marginBottom: 28 }}>
            Your video is live. Editing is permanently locked.
          </p>
          {Object.keys(publishStatus).length > 0 && (
            <div style={{ maxWidth: 400, margin: '0 auto 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(publishStatus).map(([platform, result]) => (
                <StatusBox key={platform} type={result.status === 'ok' ? 'ok' : 'err'}
                  text={`${platform}: ${result.status === 'ok' ? `Uploaded (ID: ${result.id})` : result.msg}`} />
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Btn variant="secondary" size="lg" onClick={() => navigate('/published')}>View Published</Btn>
            <Btn size="lg" onClick={() => navigate('/create')}>＋ Create Another</Btn>
          </div>
        </div>
      )}

      {/* Confirm publish modal */}
      <Confirm
        open={confirmPublish}
        onClose={() => setConfirmPublish(false)}
        onConfirm={handlePublish}
        title="PUBLISH VIDEO"
        message={`Once published, this video cannot be edited. ${autoPublishYT || autoPublishIG ? 'It will be uploaded to your connected platforms automatically.' : 'You can download it and upload manually.'}`}
        confirmLabel={publishing ? 'Publishing...' : '🚀 Publish & Lock'}
        variant="success"
      />
    </div>
  );
}
