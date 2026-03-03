import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Load .env from project root regardless of where server is run from
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const app  = express();
const port = process.env.PORT || 3001;

// ── Clients ──────────────────────────────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,   // service role — bypasses RLS
);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.VITE_APP_URL || 'http://localhost:5173' }));

// Raw body needed for Stripe webhook signature verification
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ── Price ID map (server-side, never exposed to frontend) ────────────────────
const PLAN_TO_PRICE = {
  starter:    process.env.STRIPE_PRICE_HOBBY,
  pro:        process.env.STRIPE_PRICE_CREATOR,
  enterprise: process.env.STRIPE_PRICE_PRO,
};

// ── Price → plan mapping ──────────────────────────────────────────────────────
const PRICE_TO_PLAN = {
  [process.env.STRIPE_PRICE_HOBBY]:   'starter',
  [process.env.STRIPE_PRICE_CREATOR]: 'pro',
  [process.env.STRIPE_PRICE_PRO]:     'enterprise',
};

// ── POST /api/create-checkout-session ─────────────────────────────────────────
// Body: { planId, userId, email }
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { planId, userId, email } = req.body;
    if (!planId || !userId || !email) return res.status(400).json({ error: 'Missing required fields' });

    const priceId = PLAN_TO_PRICE[planId];
    if (!priceId) return res.status(400).json({ error: `No Stripe price configured for plan: ${planId}` });

    // Look up or create Stripe customer
    let customerId = null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({ email, metadata: { supabase_uid: userId } });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.VITE_APP_URL}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.VITE_APP_URL}/subscription?canceled=true`,
      subscription_data: { metadata: { supabase_uid: userId } },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/create-portal-session ──────────────────────────────────────────
// Body: { userId }  — opens Stripe customer portal for billing management
app.post('/api/create-portal-session', async (req, res) => {
  try {
    const { userId } = req.body;
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_customer_id) return res.status(400).json({ error: 'No billing account found' });

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.VITE_APP_URL}/subscription`,
    });

    res.json({ url: portalSession.url });
  } catch (err) {
    console.error('create-portal-session error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/subscription/:userId ─────────────────────────────────────────────
app.get('/api/subscription/:userId', async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, subscription_status, stripe_subscription_id, stripe_customer_id')
      .eq('id', req.params.userId)
      .single();
    res.json(profile || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/webhook ─────────────────────────────────────────────────────────
app.post('/api/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const getUid = (obj) => obj?.metadata?.supabase_uid;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const uid = getUid(session) || getUid(await stripe.subscriptions.retrieve(session.subscription).catch(() => null));
      if (uid) {
        const priceId = session.line_items?.data?.[0]?.price?.id;
        const plan = PRICE_TO_PLAN[priceId] || 'starter';
        await supabase.from('profiles').update({
          plan,
          subscription_status: 'active',
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
        }).eq('id', uid);
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const uid = getUid(sub);
      if (uid) {
        const priceId = sub.items?.data?.[0]?.price?.id;
        const plan = PRICE_TO_PLAN[priceId] || 'starter';
        await supabase.from('profiles').update({
          plan,
          subscription_status: sub.status,
          stripe_subscription_id: sub.id,
        }).eq('id', uid);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const uid = getUid(sub);
      if (uid) {
        await supabase.from('profiles').update({
          plan: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
        }).eq('id', uid);
      }
      break;
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object;
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', inv.customer)
        .single();
      if (profileRow) {
        await supabase.from('profiles').update({ subscription_status: 'past_due' }).eq('id', profileRow.id);
      }
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
});

app.listen(port, () => console.log(`AutoTuber server listening on port ${port}`));
