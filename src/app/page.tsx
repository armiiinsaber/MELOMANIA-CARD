export default function Home() {
  return (
    <main style={{ padding: 24, maxWidth: 680, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>MELOMANIA ACCESS</h1>
      <p style={{ opacity: 0.8, marginBottom: 24 }}>
        Activate your Melomania Card and show it at the door.
      </p>

      <div style={{ display: "flex", gap: 12 }}>
        <a href="/activate" style={{ padding: "10px 14px", border: "1px solid #222", borderRadius: 8 }}>
          Activate Card →
        </a>
        <a href="/checkin" style={{ padding: "10px 14px", border: "1px solid #222", borderRadius: 8 }}>
          Door Check-in (admin)
        </a>
      </div>
    </main>
  );
}
