export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/db';
import { normalizeEmail } from '../../../../lib/utils';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const e = normalizeEmail(String(email || ''));
    if (!e) return NextResponse.json({ ok:false, reason:'missing_email' }, { status: 400 });

    // Be tolerant even if older duplicates exist: return most recent first
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('email', e)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) return NextResponse.json({ ok:false, reason:'db_error', detail:error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ ok:false, reason:'not_found' }, { status: 404 });

    // Dedup just in case
    const usernames = Array.from(new Set(data.map(r => r.username))).filter(Boolean);
    return NextResponse.json({ ok:true, usernames });
  } catch (err:any) {
    return NextResponse.json({ ok:false, reason:'server_error', detail:String(err?.message || err) }, { status: 500 });
  }
}
