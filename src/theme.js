// ── Design tokens ────────────────────────────────────────────────────────────
// bg/text/border use CSS custom properties so they respond to theme switching.
// Accent colours stay as hex — they're used with string concat for opacity.
export const T = {
  // ── Backgrounds / borders / text (theme-aware) ──────────────────────────
  bg0: 'var(--bg0)', bg1: 'var(--bg1)', bg2: 'var(--bg2)', bg3: 'var(--bg3)',
  bg0blur: 'var(--bg0blur)',
  border: 'var(--border)', borderHi: 'var(--border-hi)',
  text: 'var(--text)', textMid: 'var(--text-mid)', textDim: 'var(--text-dim)',
  // ── Accent colours (fixed, used with hex concat for alpha variants) ──────
  orange: '#FF6B35', orangeDim: '#FF6B3520',
  green: '#00E5A0', greenDim: '#00E5A020',
  blue: '#4285F4', blueDim: '#4285F420',
  pink: '#E1306C', pinkDim: '#E1306C20',
  purple: '#8B5CF6', purpleDim: '#8B5CF620',
  gold: '#F59E0B', goldDim: '#F59E0B20',
  red: '#EF4444', redDim: '#EF444420',
  cyan: '#06B6D4', cyanDim: '#06B6D420',
  // ── Typography ───────────────────────────────────────────────────────────
  mono: "'JetBrains Mono', 'Courier New', monospace",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  display: "'Bebas Neue', 'Arial Black', sans-serif",
};

// ── Subscription plans ────────────────────────────────────────────────────────
export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    color: T.textMid,
    emoji: '🌱',
    videosPerMonth: 3,
    features: [
      '3 videos / month',
      'AI script generation',
      'Canvas preview',
      'Manual download only',
      'Watermarked exports',
    ],
    limits: { videos: 3, autoPublish: false, teamSeats: 1, analytics: false },
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 9,
    color: T.blue,
    emoji: '🚀',
    videosPerMonth: 15,
    popular: false,
    features: [
      '15 videos / month',
      'AI script generation',
      'ElevenLabs voice',
      'YouTube auto-publish',
      'No watermark',
    ],
    limits: { videos: 15, autoPublish: true, teamSeats: 1, analytics: false },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    color: T.orange,
    emoji: '⚡',
    videosPerMonth: 999,
    popular: true,
    features: [
      'Unlimited videos',
      'AI script generation',
      'ElevenLabs voice',
      'YouTube + Instagram publish',
      'Video analytics',
      'Priority voice rendering',
    ],
    limits: { videos: Infinity, autoPublish: true, teamSeats: 3, analytics: true },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    color: T.purple,
    emoji: '🏢',
    videosPerMonth: 999,
    features: [
      'Unlimited videos',
      'All Pro features',
      'Unlimited team seats',
      'Custom branding',
      'SLA support',
      'Dedicated account manager',
    ],
    limits: { videos: Infinity, autoPublish: true, teamSeats: Infinity, analytics: true },
  },
];

export const CATEGORIES = [
  { id: 'motivation', emoji: '💪', label: 'Motivation', color: T.orange, desc: 'Inspirational stories & mindset shifts' },
  { id: 'finance', emoji: '💰', label: 'Finance', color: T.green, desc: 'Money tips, investing, passive income' },
  { id: 'mindset', emoji: '🧠', label: 'Mindset', color: T.purple, desc: 'Psychology, habits, mental strength' },
  { id: 'success', emoji: '🏆', label: 'Success Stories', color: T.gold, desc: 'Billionaire secrets & life lessons' },
  { id: 'health', emoji: '❤️', label: 'Health', color: T.red, desc: 'Wellness, longevity, fitness science' },
  { id: 'productivity', emoji: '⚡', label: 'Productivity', color: T.blue, desc: 'Systems, focus, deep work methods' },
  { id: 'history', emoji: '📜', label: 'History', color: T.purple, desc: 'Forgotten events & powerful figures' },
  { id: 'tech', emoji: '🤖', label: 'AI & Tech', color: T.cyan, desc: 'Future tech, AI breakthroughs, trends' },
];

export const VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', desc: 'Calm · Female', best: 'Finance, Mindset' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', desc: 'Strong · Female', best: 'Motivation, Success' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', desc: 'Rounded · Male', best: 'History, Education' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', desc: 'Crisp · Male', best: 'Tech, Productivity' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', desc: 'Deep · Male', best: 'Motivation, Success' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', desc: 'Conversational · Male', best: 'Finance, Health' },
];

export const VIDEO_STYLES = [
  { id: 'cinematic',  label: 'Cinematic',     desc: 'Real-world scenes · dramatic text fade-in' },
  { id: 'typewriter', label: 'Typewriter',    desc: 'Text types on screen word-by-word' },
  { id: 'slideup',    label: 'Slide Up',      desc: 'Words animate up from bottom' },
  { id: 'news',       label: 'Breaking News', desc: 'Bold lower-thirds · ticker bar' },
];
