export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/db';
import { normalizeEmail, normalizeUsername } from '../../../lib/utils';

export async function POST(req: Request) {
  const { email, username, eventSlug } = await req.json();

  const e = normalizeEmail(String(email || ''));
  const u = normalizeUsername(String(username || ''));
  const slug = String(eventSlug || process.env.NEXT_PUBLIC_EVENT_SLUG || 'melomania');

  if (!e || !u) {
    return NextResponse.json({ ok:false, reason:'missing_params' }, { status: 400 });
  }

  // Most recent matching profile (avoids multiple-rows error)
  const { data: profile, error: pErr } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', e)
    .eq('username', u)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pErr) return NextResponse.json({ ok:false, reason:'db_error', detail:pErr.message }, { status: 500 });
  if (!profile) return NextResponse.json({ ok:false, reason:'not_found' }, { status: 404 });

  // Most recent pass for this event
  const { data: pass, error: passErr } = await supabaseAdmin
    .from('passes')
    .select('qr_token,status')
    .eq('user_id', profile.id)
    .eq('event_slug', slug)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (passErr) return NextResponse.json({ ok:false, reason:'db_error', detail: passErr.message }, { status: 500 });
  if (!pass) return NextResponse.json({ ok:false, reason:'no_pass_for_event' }, { status: 404 });

  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  return NextResponse.json({ ok:true, token: pass.qr_token, status: pass.status, cardUrl: `${base}/card/${pass.qr_token}` });
}
