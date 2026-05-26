import { useEffect, useState } from "react";

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      const res = await fetch(
        "https://mekinebet.onrender.com/api/signals"
      );

      const data = await res.json();

      setSignals(data.activeSignals || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();

    const intervalo = setInterval(() => {
      carregar();
    }, 30000);

    return () => clearInterval(intervalo);
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
      <h1
        style={{
          color: "#00ffcc",
          marginBottom: 10
        }}
      >
        MekineBet AO VIVO
      </h1>

      <h2>Sinais: {signals.length}</h2>

      {loading && (
        <p>Carregando sinais...</p>
      )}

      {signals.map((item) => (
        <div
          key={item.id}
          style={{
            background: "#111827",
            padding: 20,
            marginTop: 20,
            borderRadius: 12,
            border: "1px solid #00ffcc",
            boxShadow: "0 0 10px rgba(0,255,204,0.2)"
          }}
        >
          <h2
            style={{
              color: "#00ffcc"
            }}
          >
            {item.match}
          </h2>

          <p>
            <b>Liga:</b> {item.league}
          </p>

          <p>
            <b>Placar:</b> {item.score}
          </p>

          <p>
            <b>Mercado:</b> {item.market}
          </p>

          <p>
            <b>Odd:</b> {item.odd}
          </p>

          <p>
            <b>Minuto:</b> {item.minute}'
          </p>

          <p>
            <b>Status:</b> {item.status}
          </p>

          <p>
            <b>Confiança IA:</b> {item.confidence}%
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 15,
              flexWrap: "wrap"
            }}
          >
            <a
              href={item.betano}
              target="_blank"
              style={{
                background: "#22c55e",
                padding: "10px 15px",
                borderRadius: 8,
                color: "white",
                textDecoration: "none",
                fontWeight: "bold"
              }}
            >
              Betano
            </a>

            <a
              href={item.novibet}
              target="_blank"
              style={{
                background: "#2563eb",
                padding: "10px 15px",
                borderRadius: 8,
                color: "white",
                textDecoration: "none",
                fontWeight: "bold"
              }}
            >
              Novibet
            </a>

            <a
              href={item.bet365}
              target="_blank"
              style={{
                background: "#f59e0b",
                padding: "10px 15px",
                borderRadius: 8,
                color: "white",
                textDecoration: "none",
                fontWeight: "bold"
              }}
            >
              Bet365
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
