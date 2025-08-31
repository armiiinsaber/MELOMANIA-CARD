export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/db';

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const { token } = params;

  const { data: pass } = await supabaseAdmin
    .from('passes').select('status,event_slug,user_id')
    .eq('qr_token', token).maybeSingle();
  if (!pass) return NextResponse.json({ ok:false }, { status: 404 });

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('username')
    .eq('id', pass.user_id).maybeSingle();
  if (!profile) return NextResponse.json({ ok:false }, { status: 404 });

  return NextResponse.json({ ok:true, status: pass.status, eventSlug: pass.event_slug, username: profile.username });
}
