export default function Home() {
  return (
    <main className="page">
      <section className="card" style={{textAlign:'center'}}>
        <h1 className="brand">MELOMANIA<span className="dot">.</span></h1>
        <div className="subtle">Access</div>
        <div style={{display:'grid', gap:12, maxWidth:360, margin:'0 auto'}}>
          <a className="btn" href="/activate">Activate Card →</a>
          <a className="btn" href="/my-card">Find My Card →</a>
          <a className="btn" href="/checkin">Door Check-in (admin) →</a>
        </div>
      </section>
    </main>
  );
}
