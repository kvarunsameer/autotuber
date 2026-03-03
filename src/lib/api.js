// ── AI provider: Groq (free) → Gemini → Claude (fallback) ───────────────────
// Priority: VITE_GROQ_API_KEY → VITE_GEMINI_API_KEY → VITE_CLAUDE_API_KEY

const GEMINI_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

async function callAI(prompt, maxTokens = 1400, userKey = null) {
  const groqKey = import.meta.env.VITE_GROQ_API_KEY?.startsWith('gsk_')
    ? import.meta.env.VITE_GROQ_API_KEY
    : (userKey?.startsWith('gsk_') ? userKey : null);

  const geminiKey = !groqKey && (import.meta.env.VITE_GEMINI_API_KEY?.startsWith('AIza')
    ? import.meta.env.VITE_GEMINI_API_KEY
    : (userKey?.startsWith('AIza') ? userKey : null));

  const claudeKey = !groqKey && !geminiKey
    ? (import.meta.env.VITE_CLAUDE_API_KEY?.startsWith('sk-ant') ? import.meta.env.VITE_CLAUDE_API_KEY
      : userKey?.startsWith('sk-ant') ? userKey : null)
    : null;

  // ── Groq (free, no billing required) ─────────────────────────────────────────
  if (groqKey) {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.8,
      }),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e?.error?.message || `Groq error ${r.status}`);
    }
    const d = await r.json();
    return d.choices?.[0]?.message?.content || '';
  }

  // ── Gemini ────────────────────────────────────────────────────────────────────
  if (geminiKey) {
    const r = await fetch(GEMINI_URL(geminiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.8 },
      }),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e?.error?.message || `Gemini error ${r.status}`);
    }
    const d = await r.json();
    return d.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  }

  // ── Claude fallback ───────────────────────────────────────────────────────────
  if (claudeKey) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e?.error?.message || `Claude error ${r.status}`);
    }
    const d = await r.json();
    return d.content?.map(b => b.text || '').join('') || '';
  }

  throw new Error('No AI key configured. Add VITE_GROQ_API_KEY (free at console.groq.com) to your .env');
}

export async function claudeScriptIdeas(niche, apiKey) {
  const raw = await callAI(
    `Expert YouTube strategist for faceless voiceover channels.\n\nGenerate 6 viral video ideas for: "${niche}"\n\nJSON array only, no markdown:\n[{"id":1,"title":"Title max 70 chars","hook":"5-second opening hook","description":"2 sentences","duration":"X min","views_potential":"High","tags":["tag1","tag2","tag3"],"thumbnail_text":"3-5 CAPS WORDS"}]\n\nviews_potential: "Medium"|"High"|"Very High"`,
    1400, apiKey,
  );
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
}

export async function claudeGenerateScript(title, hook, niche, apiKey) {
  return callAI(
    `Write a complete voiceover YouTube script.\nTitle: "${title}"\nNiche: ${niche}\nHook: "${hook}"\n\nSections: [HOOK] [INTRO] [SECTION 1] [SECTION 2] [SECTION 3] [SECTION 4] [OUTRO + CTA]\nConversational, 700-900 words, no camera directions.`,
    1400, apiKey,
  );
}

export async function claudeThumbnailOptions(title, niche, apiKey) {
  try {
    const raw = await callAI(
      `3 thumbnail text options for "${niche}" video: "${title}"\nEach: 3-5 CAPITALIZED words that create curiosity.\nJSON array only: ["OPT 1","OPT 2","OPT 3"]`,
      120, apiKey,
    );
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return [`${title.slice(0, 30).toUpperCase()}`, 'WATCH THIS NOW', 'SHOCKING TRUTH'];
  }
}

// ── ElevenLabs ────────────────────────────────────────────────────────────────

export async function testElevenLabsKey(apiKey) {
  const r = await fetch('https://api.elevenlabs.io/v1/user', {
    headers: { 'xi-api-key': apiKey },
  });
  if (!r.ok) throw new Error(`Invalid API key (${r.status})`);
  return await r.json();
}

