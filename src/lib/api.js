// ── Claude AI ─────────────────────────────────────────────────────────────────

export async function claudeScriptIdeas(niche, apiKey) {
  const headers = {
    'Content-Type': 'application/json',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  if (apiKey) headers['x-api-key'] = apiKey;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 1400,
      messages: [{
        role: 'user',
        content: `Expert YouTube strategist for faceless voiceover channels.\n\nGenerate 6 viral video ideas for: "${niche}"\n\nJSON array only, no markdown:\n[{"id":1,"title":"Title max 70 chars","hook":"5-second opening hook","description":"2 sentences","duration":"X min","views_potential":"High","tags":["tag1","tag2","tag3"],"thumbnail_text":"3-5 CAPS WORDS"}]\n\nviews_potential: "Medium"|"High"|"Very High"`,
      }],
    }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || `Claude error ${r.status}`);
  }
  const d = await r.json();
  const raw = (d.content?.map(b => b.text || '').join('') || '')
    .replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
}

export async function claudeGenerateScript(title, hook, niche, apiKey) {
  const headers = {
    'Content-Type': 'application/json',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  if (apiKey) headers['x-api-key'] = apiKey;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 1400,
      messages: [{
        role: 'user',
        content: `Write a complete voiceover YouTube script.\nTitle: "${title}"\nNiche: ${niche}\nHook: "${hook}"\n\nSections: [HOOK] [INTRO] [SECTION 1] [SECTION 2] [SECTION 3] [SECTION 4] [OUTRO + CTA]\nConversational, 700-900 words, no camera directions.`,
      }],
    }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || `Claude error ${r.status}`);
  }
  const d = await r.json();
  return d.content?.map(b => b.text || '').join('') || '';
}

export async function claudeThumbnailOptions(title, niche, apiKey) {
  const headers = {
    'Content-Type': 'application/json',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  if (apiKey) headers['x-api-key'] = apiKey;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 120,
      messages: [{
        role: 'user',
        content: `3 thumbnail text options for "${niche}" video: "${title}"\nEach: 3-5 CAPITALIZED words that create curiosity.\nJSON array only: ["OPT 1","OPT 2","OPT 3"]`,
      }],
    }),
  });
  if (!r.ok) return [`${title.slice(0, 30).toUpperCase()}`, 'WATCH THIS NOW', 'SHOCKING TRUTH'];
  const d = await r.json();
  try {
    return JSON.parse(d.content?.map(b => b.text || '').join('').replace(/```json|```/g, '').trim());
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
  const truncated = text.length > 600 ? text.slice(0, 600) + '...' : text;
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({
      text: truncated,
      model_id: 'eleven_monolingual_v1',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.detail?.message || `ElevenLabs error ${r.status}`);
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

// ── Canvas renderer ───────────────────────────────────────────────────────────

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

export async function renderVideoOnCanvas({ script, settings, audioBlob, onProgress }) {
  const W = 1080, H = 1920, FPS = 30, DURATION = 15;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const chunks = [];
  const stream = canvas.captureStream(FPS);

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

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
  recorder.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data); };

  return new Promise((resolve, reject) => {
    recorder.onerror = reject;
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve({ blob, url: URL.createObjectURL(blob) });
    };

    recorder.start(200);

    const totalFrames = FPS * DURATION;
    let frame = 0;

    const lines = wrapText(script?.title || 'Your Video Title', 22);
    const hook = script?.hook || '';

    function drawFrame() {
      if (frame >= totalFrames) { recorder.stop(); return; }
      const t = frame / totalFrames;
      const elapsed = frame / FPS;

      // Background
      const style = settings?.videoStyle || 'gradient';
      if (style === 'gradient') {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, `hsl(${220 + t * 40},70%,8%)`);
        g.addColorStop(1, `hsl(${260 + t * 40},80%,5%)`);
        ctx.fillStyle = g;
      } else if (style === 'neon') {
        ctx.fillStyle = '#000';
      } else if (style === 'particles') {
        ctx.fillStyle = '#03030a';
      } else {
        ctx.fillStyle = '#000';
      }
      ctx.fillRect(0, 0, W, H);

      // Particles / circles for non-minimal styles
      if (style === 'particles' || style === 'gradient') {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + t * Math.PI;
          const r = 200 + i * 60;
          const x = W / 2 + Math.cos(angle) * r;
          const y = H / 2 + Math.sin(angle) * r;
          ctx.beginPath();
          ctx.arc(x, y, 3 + i * 2, 0, Math.PI * 2);
          ctx.fillStyle = style === 'particles' ? `hsla(${180 + i * 30},80%,60%,0.3)` : `rgba(255,107,53,0.2)`;
          ctx.fill();
        }
      }

      // Neon border
      if (style === 'neon') {
        const grd = ctx.createLinearGradient(0, 0, W, H);
        grd.addColorStop(0, '#FF6B35');
        grd.addColorStop(0.5, '#8B5CF6');
        grd.addColorStop(1, '#06B6D4');
        ctx.strokeStyle = grd;
        ctx.lineWidth = 8;
        ctx.strokeRect(30, 30, W - 60, H - 60);
      }

      // Branding pill
      ctx.fillStyle = 'rgba(255,107,53,0.85)';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 90, 180, 180, 44, 22);
      ctx.fill();
      ctx.font = `bold 20px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('AUTOTUBER', W / 2, 208);

      // Main title lines
      const yBase = H * 0.38;
      lines.forEach((line, i) => {
        const fontSize = line.length > 18 ? 90 : 110;
        ctx.font = `900 ${fontSize}px 'Bebas Neue', 'Arial Black', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = style === 'neon' ? '#00E5A0' : '#fff';
        if (style === 'neon') {
          ctx.shadowColor = '#00E5A0';
          ctx.shadowBlur = 20;
        }
        const alpha = Math.min(1, elapsed * 2 - i * 0.4);
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillText(line.toUpperCase(), W / 2, yBase + i * 120);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });

      // Hook text
      if (hook && elapsed > 1.5) {
        const hookAlpha = Math.min(1, (elapsed - 1.5) * 1.5);
        ctx.globalAlpha = hookAlpha;
        ctx.font = `500 36px -apple-system, sans-serif`;
        ctx.fillStyle = '#E0E0FF';
        ctx.textAlign = 'center';
        const hookLines = wrapText(hook, 38);
        hookLines.forEach((hl, i) => {
          ctx.fillText(hl, W / 2, H * 0.62 + i * 48);
        });
        ctx.globalAlpha = 1;
      }

      // Bottom CTA bar
      const barH = 120;
      const barG = ctx.createLinearGradient(0, H - barH, 0, H);
      barG.addColorStop(0, 'rgba(5,5,15,0)');
      barG.addColorStop(1, 'rgba(5,5,15,0.95)');
      ctx.fillStyle = barG;
      ctx.fillRect(0, H - barH, W, barH);
      ctx.font = `700 32px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#FF6B35';
      ctx.textAlign = 'center';
      ctx.fillText('SUBSCRIBE FOR MORE', W / 2, H - 44);

      // Progress bar
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(0, H - 6, W, 6);
      ctx.fillStyle = '#FF6B35';
      ctx.fillRect(0, H - 6, W * t, 6);

      frame++;
      onProgress?.(Math.round((frame / totalFrames) * 100));
      requestAnimationFrame(drawFrame);
    }
    requestAnimationFrame(drawFrame);
  });
}
