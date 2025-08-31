import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '../../../../lib/db';

export async function GET(_: Request, { params }: { params: { token: string } }) {
  await ensureSchema();
  const { token } = params;

  const { rows } = await sql/* sql */`
    select p.status, p.event_slug, pr.username
    from passes p
    join profiles pr on pr.id = p.user_id
    where p.qr_token = ${token}
    limit 1;
  `;
  if (rows.length === 0) return NextResponse.json({ ok:false }, { status: 404 });

  const r = rows[0];
  return NextResponse.json({ ok:true, status: r.status, eventSlug: r.event_slug, username: r.username });
}
