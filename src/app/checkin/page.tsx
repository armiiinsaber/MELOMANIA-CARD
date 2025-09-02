'use client';

import { useEffect, useState } from 'react';

export default function Checkin() {
  const [raw, setRaw] = useState('');
  const [token, setToken] = useState('');
  const [secret, setSecret] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-extract token if they paste a full URL (or leave as-is)
  useEffect(() => {
    const s = raw.trim();
    const m = s.match(/[A-Za-z0-9_-]{20,}/); // long token inside URL or plain token
    setToken(m ? m[0] : s);
  }, [raw]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          eventSlug: process.env.NEXT_PUBLIC_EVENT_SLUG,
          adminSecret: secret.trim(),
        })
      });
      const j = await res.json();
      if (j.ok) setMsg('Checked in ✅');
      else setMsg([j.reason, j.detail].filter(Boolean).join(': ') || 'failed');
    } catch (err:any) {
      setMsg(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight:'100dvh', display:'grid', placeItems:'center', padding:24 }}>
      <section style={{ width:'100%', maxWidth:560, background:'#121215', color:'#f2f3f5', border:'1px solid #1e1e22', borderRadius:20, padding:24 }}>
        <h1 style={{margin:0}}>Door Check-in</h1>
        <p style={{opacity:.85}}>Paste the QR token <em>or</em> the full card URL. Enter your admin secret.</p>
        <form onSubmit={onSubmit} style={{display:'grid', gap:12}}>
          <input
            placeholder="Paste token or card URL"
            value={raw}
            onChange={e=>setRaw(e.target.value)}
            style={{padding:12, borderRadius:12, border:'1px solid #1e1e22', background:'#0e0e12', color:'#fff'}}
          />
          <input
            placeholder="Admin secret"
            value={secret}
            onChange={e=>setSecret(e.target.value)}
            style={{padding:12, borderRadius:12, border:'1px solid #1e1e22', background:'#0e0e12', color:'#fff'}}
          />
          <button
            disabled={loading || !token || !secret}
            style={{padding:'12px 16px', borderRadius:12, border:'1px solid rgba(115,1,4,.55)', background:'rgba(115,1,4,.14)', color:'#fff'}}
          >
            {loading ? 'Checking…' : 'Check In'}
          </button>
        </form>
        {msg && <div style={{marginTop:12}}>{msg}</div>}
        <div style={{opacity:.7, fontSize:12, marginTop:8}}>
          Parsed token: <code>{token || '—'}</code>
        </div>
      </section>
    </main>
  );
}
