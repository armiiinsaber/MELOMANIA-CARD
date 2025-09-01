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

  const cleanedUser = useMemo(
    () => username.trim().toLowerCase().replace(/\s+/g, ''),
    [username]
  );

  // live username availability
  useEffect(() => {
    let alive = true;
    setMsg(null);
    if (!cleanedUser) { setAvailable(null); return; }

    (async () => {
      try {
        setChecking(true);
        const r = await fetch(`/api/username-available?u=${encodeURIComponent(cleanedUser)}`, { cache: 'no-store' });
        const j = await r.json();
        if (!alive) return;
        setAvailable(j.ok ? j.available : null);
      } catch {
        if (!alive) return;
        setAvailable(null);
      } finally {
        if (alive) setChecking(false);
      }
    })();

    return () => { alive = false; };
  }, [cleanedUser]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setCardUrl(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email: email.trim(), username: cleanedUser })
      });
      const j = await res.json();
      if (j.ok) {
        setCardUrl(j.cardUrl);
      } else {
        // <-- show the precise reason and DB detail if present
        const pieces = [j.reason, j.detail].filter(Boolean);
        setMsg(pieces.length ? pieces.join(': ') : 'activation_failed');
      }
    } catch (err: any) {
      setMsg(String(err?.message || err) || 'network_error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: '40px auto', padding: 24 }}>
      <h1>Activate your Melomania Card</h1>
      <p>Choose your Melomania username — this will appear on your card at the door.</p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
          required
          type="email"
        />
        <input
          placeholder="@username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
          required
        />

        <div style={{ fontSize: 13, minHeight: 18, color: available === false ? '#b00' : '#0a0' }}>
          {checking ? 'Checking…' :
            available === null ? '' :
            available ? 'Username is available' : 'Username is taken'}
        </div>

        <button
          disabled={submitting || !email || !cleanedUser}
          style={{ padding: '10px 14px', border: '1px solid #222', borderRadius: 8 }}
        >
          {submitting ? 'Activating…' : 'Activate Card'}
        </button>
      </form>

      {msg && <p style={{ color: '#b00', marginTop: 12 }}>{msg}</p>}
      {cardUrl && (
        <p style={{ marginTop: 12 }}>
          Done! Your card: <a href={cardUrl}>{cardUrl}</a>
        </p>
      )}
    </main>
  );
}
