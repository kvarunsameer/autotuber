import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getVideos, deleteVideo as dbDelete } from '../lib/db.js';

export function useVideos() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) { setVideos([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await getVideos(user.id);
      setVideos(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const removeVideo = useCallback(async (id) => {
    await dbDelete(id);
    setVideos(prev => prev.filter(v => v.id !== id));
  }, []);

  const refresh = load;

  return { videos, loading, error, refresh, removeVideo };
}
