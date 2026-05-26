import React, { useEffect, useMemo, useState } from "react";

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  async function carregar() {
    try {
      const res = await fetch(
        "https://mekinebet.onrender.com/api/signals"
      );

      const data = await res.json();

      const novos = data.activeSignals || [];

      setSignals(novos);

      setLastUpdate(
        new Date().toLocaleTimeString("pt-BR")
      );
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

  function isLiveReal(item) {
    return (
      item.type === "live" &&
      item.source === "api-sports-live"
    );
  }

  const sinaisFiltrados = useMemo(() => {
    let filtrados = signals.filter((item) => {
      const texto =
        `${item.match} ${item.league} ${item.market}`.toLowerCase();

      if (!texto.includes(busca.toLowerCase())) {
        return false;
      }

      if (filtro === "TODOS") return true;

      if (filtro === "LIVE") {
        return isLiveReal(item);
      }

      if (filtro === "HISTORICO") {
        return !isLiveReal(item);
      }

      if (filtro === "OVER15") {
        return (
          isLiveReal(item) &&
          item.category === "over15"
        );
      }

      if (filtro === "OVER25") {
        return (
          isLiveReal(item) &&
          item.category === "over25"
        );
      }

      if (filtro === "BTTS") {
        return (
          isLiveReal(item) &&
          item.category === "btts"
        );
      }

      if (filtro === "TOP IA") {
        return (
          (item.confidence || 70) >= 82
        );
      }

      if (filtro === "ALERTA") {
        return (
          isLiveReal(item) &&
          item.alert?.includes("GOL")
        );
      }

      return true;
    });

    filtrados.sort((a, b) => {
      const confA = a.confidence || 70;
      const confB = b.confidence || 70;

      const pressA = a.pressure || 70;
      const pressB = b.pressure || 70;

      const scoreA =
        confA * 2 + pressA;

      const scoreB =
        confB * 2 + pressB;

      return scoreB - scoreA;
    });

    return filtrados;
  }, [signals, busca, filtro]);

  const liveCount =
    signals.filter(isLiveReal).length;

  const alertCount =
    signals.filter(
      (s) =>
        isLiveReal(s) &&
        s.alert?.includes("GOL")
    ).length;

  return (
    <div style={page}>
      <h1 style={title}>
        MekineBet AO VIVO
      </h1>

      <div style={statusGrid}>
        <div style={statusBox}>
          🔴 Live real: {liveCount}
        </div>

        <div style={statusBox}>
          🚨 Alertas: {alertCount}
        </div>

        <div style={statusBox}>
          🔄 Atualizado:{" "}
          {lastUpdate || "carregando..."}
        </div>
      </div>

      <h2>
        Sinais: {sinaisFiltrados.length}
      </h2>

      {liveCount === 0 &&
        filtro === "LIVE" && (
          <div style={warningBox}>
            <p>
              ⚠️ Nenhum jogo ao vivo detectado
              agora.
            </p>

            <div style={noticeButtons}>
              <button
                onClick={() =>
                  setFiltro("TODOS")
                }
                style={activeBtn}
              >
                Ver base IA
              </button>

              <button
                onClick={carregar}
                style={btnStyle}
              >
                Atualizar agora
              </button>
            </div>
          </div>
        )}

      {liveCount === 0 &&
        filtro === "TODOS" && (
          <div style={warningBox}>
            <p>
              📊 Mostrando base IA e histórico.
              Nenhum LIVE real disponível neste
              momento.
            </p>

            <div style={noticeButtons}>
              <button
                onClick={() =>
                  setFiltro("LIVE")
                }
                style={activeBtn}
              >
                Ver somente LIVE
              </button>

              <button
                onClick={carregar}
                style={btnStyle}
              >
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
          "TODOS"
        ].map((btn) => (
          <button
            key={btn}
            onClick={() => setFiltro(btn)}
            style={
              filtro === btn
                ? activeBtn
                : btnStyle
            }
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
        style={input}
      />

      {loading && (
        <p>Carregando sinais...</p>
      )}

      {!loading &&
        sinaisFiltrados.length === 0 && (
          <div style={emptyBox}>
            <p>
              Nenhum sinal encontrado nesse
              filtro.
            </p>

            <div style={noticeButtons}>
              <button
                onClick={() =>
                  setFiltro("TODOS")
                }
                style={activeBtn}
              >
                Ver base IA
              </button>

              <button
                onClick={carregar}
                style={btnStyle}
              >
                Atualizar agora
              </button>
            </div>
          </div>
        )}

      {sinaisFiltrados.map((item) => {
        const liveReal =
          isLiveReal(item);

        return (
          <div
            key={item.id}
            style={card}
          >
            <div style={header}>
              <div style={teams}>
                {item.logoHome && (
                  <img
                    src={item.logoHome}
                    alt=""
                    style={logo}
                  />
                )}

                <div>
                  <h2 style={matchTitle}>
                    {item.match}
                  </h2>

                  <p style={league}>
                    {item.league}
                  </p>
                </div>

                {item.logoAway && (
                  <img
                    src={item.logoAway}
                    alt=""
                    style={logo}
                  />
                )}
              </div>

              <div
                style={
                  liveReal
                    ? liveBadge
                    : historyBadge
                }
              >
                {liveReal
                  ? "🔴 AO VIVO"
                  : "📊 BASE"}
              </div>
            </div>

            {(item.confidence || 70) >=
              82 && (
              <div style={topIaBadge}>
                🔥 TOP IA
              </div>
            )}

            <div style={infoGrid}>
              <div>
                <b>⚽ Placar:</b>{" "}
                {item.score}
              </div>

              <div>
                <b>🎯 Mercado:</b>{" "}
                {item.market}
              </div>

              <div>
                <b>💰 Odd:</b>{" "}
                {item.odd}
              </div>

              <div>
                <b>⏱️ Minuto:</b>{" "}
                {liveReal
                  ? `${item.minute}'`
                  : "Pré/Base"}
              </div>

              <div>
                <b>🤖 IA:</b>{" "}
                {item.confidence || 70}%
              </div>

              <div>
                <b>🔥 Pressão:</b>{" "}
                {item.pressure || 70}%
              </div>
            </div>

            <div style={barBg}>
              <div
                style={{
                  ...barFill,
                  width: `${
                    item.confidence || 70
                  }%`
                }}
              />
            </div>

            <div style={buttons}>
              <a
                href={item.betano}
                target="_blank"
                rel="noreferrer"
                style={betano}
              >
                Betano
              </a>

              <a
                href={item.novibet}
                target="_blank"
                rel="noreferrer"
                style={novibet}
              >
                Novibet
              </a>

              <a
                href={item.bet365}
                target="_blank"
                rel="noreferrer"
                style={bet365}
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
  boxShadow:
    "0 0 15px rgba(249,115,22,0.35)"
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
  background:
    "linear-gradient(180deg,#081225,#0f172a)",
  padding: 22,
  marginBottom: 22,
  borderRadius: 18,
  border: "1px solid #00ffcc"
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
  fontWeight: "bold"
};

const historyBadge = {
  background: "#334155",
  padding: "8px 14px",
  borderRadius: 999,
  fontWeight: "bold"
};

const topIaBadge = {
  background: "#22c55e",
  color: "#000",
  padding: "8px 14px",
  borderRadius: 999,
  fontWeight: "900",
  display: "inline-block",
  marginTop: 20,
  marginBottom: 5
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
  height: "100%",
  background: "#00ffcc"
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
