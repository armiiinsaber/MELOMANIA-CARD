'use client';

import { useState } from 'react';

export default function MyCard() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setCardUrl(null); setLoading(true);
    try {
      const r = await fetch('/api/my-card', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ email, username })
      });
      const j = await r.json();
      if (j.ok) setCardUrl(j.cardUrl);
      else setMsg([j.reason, j.detail].filter(Boolean).join(': ') || 'not_found');
    } catch (err:any) {
      setMsg(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight:'100dvh', display:'grid', placeItems:'center', padding:24 }}>
      <section style={{ width:'100%', maxWidth:560, background:'#121215', color:'#f2f3f5', border:'1px solid #1e1e22', borderRadius:20, padding:24 }}>
        <h1 style={{margin:0}}>Find My Card</h1>
        <p style={{opacity:.85}}>Enter the same email & username you used to activate.</p>
        <form onSubmit={onSubmit} style={{display:'grid', gap:12}}>
          <input style={{padding:12, borderRadius:12, border:'1px solid #1e1e22', background:'#0e0e12', color:'#fff'}} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input style={{padding:12, borderRadius:12, border:'1px solid #1e1e22', background:'#0e0e12', color:'#fff'}} placeholder="@username" value={username} onChange={e=>setUsername(e.target.value)} />
          <button style={{padding:'12px 16px', borderRadius:12, border:'1px solid rgba(115,1,4,.55)', background:'rgba(115,1,4,.14)', color:'#fff' }} disabled={loading || !email || !username}>
            {loading ? 'Loading…' : 'Show My Card'}
          </button>
        </form>
        {msg && <div style={{color:'#ff6a6a', marginTop:10}}>{msg}</div>}
        {cardUrl && <div style={{marginTop:12}}>Your card: <a href={cardUrl}>{cardUrl}</a></div>}
      </section>
    </main>
  );
}
