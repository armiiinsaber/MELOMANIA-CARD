export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const u = (searchParams.get('u') || '').trim().toLowerCase();
  if (!u) return NextResponse.json({ ok:false, reason:'missing u' }, { status: 400 });

  const { count, error } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('username', u);

  if (error) return NextResponse.json({ ok:false, reason:'db_error' }, { status: 500 });
  return NextResponse.json({ ok:true, available: (count ?? 0) === 0 });
}
