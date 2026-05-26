import { useEffect, useState } from "react";

export default function App() {
  const [signals, setSignals] = useState([]);
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");

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

  useEffect(() => {
    carregar();

    const interval = setInterval(() => {
      carregar();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const filtrados = signals.filter((s) => {
    const texto =
      `${s.match} ${s.league} ${s.market}`.toLowerCase();

    const busca = texto.includes(search.toLowerCase());

    if (filter === "todos") return busca;

    if (filter === "live")
      return s.type === "live" && busca;

    if (filter === "prelive")
      return s.type === "prelive" && busca;

    if (filter === "over15")
      return s.category === "over15" && busca;

    if (filter === "over25")
      return s.category === "over25" && busca;

    if (filter === "btts")
      return s.category === "btts" && busca;

    if (filter === "cantos")
      return s.category === "cantos" && busca;

    if (filter === "favorito")
      return busca;

    return busca;
  });

  return (
    <div
      style={{
        background: "#020617",
        minHeight: "100vh",
        color: "white",
        padding: 30,
        fontFamily: "Arial"
      }}
    >
      <h1
        style={{
          fontSize: 48,
          fontWeight: "bold",
          marginBottom: 30
        }}
      >
        MekineBet AO VIVO
      </h1>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20
        }}
      >
        {[
          ["todos", "TODOS"],
          ["live", "LIVE"],
          ["prelive", "PRELIVE"],
          ["over15", "OVER15"],
          ["over25", "OVER25"],
          ["btts", "BTTS"],
          ["cantos", "CANTOS"],
          ["favorito", "FAVORITO"]
        ].map(([id, nome]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            style={{
              padding: "12px 20px",
              borderRadius: 12,
              border: "1px solid #00ffbf",
              background:
                filter === id ? "#00ffbf" : "transparent",
              color: filter === id ? "black" : "white",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            {nome}
          </button>
        ))}
      </div>

      <input
        placeholder="Buscar time, liga ou mercado..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: 16,
          borderRadius: 12,
          border: "1px solid #00ffbf",
          background: "#0f172a",
          color: "white",
          marginBottom: 30
        }}
      />

      <h2>Jogos ao vivo: {
        signals.filter((s) => s.type === "live").length
      }</h2>

      <h2>Sinais ativos: {signals.length}</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(350px,1fr))",
          gap: 20,
          marginTop: 30
        }}
      >
        {filtrados.map((s) => (
          <div
            key={s.id}
            style={{
              background: "#0f172a",
              border: "1px solid #00ffbf",
              borderRadius: 20,
              padding: 24
            }}
          >
            <h2 style={{ fontSize: 32 }}>
              {s.match}
            </h2>

            <p>
              <strong>Liga:</strong> {s.league}
            </p>

            <p>
              <strong>Placar:</strong> {s.score}
            </p>

            <p>
              <strong>Mercado:</strong> {s.market}
            </p>

            <p>
              <strong>Odd:</strong> {s.odd}
            </p>

            <p>
              <strong>Status:</strong> {s.status}
            </p>

            <p>
              <strong>Favorito:</strong> {s.favorito}
            </p>

            <p>
              <strong>Confiança:</strong> {s.confidence}%
            </p>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 20,
                flexWrap: "wrap"
              }}
            >
              <a
                href={s.betano}
                target="_blank"
                style={{
                  background: "#16a34a",
                  color: "white",
                  padding: "10px 14px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontWeight: "bold"
                }}
              >
                Betano
              </a>

              <a
                href={s.novibet}
                target="_blank"
                style={{
                  background: "#2563eb",
                  color: "white",
                  padding: "10px 14px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontWeight: "bold"
                }}
              >
                Novibet
              </a>

              <a
                href={s.bet365}
                target="_blank"
                style={{
                  background: "#f59e0b",
                  color: "white",
                  padding: "10px 14px",
                  borderRadius: 10,
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
    </div>
  );
}
