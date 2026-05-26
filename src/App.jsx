import React, { useEffect, useState } from "react";

export default function App() {
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    async function carregar() {
      const res = await fetch("https://mekinebet.onrender.com/api/signals");
      const data = await res.json();
      setSignals(data.activeSignals || []);
    }

    carregar();
  }, []);

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "white", padding: 20 }}>
      <h1>MekineBet AO VIVO</h1>
      <h2>Sinais: {signals.length}</h2>

      {signals.map((s) => (
        <div key={s.id} style={{ background: "#111827", padding: 20, marginTop: 20, border: "1px solid #00ffcc" }}>
          <h2>{s.match}</h2>
          <p>Liga: {s.league}</p>
          <p>Placar: {s.score}</p>
          <p>Mercado: {s.market}</p>
          <p>Odd: {s.odd}</p>
          <p>Status: {s.status}</p>
        </div>
      ))}
    </div>
  );
}
