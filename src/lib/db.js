/**
 * db.js — Async data layer
 * Uses Supabase when configured, falls back to localStorage for local dev.
 */
import { supabase, isSupabaseConfigured } from './supabase.js';
import * as local from './storage.js';

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export async function getProfile(userId) {
  if (!isSupabaseConfigured) {
    const users = local.getUsers();
    return users.find(u => u.id === userId) || null;
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, patch) {
  if (!isSupabaseConfigured) {
    return local.updateUser(userId, patch);
  }
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEOS
// ─────────────────────────────────────────────────────────────────────────────

export async function getVideos(userId) {
  if (!isSupabaseConfigured) {
    return local.getVideos(userId);
  }
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(dbToVideo);
}

export async function getVideoById(id) {
  if (!isSupabaseConfigured) {
    const all = local.getAllVideos();
    return all.find(v => v.id === id) || null;
  }
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return dbToVideo(data);
}

export async function saveVideo(video) {
  if (!isSupabaseConfigured) {
    return local.saveVideo(video);
  }
  const row = videoToDb(video);
  const { data, error } = await supabase
    .from('videos')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return dbToVideo(data);
}

export async function deleteVideo(id) {
  if (!isSupabaseConfigured) {
    return local.deleteVideo(id);
  }
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function publishVideo(id) {
  if (!isSupabaseConfigured) {
    return local.publishVideo(id);
  }
  const { data, error } = await supabase
    .from('videos')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return dbToVideo(data);
}

export async function createDraftVideo({ userId, title, niche, hook, description }) {
  const draft = {
    id: crypto.randomUUID(),
    userId,
    user_id: userId,
    title,
    niche,
    hook: hook || '',
    description: description || '',
    tags: [],
    thumbnailText: '',
    fullScript: '',
    status: 'draft',
    videoStyle: 'gradient',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    platforms: [],
    renderUrl: null,
    ytVideoId: null,
    igMediaId: null,
    publishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return saveVideo(draft);
}

export async function incrementVideoUsage(userId) {
  if (!isSupabaseConfigured) {
    const users = local.getUsers();
    const u = users.find(x => x.id === userId);
    if (u) local.updateUser(userId, { billing: { ...u.billing, videosUsedThisMonth: (u.billing?.videosUsedThisMonth || 0) + 1 } });
    return;
  }
  // Use Postgres RPC to atomically increment
  await supabase.rpc('increment_video_usage', { uid: userId });
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD MAPPING  (camelCase ↔ snake_case)
// ─────────────────────────────────────────────────────────────────────────────

function videoToDb(v) {
  return {
    id:              v.id,
    user_id:         v.userId || v.user_id,
    title:           v.title,
    niche:           v.niche,
    hook:            v.hook,
    description:     v.description,
    tags:            v.tags || [],
    thumbnail_text:  v.thumbnailText || v.thumbnail_text,
    views_potential: v.viewsPotential || v.views_potential,
    full_script:     v.fullScript || v.full_script,
    status:          v.status || 'draft',
    video_style:     v.videoStyle || v.video_style || 'gradient',
    voice_id:        v.voiceId || v.voice_id,
    platforms:       v.platforms || [],
    render_url:      v.renderUrl || v.render_url,
    yt_video_id:     v.ytVideoId || v.yt_video_id,
    ig_media_id:     v.igMediaId || v.ig_media_id,
    published_at:    v.publishedAt || v.published_at,
  };
}

function dbToVideo(row) {
  if (!row) return null;
  return {
    id:             row.id,
    userId:         row.user_id,
    title:          row.title,
    niche:          row.niche,
    hook:           row.hook,
    description:    row.description,
    tags:           row.tags || [],
    thumbnailText:  row.thumbnail_text,
    viewsPotential: row.views_potential,
    fullScript:     row.full_script,
    status:         row.status,
    videoStyle:     row.video_style,
    voiceId:        row.voice_id,
    platforms:      row.platforms || [],
    renderUrl:      row.render_url,
    ytVideoId:      row.yt_video_id,
    igMediaId:      row.ig_media_id,
    publishedAt:    row.published_at,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}
