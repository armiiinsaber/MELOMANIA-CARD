import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '../../../lib/db';
import { CheckinSchema } from '../../../lib/validation';

export async function POST(req: Request) {
  await ensureSchema();

  const body = await req.json();
  const parsed = CheckinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok:false, errors: parsed.error.format() }, { status: 400 });
  }

  const { token, eventSlug, adminSecret } = parsed.data;
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ ok:false, reason:'unauthorized' }, { status: 401 });
  }

  const { rowCount } = await sql/* sql */`
    update passes
    set status='checked_in', checked_in_at = now()
    where qr_token=${token} and event_slug=${eventSlug} and status='active';
  `;
  if (rowCount === 0) {
    return NextResponse.json({ ok:false, reason:'not_found_or_already_checked' }, { status: 404 });
  }

  return NextResponse.json({ ok:true });
}
