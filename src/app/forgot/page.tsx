'use client';

import { useState } from 'react';

export default function Forgot() {
  // Forgot username (via email)
  const [email, setEmail] = useState('');
  const [usernames, setUsernames] = useState<string[] | null>(null);
  const [uMsg, setUMsg] = useState<string | null>(null);
  const [uLoading, setULoading] = useState(false);

  // Forgot email (via username)
  const [username, setUsername] = useState('');
  const [hints, setHints] = useState<string[] | null>(null);
  const [eMsg, setEMsg] = useState<string | null>(null);
  const [eLoading, setELoading] = useState(false);

  async function onForgotUsername(e: React.FormEvent) {
    e.preventDefault();
    setUMsg(null); setUsernames(null); setULoading(true);
    try {
      const r = await fetch('/api/recover/username', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email })
      });
      const j = await r.json();
      if (j.ok) { setUsernames(j.usernames); }
      else { setUMsg([j.reason, j.detail].filter(Boolean).join(': ') || 'not_found'); }
    } catch (err:any) { setUMsg(String(err?.message || err)); }
    finally { setULoading(false); }
  }

  async function onForgotEmail(e: React.FormEvent) {
    e.preventDefault();
    setEMsg(null); setHints(null); setELoading(true);
    try {
      const r = await fetch('/api/recover/email-hint', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username })
      });
      const j = await r.json();
      if (j.ok) { setHints(j.hints); }
      else { setEMsg([j.reason, j.detail].filter(Boolean).join(': ') || 'not_found'); }
    } catch (err:any) { setEMsg(String(err?.message || err)); }
    finally { setELoading(false); }
  }

  return (
    <main className="page">
      <section className="card" style={{display:'grid', gap:16}}>
        <h1 className="brand">MELOMANIA<span className="dot">.</span></h1>
        <div className="subtle">Account Recovery</div>

        {/* Forgot username */}
        <div style={{border:'1px solid #1e1e22', borderRadius:12, padding:16}}>
          <h3 style={{marginTop:0}}>I forgot my username</h3>
          <form onSubmit={onForgotUsername} style={{display:'grid', gap:10}}>
            <input className="input" type="email" placeholder="Email you used" value={email}
                   onChange={e=>setEmail(e.target.value)} required />
            <button className="btn" disabled={uLoading || !email}>
              {uLoading ? 'Looking…' : 'Show my username'}
            </button>
          </form>
          {uMsg && <div className="err">{uMsg}</div>}
          {usernames && (
            <div className="done">
              Your username{usernames.length>1?'s':''}: <b>{usernames.join(', ')}</b>
              <div style={{marginTop:6}}>
                Proceed to <a href="/my-card">Find My Card</a>
              </div>
            </div>
          )}
        </div>

        {/* Forgot email */}
        <div style={{border:'1px solid #1e1e22', borderRadius:12, padding:16}}>
          <h3 style={{marginTop:0}}>I forgot which email I used</h3>
          <form onSubmit={onForgotEmail} style={{display:'grid', gap:10}}>
            <input className="input" placeholder="@username" value={username}
                   onChange={e=>setUsername(e.target.value)} required />
            <button className="btn" disabled={eLoading || !username}>
              {eLoading ? 'Looking…' : 'Show email hint'}
            </button>
          </form>
          {eMsg && <div className="err">{eMsg}</div>}
          {hints && (
            <div className="done">
              Try these email(s): <b>{hints.join(', ')}</b>
              <div style={{opacity:.85, marginTop:6}}>Use the right one on <a href="/my-card">Find My Card</a>.</div>
            </div>
          )}
        </div>

        <div className="done" style={{opacity:.85}}>
          Need to start over? <a href="/activate">Activate a card</a>
        </div>
      </section>
    </main>
  );
}
