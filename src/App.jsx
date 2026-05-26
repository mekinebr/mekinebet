import React, { useEffect, useMemo, useState } from "react";

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const [ultimoAlerta, setUltimoAlerta] = useState(null);

  async function carregar() {
    try {
      const res = await fetch("https://mekinebet.onrender.com/api/signals");
      const data = await res.json();

      const novos = data.activeSignals || [];
      setSignals(novos);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));

      const alerta = novos.find((s) => s.alert?.includes("IMINENTE"));

      if (alerta && alerta.id !== ultimoAlerta) {
        setUltimoAlerta(alerta.id);

        const audio = new Audio(
          "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
        );

        audio.volume = 0.4;
        audio.play().catch(() => {});

        alert(`🚨 GOL IMINENTE IA\n\n${alerta.match}\n${alerta.market}`);
      }
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
  }, [ultimoAlerta]);

  function badgeIA(conf) {
    if (conf >= 85) return { texto: "🔥 SINAL FORTE", cor: "#22c55e" };
    if (conf >= 78) return { texto: "⚡ ALTA PRESSÃO", cor: "#f59e0b" };
    return { texto: "💎 VALOR", cor: "#3b82f6" };
  }

  function isLiveReal(item) {
    return item.type === "live" && item.source === "api-sports-live";
  }

  const sinaisFiltrados = useMemo(() => {
    return signals.filter((item) => {
      const texto = `${item.match} ${item.league} ${item.market}`.toLowerCase();
      if (!texto.includes(busca.toLowerCase())) return false;

      if (filtro === "TODOS") return true;
      if (filtro === "LIVE") return isLiveReal(item);
      if (filtro === "HISTORICO") return !isLiveReal(item);
      if (filtro === "OVER15") return isLiveReal(item) && item.category === "over15";
      if (filtro === "OVER25") return isLiveReal(item) && item.category === "over25";
      if (filtro === "BTTS") return isLiveReal(item) && item.category === "btts";
      if (filtro === "ALERTA") return isLiveReal(item) && item.alert?.includes("GOL");

      return true;
    });
  }, [signals, busca, filtro]);

  const liveCount = signals.filter(isLiveReal).length;
  const alertCount = signals.filter(
    (s) => isLiveReal(s) && s.alert?.includes("GOL")
  ).length;

  return (
    <>
      <style>
        {`
          @keyframes pulseCard {
            0% { transform: scale(1); }
            50% { transform: scale(1.01); }
            100% { transform: scale(1); }
          }

          @keyframes livePulse {
            0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.8); }
            70% { box-shadow: 0 0 0 10px rgba(220,38,38,0); }
            100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
          }
        `}
      </style>

      <div style={page}>
        <h1 style={title}>MekineBet AO VIVO</h1>

        <div style={statusGrid}>
          <div style={statusBox}>🔴 Live real: {liveCount}</div>
          <div style={statusBox}>🚨 Alertas: {alertCount}</div>
          <div style={statusBox}>
            🔄 Atualizado: {lastUpdate || "carregando..."}
          </div>
        </div>

        <h2>Sinais: {sinaisFiltrados.length}</h2>

        {liveCount === 0 && filtro === "LIVE" && (
          <div style={warningBox}>
            ⚠️ Nenhum jogo ao vivo detectado agora. O sistema continua
            monitorando automaticamente.
          </div>
        )}

        {liveCount === 0 && filtro === "TODOS" && (
          <div style={warningBox}>
            📊 Mostrando base IA e histórico. Nenhum LIVE real disponível neste
            momento.
          </div>
        )}

        <div style={filters}>
          {["LIVE", "ALERTA", "OVER15", "OVER25", "BTTS", "HISTORICO", "TODOS"].map(
            (btn) => (
              <button
                key={btn}
                onClick={() => setFiltro(btn)}
                style={filtro === btn ? activeBtn : btnStyle}
              >
                {btn}
              </button>
            )
          )}
        </div>

        <input
          placeholder="Buscar jogo, liga ou mercado..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={input}
        />

        {loading && <p>Carregando sinais...</p>}

        {!loading && sinaisFiltrados.length === 0 && (
          <div style={emptyBox}>
            Nenhum sinal encontrado nesse filtro. O sistema continua monitorando.
          </div>
        )}

        {sinaisFiltrados
          .sort((a, b) => {
            const alertaA = a.alert?.includes("IMINENTE") ? 1000 : 0;
            const alertaB = b.alert?.includes("IMINENTE") ? 1000 : 0;
            return alertaB + (b.confidence || 0) - (alertaA + (a.confidence || 0));
          })
          .map((item) => {
            const badge = badgeIA(item.confidence || 70);
            const golIminente = item.alert?.includes("IMINENTE");
            const liveReal = isLiveReal(item);

            return (
              <div
                key={item.id}
                style={{
                  ...card,
                  border: golIminente ? "2px solid #ff0000" : "1px solid #00ffcc",
                  boxShadow: golIminente
                    ? "0 0 28px rgba(255,0,0,0.85)"
                    : "0 0 15px rgba(0,255,204,0.15)",
                  animation: golIminente ? "pulseCard 1s infinite" : "none"
                }}
              >
                <div style={header}>
                  <div style={teams}>
                    {item.logoHome && (
                      <img src={item.logoHome} alt="" style={logo} />
                    )}

                    <div>
                      <h2 style={matchTitle}>{item.match}</h2>
                      <p style={league}>{item.league}</p>
                    </div>

                    {item.logoAway && (
                      <img src={item.logoAway} alt="" style={logo} />
                    )}
                  </div>

                  <div style={liveReal ? liveBadge : historyBadge}>
                    {liveReal ? "🔴 AO VIVO" : "📊 BASE"}
                  </div>
                </div>

                <div style={infoGrid}>
                  <div><b>⚽ Placar:</b> {item.score}</div>
                  <div><b>🎯 Mercado:</b> {item.market}</div>
                  <div><b>💰 Odd:</b> {item.odd}</div>
                  <div><b>⏱️ Minuto:</b> {liveReal ? `${item.minute}'` : "Pré/Base"}</div>
                  <div><b>🤖 IA:</b> {item.confidence || 70}%</div>
                  <div><b>🔥 Pressão:</b> {item.pressure || 70}%</div>
                  <div><b>📡 Fonte:</b> {item.source || "MekineBet IA"}</div>
                </div>

                <div style={barBg}>
                  <div
                    style={{
                      ...barFill,
                      width: `${item.confidence || 70}%`,
                      background:
                        (item.confidence || 70) >= 85
                          ? "#22c55e"
                          : (item.confidence || 70) >= 78
                          ? "#f59e0b"
                          : "#3b82f6"
                    }}
                  />
                </div>

                <div style={{ ...badgeBox, background: badge.cor }}>
                  {badge.texto}
                </div>

                <div
                  style={{
                    ...alertBox,
                    background: golIminente ? "#ff0000" : "#dc2626"
                  }}
                >
                  {item.alert || "MONITORAMENTO IA"}
                </div>

                <div style={buttons}>
                  <a href={item.betano} target="_blank" rel="noreferrer" style={betano}>
                    Betano
                  </a>
                  <a href={item.novibet} target="_blank" rel="noreferrer" style={novibet}>
                    Novibet
                  </a>
                  <a href={item.bet365} target="_blank" rel="noreferrer" style={bet365}>
                    Bet365
                  </a>
                </div>
              </div>
            );
          })}
      </div>
    </>
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
  fontSize: "clamp(32px,6vw,58px)",
  marginBottom: 10,
  fontWeight: "900"
};