export async function generateVoice(text, voiceId, apiKey) {
  if (!apiKey || apiKey === '...' || apiKey.length < 10) {
    throw new Error('No ElevenLabs API key. Add your key in Settings → Services.');
  }
  const truncated = text.length > 2500 ? text.slice(0, 2500) + '...' : text;
  // Build headers without sending undefined values
  const headers = {
    'Content-Type': 'application/json',
    'xi-api-key': apiKey,
    'Accept': 'audio/mpeg',
  };
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      text: truncated,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
    }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    const msg = typeof e?.detail === 'string' ? e.detail : (e?.detail?.message || JSON.stringify(e?.detail) || `ElevenLabs error ${r.status}`);
    throw new Error(msg);
  }
  const blob = await r.blob();
  return { url: URL.createObjectURL(blob), blob };
}

// ── YouTube OAuth ─────────────────────────────────────────────────────────────

export function buildYTAuthUrl(clientId) {
  const base = window.location.href.split('?')[0].split('#')[0];
  return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: base,
    response_type: 'token',
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube',
    state: 'yt_auth',
  })}`;
}

export function parseOAuthHash() {
  const p = new URLSearchParams(window.location.hash.substring(1));
  const token = p.get('access_token');
  if (!token) return null;
  return { state: p.get('state'), token };
}

export async function fetchYTChannel(token) {
  const r = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`YouTube API error ${r.status}`);
  const d = await r.json();
  const c = d.items?.[0]?.snippet;
  return c ? { name: c.title, thumbnail: c.thumbnails?.default?.url } : null;
}

export async function ytUpload({ token, blob, title, description, tags }) {
  const meta = {
    snippet: { title, description, tags, categoryId: '22' },
    status: { privacyStatus: 'public' },
  };
  const init = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': blob.size,
      },
      body: JSON.stringify(meta),
    }
  );
  if (!init.ok) throw new Error(`YouTube upload init failed (${init.status})`);
  const url = init.headers.get('Location');
  if (!url) throw new Error('No upload URL returned');
  const up = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'video/mp4' }, body: blob });
  if (!up.ok) throw new Error(`YouTube upload failed (${up.status})`);
  return (await up.json()).id;
}

// ── Instagram ─────────────────────────────────────────────────────────────────

export async function fetchIGAccount(token) {
  const r = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account{id,name,username,profile_picture_url}&access_token=${token}`
  );
  if (!r.ok) throw new Error(`Facebook API error ${r.status}`);
  const d = await r.json();
  for (const page of (d.data || [])) {
    if (page.instagram_business_account) {
      const ig = page.instagram_business_account;
      return { id: ig.id, name: ig.name, username: ig.username, avatar: ig.profile_picture_url };
    }
  }
  throw new Error('No Instagram Business account found. Connect Instagram to a Facebook Page first.');
}

// ── Canvas renderer (AI backgrounds via Pollinations.ai + Ken Burns effect) ──

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) { lines.push(cur.trim()); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur.trim());
  return lines.slice(0, 3);
}

// Platform dimension presets
const PLATFORM_CONFIG = {
  shorts:    { W: 1080, H: 1920, label: 'YouTube Shorts', duration: 45 },
  youtube:   { W: 1920, H: 1080, label: 'YouTube',        duration: 60 },
  instagram: { W: 1080, H: 1080, label: 'Instagram',      duration: 45 },
  reels:     { W: 1080, H: 1920, label: 'Instagram Reels', duration: 45 },
};

// Load a single image with CORS, returns null on failure
function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
    setTimeout(() => resolve(null), 15_000); // 15s timeout
  });
}

// Fetch AI-generated background images from Pollinations.ai (free, no key)
async function fetchAIImages(niche, title, W, H) {
  const prompts = [
    `cinematic ${niche} scene, dramatic lighting, 4K, professional photography, no text, no watermark`,
    `${niche} aerial landscape, stunning scenery, golden hour, cinematic, highly detailed`,
    `${title} concept art, dramatic, visually striking, no text, photorealistic`,
    `${niche} close-up detail, macro photography, beautiful, artistic, no text`,
  ];
  const urls = prompts.map((p, i) =>
    `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=${W}&height=${H}&nologo=true&model=flux&seed=${i + 42}`
  );
  // Load all in parallel, keep whichever succeed
  const images = await Promise.all(urls.map(loadImage));
  return images.filter(Boolean);
}

