import QRCode from 'qrcode';
import { ensureSchema, sql } from '../../../lib/db';

async function getPass(token: string) {
  await ensureSchema();
  const { rows } = await sql/* sql */`
    select p.status, p.event_slug, pr.username
    from passes p
    join profiles pr on pr.id = p.user_id
    where p.qr_token = ${token}
    limit 1;
  `;
  return rows[0] || null;
}

export default async function Card({ params }: { params: { token: string } }) {
  const pass = await getPass(params.token);
  if (!pass) return <main style={{padding:24}}>Invalid or expired card.</main>;

  const qrDataUrl = await QRCode.toDataURL(`${process.env.NEXT_PUBLIC_SITE_URL}/api/pass/${params.token}`);

  return (
    <main style={{ maxWidth: 520, margin:'40px auto', padding:24, textAlign:'center' }}>
      <h1>MELOMANIA</h1>
      <p style={{letterSpacing:2, opacity:.7}}>{String(pass.event_slug).toUpperCase()}</p>
      <div style={{ border:'1px solid #222', padding:24, borderRadius:12, marginTop:12 }}>
        <h2 style={{ margin:0 }}>@{pass.username}</h2>
        <p style={{ opacity:.7, margin:'8px 0 16px' }}>Status: {pass.status === 'active' ? 'Active' : pass.status}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="QR" src={qrDataUrl} width={220} height={220} />
        <p style={{opacity:.7, marginTop:12}}>Show this at the door</p>
      </div>
    </main>
  );
}
