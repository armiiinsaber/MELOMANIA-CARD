export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { makeToken, normalizeEmail, normalizeUsername } from '../../../lib/utils';
import { ActivateSchema } from '../../../lib/validation';
import { supabaseAdmin } from '../../../lib/db';

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = ActivateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok:false, errors: parsed.error.format() }, { status: 400 });
  }

  const { email, username, eventSlug } = parsed.data;
  const e = normalizeEmail(email);
  const u = normalizeUsername(username);

  const { data: byEmail, error: emailErr } = await supabaseAdmin
    .from('profiles').select('*').eq('email', e).maybeSingle();
  if (emailErr) return NextResponse.json({ ok:false, reason:'db_error', detail: emailErr.message }, { status: 500 });

  const { data: byUsername, error: unameErr } = await supabaseAdmin
    .from('profiles').select('*').eq('username', u).maybeSingle();
  if (unameErr) return NextResponse.json({ ok:false, reason:'db_error', detail: unameErr.message }, { status: 500 });

  if (byUsername && (!byEmail || byEmail.id !== byUsername.id)) {
    return NextResponse.json({ ok:false, reason:'username_taken' }, { status: 409 });
  }

  let userId = byEmail?.id as string | undefined;
  if (!userId) {
    const { data: created, error: insErr } = await supabaseAdmin
      .from('profiles').insert({ email: e, username: u }).select('id').single();
    if (insErr) return NextResponse.json({ ok:false, reason:'db_error', detail: insErr.message }, { status: 500 });
    userId = created.id;
  }

  const { error: revokeErr } = await supabaseAdmin
    .from('passes').update({ status: 'revoked' })
    .eq('user_id', userId).eq('event_slug', eventSlug).eq('status', 'active');
  if (revokeErr) return NextResponse.json({ ok:false, reason:'db_error', detail: revokeErr.message }, { status: 500 });

  const token = makeToken();
  const { error: passErr } = await supabaseAdmin
    .from('passes').insert({ user_id: userId, event_slug: eventSlug, qr_token: token, status: 'active' });
  if (passErr) return NextResponse.json({ ok:false, reason:'db_error', detail: passErr.message }, { status: 500 });

  const base = process.env.NEXT_PUBLIC_SITE_URL!;
  return NextResponse.json({ ok:true, token, cardUrl: `${base}/card/${token}` });
}
