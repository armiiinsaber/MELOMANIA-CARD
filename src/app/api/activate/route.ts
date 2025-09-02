export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/db';
import { makeToken, normalizeEmail, normalizeUsername } from '../../../lib/utils';
import { z } from 'zod';

const RESERVED = new Set([
  'admin','melomania','melomaniaofficial','support','help','moderator','root',
  'activate','checkin','card','my-card','api','login','signup','verify','staff'
]);
const USER_RE = /^[a-z0-9._-]{3,20}$/i;

const ActivateSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  eventSlug: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ActivateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok:false, reason:'bad_request', errors: parsed.error.format() }, { status: 400 });
    }

    const e = normalizeEmail(parsed.data.email);
    const u = normalizeUsername(parsed.data.username);
    const eventSlug = parsed.data.eventSlug || process.env.NEXT_PUBLIC_EVENT_SLUG || 'melomania';

    if (!USER_RE.test(u)) return NextResponse.json({ ok:false, reason:'invalid_pattern' }, { status: 400 });
    if (RESERVED.has(u)) return NextResponse.json({ ok:false, reason:'reserved' }, { status: 409 });

    // Take the most recent row (avoids "multiple rows" error if duplicates exist)
    const { data: unameRow, error: unameErr } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', u)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (unameErr) return NextResponse.json({ ok:false, reason:'db_error', detail: unameErr.message }, { status: 500 });

    const { data: emailRow, error: emailErr } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('email', e)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (emailErr) return NextResponse.json({ ok:false, reason:'db_error', detail: emailErr.message }, { status: 500 });

    if (unameRow && (!emailRow || emailRow.id !== unameRow.id)) {
      return NextResponse.json({ ok:false, reason:'username_taken' }, { status: 409 });
    }

    let userId: string;
    if (!emailRow) {
      const { data: created, error: insErr } = await supabaseAdmin
        .from('profiles')
        .insert({ email: e, username: u })
        .select('id')
        .single();
      if (insErr) return NextResponse.json({ ok:false, reason:'db_error', detail: insErr.message }, { status: 500 });
      userId = created.id;
    } else {
      userId = emailRow.id;
      if (emailRow.username !== u) {
        const { error: upErr } = await supabaseAdmin.from('profiles').update({ username: u }).eq('id', userId);
        if (upErr) return NextResponse.json({ ok:false, reason:'db_error', detail: upErr.message }, { status: 500 });
      }
    }

    // Revoke any existing active pass for this event
    const { error: revokeErr } = await supabaseAdmin
      .from('passes')
      .update({ status:'revoked' })
      .eq('user_id', userId)
      .eq('event_slug', eventSlug)
      .eq('status','active');
    if (revokeErr) return NextResponse.json({ ok:false, reason:'db_error', detail: revokeErr.message }, { status: 500 });

    // Issue new pass
    const token = makeToken();
    const { error: passErr } = await supabaseAdmin
      .from('passes')
      .insert({ user_id: userId, event_slug: eventSlug, qr_token: token, status:'active' });
    if (passErr) return NextResponse.json({ ok:false, reason:'db_error', detail: passErr.message }, { status: 500 });

    const base = process.env.NEXT_PUBLIC_SITE_URL || '';
    return NextResponse.json({ ok:true, token, cardUrl: `${base}/card/${token}` });
  } catch (err:any) {
    return NextResponse.json({ ok:false, reason:'server_error', detail: String(err?.message || err) }, { status: 500 });
  }
}