const statusGrid = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 18
};

const statusBox = {
  background: "#111827",
  border: "1px solid #00ffcc",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: "bold"
};

const warningBox = {
  background: "#7c2d12",
  border: "1px solid #f97316",
  color: "white",
  padding: 16,
  borderRadius: 14,
  marginBottom: 20,
  fontWeight: "bold",
  fontSize: 16,
  boxShadow: "0 0 15px rgba(249,115,22,0.35)"
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

const emptyBox = {
  background: "#111827",
  border: "1px solid #00ffcc",
  borderRadius: 14,
  padding: 20,
  fontWeight: "bold"
};

const card = {
  background: "linear-gradient(180deg,#081225,#0f172a)",
  padding: 22,
  marginBottom: 22,
  borderRadius: 18,
  transition: "0.25s",
  overflow: "hidden"
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
  width: 55,
  height: 55,
  objectFit: "contain",
  background: "white",
  borderRadius: "50%",
  padding: 5
};

const matchTitle = {
  color: "#00ffcc",
  fontSize: "clamp(24px,4vw,42px)",
  margin: 0,
  lineHeight: 1.1
};

const league = {
  color: "#94a3b8",
  marginTop: 10
};

const liveBadge = {
  background: "#dc2626",
  padding: "8px 14px",
  borderRadius: 999,
  fontWeight: "bold",
  animation: "livePulse 1.5s infinite"
};

const historyBadge = {
  background: "#334155",
  padding: "8px 14px",
  borderRadius: 999,
  fontWeight: "bold"
};

const infoGrid = {
  display: "grid",
  gap: 12,
  marginTop: 20,
  fontSize: "clamp(15px,2vw,21px)"
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
