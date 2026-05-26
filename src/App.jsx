import { useEffect, useState } from "react";

export default function App() {
  const [signals, setSignals] = useState([]);

  async function carregar() {
    try {
      const response = await fetch(
        "https://mekinebet.onrender.com/api/signals"
      );

      const data = await response.json();

      setSignals(data.activeSignals || []);
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    carregar();

    const interval = setInterval(carregar, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        background: "#020617",
        minHeight: "100vh",
        color: "white",
        padding: 20,
        fontFamily: "Arial"
      }}
    >
      <h1>MekineBet AO VIVO</h1>

      <h2>Sinais: {signals.length}</h2>

      <div
        style={{
          display: "grid",
          gap: 20
        }}
      >
        {signals.map((s) => (
          <div
            key={s.id}
            style={{
              background: "#111827",
              padding: 20,
              borderRadius: 12,
              border: "1px solid #00ffcc"
            }}
          >
            <h2>{s.match}</h2>

            <p>Liga: {s.league}</p>

            <p>Placar: {s.score}</p>

            <p>Mercado: {s.market}</p>

            <p>Odd: {s.odd}</p>

            <p>Status: {s.status}</p>

            <p>Confiança: {s.confidence}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
