import { NextResponse } from 'next/server';
import { makeToken, normalizeEmail, normalizeUsername } from '@/lib/utils';
import { ActivateSchema } from '@/lib/validation';
import { ensureSchema, sql } from '@/lib/db';

export async function POST(req: Request) {
  await ensureSchema();
  const body = await req.json();
  const parsed = ActivateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false, errors:parsed.error.format() }, { status: 400 });

  const { email, username, eventSlug } = parsed.data;
  const e = normalizeEmail(email);
  const u = normalizeUsername(username);

  // If username belongs to another email → block
  const userCheck = await sql/* sql */`
    select * from profiles where email = ${e} or username = ${u} limit 1;
  `;
  if (userCheck.rows[0] && userCheck.rows[0].email !== e && userCheck.rows[0].username === u) {
    return NextResponse.json({ ok:false, reason:'username_taken' }, { status: 409 });
  }

  // Create (or get) profile
  let userId = userCheck.rows[0]?.id as string | undefined;
  if (!userId) {
    const created = await sql/* sql */`
      insert into profiles (email, username) values (${e}, ${u}) returning id;
    `;
    userId = created.rows[0].id as string;
  }

  // Revoke previous active pass for same event
  await sql/* sql */`
    update passes set status='revoked'
    where user_id=${userId} and event_slug=${eventSlug} and status='active';
  `;

  // Issue new pass
  const token = makeToken();
  await sql/* sql */`
    insert into passes (user_id, event_slug, qr_token, status)
    values (${userId}, ${eventSlug}, ${token}, 'active');
  `;

  const base = process.env.NEXT_PUBLIC_SITE_URL!;
  return NextResponse.json({ ok:true, token, cardUrl: `${base}/card/${token}` });
}
