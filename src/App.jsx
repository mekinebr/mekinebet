import { useEffect, useState } from "react";

export default function App() {
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch(
          "https://mekinebet.onrender.com/api/signals"
        );

        const data = await res.json();

        setSignals(data.activeSignals || []);
      } catch (err) {
        console.log(err);
      }
    }

    carregar();
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

      {signals.map((item) => (
        <div
          key={item.id}
          style={{
            background: "#111827",
            padding: 20,
            marginTop: 20,
            borderRadius: 12,
            border: "1px solid #00ffcc"
          }}
        >
          <h2>{item.match}</h2>

          <p>Liga: {item.league}</p>

          <p>Placar: {item.score}</p>

          <p>Mercado: {item.market}</p>

          <p>Odd: {item.odd}</p>

          <p>Status: {item.status}</p>
        </div>
      ))}
    </div>
  );
}
