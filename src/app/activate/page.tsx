'use client';

import { useEffect, useMemo, useState } from 'react';

export default function Activate() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);

  const clean = useMemo(() => username.trim().toLowerCase().replace(/\s+/g,''), [username]);

  useEffect(() => {
    let alive = true;
    setMsg(null);
    if (!clean) { setAvailable(null); return; }
    (async () => {
      try {
        setChecking(true);
        const r = await fetch(`/api/username-available?u=${encodeURIComponent(clean)}`, { cache:'no-store' });
        const j = await r.json();
        if (!alive) return;
        setAvailable(j.ok ? j.available : null);
      } finally { if (alive) setChecking(false); }
    })();
    return () => { alive = false; };
  }, [clean]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setCardUrl(null); setSubmitting(true);
    try {
      const r = await fetch('/api/activate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: email.trim(), username: clean })
      });
      const j = await r.json();
      if (j.ok) setCardUrl(j.cardUrl);
      else setMsg([j.reason, j.detail].filter(Boolean).join(': ') || 'activation_failed');
    } catch (err:any) { setMsg(String(err?.message || err)); }
    finally { setSubmitting(false); }
  }

  return (
    <main className="page">
      <section className="card">
        <h1 className="brand">MELOMANIA<span className="dot">.</span></h1>
        <div className="subtle">Access Activation</div>

        <form onSubmit={onSubmit} style={{display:'grid', gap:12}}>
          <input className="input" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input" placeholder="@username" value={username} onChange={e=>setUsername(e.target.value)} required />
          <div className={`meta ${available ? 'ok' : available === false ? 'bad' : ''}`}>
            {checking ? 'Checking…' : available === null ? ' ' : available ? 'Username is available' : 'Username is taken'}
          </div>
          <button className="btn" disabled={submitting || !email || !clean}>
            {submitting ? 'Activating…' : 'Activate Card'}
          </button>
        </form>

        {msg && <div className="err">{msg}</div>}
        {cardUrl && <div className="done">Done! Your card: <a href={cardUrl}>{cardUrl}</a></div>}
        <div className="done" style={{opacity:.85}}>Already activated? <a href="/my-card">Find my card</a></div>
        <div className="done" style={{opacity:.85}}>Forgot details? <a href="/forgot">Recover account</a></div>
      </section>
    </main>
  );
}
