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
    `Write a complete voiceover YouTube script for a FACELESS channel (no host, no presenter).\nTitle: "${title}"\nNiche: ${niche}\nHook: "${hook}"\n\nSections: [HOOK] [INTRO] [SECTION 1] [SECTION 2] [SECTION 3] [SECTION 4] [OUTRO + CTA]\nConversational, 700-900 words.\nSTRICT RULES:\n- NEVER say "my name is", "I'm your host", "welcome back", or introduce a person\n- No camera directions, no stage directions\n- Speak directly to the viewer as "you"\n- Start immediately with the hook line`,
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

// ── HuggingFace TTS (free fallback — no billing required) ────────────────────
// Get free key: https://huggingface.co/settings/tokens
async function hfTTS(text) {
  const hfKey = import.meta.env.VITE_HF_API_KEY;
  const truncated = text.length > 1000 ? text.slice(0, 1000) : text;
  const r = await fetch(
    'https://api-inference.huggingface.co/models/facebook/mms-tts-eng',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(hfKey ? { Authorization: `Bearer ${hfKey}` } : {}),
      },
      body: JSON.stringify({ inputs: truncated }),
    }
  );
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error || `HuggingFace TTS error ${r.status}`);
  }
  const blob = await r.blob();
  return { url: URL.createObjectURL(blob), blob };
}

export async function generateVoice(text, voiceId, apiKey) {
  // ── Try ElevenLabs first if key is provided ───────────────────────────────
  if (apiKey && apiKey.length > 10 && apiKey !== '...') {
    const truncated = text.length > 2500 ? text.slice(0, 2500) + '...' : text;
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: truncated,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
      }),
    });
    if (r.ok) {
      const blob = await r.blob();
      return { url: URL.createObjectURL(blob), blob };
    }
    const e = await r.json().catch(() => ({}));
    const isQuota = e?.detail?.status === 'quota_exceeded' || r.status === 429;
    if (!isQuota) {
      // Hard error (bad key, wrong voice ID, etc.) — throw so user sees it
      const msg = typeof e?.detail === 'string' ? e.detail : (e?.detail?.message || `ElevenLabs error ${r.status}`);
      throw new Error(msg);
    }
    // Quota exceeded → fall through to HuggingFace
    console.warn('ElevenLabs quota exceeded, falling back to HuggingFace TTS (free)');
  }

  // ── HuggingFace TTS fallback (free, no billing) ───────────────────────────
  return hfTTS(text);
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

// ── Background music generator (Web Audio API, no key needed) ────────────────
// Maps niche/category to mood, generates a looping ambient track procedurally.

const NICHE_MOOD = {
  // upbeat major
  cooking: { bpm: 96,  root: 261.63, minor: false, style: 'warm'       },
  beauty:  { bpm: 100, root: 293.66, minor: false, style: 'warm'       },
  fitness: { bpm: 128, root: 293.66, minor: false, style: 'energetic'  },
  travel:  { bpm: 90,  root: 261.63, minor: false, style: 'cinematic'  },
  lifestyle:{ bpm: 95, root: 246.94, minor: false, style: 'warm'       },
  // neutral / corporate
  finance: { bpm: 100, root: 220.00, minor: false, style: 'corporate'  },
  business:{ bpm: 100, root: 220.00, minor: false, style: 'corporate'  },
  // electronic / minor
  tech:    { bpm: 120, root: 220.00, minor: true,  style: 'electronic' },
  gaming:  { bpm: 140, root: 246.94, minor: true,  style: 'energetic'  },
  crypto:  { bpm: 115, root: 220.00, minor: true,  style: 'electronic' },
  // dark / dramatic
  mystery: { bpm: 70,  root: 196.00, minor: true,  style: 'dark'       },
  horror:  { bpm: 65,  root: 185.00, minor: true,  style: 'dark'       },
  crime:   { bpm: 75,  root: 196.00, minor: true,  style: 'dark'       },
  history: { bpm: 80,  root: 220.00, minor: true,  style: 'cinematic'  },
  science: { bpm: 90,  root: 220.00, minor: false, style: 'cinematic'  },
};

function getNicheMood(niche = '') {
  const n = niche.toLowerCase();
  for (const [key, mood] of Object.entries(NICHE_MOOD)) {
    if (n.includes(key)) return mood;
  }
  return { bpm: 90, root: 220.00, minor: false, style: 'cinematic' };
}

// Encode AudioBuffer → WAV Blob (PCM 16-bit)
function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = numSamples * numChannels * 2;
  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);
  const write = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
  write(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true);
  write(8, 'WAVE'); write(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true); view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); write(36, 'data');
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}

