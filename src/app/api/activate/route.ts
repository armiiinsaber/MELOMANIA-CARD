export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/db';
import { makeToken, normalizeEmail, normalizeUsername } from '../../../lib/utils';
import { z } from 'zod';

// Very small schema (zod was already in deps)
const ActivateSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(24),
  eventSlug: z.string().min(1).optional(), // we’ll default from env if missing
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ActivateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, reason: 'bad_request', errors: parsed.error.format() }, { status: 400 });
    }

    const e = normalizeEmail(parsed.data.email);
    const u = normalizeUsername(parsed.data.username);
    const eventSlug = parsed.data.eventSlug || process.env.NEXT_PUBLIC_EVENT_SLUG || 'melomania';

    // 1) Uniqueness check on username (race-safe)
    const { data: unameRow, error: unameErr } = await supabaseAdmin
      .from('profiles').select('id').eq('username', u).maybeSingle();
    if (unameErr) {
      console.error('username lookup error:', unameErr);
      return NextResponse.json({ ok:false, reason:'db_error', detail: unameErr.message }, { status: 500 });
    }

    // 2) Find by email (existing user?)
    const { data: emailRow, error: emailErr } = await supabaseAdmin
      .from('profiles').select('id, username').eq('email', e).maybeSingle();
    if (emailErr) {
      console.error('email lookup error:', emailErr);
      return NextResponse.json({ ok:false, reason:'db_error', detail: emailErr.message }, { status: 500 });
    }

    if (unameRow && (!emailRow || emailRow.id !== unameRow.id)) {
      return NextResponse.json({ ok:false, reason:'username_taken' }, { status: 409 });
    }

    // 3) Create or update profile
    let userId = emailRow?.id as string | undefined;
    if (!userId) {
      const { data: created, error: insErr } = await supabaseAdmin
        .from('profiles')
        .insert({ email: e, username: u })
        .select('id')
        .single();

      if (insErr) {
        console.error('insert profile error:', insErr);
        return NextResponse.json({ ok:false, reason:'db_error', detail: insErr.message }, { status: 500 });
      }
      userId = created.id;
    } else if (emailRow.username !== u) {
      // update username for same email
      const { error: upErr } = await supabaseAdmin
        .from('profiles')
        .update({ username: u })
        .eq('id', userId);
      if (upErr) {
        console.error('update profile username error:', upErr);
        return NextResponse.json({ ok:false, reason:'db_error', detail: upErr.message }, { status: 500 });
      }
    }

    // 4) Revoke any existing pass for this event (status is TEXT now)
    const { error: revokeErr } = await supabaseAdmin
      .from('passes')
      .update({ status: 'revoked' })
      .eq('user_id', userId!)
      .eq('event_slug', eventSlug)
      .eq('status', 'active');
    if (revokeErr) {
      console.error('revoke error:', revokeErr);
      return NextResponse.json({ ok:false, reason:'db_error', detail: revokeErr.message }, { status: 500 });
    }

    // 5) Issue new pass
    const token = makeToken();
    const { error: passErr } = await supabaseAdmin
      .from('passes')
      .insert({ user_id: userId!, event_slug: eventSlug, qr_token: token, status: 'active' });
    if (passErr) {
      console.error('insert pass error:', passErr);
      return NextResponse.json({ ok:false, reason:'db_error', detail: passErr.message }, { status: 500 });
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || '';
    return NextResponse.json({ ok: true, token, cardUrl: `${base}/card/${token}` });
  } catch (err: any) {
    console.error('activate fatal:', err);
    return NextResponse.json({ ok:false, reason:'server_error', detail: String(err?.message || err) }, { status: 500 });
  }
}
