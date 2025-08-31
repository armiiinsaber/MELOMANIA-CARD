export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import QRCode from 'qrcode';
import { supabaseAdmin } from '../../../lib/db';

async function getPass(token: string) {
  const { data: pass } = await supabaseAdmin
    .from('passes').select('status,event_slug,user_id')
    .eq('qr_token', token).maybeSingle();
  if (!pass) return null;

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('username')
    .eq('id', pass.user_id).maybeSingle();
  if (!profile) return null;

  return { status: pass.status, event_slug: pass.event_slug, username: profile.username };
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
        <img alt="QR" src={qrDataUrl} width={220} height={220} />
        <p style={{opacity:.7, marginTop:12}}>Show this at the door</p>
      </div>
    </main>
  );
}
