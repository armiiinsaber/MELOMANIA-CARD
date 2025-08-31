import { sql } from '@vercel/postgres';

/** Run once per cold start to ensure tables exist (simple migration). */
let initialized = false;
export async function ensureSchema() {
  if (initialized) return;
  await sql/* sql */`
    create table if not exists profiles (
      id uuid primary key default gen_random_uuid(),
      email text unique not null,
      username text unique not null,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  `;
  await sql/* sql */`
    do $$
    begin
      if not exists (select 1 from pg_type where typname = 'pass_status') then
        create type pass_status as enum ('active','checked_in','revoked');
      end if;
    end$$;
  `;
  await sql/* sql */`
    create table if not exists passes (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references profiles(id) on delete cascade,
      event_slug text not null,
      qr_token text unique not null,
      status pass_status not null default 'active',
      created_at timestamptz default now(),
      checked_in_at timestamptz
    );
  `;
  initialized = true;
}

export { sql };
