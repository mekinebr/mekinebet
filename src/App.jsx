import React, { useEffect, useMemo, useState } from "react";

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtro, setFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");

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

  function badgeIA(conf) {
    if (conf >= 85)
      return {
        texto: "🔥 SINAL FORTE",
        cor: "#22c55e"
      };

    if (conf >= 78)
      return {
        texto: "⚡ ALTA PRESSÃO",
        cor: "#f59e0b"
      };

    return {
      texto: "💎 VALOR",
      cor: "#3b82f6"
    };
  }

  const sinaisFiltrados = useMemo(() => {
    return signals.filter((item) => {
      const texto =
        `${item.match} ${item.league} ${item.market}`.toLowerCase();

      const passouBusca = texto.includes(
        busca.toLowerCase()
      );

      if (!passouBusca) return false;

      if (filtro === "TODOS") return true;

      if (filtro === "LIVE")
        return item.type === "live";

      if (filtro === "OVER15")
        return item.category === "over15";

      if (filtro === "OVER25")
        return item.category === "over25";

      if (filtro === "BTTS")
        return item.category === "btts";

      return true;
    });
  }, [signals, busca, filtro]);

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
          fontSize: 50,
          marginBottom: 10
        }}
      >
        MekineBet AO VIVO
      </h1>

      <h2
        style={{
          marginBottom: 20
        }}
      >
        Sinais: {sinaisFiltrados.length}
      </h2>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20
        }}
      >
        {[
          "TODOS",
          "LIVE",
          "OVER15",
          "OVER25",
          "BTTS"
        ].map((btn) => (
          <button
            key={btn}
            onClick={() => setFiltro(btn)}
            style={{
              background:
                filtro === btn
                  ? "#00ffcc"
                  : "#111827",
              color:
                filtro === btn
                  ? "#000"
                  : "#fff",
              border: "1px solid #00ffcc",
              padding: "10px 20px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            {btn}
          </button>
        ))}
      </div>

      <input
        placeholder="Buscar jogo, liga ou mercado..."
        value={busca}
        onChange={(e) =>
          setBusca(e.target.value)
        }
        style={{
          width: "100%",
          padding: 15,
          borderRadius: 12,
          border: "1px solid #00ffcc",
          background: "#111827",
          color: "white",
          marginBottom: 30,
          fontSize: 16
        }}
      />

      {loading && (
        <p>Carregando sinais...</p>
      )}

      {sinaisFiltrados.map((item) => {
        const badge = badgeIA(
          item.confidence || 70
        );

        return (
          <div
            key={item.id}
            style={{
              background:
                "linear-gradient(180deg,#081225,#0f172a)",
              padding: 25,
              marginBottom: 25,
              borderRadius: 18,
              border: "1px solid #00ffcc",
              boxShadow:
                "0 0 15px rgba(0,255,204,0.15)"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10
              }}
            >
              <h2
                style={{
                  color: "#00ffcc",
                  fontSize: 35,
                  margin: 0
                }}
              >
                {item.match}
              </h2>

              <div
                style={{
                  background: "#dc2626",
                  padding:
                    "8px 14px",
                  borderRadius: 999,
                  fontWeight: "bold",
                  animation:
                    "pulse 1s infinite"
                }}
              >
                🔴 AO VIVO
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                display: "grid",
                gap: 12,
                fontSize: 20
              }}
            >
              <div>
                <b>Liga:</b>{" "}
                {item.league}
              </div>

              <div>
                <b>Placar:</b>{" "}
                {item.score}
              </div>

              <div>
                <b>Mercado:</b>{" "}
                {item.market}
              </div>

              <div>
                <b>Odd:</b>{" "}
                {item.odd}
              </div>

              <div>
                <b>Minuto:</b>{" "}
                {item.minute}'
              </div>

              <div>
                <b>Confiança IA:</b>{" "}
                {item.confidence}%
              </div>

              <div
                style={{
                  background: badge.cor,
                  color: "white",
                  width: "fit-content",
                  padding:
                    "10px 18px",
                  borderRadius: 10,
                  fontWeight: "bold",
                  fontSize: 18
                }}
              >
                {badge.texto}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginTop: 25
              }}
            >
              <a
                href={item.betano}
                target="_blank"
                style={{
                  background: "#22c55e",
                  padding:
                    "12px 18px",
                  borderRadius: 10,
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
                  padding:
                    "12px 18px",
                  borderRadius: 10,
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
                  padding:
                    "12px 18px",
                  borderRadius: 10,
                  color: "white",
                  textDecoration: "none",
                  fontWeight: "bold"
                }}
              >
                Bet365
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