export async function generateBackgroundMusic(niche, duration = 45) {
  const mood = getNicheMood(niche);
  const SR = 44100;
  const ctx = new OfflineAudioContext(2, SR * duration, SR);
  const { bpm, root, minor, style } = mood;

  // Master gain (background music should be subtle, ~18% volume)
  const master = ctx.createGain();
  master.gain.value = 0.18;
  master.connect(ctx.destination);

  // Chord intervals: major or minor triads + 7th
  const intervals = minor
    ? [0, 3, 7, 10]  // minor 7
    : [0, 4, 7, 11]; // major 7

  // 4-chord progression (all relative to root)
  const chordRoots = minor
    ? [root, root * 1.189, root * 1.335, root * 1.498]  // i → III → iv → VII
    : [root, root * 1.122, root * 1.335, root * 1.498]; // I → II → IV → V

  const beatDur = 60 / bpm;
  const barDur = beatDur * 4;
  const chordDur = barDur * 2; // 2 bars per chord
  const totalBars = Math.ceil(duration / barDur);

  // ── Pad layer (soft chords) ────────────────────────────────────────────────
  for (let bar = 0; bar < totalBars; bar++) {
    const t = bar * barDur;
    const chordIdx = Math.floor(bar / 2) % chordRoots.length;
    const chordRoot = chordRoots[chordIdx];

    intervals.forEach((semitones, voiceIdx) => {
      const freq = chordRoot * Math.pow(2, semitones / 12) * (voiceIdx > 1 ? 2 : 1);

      // 2 oscillators slightly detuned for warmth
      [-4, 4].forEach((detune) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = style === 'electronic' ? 'sawtooth' : 'sine';
        osc.frequency.value = freq;
        osc.detune.value = detune;

        // Gentle low-pass
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = style === 'dark' ? 700 : 1800;
        filter.Q.value = 0.8;

        const attackT = 0.3, releaseT = 0.8;
        const noteEnd = Math.min(t + chordDur, duration);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + attackT);
        gain.gain.setValueAtTime(0.12, noteEnd - releaseT);
        gain.gain.linearRampToValueAtTime(0, noteEnd);

        osc.connect(filter); filter.connect(gain); gain.connect(master);
        osc.start(t); osc.stop(Math.min(noteEnd + 0.1, duration));
      });
    });
  }

  // ── Bass line ─────────────────────────────────────────────────────────────
  for (let bar = 0; bar < totalBars; bar++) {
    const t = bar * barDur;
    const chordIdx = Math.floor(bar / 2) % chordRoots.length;
    const bassFreq = chordRoots[chordIdx] / 2; // one octave down

    // Bass hits on beat 1 and beat 3
    [0, beatDur * 2].forEach((beatOffset) => {
      const noteStart = t + beatOffset;
      if (noteStart >= duration) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.value = bassFreq;
      filter.type = 'lowpass'; filter.frequency.value = 300;
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(0.35, noteStart + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + beatDur * 1.5);

      osc.connect(filter); filter.connect(gain); gain.connect(master);
      osc.start(noteStart); osc.stop(Math.min(noteStart + beatDur * 1.6, duration));
    });
  }

  // ── Hi-hat / pulse (energetic & electronic styles only) ──────────────────
  if (style === 'energetic' || style === 'electronic') {
    for (let bar = 0; bar < totalBars; bar++) {
      for (let beat = 0; beat < 8; beat++) {
        const noteStart = bar * barDur + beat * beatDur * 0.5;
        if (noteStart >= duration) break;
        const buf = ctx.createBuffer(1, SR * 0.05, SR);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const hpf = ctx.createBiquadFilter();
        hpf.type = 'highpass'; hpf.frequency.value = 8000;
        const hGain = ctx.createGain();
        hGain.gain.setValueAtTime(0.04, noteStart);
        hGain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.05);
        src.connect(hpf); hpf.connect(hGain); hGain.connect(master);
        src.start(noteStart); src.stop(noteStart + 0.06);
      }
    }
  }

  // ── Fade in / out ─────────────────────────────────────────────────────────
  master.gain.setValueAtTime(0, 0);
  master.gain.linearRampToValueAtTime(0.18, 2.0);
  master.gain.setValueAtTime(0.18, duration - 3);
  master.gain.linearRampToValueAtTime(0, duration);

  const rendered = await ctx.startRendering();
  return audioBufferToWav(rendered);
}

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