export async function renderVideoOnCanvas({ script, settings, audioBlob, onProgress, platform = 'shorts' }) {
  const cfg = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.shorts;
  const { W, H } = cfg;
  const FPS = 30;
  const DURATION = cfg.duration; // seconds

  // ── Setup canvas ────────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const chunks = [];
  const stream = canvas.captureStream(FPS);

  // ── Audio ──────────────────────────────────────────────────────────────────
  if (audioBlob) {
    try {
      const audioCtx = new AudioContext();
      const buf = await audioBlob.arrayBuffer();
      const decoded = await audioCtx.decodeAudioData(buf);
      const source = audioCtx.createBufferSource();
      source.buffer = decoded;
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      source.connect(audioCtx.destination);
      dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
      source.start();
    } catch { /* no audio */ }
  }

  // ── Fetch AI background images ─────────────────────────────────────────────
  onProgress?.(2);
  const niche = script?.niche || 'technology';
  const title = script?.title || 'Video';
  const bgImages = await fetchAIImages(niche, title, W, H);
  onProgress?.(12);

  // ── Recording ──────────────────────────────────────────────────────────────
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
  recorder.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data); };

  const style = settings?.videoStyle || 'gradient';
  const accentColor = '#FF6B35';

  // Ken Burns state per image: each image gets random start/end pan/zoom
  const kbStates = bgImages.map(() => ({
    sx: (Math.random() - 0.5) * 0.06,
    sy: (Math.random() - 0.5) * 0.06,
    startScale: 1.0 + Math.random() * 0.08,
    endScale:   1.08 + Math.random() * 0.08,
  }));

  const IMG_INTERVAL = bgImages.length > 0 ? (DURATION / bgImages.length) : DURATION;

  function drawBackground(t) {
    if (bgImages.length === 0) {
      // Fallback gradient if no images loaded
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, `hsl(${220 + t * 40},70%,8%)`);
      g.addColorStop(1, `hsl(${260 + t * 40},80%,5%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      return;
    }

    const imgIndex = Math.min(Math.floor(t * DURATION / IMG_INTERVAL), bgImages.length - 1);
    const imgT = ((t * DURATION) % IMG_INTERVAL) / IMG_INTERVAL; // 0-1 within current image
    const img = bgImages[imgIndex];
    const kb = kbStates[imgIndex];

    // Ken Burns: lerp scale and pan
    const scale = kb.startScale + (kb.endScale - kb.startScale) * imgT;
    const translateX = kb.sx * W * imgT;
    const translateY = kb.sy * H * imgT;

    // Draw image with Ken Burns transform
    ctx.save();
    ctx.translate(W / 2 + translateX, H / 2 + translateY);
    ctx.scale(scale, scale);

    // Cover-fit the image
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const fitScale = Math.max(W / iw, H / ih);
    ctx.drawImage(img, -iw * fitScale / 2, -ih * fitScale / 2, iw * fitScale, ih * fitScale);
    ctx.restore();

    // Dark overlay so text is readable
    const overlayAlpha = style === 'minimal' ? 0.55 : 0.45;
    ctx.fillStyle = `rgba(0,0,0,${overlayAlpha})`;
    ctx.fillRect(0, 0, W, H);

    // Vignette
    const vig = ctx.createRadialGradient(W/2, H/2, H*0.18, W/2, H/2, H*0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // Cross-fade to next image near end of interval
    if (imgT > 0.85 && imgIndex < bgImages.length - 1) {
      const fadeAlpha = (imgT - 0.85) / 0.15;
      const nextImg = bgImages[imgIndex + 1];
      ctx.globalAlpha = fadeAlpha;
      ctx.fillStyle = `rgba(0,0,0,${overlayAlpha})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  function drawNeonBorder() {
    if (style !== 'neon') return;
    const grd = ctx.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, '#FF6B35'); grd.addColorStop(0.5, '#8B5CF6'); grd.addColorStop(1, '#06B6D4');
    ctx.strokeStyle = grd; ctx.lineWidth = 8;
    ctx.strokeRect(24, 24, W - 48, H - 48);
  }

  function drawBranding(elapsed) {
    // Pill badge
    ctx.fillStyle = accentColor + 'CC';
    ctx.beginPath();
    const pillW = 200, pillH = 44, pillX = W / 2 - pillW / 2, pillY = H * 0.10;
    ctx.roundRect(pillX, pillY, pillW, pillH, 22);
    ctx.fill();
    ctx.font = `bold ${Math.round(H * 0.013)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText('AUTOTUBER', W / 2, pillY + pillH * 0.65);
  }

  function drawTitle(elapsed, t) {
    const lines = wrapText(title, W > H ? 30 : 22); // wider wrap for landscape
    const yBase = H * (W > H ? 0.32 : 0.38);
    lines.forEach((line, i) => {
      const maxFontSize = W > H ? 90 : 110;
      const fontSize = line.length > 18 ? maxFontSize * 0.82 : maxFontSize;
      ctx.font = `900 ${Math.round(fontSize * (H / 1920))}px 'Bebas Neue', 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';

      // Text shadow for depth
      ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;

      const alpha = Math.min(1, elapsed * 2 - i * 0.4);
      ctx.globalAlpha = Math.max(0, alpha);

      if (style === 'neon') {
        ctx.fillStyle = '#00E5A0'; ctx.shadowColor = '#00E5A0'; ctx.shadowBlur = 28;
      } else {
        ctx.fillStyle = '#fff';
      }
      ctx.fillText(line.toUpperCase(), W / 2, yBase + i * Math.round(130 * H / 1920));
      ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    });
  }

  function drawHook(elapsed) {
    const hook = script?.hook || '';
    if (!hook || elapsed < 1.5) return;
    const hookAlpha = Math.min(1, (elapsed - 1.5) * 1.5);
    ctx.globalAlpha = hookAlpha;
    ctx.font = `500 ${Math.round(36 * H / 1920)}px -apple-system, 'Segoe UI', sans-serif`;
    ctx.fillStyle = '#E0E0FF'; ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 14;
    const hookLines = wrapText(hook, W > H ? 50 : 38);
    hookLines.forEach((hl, i) => {
      ctx.fillText(hl, W / 2, H * (W > H ? 0.52 : 0.62) + i * Math.round(48 * H / 1920));
    });
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }

  function drawCTA(t) {
    const barH = Math.round(130 * H / 1920);
    const barG = ctx.createLinearGradient(0, H - barH, 0, H);
    barG.addColorStop(0, 'rgba(0,0,0,0)'); barG.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = barG; ctx.fillRect(0, H - barH, W, barH);

    ctx.font = `700 ${Math.round(30 * H / 1920)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = accentColor; ctx.textAlign = 'center';
    ctx.shadowColor = accentColor + '80'; ctx.shadowBlur = 12;
    ctx.fillText('LIKE · SUBSCRIBE · SHARE', W / 2, H - Math.round(44 * H / 1920));
    ctx.shadowBlur = 0;

    // Progress bar
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(0, H - 6, W, 6);
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, H - 6, W * t, 6);
  }

  return new Promise((resolve, reject) => {
    recorder.onerror = reject;
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve({ blob, url: URL.createObjectURL(blob) });
    };

    recorder.start(200);

    const totalFrames = FPS * DURATION;
    let frame = 0;

    function drawFrame() {
      if (frame >= totalFrames) { recorder.stop(); return; }
      const t = frame / totalFrames;
      const elapsed = frame / FPS;

      drawBackground(t);
      drawNeonBorder();
      drawBranding(elapsed);
      drawTitle(elapsed, t);
      drawHook(elapsed);
      drawCTA(t);

      frame++;
      onProgress?.(12 + Math.round((frame / totalFrames) * 88));
      requestAnimationFrame(drawFrame);
    }
    requestAnimationFrame(drawFrame);
  });
}
