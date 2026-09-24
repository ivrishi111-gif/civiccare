import 'dotenv/config';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// DEMO MODE: when no Supabase keys are set, the app runs on an in-memory
// database so you can try everything without any external service.
export const isDemoMode = !(SUPABASE_URL && SERVICE_KEY);

const sb = isDemoMode
  ? null
  : createClient(SUPABASE_URL, SERVICE_KEY, {
      realtime: { transport: ws }, // Node 18/20 WebSocket support
      auth: { persistSession: false, autoRefreshToken: false },
    });

if (isDemoMode) {
  console.log('[db] DEMO MODE — in-memory database. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in server/.env for real storage.');
} else {
  console.log('[db] Supabase connected:', SUPABASE_URL);
}

const now = () => new Date().toISOString();

// ---------------- in-memory demo store ----------------
const mem = { users: new Map(), complaints: new Map() };

export async function seedDemo() {
  if (!isDemoMode) return;
  const password_hash = await bcrypt.hash('Demo@123', 10);
  const demo = {
    id: crypto.randomUUID(),
    name: 'Demo Citizen',
    email: 'demo@civiccare.in',
    password_hash,
    created_at: now(),
  };
  mem.users.set(demo.email, demo);

  const samples = [
    {
      title: 'Pothole near the bus stop',
      category: 'Pothole',
      description: 'Large pothole on the main road next to the bus stop. Two-wheelers are swerving to avoid it.',
      location: 'Sample · MG Road, Hyderabad',
      status: 'in_progress',
    },
    {
      title: 'Dustbin overflowing for 2 days',
      category: 'Garbage',
      description: 'The street dustbin is overflowing and creating a bad smell near the park gate.',
      location: 'Sample · Park Street, Secunderabad',
      status: 'open',
    },
    {
      title: 'Streetlight off since last week',
      category: 'Streetlight',
      description: 'The streetlight near the bakery has not been working for a week; the lane is completely dark at night.',
      location: 'Sample · Lake View Colony, Kukatpally',
      status: 'resolved',
    },
  ];
  for (const s of samples) {
    const id = crypto.randomUUID();
    mem.complaints.set(id, { id, user_id: demo.id, ...s, photo: null, created_at: now(), updated_at: now() });
  }
  console.log('[db] Demo data seeded (demo@civiccare.in / Demo@123)');
}

// ---------------- users ----------------
export async function findUserByEmail(email) {
  const e = String(email).toLowerCase();
  if (isDemoMode) return mem.users.get(e) || null;
  const { data, error } = await sb.from('users').select('*').eq('email', e).maybeSingle();
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return data;
}

export async function createUser({ name, email, password_hash }) {
  if (isDemoMode) {
    const user = { id: crypto.randomUUID(), name, email, password_hash, created_at: now() };
    mem.users.set(email, user);
    return user;
  }
  const { data, error } = await sb.from('users').insert({ name, email, password_hash }).select().single();
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return data;
}

// ---------------- complaints ----------------
export async function getComplaints(userId) {
  if (isDemoMode) {
    return [...mem.complaints.values()]
      .filter((c) => c.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const { data, error } = await sb
    .from('complaints')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return data || [];
}

export async function getComplaint(id, userId) {
  if (isDemoMode) {
    const c = mem.complaints.get(id);
    return c && c.user_id === userId ? c : null;
  }
  const { data, error } = await sb
    .from('complaints')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return data;
}

export async function createComplaint(userId, value) {
  if (isDemoMode) {
    const c = { id: crypto.randomUUID(), user_id: userId, ...value, created_at: now(), updated_at: now() };
    mem.complaints.set(c.id, c);
    return c;
  }
  const { data, error } = await sb.from('complaints').insert({ user_id: userId, ...value }).select().single();
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return data;
}

export async function updateComplaint(id, userId, value) {
  if (isDemoMode) {
    const c = mem.complaints.get(id);
    if (!c || c.user_id !== userId) return null;
    Object.assign(c, value, { updated_at: now() });
    return c;
  }
  const { data, error } = await sb
    .from('complaints')
    .update({ ...value, updated_at: now() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .maybeSingle();
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return data;
}

export async function deleteComplaint(id, userId) {
  if (isDemoMode) {
    const c = mem.complaints.get(id);
    if (!c || c.user_id !== userId) return false;
    mem.complaints.delete(id);
    return true;
  }
  const { error } = await sb.from('complaints').delete().eq('id', id).eq('user_id', userId);
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return true;
}