// Niche → Picsum seed IDs (curated ranges with people/activities)
const NICHE_SEEDS = {
  tech:      [367, 442, 2, 3],
  gaming:    [292, 325, 7, 450],
  finance:   [260, 453, 454, 455],
  business:  [453, 260, 366, 617],
  travel:    [11, 12, 428, 430],
  fitness:   [303, 304, 312, 490],
  health:    [463, 490, 312, 26],
  cooking:   [292, 493, 30, 312],
  beauty:    [659, 815, 42, 317],
  fashion:   [815, 660, 318, 44],
  nature:    [50, 51, 429, 430],
  science:   [60, 400, 367, 401],
  history:   [120, 121, 346, 347],
  mystery:   [200, 391, 247, 392],
  lifestyle: [659, 312, 317, 100],
};

function getNicheSeeds(niche = '') {
  const n = niche.toLowerCase();
  for (const [key, seeds] of Object.entries(NICHE_SEEDS)) {
    if (n.includes(key)) return seeds;
  }
  return [312, 367, 428, 453]; // default: mixed people/scenes
}

// Fetch background images from Picsum (free, CORS-enabled, no API key/token)
async function fetchAIImages(niche, title, W, H) {
  const seeds = getNicheSeeds(niche);
  const fetchW = W >= H ? 800 : Math.round(800 * W / H);
  const fetchH = W >= H ? Math.round(800 * H / W) : 800;
  const urls = seeds.map(seed =>
    `https://picsum.photos/seed/${seed}/${fetchW}/${fetchH}`
  );
  const images = await Promise.all(urls.map(loadImage));
  return images.filter(Boolean);
}

