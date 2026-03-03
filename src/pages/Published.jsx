import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, CATEGORIES } from '../theme.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useVideos } from '../hooks/useVideos.js';
import { Card, SLabel, Btn, EmptyState, Spinner } from '../components/ui/index.jsx';

export default function Published() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { videos: allVideos, loading } = useVideos();
  const videos = useMemo(() => allVideos.filter(v => v.status === 'published'), [allVideos]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: T.display, fontSize: 36, letterSpacing: 3, color: T.text }}>PUBLISHED VIDEOS</h1>
        <p style={{ color: T.textMid, fontFamily: T.mono, fontSize: 12, marginTop: 4 }}>
          {videos.length} published · Read-only · Editing is locked after publishing
        </p>
      </div>

      {/* Lock notice */}
      {videos.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          background: '#FFD70012', border: '1px solid #FFD70030', borderRadius: 10,
        }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <span style={{ color: '#FFD700', fontFamily: T.mono, fontSize: 11 }}>
            Published videos are locked and cannot be edited. Download or view-only access.
          </span>
        </div>
      )}

      {videos.length === 0 ? (
        <EmptyState
          icon="📡"
          title="NO PUBLISHED VIDEOS"
          subtitle="Create and publish your first video to see it here"
          action={<Btn onClick={() => navigate('/create')}>＋ Create First Video</Btn>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {videos.map(v => {
            const cat = CATEGORIES.find(c => c.id === v.niche);
            return (
              <Card key={v.id} glow={cat?.color} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Thumbnail mockup */}
                <div style={{
                  height: 140, borderRadius: 10, overflow: 'hidden', position: 'relative',
                  background: `linear-gradient(135deg,${cat?.color || T.orange}30,${T.purple}30)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${cat?.color || T.orange}20`,
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 36 }}>{cat?.emoji || '🎬'}</div>
                    <div style={{
                      fontFamily: T.display, fontSize: 14, letterSpacing: 2, color: T.text,
                      marginTop: 8, padding: '0 12px', lineHeight: 1.2, textAlign: 'center',
                    }}>
                      {v.thumbnailText || v.title?.toUpperCase().slice(0, 30)}
                    </div>
                  </div>
                  {/* Lock badge */}
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: '#FFD70030', border: '1px solid #FFD70050',
                    borderRadius: 6, padding: '3px 8px',
                    color: '#FFD700', fontFamily: T.mono, fontSize: 9, fontWeight: 700,
                  }}>🔒 PUBLISHED</div>
                  {/* Platform badges */}
                  <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 4 }}>
                    {v.ytVideoId && (
                      <span style={{ background: '#FF0000', borderRadius: 4, padding: '2px 6px', fontSize: 9, color: '#fff', fontFamily: T.mono, fontWeight: 700 }}>▶ YT</span>
                    )}
                    {v.igMediaId && (
                      <span style={{ background: '#E1306C', borderRadius: 4, padding: '2px 6px', fontSize: 9, color: '#fff', fontFamily: T.mono, fontWeight: 700 }}>📸 IG</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 style={{ color: T.text, fontFamily: T.mono, fontSize: 13, fontWeight: 700, lineHeight: 1.4, marginBottom: 6 }}>
                    {v.title}
                  </h3>
                  <div style={{ color: T.textDim, fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>
                    {v.description || v.hook}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {v.tags?.slice(0, 3).map(tag => (
                      <span key={tag} style={{
                        background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 5,
                        padding: '2px 7px', color: T.textDim, fontFamily: T.mono, fontSize: 9,
                      }}>#{tag}</span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <div style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10 }}>
                    Published {new Date(v.publishedAt).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {v.renderUrl && (
                      <a href={v.renderUrl} download={`${v.title?.slice(0, 30)}.webm`} style={{
                        background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 7,
                        padding: '5px 10px', color: T.textMid, fontFamily: T.mono, fontSize: 10, fontWeight: 700,
                      }}>⬇</a>
                    )}
                    {v.ytVideoId && (
                      <a href={`https://youtube.com/watch?v=${v.ytVideoId}`} target="_blank" rel="noopener noreferrer" style={{
                        background: '#FF000018', border: '1px solid #FF000030', borderRadius: 7,
                        padding: '5px 10px', color: '#FF0000', fontFamily: T.mono, fontSize: 10, fontWeight: 700,
                      }}>▶</a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Script viewer accordion */}
      {videos.length > 0 && (
        <Card>
          <SLabel icon="📋">PUBLISHED SCRIPTS (READ-ONLY)</SLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {videos.slice(0, 5).map(v => (
              <PublishedScriptRow key={v.id} video={v} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function PublishedScriptRow({ video }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ color: T.text, fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>{video.title}</span>
        <span style={{ color: T.textDim, fontSize: 14 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          <div style={{ color: T.textDim, fontSize: 11, lineHeight: 1.7, fontFamily: T.mono, whiteSpace: 'pre-wrap', userSelect: 'text' }}>
            {video.fullScript || 'No script stored.'}
          </div>
        </div>
      )}
    </div>
  );
}
