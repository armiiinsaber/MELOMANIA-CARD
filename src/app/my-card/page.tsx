'use client';

import { useState } from 'react';

export default function MyCard() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setCardUrl(null);
    setLoading(true);
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
    <main className="page">
      <section className="card">
        <h1 className="brand">MELOMANIA<span className="dot">.</span></h1>
        <div className="subtle">Find My Card</div>

        <form onSubmit={onSubmit} style={{display:'grid', gap:12}}>
          <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" placeholder="@username" value={username} onChange={e=>setUsername(e.target.value)} />
          <button className="btn" disabled={loading || !email || !username}>
            {loading ? 'Loading…' : 'Show My Card'}
          </button>
        </form>

        {msg && <div className="err">{msg}</div>}
        {cardUrl && <div className="done">Your card: <a href={cardUrl}>{cardUrl}</a></div>}
      </section>
    </main>
  );
}
