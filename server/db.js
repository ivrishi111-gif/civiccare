import 'dotenv/config';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import bcrypt from 'bcryptjs';
import { CATEGORIES, STATUSES, DEMO_CITIZEN, DEMO_AUTHORITY } from './constants.js';

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
const daysAgoIso = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

// ---------------- in-memory demo store ----------------
const mem = {
  users: new Map(), // id -> user
  usersByEmail: new Map(),
  usersByPhone: new Map(),
  authorities: new Map(), // id -> authority
  complaints: new Map(), // id -> complaint
  history: new Map(), // complaintId -> [rows]
};

// ---------------- sample data (used by both demo mode and Supabase seeding) ----------------
const SAMPLE_BASE = () => (process.env.SAMPLE_BASE_URL || '').replace(/\/$/, '');

const SAMPLES = [
  {
    title: 'Pothole near the bus stop',
    category: 'Pothole',
    description:
      'A large pothole in the middle of the road near the bus stop. Water collects in it and two-wheelers swerve to avoid it. Dangerous, especially in rain.',
    location: 'MG Road, near City Bus Stop',
    status: 'resolved',
    before: 'pothole-before.jpg',
    after: 'pothole-after.jpg',
    history: [
      { status: 'open', message: 'Complaint submitted by citizen.', actor: 'Demo Citizen', role: 'user', daysAgo: 4 },
      { status: 'assigned', message: 'Assigned to Road Maintenance Team.', actor: 'Municipal Works (Demo)', role: 'authority', daysAgo: 3.5 },
      { status: 'in_progress', message: 'Team inspected the site. Repair work started.', actor: 'Municipal Works (Demo)', role: 'authority', daysAgo: 2.5 },
      { status: 'completed', message: 'Pothole filled and road surface levelled. After photo uploaded as proof.', actor: 'Municipal Works (Demo)', role: 'authority', daysAgo: 0.5 },
      { status: 'resolved', message: 'Work verified and complaint closed. Thank you for reporting!', actor: 'Municipal Works (Demo)', role: 'authority', daysAgo: 0.2 },
    ],
  },
  {
    title: 'Dustbin overflowing for 3 days',
    category: 'Garbage',
    description:
      'The street dustbin near the park gate has been overflowing for 3 days. Garbage is spread on the footpath and creating a bad smell.',
    location: 'Park Street, near Park Gate',
    status: 'in_progress',
    before: 'garbage-before.jpg',
    after: null,
    history: [
      { status: 'open', message: 'Complaint submitted by citizen.', actor: 'Demo Citizen', role: 'user', daysAgo: 2 },
      { status: 'assigned', message: 'Assigned to Sanitation Team.', actor: 'Municipal Works (Demo)', role: 'authority', daysAgo: 1.5 },
      { status: 'in_progress', message: 'Sanitation team scheduled for cleanup tomorrow 6 AM.', actor: 'Municipal Works (Demo)', role: 'authority', daysAgo: 0.5 },
    ],
  },
  {
    title: 'Streetlight off since last week',
    category: 'Streetlight',
    description:
      'The streetlight near the bakery has not been working for a week. The lane is completely dark at night and unsafe for pedestrians.',
    location: 'Bakery Lane, Sample Colony',
    status: 'completed',
    before: 'streetlight-before.jpg',
    after: 'streetlight-after.jpg',
    history: [
      { status: 'open', message: 'Complaint submitted by citizen.', actor: 'Demo Citizen', role: 'user', daysAgo: 3 },
      { status: 'assigned', message: 'Assigned to Electrical Team.', actor: 'Municipal Works (Demo)', role: 'authority', daysAgo: 2 },
      { status: 'in_progress', message: 'Faulty lamp board identified; replacement arranged.', actor: 'Municipal Works (Demo)', role: 'authority', daysAgo: 1 },
      { status: 'completed', message: 'New LED lamp installed and working. After photo uploaded as proof.', actor: 'Municipal Works (Demo)', role: 'authority', daysAgo: 0.3 },
    ],
  },
];

function sampleComplaintFields(s, base) {
  return {
    title: s.title,
    category: s.category,
    description: s.description,
    location: s.location,
    status: s.status,
    photo: `${base}/samples/${s.before}`,
    before_image: `${base}/samples/${s.before}`,
    after_image: s.after ? `${base}/samples/${s.after}` : null,
  };
}

// ---------------- users ----------------
export async function findUserById(id) {
  if (isDemoMode) return mem.users.get(id) || null;
  const { data, error } = await sb.from('users').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return data;
}

export async function findUserByEmail(email) {
  const e = String(email).toLowerCase();
  if (isDemoMode) return mem.usersByEmail.get(e) || null;
  const { data, error } = await sb.from('users').select('*').eq('email', e).maybeSingle();
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return data;
}

