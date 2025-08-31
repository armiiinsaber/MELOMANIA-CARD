import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '../../../lib/db';

export async function GET(req: Request) {
  await ensureSchema();
  const { searchParams } = new URL(req.url);
  const u = (searchParams.get('u') || '').trim().toLowerCase();
  if (!u) return NextResponse.json({ ok:false, reason:'missing u' }, { status: 400 });

  const { rows } = await sql/* sql */`
    select id from profiles where username = ${u} limit 1;
  `;
  return NextResponse.json({ ok:true, available: rows.length === 0 });
}
