import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { T, PLANS } from '../theme.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { Card, SLabel, Btn, StatusBox } from '../components/ui/index.jsx';

// Stripe is configured if publishable key is present in env
const STRIPE_CONFIGURED = !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export default function Subscription() {
  const { user, patchUser, refreshUser } = useAuth();
  const { toast } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPlan = PLANS.find(p => p.id === user?.plan) || PLANS[0];
  const [processing, setProcessing] = useState(null);

  // Handle Stripe return redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast('Payment successful! Your plan has been updated.', 'success');
      refreshUser();
      setSearchParams({});
    }
    if (searchParams.get('canceled') === 'true') {
      toast('Payment canceled.', 'warn');
      setSearchParams({});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectPlan = async (plan) => {
    if (plan.id === user?.plan) return;
    setProcessing(plan.id);
    try {
      if (!STRIPE_CONFIGURED || plan.id === 'free') {
        await new Promise(r => setTimeout(r, 600));
        await patchUser({ plan: plan.id });
        toast(plan.id === 'free' ? 'Downgraded to Free plan.' : `Switched to ${plan.name}!`, plan.id === 'free' ? 'warn' : 'success');
      } else {
        const priceId = PLAN_PRICES[plan.id];
        if (!priceId) { toast('Price ID not configured for this plan.', 'error'); return; }
        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: plan.id, userId: user.id, email: user.email }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to create checkout session');
        window.location.href = json.url;
        return; // page will redirect — keep spinner
      }
    } catch (err) {
      toast(err.message || 'Something went wrong', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleManageBilling = async () => {
    setProcessing('portal');
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to open billing portal');
      window.location.href = json.url;
    } catch (err) {
      toast(err.message, 'error');
      setProcessing(null);
    }
  };

  const usage = {
    videos: user?.billing?.videosUsedThisMonth || 0,
    limit: currentPlan.videosPerMonth === Infinity ? '∞' : currentPlan.videosPerMonth,
    pct: currentPlan.videosPerMonth === Infinity ? 0 : Math.round(((user?.billing?.videosUsedThisMonth || 0) / currentPlan.videosPerMonth) * 100),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 860 }}>
      <div>
        <h1 style={{ fontFamily: T.display, fontSize: 36, letterSpacing: 3, color: T.text }}>SUBSCRIPTION</h1>
        <p style={{ color: T.textMid, fontFamily: T.mono, fontSize: 12, marginTop: 4 }}>Manage your plan and billing</p>
      </div>

      {/* Current plan summary */}
      <Card glow={currentPlan.color}>
        <SLabel icon="📋">CURRENT PLAN</SLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 40 }}>{currentPlan.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.display, fontSize: 30, color: currentPlan.color, letterSpacing: 2 }}>
              {currentPlan.name.toUpperCase()}
              {currentPlan.price > 0 && <span style={{ fontFamily: T.mono, fontSize: 14, color: T.textMid, marginLeft: 12 }}>${currentPlan.price}/mo</span>}
            </div>
            <div style={{ color: T.textMid, fontFamily: T.mono, fontSize: 11, marginTop: 4 }}>
              {usage.videos} / {usage.limit} videos used this month
            </div>
          </div>
          {currentPlan.id !== 'enterprise' && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10, marginBottom: 4 }}>NEXT BILLING</div>
              <div style={{ color: T.text, fontFamily: T.mono, fontSize: 12 }}>
                {currentPlan.price === 0 ? 'Free forever' : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Manage billing portal button */}
        {STRIPE_CONFIGURED && currentPlan.price > 0 && user?.stripeCustomerId && (
          <div style={{ marginTop: 14 }}>
            <Btn
              variant="outline"
              size="sm"
              loading={processing === 'portal'}
              onClick={handleManageBilling}
            >
              Manage Billing &amp; Invoices ↗
            </Btn>
          </div>
        )}

        {/* Usage bar */}
        {currentPlan.videosPerMonth !== Infinity && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: T.textDim, fontFamily: T.mono, fontSize: 10 }}>VIDEO USAGE</span>
              <span style={{ color: usage.pct > 80 ? T.red : T.text, fontFamily: T.mono, fontSize: 10 }}>{usage.pct}%</span>
            </div>
            <div style={{ height: 8, background: T.bg3, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${usage.pct}%`, background: usage.pct > 80 ? T.red : currentPlan.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
            </div>
            {usage.pct > 80 && (
              <div style={{ marginTop: 10 }}>
                <StatusBox type="warn" text="You're approaching your monthly limit. Upgrade to avoid interruptions." />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Plan comparison */}
      <div>
        <h2 style={{ fontFamily: T.display, fontSize: 28, letterSpacing: 2, color: T.text, marginBottom: 20 }}>CHOOSE YOUR PLAN</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
          {PLANS.map(plan => {
            const isCurrent = plan.id === user?.plan;
            const isProcessing = processing === plan.id;
            const isDowngrade = PLANS.findIndex(p => p.id === plan.id) < PLANS.findIndex(p => p.id === user?.plan);
            return (
              <div key={plan.id} style={{
                background: T.bg2,
                border: `2px solid ${isCurrent ? plan.color : T.border}`,
                borderRadius: 14, padding: '22px 18px',
                boxShadow: isCurrent ? `0 0 30px ${plan.color}15` : 'none',
                position: 'relative', overflow: 'hidden',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}>
                {isCurrent && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    background: plan.color, color: '#fff',
                    fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: 1,
                    padding: '5px 12px', borderBottomLeftRadius: 8,
                  }}>CURRENT</div>
                )}
                {plan.popular && !isCurrent && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    background: plan.color + '20', color: plan.color,
                    border: `1px solid ${plan.color}40`,
                    fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: 1,
                    padding: '5px 12px', borderBottomLeftRadius: 8,
                  }}>POPULAR</div>
                )}

                <div style={{ fontSize: 28, marginBottom: 8 }}>{plan.emoji}</div>
                <div style={{ color: plan.color, fontFamily: T.mono, fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>
                  {plan.name.toUpperCase()}
                </div>
                <div style={{ fontFamily: T.display, fontSize: 30, color: T.text, letterSpacing: 1, marginBottom: 14 }}>
                  {plan.price === 0 ? 'FREE' : `$${plan.price}/mo`}
                </div>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ color: T.textMid, fontSize: 11, display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                      <span style={{ color: plan.color, flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrent || isProcessing}
                  onClick={() => handleSelectPlan(plan)}
                  style={{
                    width: '100%',
                    background: isCurrent ? T.bg3 : isDowngrade ? T.red + '20' : `linear-gradient(135deg,${plan.color},${plan.id === 'pro' ? '#F59E0B' : plan.color + 'cc'})`,
                    border: isCurrent ? `1px solid ${T.border}` : isDowngrade ? `1px solid ${T.red}40` : 'none',
                    borderRadius: 9, padding: '11px',
                    color: isCurrent ? T.textDim : isDowngrade ? T.red : '#fff',
                    fontFamily: T.mono, fontSize: 11, fontWeight: 700,
                    cursor: isCurrent ? 'default' : 'pointer',
                    opacity: isProcessing ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {isProcessing ? (
                    <>
                      <div className="spin" style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff4', borderTop: '2px solid #fff' }} />
                      Processing...
                    </>
                  ) : isCurrent ? 'Current Plan' : isDowngrade ? 'Downgrade' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature comparison table */}
      <Card>
        <SLabel icon="📊">FEATURE COMPARISON</SLabel>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', color: T.textDim, fontFamily: T.mono, fontSize: 10, padding: '6px 10px' }}>FEATURE</th>
                {PLANS.map(p => (
                  <th key={p.id} style={{ textAlign: 'center', color: p.id === user?.plan ? p.color : T.textDim, fontFamily: T.mono, fontSize: 10, padding: '6px 10px', minWidth: 80 }}>
                    {p.name.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Videos/Month', fn: (p) => p.limits.videos === Infinity ? '∞' : p.limits.videos },
                { label: 'AI Scripts', fn: () => '✓' },
                { label: 'ElevenLabs Voice', fn: (p) => p.id === 'free' ? '—' : '✓' },
                { label: 'Auto-publish', fn: (p) => p.limits.autoPublish ? '✓' : '—' },
                { label: 'YouTube Upload', fn: (p) => p.id === 'free' ? '—' : '✓' },
                { label: 'Instagram Upload', fn: (p) => p.id === 'pro' || p.id === 'enterprise' ? '✓' : '—' },
                { label: 'Analytics', fn: (p) => p.limits.analytics ? '✓' : '—' },
                { label: 'Team Seats', fn: (p) => p.limits.teamSeats === Infinity ? '∞' : p.limits.teamSeats },
                { label: 'No Watermark', fn: (p) => p.id === 'free' ? '—' : '✓' },
              ].map(({ label, fn }) => (
                <tr key={label}>
                  <td style={{ color: T.textMid, fontFamily: T.mono, fontSize: 11, padding: '8px 10px', borderBottom: `1px solid ${T.border}` }}>{label}</td>
                  {PLANS.map(p => (
                    <td key={p.id} style={{
                      textAlign: 'center', fontFamily: T.mono, fontSize: 11, padding: '8px 10px',
                      borderBottom: `1px solid ${T.border}`,
                      color: fn(p) === '—' ? T.textDim : fn(p) === '✓' ? T.green : p.id === user?.plan ? p.color : T.text,
                      fontWeight: p.id === user?.plan ? 700 : 400,
                    }}>{String(fn(p))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Billing info */}
      <div style={{ padding: '12px 16px', background: STRIPE_CONFIGURED ? T.green + '10' : T.blue + '10', border: `1px solid ${STRIPE_CONFIGURED ? T.green : T.blue}30`, borderRadius: 10 }}>
        <p style={{ color: STRIPE_CONFIGURED ? T.green : T.blue, fontFamily: T.mono, fontSize: 10, lineHeight: 1.7 }}>
          {STRIPE_CONFIGURED
            ? '✓ Stripe is configured — upgrades go through secure Stripe Checkout. Manage invoices and payment methods via the billing portal.'
            : 'ℹ Add VITE_STRIPE_PRICE_HOBBY / CREATOR / PRO and the server STRIPE_* keys to .env to enable real billing. Plans can be switched locally right now for testing.'}
        </p>
      </div>
    </div>
  );
}
