import React, { useEffect, useMemo, useState } from "react";

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const [ultimoAlerta, setUltimoAlerta] = useState("");
  const [popupAlerta, setPopupAlerta] = useState(null);

  async function carregar() {
    try {
      const res = await fetch("https://mekinebet.onrender.com/api/signals");
      const data = await res.json();
      const novos = data.activeSignals || [];

      setSignals(novos);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));

      const alerta = novos.find(
        (s) =>
          s.source === "api-sports-live" &&
          (s.alert?.includes("IMINENTE") ||
            (s.confidence || 0) >= 85 ||
            (s.pressure || 0) >= 88)
      );

      if (alerta && alerta.id !== ultimoAlerta) {
        setUltimoAlerta(alerta.id);
        setPopupAlerta(alerta);

        const audio = new Audio(
          "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
        );

        audio.volume = 0.45;
        audio.play().catch(() => {});

        setTimeout(() => {
          setPopupAlerta(null);
        }, 9000);
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

  function isLiveReal(item) {
    return item.type === "live" && item.source === "api-sports-live";
  }

  function isVipLiberado(item) {
    return (
      (item.confidence || 70) >= 82 ||
      item.alert?.includes("IMINENTE") ||
      item.alert?.includes("GOL")
    );
  }

  const sinaisFiltrados = useMemo(() => {
    let filtrados = signals.filter((item) => {
      const texto = `${item.match} ${item.league} ${item.market}`.toLowerCase();

      if (!texto.includes(busca.toLowerCase())) return false;

      if (filtro === "TODOS") return true;
      if (filtro === "LIVE") return isLiveReal(item);
      if (filtro === "HISTORICO") return !isLiveReal(item);
      if (filtro === "OVER15") return isLiveReal(item) && item.category === "over15";
      if (filtro === "OVER25") return isLiveReal(item) && item.category === "over25";
      if (filtro === "BTTS") return isLiveReal(item) && item.category === "btts";
      if (filtro === "TOP IA") return (item.confidence || 70) >= 82;
      if (filtro === "VIP") return isVipLiberado(item);
      if (filtro === "ALERTA") return isLiveReal(item) && item.alert?.includes("GOL");

      return true;
    });

    filtrados.sort((a, b) => {
      const alertaA = a.alert?.includes("IMINENTE") ? 1000 : 0;
      const alertaB = b.alert?.includes("IMINENTE") ? 1000 : 0;

      const scoreA = alertaA + (a.confidence || 70) * 2 + (a.pressure || 70);
      const scoreB = alertaB + (b.confidence || 70) * 2 + (b.pressure || 70);

      return scoreB - scoreA;
    });

    return filtrados;
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
            50% { transform: scale(1.015); }
            100% { transform: scale(1); }
          }

          @keyframes livePulse {
            0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.8); }
            70% { box-shadow: 0 0 0 10px rgba(220,38,38,0); }
            100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
          }

          @keyframes popupIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <div style={page}>
        {popupAlerta && (
          <div style={popup}>
            <button onClick={() => setPopupAlerta(null)} style={popupClose}>
              ×
            </button>

            <h2 style={{ margin: 0 }}>🚨 ALERTA IA</h2>
            <p style={{ fontSize: 20, fontWeight: "bold" }}>
              {popupAlerta.alert || "GOL IMINENTE"}
            </p>
            <p>{popupAlerta.match}</p>
            <p>
              {popupAlerta.market} • IA {popupAlerta.confidence || 70}% •
              Pressão {popupAlerta.pressure || 70}%
            </p>
          </div>
        )}

        <h1 style={title}>MekineBet AO VIVO</h1>

        <div style={statusGrid}>
          <div style={statusBox}>🔴 Live real: {liveCount}</div>
          <div style={statusBox}>🚨 Alertas: {alertCount}</div>
          <div style={statusBox}>👑 VIP visual ativo</div>
          <div style={statusBox}>🔄 Atualizado: {lastUpdate || "carregando..."}</div>
        </div>

        <h2>Sinais: {sinaisFiltrados.length}</h2>

        {liveCount === 0 && filtro === "TODOS" && (
          <div style={warningBox}>
            <p>
              📊 Mostrando base IA e histórico. Nenhum LIVE real disponível neste
              momento.
            </p>

            <div style={noticeButtons}>
              <button onClick={() => setFiltro("LIVE")} style={activeBtn}>
                Ver somente LIVE
              </button>

              <button onClick={carregar} style={btnStyle}>
                Atualizar agora
              </button>
            </div>
          </div>
        )}

        <div style={filters}>
          {[
            "LIVE",
            "ALERTA",
            "OVER15",
            "OVER25",
            "BTTS",
            "HISTORICO",
            "TOP IA",
            "VIP",
            "TODOS"
          ].map((btn) => (
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

        {!loading && sinaisFiltrados.length === 0 && (
          <div style={emptyBox}>
            <p>Nenhum sinal encontrado nesse filtro.</p>

            <div style={noticeButtons}>
              <button onClick={() => setFiltro("TODOS")} style={activeBtn}>
                Ver base IA
              </button>

              <button onClick={carregar} style={btnStyle}>
                Atualizar agora
              </button>
            </div>
          </div>
        )}

        {sinaisFiltrados.map((item) => {
          const liveReal = isLiveReal(item);
          const golIminente = item.alert?.includes("IMINENTE");
          const topIa = (item.confidence || 70) >= 82;
          const vipLiberado = isVipLiberado(item);
          const bloqueado = !vipLiberado && filtro !== "TODOS" && filtro !== "HISTORICO";

          return (
            <div
              key={item.id}
              style={{
                ...card,
                border: golIminente
                  ? "2px solid #ff0000"
                  : vipLiberado
                  ? "2px solid #facc15"
                  : topIa
                  ? "2px solid #22c55e"
                  : "1px solid #00ffcc",
                boxShadow: golIminente
                  ? "0 0 30px rgba(255,0,0,0.85)"
                  : vipLiberado
                  ? "0 0 24px rgba(250,204,21,0.35)"
                  : "0 0 15px rgba(0,255,204,0.15)",
                animation: golIminente ? "pulseCard 1s infinite" : "none",
                position: "relative"
              }}
            >
              {bloqueado && (
                <div style={vipOverlay}>
                  <h2>🔒 SINAL VIP</h2>
                  <p>Este sinal fica disponível no plano VIP.</p>
                  <button style={vipButton}>Liberar VIP</button>
                </div>
              )}

              <div style={header}>
                <div style={teams}>
                  {item.logoHome && <img src={item.logoHome} alt="" style={logo} />}

                  <div>
                    <h2 style={matchTitle}>{item.match}</h2>
                    <p style={league}>{item.league}</p>
                  </div>

                  {item.logoAway && <img src={item.logoAway} alt="" style={logo} />}
                </div>

                <div style={liveReal ? liveBadge : historyBadge}>
                  {liveReal ? "🔴 AO VIVO" : "📊 BASE"}
                </div>
              </div>

              {vipLiberado && <div style={vipBadge}>👑 VIP LIBERADO</div>}
              {topIa && <div style={topIaBadge}>🔥 TOP IA</div>}
              {golIminente && <div style={dangerBadge}>🚨 GOL IMINENTE</div>}

              <div style={infoGrid}>
                <div><b>⚽ Placar:</b> {item.score}</div>
                <div><b>🎯 Mercado:</b> {item.market}</div>
                <div><b>💰 Odd:</b> {item.odd}</div>
                <div><b>⏱️ Minuto:</b> {liveReal ? `${item.minute}'` : "Pré/Base"}</div>
                <div><b>🤖 IA:</b> {item.confidence || 70}%</div>
                <div><b>🔥 Pressão:</b> {item.pressure || 70}%</div>
                <div><b>📢 Alerta:</b> {item.alert || "MONITORAMENTO IA"}</div>
              </div>

              <div style={barBg}>
                <div
                  style={{
                    ...barFill,
                    width: `${item.confidence || 70}%`,
                    background: vipLiberado ? "#facc15" : topIa ? "#22c55e" : "#00ffcc"
                  }}
                />
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

const popup = {
  position: "fixed",
  top: 20,
  right: 20,
  zIndex: 9999,
  background: "#7f1d1d",
  border: "2px solid #ff0000",
  color: "white",
  padding: 20,
  borderRadius: 18,
  width: "min(420px, calc(100% - 40px))",
  boxShadow: "0 0 30px rgba(255,0,0,0.8)",
  animation: "popupIn 0.3s ease"
};

const popupClose = {
  position: "absolute",
  top: 8,
  right: 12,
  background: "transparent",
  border: "none",
  color: "white",
  fontSize: 28,
  cursor: "pointer"
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
  boxShadow: "0 0 15px rgba(249,115,22,0.35)"
};

const noticeButtons = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 12
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
  overflow: "hidden"
};

const vipOverlay = {
  position: "absolute",
  inset: 0,
  background: "rgba(2,6,23,0.88)",
  backdropFilter: "blur(5px)",
  zIndex: 5,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: 20
};

const vipButton = {
  background: "#facc15",
  color: "#000",
  border: "none",
  padding: "12px 22px",
  borderRadius: 12,
  fontWeight: "900",
  cursor: "pointer"
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
  fontWeight: "bold",
  animation: "livePulse 1.5s infinite"
};

const historyBadge = {
  background: "#334155",
  padding: "8px 14px",
  borderRadius: 999,
  fontWeight: "bold"
};

const vipBadge = {
  background: "#facc15",
  color: "#000",
  padding: "8px 14px",
  borderRadius: 999,
  fontWeight: "900",
  display: "inline-block",
  marginTop: 20,
  marginRight: 8
};

const topIaBadge = {
  background: "#22c55e",
  color: "#000",
  padding: "8px 14px",
  borderRadius: 999,
  fontWeight: "900",
  display: "inline-block",
  marginTop: 20,
  marginRight: 8
};

const dangerBadge = {
  background: "#ff0000",
  color: "white",
  padding: "8px 14px",
  borderRadius: 999,
  fontWeight: "900",
  display: "inline-block",
  marginTop: 20
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
