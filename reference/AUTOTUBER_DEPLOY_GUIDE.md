# 🎬 AUTOTUBER v6.0 — Complete Deployment Guide

## What Was Built
A fully automated faceless YouTube channel engine with:
- **Claude AI** — Generates viral script ideas + full voiceover scripts + thumbnail text
- **ElevenLabs** — Converts scripts to real AI voice audio
- **Canvas API (browser-native)** — Renders animated video with text, effects, and audio
- **YouTube Data API v3** — Uploads videos directly to your channel
- **Instagram Graph API** — Publishes Reels to your Instagram

---

## 🚀 Option 1: Use It Right Now (Easiest)

The `.jsx` file opens directly in Claude.ai as an interactive app.

1. Upload `autotuber-v6.jsx` to Claude.ai
2. Ask Claude: *"Run this as an artifact"*
3. It works instantly in your browser — no install needed

---

## 🌐 Option 2: Deploy to Vercel (Free, 5 min)

### Prerequisites
- Node.js 18+ installed
- Free Vercel account at vercel.com

### Steps

```bash
# 1. Create a new Vite + React project
npm create vite@latest autotuber -- --template react
cd autotuber

# 2. Replace src/App.jsx with autotuber-v6.jsx contents

# 3. Install dependencies (none extra needed — all built-in)

# 4. Test locally
npm run dev

# 5. Deploy to Vercel
npm install -g vercel
vercel

# Done! You'll get a URL like: https://autotuber-xxx.vercel.app
```

### After deploying, add your Vercel URL to:
- Google Cloud Console → OAuth Authorized Redirect URIs
- Facebook Developer Dashboard → Valid OAuth Redirect URIs

---

## 🖥️ Option 3: Deploy to Netlify (Free)

```bash
# Build the project
npm run build

# Drag-and-drop the "dist" folder to netlify.com/drop
# Or use Netlify CLI:
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## 🔑 Service Setup (One-Time)

### Claude AI (Always Works — No Setup Needed)
- Already integrated via the Anthropic API
- Claude handles: script ideas, full scripts, thumbnail text

---

### ElevenLabs Voice (~10 min)
1. Go to **elevenlabs.io** → Sign up (free)
2. Click your profile icon → **API Key**
3. Copy and paste into the app's Setup screen
4. Click **TEST KEY** to verify

| Plan | Cost | Monthly Audio |
|------|------|--------------|
| Free | $0 | ~10 min (~5 videos) |
| Starter | $5/mo | 30K chars (~25 videos) |
| Creator | $22/mo | 100K chars (~80 videos) |

---

### YouTube Auto-Upload (~10 min)
1. Go to **console.cloud.google.com**
2. Click **Select Project** → **New Project** → name it "Autotuber"
3. **APIs & Services** → **Enable APIs** → search **YouTube Data API v3** → Enable
4. **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web Application**
6. Under **Authorized Redirect URIs**, add your app's URL (e.g. `https://autotuber.vercel.app`)
7. Copy the **Client ID** → paste into app Setup → click **CONNECT**
8. You'll be redirected to Google login → approve → return to app

---

### Instagram Reels Auto-Upload (~15 min)
**Requirements:**
- Instagram must be a **Business or Creator account**
- Instagram must be connected to a **Facebook Page**

**Steps:**
1. Go to **developers.facebook.com** → Log in → **My Apps** → **Create App**
2. Select **Business** as app type
3. Add product: **Instagram Graph API**
4. In the left sidebar: **Instagram Graph API** → **Getting Started**
5. Connect your Instagram account
6. Go to **Tools** → **Graph API Explorer**
7. Select your app → Select your page → Click **Generate Access Token**
8. Required permissions: `instagram_basic`, `publish_video`, `pages_read_engagement`
9. Copy the token → paste into app Setup → click **CONNECT**

> ⚠️ Note: For production use, generate a **Long-Lived Token** (60 days) or set up token refresh

---

## 💰 Monthly Cost Breakdown

| Service | Free Tier | Paid |
|---------|-----------|------|
| Hosting (Vercel/Netlify) | Free | Free |
| Claude AI (scripts) | Included in app | Included |
| ElevenLabs (voice) | ~5 videos/mo | $5–$22/mo |
| YouTube API | Free | Free |
| Instagram API | Free | Free |
| **Total** | **$0/mo** | **$5–$22/mo** |

---

## 📱 Video Specs (Auto-Configured)

| Setting | Value |
|---------|-------|
| Resolution | 1080 × 1920 (9:16) |
| Frame rate | 30 FPS |
| Duration | 15 seconds (preview render) |
| Format | WebM (VP9) or MP4 |
| Audio | ElevenLabs AI voice (if connected) |
| Platforms | YouTube Shorts + Instagram Reels |

---

## 📈 Revenue Timeline

| Month | Milestone | Estimated Revenue |
|-------|-----------|------------------|
| 1–2 | Building library (10–20 videos) | $0 |
| 3–4 | Growing audience | $0–$50/mo |
| 4–6 | Hit monetization (1K subs + 4K hours) | $50–$200/mo |
| 6–12 | Consistent growth | $200–$800/mo |
| Year 2+ | Scaling with multiple niches | $1,000–$5,000/mo |

**Weekly workflow (1–2 hours):**
1. Open the app → Generate 7 scripts
2. Review + approve in Preview step
3. Render all videos
4. Publish → Auto-uploads to YouTube + Instagram
5. Done! Content runs on autopilot all week

---

## 🛠️ Customization

### Change Video Duration
In the code, find `const DURATION=15` and change to any number of seconds.

### Add More Niches
In the `CATEGORIES` array, add:
```js
{id:"your_niche", emoji:"🔥", label:"Your Niche", color:"#FF6B35", desc:"Short description"}
```

### Add More Voices
In the `VOICES` array, add any ElevenLabs voice ID:
```js
{id:"voice_id_from_elevenlabs", name:"Voice Name", desc:"Description", best:"Niches"}
```

### Change Video Style
Four styles are built in: `gradient`, `neon`, `particles`, `minimal`. Add your own in `renderVideoOnCanvas()`.

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "ElevenLabs error 401" | Check API key — regenerate at elevenlabs.io |
| "YouTube auth failed" | Add redirect URI in Google Cloud Console |
| "No Instagram account found" | Make sure Instagram is connected to a Facebook Page |
| Video won't render | Use Chrome or Edge (best MediaRecorder support) |
| "Network error" on API calls | Check browser console → likely CORS issue |

---

## 📂 File Structure
```
autotuber/
├── src/
│   └── App.jsx          ← autotuber-v6.jsx contents go here
├── index.html
├── package.json
└── vite.config.js
```

---

*AUTOTUBER v6.0 — Built with Claude AI | Browser-native, no server required*
