export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/db';
import { CheckinSchema } from '../../../lib/validation';

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CheckinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false, errors: parsed.error.format() }, { status: 400 });

  const { token, eventSlug, adminSecret } = parsed.data;
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ ok:false, reason:'unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin.from('passes')
    .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
    .eq('qr_token', token).eq('event_slug', eventSlug).eq('status', 'active')
    .select('id');

  if (error) return NextResponse.json({ ok:false, reason:'db_error' }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ ok:false, reason:'not_found_or_already_checked' }, { status: 404 });

  return NextResponse.json({ ok:true });
}
