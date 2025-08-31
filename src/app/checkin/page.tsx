'use client';
import { useState } from 'react';
const EVENT = process.env.NEXT_PUBLIC_EVENT_SLUG as string;

export default function Checkin() {
  const [token, setToken] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg(null);
    const res = await fetch('/api/checkin', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ token, eventSlug: EVENT, adminSecret })
    });
    const j = await res.json();
    setLoading(false);
    if (j.ok) { setMsg('✅ Checked in'); setToken(''); }
    else setMsg(`❌ ${j.reason || 'Failed'}`);
  }

  return (
    <main style={{ maxWidth: 520, margin:'40px auto', padding:24 }}>
      <h1>Door Check-in</h1>
      <form onSubmit={onSubmit} style={{ display:'grid', gap:12 }}>
        <input placeholder="Scan or paste QR token" value={token} onChange={e=>setToken(e.target.value)} />
        <input placeholder="Admin secret" value={adminSecret} onChange={e=>setAdminSecret(e.target.value)} />
        <button disabled={loading || !token || !adminSecret}>{loading ? 'Checking…' : 'Check in'}</button>
      </form>
      {msg && <p style={{ marginTop:12 }}>{msg}</p>}
      <p style={{opacity:.7, marginTop:24}}>Tip: any QR scanner that pastes into a text field works.</p>
    </main>
  );
}