export async function renderVideoOnCanvas({ script, settings, audioBlob, musicBlob, onProgress, platform = 'shorts' }) {
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

  // ── Audio (voice + music mixed — silent during setup, starts with recorder) ─
  let audioStartFn = null;
  if (audioBlob || musicBlob) {
    try {
      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();

      const prepareSource = async (blob, gainValue) => {
        if (!blob) return null;
        const buf = await blob.arrayBuffer();
        const decoded = await audioCtx.decodeAudioData(buf);
        const source = audioCtx.createBufferSource();
        source.buffer = decoded;
        source.loop = (blob === musicBlob); // loop music to fill video duration
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = gainValue;
        source.connect(gainNode);
        gainNode.connect(dest); // → MediaStream only, NOT audioCtx.destination (no speaker output)
        return source;
      };

      const [voiceSrc, musicSrc] = await Promise.all([
        prepareSource(audioBlob, 1.0),
        prepareSource(musicBlob, 0.20),
      ]);

      dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));

      // Defer actual .start() until recorder begins so audio is in sync
      audioStartFn = () => {
        voiceSrc?.start(0);
        musicSrc?.start(0);
      };
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

  function drawWatermark(elapsed) {
    // Subtle floating semi-transparent watermark - no pill, no solid background
    const alpha = 0.18 + 0.06 * Math.sin(elapsed * 0.4); // gentle pulse
    const x = W * 0.5 + Math.sin(elapsed * 0.15) * W * 0.25; // drift side to side slowly
    const y = H * 0.07 + Math.cos(elapsed * 0.1) * H * 0.015;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${Math.round(18 * H / 1920)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8;
    ctx.fillText('AUTOTUBER', x, y);
    ctx.restore();
  }

  function drawTitle(elapsed, t) {
    const lines = wrapText(title, W > H ? 30 : 20);
    const yBase = H * (W > H ? 0.32 : 0.40);
    const baseFontSize = W > H ? 80 : 108;

    if (style === 'news') {
      // Breaking news: accent bar + bold solid text, no fade
      const barH = Math.round(8 * H / 1920);
      ctx.fillStyle = '#CC0000';
      ctx.fillRect(0, H * 0.27, W, barH);

      const labelW = Math.round(260 * W / 1080), labelH = Math.round(52 * H / 1920);
      const labelX = Math.round(30 * W / 1080), labelY = H * 0.28;
      ctx.fillStyle = '#CC0000';
      ctx.fillRect(labelX, labelY, labelW, labelH);
      ctx.font = `900 ${Math.round(22 * H / 1920)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.shadowBlur = 0;
      ctx.fillText('BREAKING NEWS', labelX + 12, labelY + labelH * 0.68);

      lines.forEach((line, i) => {
        const fs = line.length > 20 ? baseFontSize * 0.78 : baseFontSize;
        ctx.font = `900 ${Math.round(fs * H / 1920)}px 'Arial Black', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
        ctx.globalAlpha = Math.min(1, elapsed * 3);
        ctx.fillText(line.toUpperCase(), W / 2, yBase + i * Math.round(118 * H / 1920) + Math.round(60 * H / 1920));
        ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      });
      return;
    }

    if (style === 'typewriter') {
      // Typewriter: reveal characters over time
      const fullText = lines.join(' ');
      const charsToShow = Math.floor(elapsed * 12); // ~12 chars/sec
      const displayText = fullText.slice(0, charsToShow);
      const displayLines = wrapText(displayText || ' ', W > H ? 30 : 20);

      const fs = Math.round((baseFontSize * 0.75) * H / 1920);
      ctx.font = `700 ${fs}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
      displayLines.forEach((line, i) => {
        ctx.fillText(line, W / 2, yBase + i * Math.round(fs * 1.5));
      });
      // Blinking cursor
      if (Math.floor(elapsed * 2) % 2 === 0) {
        const lastLine = displayLines[displayLines.length - 1] || '';
        const lineW = ctx.measureText(lastLine).width;
        ctx.fillRect(W / 2 + lineW / 2 + 4, yBase + (displayLines.length - 1) * Math.round(fs * 1.5) - fs + 4, 3, fs);
      }
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      return;
    }

    if (style === 'slideup') {
      // Each line slides up from off-screen with stagger
      lines.forEach((line, i) => {
        const delay = i * 0.55;
        const progress = Math.max(0, Math.min(1, (elapsed - delay) * 2.2));
        // ease-out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const startY = H * 0.72;
        const endY = yBase + i * Math.round(120 * H / 1920);
        const currentY = startY + (endY - startY) * ease;

        const fs = line.length > 18 ? baseFontSize * 0.82 : baseFontSize;
        ctx.font = `900 ${Math.round(fs * H / 1920)}px 'Bebas Neue', 'Arial Black', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = ease;
        ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
        ctx.fillText(line.toUpperCase(), W / 2, currentY);
        ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      });
      return;
    }

    // Default: cinematic fade-in per line (original style, works great with photos)
    lines.forEach((line, i) => {
      const fs = line.length > 18 ? baseFontSize * 0.82 : baseFontSize;
      ctx.font = `900 ${Math.round(fs * H / 1920)}px 'Bebas Neue', 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 5;
      const alpha = Math.min(1, (elapsed - i * 0.45) * 2.2);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line.toUpperCase(), W / 2, yBase + i * Math.round(128 * H / 1920));
      ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    });
  }

  function drawHook(elapsed) {
    const hook = script?.hook || '';
    if (!hook || elapsed < 1.8) return;
    const hookAlpha = Math.min(1, (elapsed - 1.8) * 1.8);

    if (style === 'news') {
      // Ticker-style scrolling text at bottom
      const tickerH = Math.round(52 * H / 1920);
      const tickerY = H - tickerH - Math.round(70 * H / 1920);
      ctx.fillStyle = '#CC0000';
      ctx.fillRect(0, tickerY, W, tickerH);
      const scrollX = W - ((elapsed - 1.8) * W * 0.5) % (W * 2);
      ctx.font = `700 ${Math.round(24 * H / 1920)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
      ctx.save(); ctx.beginPath(); ctx.rect(0, tickerY, W, tickerH); ctx.clip();
      ctx.fillText('▶  ' + hook.toUpperCase() + '   ▶   ' + hook.toUpperCase(), scrollX, tickerY + tickerH * 0.68);
      ctx.restore();
      return;
    }

    ctx.globalAlpha = hookAlpha;
    const isSlideup = style === 'slideup';
    const hookY = isSlideup ? H * 0.70 : H * (W > H ? 0.52 : 0.64);
    ctx.font = `500 ${Math.round(34 * H / 1920)}px -apple-system, 'Segoe UI', sans-serif`;
    ctx.fillStyle = style === 'typewriter' ? accentColor : '#E8E8FF';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 16;
    const hookLines = wrapText(hook, W > H ? 50 : 36);
    hookLines.forEach((hl, i) => {
      ctx.fillText(hl, W / 2, hookY + i * Math.round(46 * H / 1920));
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
    audioStartFn?.(); // start audio exactly when recorder starts

    const totalFrames = FPS * DURATION;
    const frameInterval = 1000 / FPS; // ~33ms per frame
    let frame = 0;
    let startTime = performance.now();

    // Use setTimeout instead of requestAnimationFrame:
    // rAF gets throttled by the browser when the tab is busy/hidden,
    // causing the recorded video to appear shortened (1-sec bug).
    function drawFrame() {
      if (frame >= totalFrames) { recorder.stop(); return; }
      const t = frame / totalFrames;
      const elapsed = frame / FPS;

      drawBackground(t);
      drawTitle(elapsed, t);
      drawHook(elapsed);
      drawCTA(t);
      drawWatermark(elapsed);

      frame++;
      onProgress?.(12 + Math.round((frame / totalFrames) * 88));

      // Schedule next frame at the correct wall-clock time to maintain real FPS
      const nextFrameTime = startTime + frame * frameInterval;
      const delay = Math.max(0, nextFrameTime - performance.now());
      setTimeout(drawFrame, delay);
    }
    setTimeout(drawFrame, 0);
  });
}
