'use client';
import { useEffect, useState } from 'react';
const EVENT = process.env.NEXT_PUBLIC_EVENT_SLUG as string;

export default function Activate() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [avail, setAvail] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(false);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!username || username.length < 3) { setAvail(null); return; }
      const res = await fetch(`/api/username-available?u=${encodeURIComponent(username)}`);
      const j = await res.json();
      if (j.ok) setAvail(j.available); else setAvail(null);
    };
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [username]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch('/api/activate', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email, username, eventSlug: EVENT })
    });
    const j = await res.json();
    setLoading(false);
    if (j.ok) setCardUrl(j.cardUrl);
    else setError(j.reason ?? 'Something went wrong');
  };

  return (
    <main style={{ maxWidth: 520, margin: '40px auto', padding: 24 }}>
      <h1>Activate your Melomania Card</h1>
      <p style={{opacity:.8}}>Choose your Melomania username — this will appear on your card at the door.</p>
      <form onSubmit={onSubmit} style={{ display:'grid', gap:12 }}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input placeholder="Username (3–20, letters/numbers/_ . -)" value={username} onChange={e=>setUsername(e.target.value)} required />
        <small style={{ color: avail===false ? 'crimson' : 'inherit' }}>
          {avail===false && 'Username is taken'}
          {avail===true && 'Username is available'}
        </small>
        <button disabled={loading || avail===false}>{loading ? 'Issuing…' : 'Activate Card'}</button>
      </form>
      {error && <p style={{ color:'crimson', marginTop:12 }}>{error}</p>}
      {cardUrl && (
        <p style={{marginTop:16}}>
          Done. Your card is ready: <a href={cardUrl}>Open Card →</a>
        </p>
      )}
    </main>
  );
}