export async function findUserByPhone(phone) {
  if (isDemoMode) return mem.usersByPhone.get(phone) || null;
  const { data, error } = await sb.from('users').select('*').eq('phone', phone).maybeSingle();
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return data;
}

export async function createUser({ name, email, phone, password_hash, language }) {
  if (isDemoMode) {
    const user = {
      id: crypto.randomUUID(),
      name,
      email: email || null,
      phone: phone || null,
      password_hash,
      language: language || 'en',
      created_at: now(),
    };
    mem.users.set(user.id, user);
    if (email) mem.usersByEmail.set(email.toLowerCase(), user);
    if (phone) mem.usersByPhone.set(phone, user);
    return user;
  }
  const { data, error } = await sb
    .from('users')
    .insert({ name, email: email || null, phone: phone || null, password_hash, language: language || 'en' })
    .select()
    .single();
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return data;
}

// ---------------- authorities ----------------
export async function findAuthorityById(id) {
  if (isDemoMode) return mem.authorities.get(id) || null;
  const { data, error } = await sb.from('authorities').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return data;
}

export async function findAuthorityByPhone(phone) {
  if (isDemoMode) {
    for (const a of mem.authorities.values()) if (a.phone === phone) return a;
    return null;
  }
  const { data, error } = await sb.from('authorities').select('*').eq('phone', phone).maybeSingle();
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return data;
}

