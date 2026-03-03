import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { getProfile, updateProfile } from '../lib/db.js';
import * as local from '../lib/storage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Merge Supabase auth user with profiles row ──────────────────────────────
  const loadUserWithProfile = useCallback(async (authUser) => {
    if (!authUser) { setUser(null); return; }
    try {
      const profile = await getProfile(authUser.id);
      setUser({
        id:      authUser.id,
        email:   authUser.email,
        name:    profile?.name || authUser.user_metadata?.name || authUser.email.split('@')[0],
        plan:    profile?.plan || 'free',
        billing: {
          videosUsedThisMonth: profile?.videos_used_this_month || 0,
          periodStart: profile?.billing_period_start,
        },
        services:             profile?.services || {},
        stripeCustomerId:     profile?.stripe_customer_id,
        stripeSubscriptionId: profile?.stripe_subscription_id,
        subscriptionStatus:   profile?.subscription_status,
      });
    } catch {
      // Profile row not ready yet (trigger latency on first signup)
      setUser({
        id:      authUser.id,
        email:   authUser.email,
        name:    authUser.user_metadata?.name || authUser.email.split('@')[0],
        plan:    'free',
        billing: { videosUsedThisMonth: 0 },
        services: {},
      });
    }
  }, []);

  // ── Bootstrap session on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // localStorage fallback
      const session = local.getSession();
      if (session) {
        const users = local.getUsers();
        const found = users.find(u => u.id === session.userId);
        if (found) setUser(found);
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserWithProfile(session?.user || null).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUserWithProfile(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, [loadUserWithProfile]);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      const u = local.loginUser({ email, password });
      setUser(u); local.setSession(u.id); return u;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    await loadUserWithProfile(data.user);
    return data.user;
  }, [loadUserWithProfile]);

  // ── Signup ──────────────────────────────────────────────────────────────────
  const signup = useCallback(async ({ name, email, password }) => {
    if (!isSupabaseConfigured) {
      const u = local.createUser({ name, email, password });
      setUser(u); local.setSession(u.id); return u;
    }
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } },
    });
    if (error) throw new Error(error.message);
    // Profile row created by DB trigger — brief wait for consistency
    await new Promise(r => setTimeout(r, 800));
    await loadUserWithProfile(data.user);
    return data.user;
  }, [loadUserWithProfile]);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (!isSupabaseConfigured) { local.clearSession(); setUser(null); return; }
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  // ── Refresh user from DB ────────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    if (!user) return;
    if (!isSupabaseConfigured) {
      const users = local.getUsers();
      const found = users.find(u => u.id === user.id);
      if (found) setUser(found);
      return;
    }
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) await loadUserWithProfile(authUser);
  }, [user, loadUserWithProfile]);

  // ── Patch user (plan, services, billing, etc.) ──────────────────────────────
  const patchUser = useCallback(async (patch) => {
    if (!user) return;
    // Optimistic update
    setUser(prev => ({ ...prev, ...patch }));
    if (!isSupabaseConfigured) {
      return local.updateUser(user.id, patch);
    }
    const dbPatch = {};
    if (patch.name !== undefined)     dbPatch.name = patch.name;
    if (patch.plan !== undefined)     dbPatch.plan = patch.plan;
    if (patch.services !== undefined) dbPatch.services = { ...(user.services || {}), ...patch.services };
    if (patch.billing?.videosUsedThisMonth !== undefined)
      dbPatch.videos_used_this_month = patch.billing.videosUsedThisMonth;
    if (patch.stripeCustomerId !== undefined)     dbPatch.stripe_customer_id = patch.stripeCustomerId;
    if (patch.stripeSubscriptionId !== undefined) dbPatch.stripe_subscription_id = patch.stripeSubscriptionId;
    if (patch.subscriptionStatus !== undefined)   dbPatch.subscription_status = patch.subscriptionStatus;

    if (Object.keys(dbPatch).length > 0) await updateProfile(user.id, dbPatch);

    // Reload fresh data to sync
    const fresh = await getProfile(user.id);
    if (fresh) {
      setUser(prev => ({
        ...prev,
        plan:    fresh.plan,
        billing: { videosUsedThisMonth: fresh.videos_used_this_month, periodStart: fresh.billing_period_start },
        services: fresh.services || {},
        stripeCustomerId:     fresh.stripe_customer_id,
        stripeSubscriptionId: fresh.stripe_subscription_id,
        subscriptionStatus:   fresh.subscription_status,
      }));
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser, patchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
