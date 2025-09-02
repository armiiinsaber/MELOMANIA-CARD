export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/db';

const RESERVED = new Set([
  'admin','melomania','melomaniaofficial','support','help','moderator','root',
  'activate','checkin','card','my-card','api','login','signup','verify','staff'
]);
const USER_RE = /^[a-z0-9._-]{3,20}$/i;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const u = (searchParams.get('u') || '').trim().toLowerCase();

  if (!u) return NextResponse.json({ ok:false, reason:'missing' }, { status: 400 });
  if (!USER_RE.test(u)) return NextResponse.json({ ok:true, available:false, reason:'invalid_pattern' });
  if (RESERVED.has(u)) return NextResponse.json({ ok:true, available:false, reason:'reserved' });

  const { count, error } = await supabaseAdmin
    .from('profiles')
    .select('id', { count:'exact', head:true })
    .eq('username', u);

  if (error) return NextResponse.json({ ok:false, reason:'db_error' }, { status: 500 });
  return NextResponse.json({ ok:true, available:(count ?? 0) === 0 });
}
