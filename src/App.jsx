import React, { useEffect, useMemo, useState } from "react";

const API_URL = "https://mekinebet.onrender.com/api/signals";

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const [ultimoAlerta, setUltimoAlerta] = useState("");
  const [popupAlerta, setPopupAlerta] = useState(null);

  async function ativarNotificacoes() {
    try {
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/sw.js");
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function mostrarPush(alerta) {
    try {
      if (Notification.permission !== "granted") return;
      const registration = await navigator.serviceWorker.ready;

      registration.showNotification("🚨 MekineBet ALERTA", {
        body: `${alerta.match} | ${alerta.market} | IA ${alerta.confidence || 70}%`,
        icon: "/logo192.png",
        badge: "/logo192.png",
        vibrate: [200, 100, 200],
        tag: "mekine-alerta"
      });
    } catch (err) {
      console.log(err);
    }
  }

  async function carregar() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);

      const res = await fetch(API_URL, {
        signal: controller.signal,
        cache: "no-store"
      });

      clearTimeout(timer);

      const data = await res.json();
      const novos = data.activeSignals || [];

      setSignals(novos);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));

      const alerta = novos.find((s) => {
        const status = mercadoStatus(s);
        return (
          s.source === "api-sports-live" &&
          (
            status.includes("GOL IMINENTE") ||
            status.includes("PRESSÃO EXTREMA") ||
            status.includes("OVER MUITO FORTE") ||
            (s.confidence || 0) >= 86 ||
            (s.pressure || 0) >= 88
          )
        );
      });

      if (alerta && alerta.id !== ultimoAlerta) {
        setUltimoAlerta(alerta.id);
        setPopupAlerta(alerta);
        mostrarPush(alerta);

        const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
        audio.volume = 0.45;
        audio.play().catch(() => {});

        setTimeout(() => setPopupAlerta(null), 9000);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    ativarNotificacoes();
    carregar();

    const intervalo = setInterval(() => {
      if (!document.hidden) carregar();
    }, 20000);

    return () => clearInterval(intervalo);
  }, []);

  function isLiveReal(item) {
    return item.type === "live" && item.source === "api-sports-live";
  }

  function totalGols(item) {
    const nums = String(item.score || "0-0").match(/\d+/g) || [0, 0];
    return Number(nums[0] || 0) + Number(nums[1] || 0);
  }

  function minuto(item) {
    return Number(String(item.minute || 0).replace(/\D/g, "")) || 0;
  }

  function statsDoJogo(item) {
    const conf = item.confidence || 70;
    const press = item.pressure || 70;
    const gols = totalGols(item);

    return {
      posse: item.possession || Math.min(68, Math.max(42, conf - 18)),
      finalizacoes: item.shots || Math.max(6, Math.round(press / 8 + gols * 2)),
      ataques: item.attacks || Math.max(18, Math.round(press / 2)),
      cantos: item.corners || Math.max(2, Math.round(press / 18)),
      cartoes: item.cards || Math.max(1, Math.round((100 - conf) / 25)),
      perigosos: item.dangerousAttacks || Math.max(8, Math.round(press / 3))
    };
  }

  function mercadoStatus(item) {
    const gols = totalGols(item);
    const min = minuto(item);
    const pressure = item.pressure || 70;
    const confidence = item.confidence || 70;
    const stats = statsDoJogo(item);
    const market = String(item.market || "").toLowerCase();

    if (market.includes("0.5") || market.includes("0,5")) {
      if (gols >= 1) return "✅ GREEN";
      if (min >= 12 && pressure >= 70 && stats.ataques >= 28) return "🔥 GOL IMINENTE";
      if (min >= 30 && pressure >= 60) return "📈 OVER FORTE";
      return "👀 MONITORANDO";
    }

    if (market.includes("1.5") || market.includes("1,5")) {
      if (gols >= 2) return "✅ GREEN";
      if (gols === 1 && min <= 68 && pressure >= 72) return "🔥 2º GOL MUITO FORTE";
      if (gols === 0 && min >= 35 && pressure < 55) return "❄️ JOGO FRIO";
      if (stats.finalizacoes >= 8 && stats.ataques >= 32) return "⚡ PRESSÃO ALTA";
      return "📊 MONITORANDO";
    }

    if (market.includes("2.5") || market.includes("2,5")) {
      if (gols >= 3) return "✅ GREEN";
      if (gols >= 2 && pressure >= 74 && min <= 82) return "🔥 OVER MUITO FORTE";
      if (min >= 60 && stats.perigosos >= 20) return "⚡ ATAQUE TOTAL";
      return "📊 MONITORANDO";
    }

    if (market.includes("3.5") || market.includes("3,5")) {
      if (gols >= 4) return "✅ GREEN";
      if (gols >= 3 && pressure >= 82) return "🚨 JOGO MALUCO";
      if (gols <= 1 && min >= 65) return "📉 RISCO ALTO";
      return "📉 RISCO MÉDIO";
    }

    if (market.includes("btts") || market.includes("ambas")) {
      if (gols >= 2) return "🔥 BTTS QUENTE";
      if (pressure >= 75 && stats.ataques >= 30) return "⚡ AMBAS PRESSIONANDO";
      return "👀 OBSERVAÇÃO";
    }

    if (market.includes("under") && (market.includes("cart") || market.includes("card"))) {
      if (stats.cartoes <= 2 && min >= 60) return "🟢 UNDER CARTÕES BOM";
      if (stats.cartoes >= 4) return "🔴 RISCO UNDER CARTÕES";
      return "📊 UNDER CARTÕES";
    }

    if (market.includes("cart") || market.includes("card")) {
      if (min >= 55 && pressure >= 72) return "🟨 JOGO PEGADO";
      if (min >= 70) return "🚨 RISCO DE CARTÃO";
      return "📊 CARTÕES AO VIVO";
    }

    if (market.includes("under") && (market.includes("canto") || market.includes("corner"))) {
      if (stats.cantos <= 5 && min >= 60) return "🟢 UNDER CANTOS BOM";
      if (pressure >= 78) return "🔴 RISCO UNDER CANTOS";
      return "📊 UNDER CANTOS";
    }

    if (market.includes("canto") || market.includes("corner")) {
      if (pressure >= 78) return "🚩 PRESSÃO EM ESCANTEIOS";
      if (stats.ataques >= 35) return "⚡ OVER CANTOS";
      return "📈 CANTOS AO VIVO";
    }

    if (confidence >= 84 && pressure >= 80) return "🧠 IA DETECTOU VALOR";

    return "📊 MONITORAMENTO IA";
  }

  function categoriaMercado(item) {
    const market = String(item.market || "").toLowerCase();

    if (market.includes("0.5") || market.includes("0,5")) return "OVER 0,5";
    if (market.includes("1.5") || market.includes("1,5")) return "OVER 1,5";
    if (market.includes("2.5") || market.includes("2,5")) return "OVER 2,5";
    if (market.includes("3.5") || market.includes("3,5")) return "OVER 3,5";
    if (market.includes("under") && (market.includes("cart") || market.includes("card"))) return "UNDER CARTÕES";
    if (market.includes("cart") || market.includes("card")) return "OVER CARTÕES";
    if (market.includes("under") && (market.includes("canto") || market.includes("corner"))) return "UNDER CANTOS";
    if (market.includes("canto") || market.includes("corner")) return "OVER CANTOS";
    if (market.includes("btts") || market.includes("ambas")) return "BTTS";

    return item.category?.toUpperCase() || "OUTROS";
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

      const cat = categoriaMercado(item);

      if (filtro === "TODOS") return true;
      if (filtro === "LIVE") return isLiveReal(item);
      if (filtro === "HISTORICO") return !isLiveReal(item);
      if (filtro === "OVER05") return cat === "OVER 0,5";
      if (filtro === "OVER15") return cat === "OVER 1,5";
      if (filtro === "OVER25") return cat === "OVER 2,5";
      if (filtro === "OVER35") return cat === "OVER 3,5";
      if (filtro === "CARTÕES") return cat.includes("CARTÕES");
      if (filtro === "CANTOS") return cat.includes("CANTOS");
      if (filtro === "BTTS") return cat === "BTTS";
      if (filtro === "TOP IA") return (item.confidence || 70) >= 82;
      if (filtro === "VIP") return isVipLiberado(item);
      if (filtro === "ALERTA") return mercadoStatus(item).includes("🔥") || mercadoStatus(item).includes("🚨");

      return true;
    });

    filtrados.sort((a, b) => {
      const scoreA =
        (mercadoStatus(a).includes("🔥") ? 1000 : 0) +
        (a.confidence || 70) * 2 +
        (a.pressure || 70);

      const scoreB =
        (mercadoStatus(b).includes("🔥") ? 1000 : 0) +
        (b.confidence || 70) * 2 +
        (b.pressure || 70);

      return scoreB - scoreA;
    });

    return filtrados;
  }, [signals, busca, filtro]);

  const liveCount = signals.filter(isLiveReal).length;
  const alertCount = signals.filter((s) => mercadoStatus(s).includes("🔥") || mercadoStatus(s).includes("🚨")).length;

  return (
    <div style={page}>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: .45; }
            100% { opacity: 1; }
          }
        `}
      </style>

      {popupAlerta && (
        <div style={popup}>
          <b>🚨 ALERTA IA</b>
          <div>{popupAlerta.match}</div>
          <small>{popupAlerta.market} • IA {popupAlerta.confidence || 70}%</small>
        </div>
      )}

      <header style={topBar}>
        <div>
          <h1 style={title}>MekineBet AO VIVO</h1>
          <div style={subTitle}>🟢 Scanner live • odds • pressão • mercados</div>
        </div>

        <div style={statusWrap}>
          <span style={pill}>🔴 Live: {liveCount}</span>
          <span style={pill}>🚨 Alertas: {alertCount}</span>
          <span style={pill}>👑 VIP</span>
          <span style={pill}>🕘 {lastUpdate || "carregando..."}</span>
        </div>
      </header>

      {liveCount === 0 && (
        <div style={notice}>
          📊 Nenhum LIVE real disponível agora. Mostrando base IA/histórico enquanto monitora automaticamente.
        </div>
      )}

      <div style={filters}>
        {[
          ["TODOS", "TODOS"],
          ["LIVE", "LIVE"],
          ["ALERTA", "ALERTA"],
          ["OVER05", "O0,5"],
          ["OVER15", "O1,5"],
          ["OVER25", "O2,5"],
          ["OVER35", "O3,5"],
          ["CARTÕES", "CART"],
          ["CANTOS", "CANT"],
          ["BTTS", "BTTS"],
          ["TOP IA", "TOP"],
          ["VIP", "VIP"],
          ["HISTORICO", "HIST"]
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFiltro(value)}
            style={filtro === value ? activeBtn : btnStyle}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        placeholder="🔍  Buscar jogo, liga ou mercado..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={search}
      />

      {loading ? (
        <div style={empty}>Carregando sinais...</div>
      ) : sinaisFiltrados.length === 0 ? (
        <div style={empty}>Nenhum sinal encontrado nesse filtro.</div>
      ) : (
        <main style={grid}>
          {sinaisFiltrados.map((item, index) => {
            const liveReal = isLiveReal(item);
            const vip = isVipLiberado(item);
            const stats = statsDoJogo(item);
            const status = mercadoStatus(item);
            const cat = categoriaMercado(item);

            return (
              <section key={item.id || index} style={card}>
                <div style={cardHeader}>
                  <div style={teams}>
                    <div>
                      <h2 style={match}>{item.match}</h2>
                      <p style={league}>🦁 {item.league}</p>
                    </div>
                  </div>

                  <div style={rightBadges}>
                    <span style={baseBadge}>{liveReal ? "AO VIVO" : "BASE"}</span>
                    {vip && <span style={vipBadge}>VIP</span>}
                    <span style={marketBadge}>{cat}</span>
                  </div>
                </div>

                <div style={bodyGrid}>
                  <div style={mainInfo}>
                    <div style={scoreBox}>
                      <span>Placar</span>
                      <b>{item.score || "0-0"}</b>
                      <small>{liveReal ? `${item.minute || 0}'` : "Pré/Base"}</small>
                    </div>

                    <div style={signalBox}>
                      <b>{item.market}</b>
                      <span>Status: {status}</span>
                      <span style={oddBlink}>Odd: {item.odd || "1.72"}</span>
                    </div>
                  </div>

                  <div style={miniMap}>
                    <div style={field}>
                      <div style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${item.pressure || 70}%`,
                        background: "linear-gradient(90deg,rgba(255,255,0,.10),rgba(255,0,0,.18))"
                      }} />

                      <div style={midLine}></div>
                      <div style={areaLeft}></div>
                      <div style={areaRight}></div>
                      <div style={{ ...dot, left: `${Math.min(82, stats.ataques)}%`, top: "44%" }} />
                      <div style={{ ...dot2, left: `${100 - Math.min(82, stats.ataques)}%`, top: "56%" }} />
                    </div>

                    <div style={statsGrid}>
                      <span>Posse {stats.posse}%</span>
                      <span>Final. {stats.finalizacoes}</span>
                      <span>Ataques {stats.ataques}</span>
                      <span>Cantos {stats.cantos}</span>
                      <span>Cartões {stats.cartoes}</span>
                      <span>Perig. {stats.perigosos}</span>
                    </div>
                  </div>
                </div>

                <div style={bars}>
                  <label>IA {item.confidence || 70}%</label>
                  <div style={barBg}>
                    <div style={{ ...bar, width: `${item.confidence || 70}%` }} />
                  </div>

                  <label>Pressão {item.pressure || 70}%</label>
                  <div style={barBg}>
                    <div style={{ ...barGold, width: `${item.pressure || 70}%` }} />
                  </div>
                </div>

                <div style={momentumBox}>
                  <div style={momentumTitle}>Momentum IA</div>
                  <div style={momentumBar}>
                    <div style={{ ...momentumFill, width: `${item.pressure || 70}%` }} />
                  </div>
                  <div style={momentumInfo}>
                    ⚡ {status.includes("🔥") || status.includes("🚨")
                      ? "Alerta forte detectado"
                      : "Ataque perigoso detectado"}
                  </div>
                </div>

                <div style={footer}>
                  <button style={betano}>Betano</button>
                  <button style={novibet}>Novibet</button>
                  <button style={bet365}>Bet365</button>
                  <button style={vipBtn}>VIP</button>
                </div>
              </section>
            );
          })}
        </main>
      )}
    </div>
  );
}

const page = {
  minHeight: "100vh",
  background: "#06100b",
  color: "#fff",
  padding: 12,
  fontFamily: "Arial, sans-serif",
  overflowX: "hidden"
};

const topBar = {
  background: "linear-gradient(180deg,#07160f,#081018)",
  border: "1px solid #00ff87",
  borderRadius: 10,
  padding: 6,
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 5,
  boxShadow: "0 0 15px rgba(0,255,135,.06)"
};

const title = {
  color: "#00ff87",
  fontSize: "clamp(22px,2.5vw,42px)",
  margin: 0,
  fontWeight: 900,
  lineHeight: 1
};

const subTitle = { color: "#cbd5e1", marginTop: 4 };
const statusWrap = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const pill = { border: "1px solid #00ff87", background: "#06150d", padding: "10px 14px", borderRadius: 8, fontWeight: 900, fontSize: 15 };

const notice = {
  background: "linear-gradient(90deg,#451a03,#5b2206)",
  border: "1px solid #ff8a00",
  padding: 14,
  borderRadius: 8,
  marginBottom: 12,
  fontWeight: 900
};

const filters = {
  display: "grid",
  gridTemplateColumns: "repeat(13, minmax(0, 1fr))",
  gap: 4,
  marginBottom: 6,
  width: "100%",
  overflow: "hidden"
};

const btnStyle = {
  background: "#08140d",
  color: "#fff",
  border: "1px solid #00ff87",
  padding: "8px 2px",
  borderRadius: 7,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 10,
  whiteSpace: "nowrap",
  textAlign: "center",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis"
};

const activeBtn = {
  ...btnStyle,
  background: "#00ff87",
  color: "#001b0b",
  boxShadow: "0 0 10px rgba(0,255,135,.30)"
};

const search = {
  width: "100%",
  boxSizing: "border-box",
  background: "#07131a",
  border: "1px solid #00ff87",
  color: "#fff",
  padding: 15,
  borderRadius: 8,
  marginBottom: 12,
  fontSize: 16
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
  gap: 8,
  alignItems: "start"
};

const card = {
  background: "linear-gradient(180deg,#07140d,#081018)",
  border: "1px solid rgba(0,255,135,.30)",
  borderRadius: 10,
  padding: 7,
  minHeight: 185,
  boxShadow: "0 0 10px rgba(0,255,135,.06)",
  overflow: "hidden",
  transition: ".25s"
};

const cardHeader = { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 10 };
const teams = { display: "flex", gap: 8, alignItems: "center" };
const match = { color: "#00ff87", fontSize: "clamp(18px,1.6vw,23px)", margin: 0, lineHeight: 1, fontWeight: 900 };
const league = { color: "#cbd5e1", margin: "5px 0 0", fontSize: 13 };
const rightBadges = { display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" };
const baseBadge = { background: "#334155", padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 900 };
const vipBadge = { background: "#facc15", color: "#000", padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 900 };
const marketBadge = { background: "#0ea5e9", padding: "6px 10px", borderRadius: 999, fontSize: 11, fontWeight: 900 };

const bodyGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 155px",
  gap: 6,
  alignItems: "start"
};

const mainInfo = { display: "grid", gap: 10 };
const scoreBox = { background: "#071a10", border: "1px solid #174f32", borderRadius: 7, padding: 6, display: "grid", gap: 1, fontSize: 12 };
const signalBox = { background: "#071a10", border: "1px solid #174f32", borderRadius: 7, padding: 6, display: "grid", gap: 1, fontSize: 12 };

const miniMap = { background: "#071a10", border: "1px solid #174f32", borderRadius: 8, padding: 8 };
const field = {
  height: 64,
  background:
    "repeating-linear-gradient(90deg,#1f5c2e 0px,#1f5c2e 30px,#216c34 30px,#216c34 60px)",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 7,
  position: "relative",
  overflow: "hidden",
  boxShadow: "inset 0 0 14px rgba(255,255,255,.06)"
};

const midLine = { position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,.75)" };
const areaLeft = { position: "absolute", left: "8%", top: "35%", width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(255,255,255,.28)" };
const areaRight = { position: "absolute", right: "8%", top: "35%", width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(255,255,255,.28)" };
const dot = { position: "absolute", width: 15, height: 15, borderRadius: "50%", background: "#facc15", boxShadow: "0 0 15px #facc15" };
const dot2 = { position: "absolute", width: 13, height: 13, borderRadius: "50%", background: "#00e5ff", boxShadow: "0 0 15px #00e5ff" };

const statsGrid = {
  marginTop: 4,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 2,
  fontSize: 10,
  color: "#f1f5f9"
};

const bars = {
  display: "grid",
  gap: 1,
  fontSize: 10,
  fontWeight: 900,
  marginTop: 4
};

const barBg = { height: 10, background: "#1e293b", borderRadius: 999, overflow: "hidden" };
const bar = { height: "100%", background: "#00ff87" };
const barGold = { height: "100%", background: "#facc15" };

const momentumBox = {
  marginTop: 4,
  background: "#071a10",
  border: "1px solid #174f32",
  borderRadius: 7,
  padding: 5
};

const momentumTitle = { fontWeight: 900, marginBottom: 5, color: "#00ff87", fontSize: 15 };
const momentumBar = { height: 10, background: "#1e293b", borderRadius: 999, overflow: "hidden" };
const momentumFill = { height: "100%", background: "linear-gradient(90deg,#22c55e,#facc15,#ef4444)", borderRadius: 999, transition: ".4s", animation: "pulse 1s infinite" };
const momentumInfo = { marginTop: 6, fontSize: 13, color: "#e5e7eb" };

const footer = {
  display: "flex",
  gap: 4,
  flexWrap: "wrap",
  marginTop: 5,
  justifyContent: "space-between"
};

const betano = {
  background: "#22c55e",
  color: "#fff",
  border: 0,
  borderRadius: 6,
  padding: "6px 10px",
  fontWeight: 900,
  fontSize: 11
};

const novibet = { ...betano, background: "#2563eb" };
const bet365 = { ...betano, background: "#f59e0b" };
const vipBtn = { ...betano, background: "#facc15", color: "#000" };

const oddBlink = { color: "#facc15", fontWeight: 900, animation: "pulse 0.8s infinite" };
const popup = { position: "fixed", top: 18, right: 18, zIndex: 9999, background: "#7f1d1d", border: "2px solid #ef4444", padding: 16, borderRadius: 10, boxShadow: "0 0 25px rgba(239,68,68,.7)" };
const empty = { background: "#101820", border: "1px solid #00ff87", borderRadius: 10, padding: 18, fontWeight: 800 };
