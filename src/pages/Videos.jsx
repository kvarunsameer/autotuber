import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, CATEGORIES } from '../theme.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useVideos } from '../hooks/useVideos.js';
import { Card, SLabel, Btn, StatusBadge, EmptyState, Confirm, Spinner } from '../components/ui/index.jsx';

const STATUS_FILTERS = ['all', 'draft', 'rendering', 'published', 'failed'];

export default function Videos() {
  const { user } = useAuth();
  const { toast } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { videos, loading, removeVideo } = useVideos();

  const filtered = useMemo(() => {
    let r = [...videos].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (filter !== 'all') r = r.filter(v => v.status === filter);
    if (search.trim()) r = r.filter(v => v.title.toLowerCase().includes(search.toLowerCase()));
    return r;
  }, [videos, filter, search]);

  const handleDelete = useCallback(async (id) => {
    await removeVideo(id);
    toast('Video deleted.', 'success');
  }, [removeVideo, toast]);

  const canEdit = (v) => v.status !== 'published';

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: T.display, fontSize: 36, letterSpacing: 3, color: T.text }}>MY VIDEOS</h1>
          <p style={{ color: T.textMid, fontFamily: T.mono, fontSize: 12, marginTop: 4 }}>
            {videos.length} total · {videos.filter(v => v.status === 'published').length} published · {videos.filter(v => v.status === 'draft').length} drafts
          </p>
        </div>
        <Btn onClick={() => navigate('/create')}>＋ NEW VIDEO</Btn>
      </div>

      {/* Filters + Search */}
      <Card>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search videos..."
            style={{
              flex: 1, minWidth: 200, background: T.bg1, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '9px 14px', color: T.text, fontFamily: T.mono, fontSize: 12,
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUS_FILTERS.map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{
                background: filter === s ? T.orange + '25' : T.bg3,
                border: `1px solid ${filter === s ? T.orange + '60' : T.border}`,
                borderRadius: 7, padding: '7px 14px',
                color: filter === s ? T.orange : T.textMid,
                fontFamily: T.mono, fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
              }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Video list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={search ? '🔍' : '🎬'}
          title={search ? 'NO RESULTS' : 'NO VIDEOS YET'}
          subtitle={search ? 'Try a different search term' : 'Generate your first AI video script'}
          action={!search && <Btn onClick={() => navigate('/create')}>＋ Create First Video</Btn>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(v => {
            const cat = CATEGORIES.find(c => c.id === v.niche);
            const editable = canEdit(v);
            return (
              <div key={v.id} style={{
                background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14,
                padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14,
                transition: 'border-color 0.15s',
              }}>
                {/* Niche icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                  background: (cat?.color || T.orange) + '20',
                  border: `1px solid ${(cat?.color || T.orange)}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>
                  {cat?.emoji || '🎬'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h3 style={{
                      color: T.text, fontFamily: T.mono, fontSize: 13, fontWeight: 700,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flex: 1, minWidth: 0,
                    }}>{v.title}</h3>
                    <StatusBadge status={v.status} />
                    {v.status === 'published' && (
                      <span style={{
                        background: '#FFD70020', border: '1px solid #FFD70040', borderRadius: 6,
                        padding: '2px 8px', color: '#FFD700', fontFamily: T.mono, fontSize: 9, fontWeight: 700,
                      }}>🔒 LOCKED</span>
                    )}
                  </div>
                  <div style={{ color: T.textDim, fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
                    {v.description || v.hook || '—'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {v.tags?.slice(0, 3).map(tag => (
                      <span key={tag} style={{
                        background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 6,
                        padding: '2px 8px', color: T.textMid, fontFamily: T.mono, fontSize: 10,
                      }}>#{tag}</span>
                    ))}
                    <span style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10 }}>
                      {new Date(v.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                  {editable ? (
                    <button onClick={() => navigate(`/editor/${v.id}`)} style={{
                      background: T.orange + '20', border: `1px solid ${T.orange}40`,
                      borderRadius: 8, padding: '7px 16px', color: T.orange,
                      fontFamily: T.mono, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}>
                      ✏️ Edit
                    </button>
                  ) : (
                    <button onClick={() => navigate('/published')} style={{
                      background: T.green + '15', border: `1px solid ${T.green}30`,
                      borderRadius: 8, padding: '7px 16px', color: T.green,
                      fontFamily: T.mono, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}>
                      👁 View
                    </button>
                  )}
                  {editable && (
                    <button onClick={() => setConfirmDelete(v.id)} style={{
                      background: T.red + '15', border: `1px solid ${T.red}30`,
                      borderRadius: 8, padding: '7px 10px', color: T.red,
                      fontFamily: T.mono, fontSize: 11, cursor: 'pointer',
                    }}>
                      🗑
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Confirm
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="DELETE VIDEO"
        message="This draft will be permanently deleted. Published videos cannot be deleted."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