export async function createAuthority({ name, phone, department, area, password_hash, is_demo }) {
  if (isDemoMode) {
    const a = {
      id: crypto.randomUUID(),
      name,
      phone,
      department: department || 'Municipal Corporation',
      area: area || '',
      password_hash,
      is_demo: !!is_demo,
      created_at: now(),
    };
    mem.authorities.set(a.id, a);
    return a;
  }
  const { data, error } = await sb
    .from('authorities')
    .insert({ name, phone, department: department || 'Municipal Corporation', area: area || '', password_hash, is_demo: !!is_demo })
    .select()
    .single();
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

export async function listAllComplaints(status) {
  if (isDemoMode) {
    return [...mem.complaints.values()]
      .filter((c) => !status || status === 'all' || c.status === status)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  let q = sb.from('complaints').select('*').order('created_at', { ascending: false });
  if (status && status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
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
  const { data, error } = await sb.from('complaints').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return data;
}

export async function getComplaintAny(id) {
  if (isDemoMode) return mem.complaints.get(id) || null;
  const { data, error } = await sb.from('complaints').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return data;
}

export async function createComplaint(userId, value, { actor } = {}) {
  const row = {
    ...value,
    before_image: value.before_image || value.photo || null,
    after_image: null,
    authority_id: null,
    created_at: now(),
    updated_at: now(),
  };
  if (isDemoMode) {
    const c = { id: crypto.randomUUID(), user_id: userId, ...row };
    mem.complaints.set(c.id, c);
    addHistory(c.id, {
      status: row.status || 'open',
      message: 'Complaint submitted by citizen.',
      actor: actor || 'Citizen',
      role: 'user',
      created_at: now(),
    });
    return c;
  }
  const { data, error } = await sb.from('complaints').insert({ user_id: userId, ...row }).select().single();
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  await addHistory(data.id, {
    status: row.status || 'open',
    message: 'Complaint submitted by citizen.',
    actor: actor || 'Citizen',
    role: 'user',
  });
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
    mem.history.delete(id);
    return true;
  }
  const { error } = await sb.from('complaints').delete().eq('id', id).eq('user_id', userId);
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return true;
}

// authority updates — ownership NOT required, guarded by requireAuthority middleware
export async function updateComplaintByAuthority(id, value, actor, historyRow) {
  if (isDemoMode) {
    const c = mem.complaints.get(id);
    if (!c) return null;
    Object.assign(c, value, { updated_at: now() });
    if (historyRow) addHistory(c.id, { ...historyRow, created_at: now() });
    return c;
  }
  const { data, error } = await sb
    .from('complaints')
    .update({ ...value, updated_at: now() })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  if (historyRow) {
    await addHistory(id, { ...historyRow, actor: actor || 'Authority', created_at: now() });
  }
  return data;
}

// ---------------- history ----------------
export async function addHistory(complaintId, { status, message, actor, role }) {
  if (isDemoMode) {
    addHistoryLocal(complaintId, { status, message, actor, role });
    return;
  }
  const { error } = await sb.from('complaint_history').insert({
    complaint_id: complaintId,
    status,
    message,
    actor: actor || 'system',
    role: role || 'system',
  });
  if (error) {
    console.error('[db] history:', error.message);
    throw error;
  }
}

// in-memory helper (used by demo mode)
function addHistoryLocal(complaintId, row) {
  if (!mem.history.has(complaintId)) mem.history.set(complaintId, []);
  mem.history.get(complaintId).push({ id: crypto.randomUUID(), complaint_id: complaintId, ...row, created_at: now() });
}

export async function listHistory(complaintId) {
  if (isDemoMode) {
    return (mem.history.get(complaintId) || []).sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  const { data, error } = await sb
    .from('complaint_history')
    .select('*')
    .eq('complaint_id', complaintId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[db]', error.message);
    throw error;
  }
  return data || [];
}

// ---------------- seeding ----------------
// Seeds the demo citizen, demo authority and 3 sample complaints (with
// before/after photos + full status history) exactly ONCE.
// Trigger: the demo citizen does not exist yet — this way real users'
// complaints are never affected, and it self-heals if a previous seed
// was interrupted.
export async function seedIfEmpty() {
  if (isDemoMode) {
    await seedDemoLocal();
    return;
  }
  try {
    const { data: existing } = await sb
      .from('users')
      .select('id')
      .eq('email', DEMO_CITIZEN.email)
      .maybeSingle();

    let user = existing;

    if (!user) {
      const userHash = await bcrypt.hash(DEMO_CITIZEN.password, 10);
      const { data, error } = await sb
        .from('users')
        .insert({
          name: DEMO_CITIZEN.name,
          email: DEMO_CITIZEN.email,
          phone: DEMO_CITIZEN.phone,
          password_hash: userHash,
          language: 'en',
        })
        .select()
        .single();
      if (error) throw error;
      user = data;
    }

    const { count } = await sb
      .from('complaints')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (count > 0) return; // samples already there

    const base = SAMPLE_BASE();

    // demo authority (create if missing)
    let authority = await findAuthorityByPhone(DEMO_AUTHORITY.phone);
    if (!authority) {
      const authHash = await bcrypt.hash(DEMO_AUTHORITY.password, 10);
      const { data, error } = await sb
        .from('authorities')
        .insert({
          name: DEMO_AUTHORITY.name,
          phone: DEMO_AUTHORITY.phone,
          department: DEMO_AUTHORITY.department,
          area: DEMO_AUTHORITY.area,
          password_hash: authHash,
          is_demo: true,
        })
        .select()
        .single();
      if (error) throw error;
      authority = data;
    }

    for (const s of SAMPLES) {
      const { data: c, error } = await sb
        .from('complaints')
        .insert({
          user_id: user.id,
          authority_id: authority.id,
          ...sampleComplaintFields(s, base),
        })
        .select()
        .single();
      if (error) throw error;
      for (const h of s.history) {
        await sb.from('complaint_history').insert({
          complaint_id: c.id,
          status: h.status,
          message: h.message,
          actor: h.actor,
          role: h.role,
          created_at: daysAgoIso(h.daysAgo),
        });
      }
    }
    console.log('[db] Seeded demo citizen, demo authority and 3 sample complaints (with before/after photos).');
  } catch (e) {
    console.log('[db] Seed skipped (run the updated schema.sql in Supabase SQL Editor first):', String(e.message).slice(0, 120));
  }
}

async function seedDemoLocal() {
  const base = SAMPLE_BASE() || '';

  const userHash = await bcrypt.hash(DEMO_CITIZEN.password, 10);
  const user = {
    id: crypto.randomUUID(),
    name: DEMO_CITIZEN.name,
    email: DEMO_CITIZEN.email,
    phone: DEMO_CITIZEN.phone,
    password_hash: userHash,
    language: 'en',
    created_at: daysAgoIso(5),
  };
  mem.users.set(user.id, user);
  mem.usersByEmail.set(user.email.toLowerCase(), user);
  mem.usersByPhone.set(user.phone, user);

  const authHash = await bcrypt.hash(DEMO_AUTHORITY.password, 10);
  const authority = {
    id: crypto.randomUUID(),
    name: DEMO_AUTHORITY.name,
    phone: DEMO_AUTHORITY.phone,
    department: DEMO_AUTHORITY.department,
    area: DEMO_AUTHORITY.area,
    password_hash: authHash,
    is_demo: true,
    created_at: daysAgoIso(5),
  };
  mem.authorities.set(authority.id, authority);

  for (const s of SAMPLES) {
    const id = crypto.randomUUID();
    const c = {
      id,
      user_id: user.id,
      authority_id: authority.id,
      ...sampleComplaintFields(s, base),
      created_at: daysAgoIso(s.history[0].daysAgo),
      updated_at: daysAgoIso(s.history[s.history.length - 1].daysAgo),
    };
    mem.complaints.set(id, c);
    for (const h of s.history) {
      addHistoryLocal(id, { status: h.status, message: h.message, actor: h.actor, role: h.role, created_at: daysAgoIso(h.daysAgo) });
    }
  }
  console.log('[db] Demo data seeded (citizen +919876543210 / Demo@123, authority +919999999999 / Demo@123, 3 sample complaints).');
}
