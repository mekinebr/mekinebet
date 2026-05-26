import React, { useEffect, useMemo, useState } from "react";

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");

  async function carregar() {
    try {
      const res = await fetch("https://mekinebet.onrender.com/api/signals");
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
    const intervalo = setInterval(carregar, 30000);
    return () => clearInterval(intervalo);
  }, []);

  function badgeIA(conf) {
    if (conf >= 85) return { texto: "🔥 SINAL FORTE", cor: "#22c55e" };
    if (conf >= 78) return { texto: "⚡ ALTA PRESSÃO", cor: "#f59e0b" };
    return { texto: "💎 VALOR", cor: "#3b82f6" };
  }

  const sinaisFiltrados = useMemo(() => {
    return signals.filter((item) => {
      const texto = `${item.match} ${item.league} ${item.market}`.toLowerCase();
      if (!texto.includes(busca.toLowerCase())) return false;

      if (filtro === "TODOS") return true;
      if (filtro === "LIVE") return item.type === "live";
      if (filtro === "OVER15") return item.category === "over15";
      if (filtro === "OVER25") return item.category === "over25";
      if (filtro === "BTTS") return item.category === "btts";
      if (filtro === "ALERTA") return item.alert?.includes("GOL");
      return true;
    });
  }, [signals, busca, filtro]);

  return (
    <div style={page}>
      <h1 style={title}>MekineBet AO VIVO</h1>

      <h2>Sinais: {sinaisFiltrados.length}</h2>

      <div style={filters}>
        {["TODOS", "LIVE", "OVER15", "OVER25", "BTTS", "ALERTA"].map((btn) => (
          <button
            key={btn}
            onClick={() => setFiltro(btn)}
            style={filtro === btn ? activeBtn : btnStyle}
          >
            {btn}
          </button>
        ))}
      </div>

      <input
        placeholder="Buscar jogo, liga ou mercado..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={input}
      />

      {loading && <p>Carregando sinais...</p>}

      {sinaisFiltrados
        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
        .map((item) => {
          const badge = badgeIA(item.confidence || 70);

          return (
            <div key={item.id} style={card}>
              <div style={header}>
                <div style={teams}>
                  {item.logoHome && <img src={item.logoHome} alt="" style={logo} />}

                  <div>
                    <h2 style={matchTitle}>{item.match}</h2>
                    <p style={league}>{item.league}</p>
                  </div>

                  {item.logoAway && <img src={item.logoAway} alt="" style={logo} />}
                </div>

                <div style={liveBadge}>🔴 AO VIVO</div>
              </div>

              <div style={infoGrid}>
                <div><b>⚽ Placar:</b> {item.score}</div>
                <div><b>🎯 Mercado:</b> {item.market}</div>
                <div><b>💰 Odd:</b> {item.odd}</div>
                <div><b>⏱️ Minuto:</b> {item.minute}'</div>
                <div><b>🤖 IA:</b> {item.confidence}%</div>
                <div><b>🔥 Pressão:</b> {item.pressure || 70}%</div>
              </div>

              <div style={barBg}>
                <div
                  style={{
                    ...barFill,
                    width: `${item.confidence || 70}%`,
                    background:
                      item.confidence >= 85
                        ? "#22c55e"
                        : item.confidence >= 78
                        ? "#f59e0b"
                        : "#3b82f6"
                  }}
                />
              </div>

              <div style={{ ...badgeBox, background: badge.cor }}>
                {badge.texto}
              </div>

              <div style={alertBox}>
                {item.alert || "MONITORAMENTO IA"}
              </div>

              <div style={buttons}>
                <a href={item.betano} target="_blank" rel="noreferrer" style={betano}>Betano</a>
                <a href={item.novibet} target="_blank" rel="noreferrer" style={novibet}>Novibet</a>
                <a href={item.bet365} target="_blank" rel="noreferrer" style={bet365}>Bet365</a>
              </div>
            </div>
          );
        })}
    </div>
  );
}

const page = {
  background: "#020617",
  minHeight: "100vh",
  color: "white",
  padding: 20,
  fontFamily: "Arial"
};

const title = {
  color: "#00ffcc",
  fontSize: 50,
  marginBottom: 10
};

const filters = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 20
};

const btnStyle = {
  background: "#111827",
  color: "#fff",
  border: "1px solid #00ffcc",
  padding: "10px 20px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold"
};

const activeBtn = {
  ...btnStyle,
  background: "#00ffcc",
  color: "#000"
};

const input = {
  width: "100%",
  padding: 15,
  borderRadius: 12,
  border: "1px solid #00ffcc",
  background: "#111827",
  color: "white",
  marginBottom: 30,
  fontSize: 16
};

const card = {
  background: "linear-gradient(180deg,#081225,#0f172a)",
  padding: 25,
  marginBottom: 25,
  borderRadius: 18,
  border: "1px solid #00ffcc",
  boxShadow: "0 0 15px rgba(0,255,204,0.15)"
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 15
};

const teams = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap"
};

const logo = {
  width: 60,
  height: 60,
  objectFit: "contain",
  background: "white",
  borderRadius: "50%",
  padding: 5
};

const matchTitle = {
  color: "#00ffcc",
  fontSize: 35,
  margin: 0
};

const league = {
  color: "#94a3b8",
  marginTop: 10
};

const liveBadge = {
  background: "#dc2626",
  padding: "8px 14px",
  borderRadius: 999,
  fontWeight: "bold"
};

const infoGrid = {
  display: "grid",
  gap: 12,
  marginTop: 20,
  fontSize: 20
};

const barBg = {
  height: 16,
  background: "#1e293b",
  borderRadius: 999,
  overflow: "hidden",
  marginTop: 20
};

const barFill = {
  height: "100%"
};

const badgeBox = {
  color: "white",
  width: "fit-content",
  padding: "10px 18px",
  borderRadius: 10,
  fontWeight: "bold",
  fontSize: 18,
  marginTop: 20
};

const alertBox = {
  background: "#dc2626",
  padding: "10px 15px",
  borderRadius: 10,
  marginTop: 15,
  fontWeight: "bold",
  width: "fit-content"
};

const buttons = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 25
};

const linkBase = {
  padding: "12px 18px",
  borderRadius: 10,
  color: "white",
  textDecoration: "none",
  fontWeight: "bold"
};

const betano = {
  ...linkBase,
  background: "#22c55e"
};

const novibet = {
  ...linkBase,
  background: "#2563eb"
};

const bet365 = {
  ...linkBase,
  background: "#f59e0b"
};
