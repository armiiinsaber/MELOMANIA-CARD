export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/db';
import { normalizeUsername } from '../../../../lib/utils';

function maskEmail(full: string) {
  const at = full.indexOf('@');
  if (at <= 0) return '***@***';
  const local = full.slice(0, at);
  const domain = full.slice(at + 1);
  const parts = domain.split('.');
  const tld = parts.pop() || '';
  const domRoot = parts.join('.') || '';
  const localMasked = local.slice(0, 1) + '***';
  const rootMasked = domRoot ? domRoot.slice(0, 1) + '***' : '*';
  const tldMasked = tld ? tld : '**';
  return `${localMasked}@${rootMasked}.${tldMasked}`;
}

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    const u = normalizeUsername(String(username || ''));
    if (!u) return NextResponse.json({ ok:false, reason:'missing_username' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('username', u)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) return NextResponse.json({ ok:false, reason:'db_error', detail:error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ ok:false, reason:'not_found' }, { status: 404 });

    const hints = Array.from(new Set(data.map(r => r.email))).filter(Boolean).map(maskEmail);
    return NextResponse.json({ ok:true, hints });
  } catch (err:any) {
    return NextResponse.json({ ok:false, reason:'server_error', detail:String(err?.message || err) }, { status: 500 });
  }
}
