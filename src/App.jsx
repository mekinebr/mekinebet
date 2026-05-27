import React, { useEffect, useMemo, useState } from "react";

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
      if ("Notification" in window) await Notification.requestPermission();
      if ("serviceWorker" in navigator) await navigator.serviceWorker.register("/sw.js");
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
    const intervalo = setInterval(carregar, 30000);
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

  function mercadoStatus(item) {
    const gols = totalGols(item);
    const min = minuto(item);
    const pressure = item.pressure || 70;
    const confidence = item.confidence || 70;
    const ataques = Math.round(pressure / 2);
    const finalizacoes = Math.round(pressure / 8);
    const market = String(item.market || "").toLowerCase();

    if (market.includes("0.5")) {
      if (gols >= 1) return "✅ GREEN";
      if (min >= 15 && pressure >= 72 && ataques >= 28) return "🔥 GOL IMINENTE";
      if (min >= 30 && pressure >= 60) return "📈 OVER FORTE";
      return "👀 MONITORANDO";
    }

    if (market.includes("1.5")) {
      if (gols >= 2) return "✅ GREEN";
      if (gols === 1 && min <= 70 && pressure >= 74) return "🔥 2º GOL QUENTE";
      if (min >= 55 && pressure >= 78 && finalizacoes >= 8) return "🚨 PRESSÃO EXTREMA";
      return "📊 AO VIVO";
    }

    if (market.includes("2.5")) {
      if (gols >= 3) return "✅ GREEN";
      if (gols >= 2 && pressure >= 75 && min <= 80) return "🔥 OVER MUITO FORTE";
      if (min >= 60 && ataques >= 35) return "⚡ ATAQUE TOTAL";
      return "📊 MONITORANDO";
    }

    if (market.includes("3.5")) {
      if (gols >= 4) return "✅ GREEN";
      if (gols >= 3 && pressure >= 82) return "🚨 JOGO MALUCO";
      return "📉 RISCO MÉDIO";
    }

    if (market.includes("btts") || market.includes("ambas")) {
      if (gols >= 2) return "🔥 BTTS QUENTE";
      if (pressure >= 75 && ataques >= 30) return "⚡ AMBAS PRESSIONANDO";
      return "👀 OBSERVAÇÃO";
    }

    if (market.includes("cart") || market.includes("card")) {
      if (min >= 55 && pressure >= 72) return "🟨 JOGO PEGADO";
      if (min >= 70) return "🚨 RISCO DE CARTÃO";
      return "📊 CARTÕES AO VIVO";
    }

    if (market.includes("canto") || market.includes("corner")) {
      if (pressure >= 78) return "🚩 PRESSÃO EM ESCANTEIOS";
      if (ataques >= 35) return "⚡ OVER CANTOS";
      return "📈 CANTOS AO VIVO";
    }

    if (confidence >= 84 && pressure >= 80) return "🧠 IA DETECTOU VALOR";

    return "📊 MONITORAMENTO IA";
  }

  function categoriaMercado(item) {
    const market = String(item.market || "").toLowerCase();

    if (market.includes("0.5")) return "OVER05";
    if (market.includes("1.5")) return "OVER15";
    if (market.includes("2.5")) return "OVER25";
    if (market.includes("3.5")) return "OVER35";
    if (market.includes("cart") || market.includes("card")) return "CARTOES";
    if (market.includes("canto") || market.includes("corner")) return "CANTOS";
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

  function estatisticasFake(item) {
    const conf = item.confidence || 70;
    const press = item.pressure || 70;
    const gols = totalGols(item);

    return {
      posseCasa: Math.min(68, Math.max(42, conf - 18)),
      finalizacoes: Math.max(6, Math.round(press / 8 + gols * 2)),
      ataques: Math.max(18, Math.round(press / 2)),
      cantos: Math.max(2, Math.round(press / 18)),
      cartoes: Math.max(1, Math.round((100 - conf) / 25))
    };
  }

  const sinaisFiltrados = useMemo(() => {
    let filtrados = signals.filter((item) => {
      const texto = `${item.match} ${item.league} ${item.market}`.toLowerCase();
      if (!texto.includes(busca.toLowerCase())) return false;

      const cat = categoriaMercado(item);

      if (filtro === "TODOS") return true;
      if (filtro === "LIVE") return isLiveReal(item);
      if (filtro === "HISTORICO") return !isLiveReal(item);
      if (filtro === "OVER05") return cat === "OVER05";
      if (filtro === "OVER15") return cat === "OVER15";
      if (filtro === "OVER25") return cat === "OVER25";
      if (filtro === "OVER35") return cat === "OVER35";
      if (filtro === "CARTOES") return cat === "CARTOES";
      if (filtro === "CANTOS") return cat === "CANTOS";
      if (filtro === "BTTS") return cat === "BTTS";
      if (filtro === "TOP IA") return (item.confidence || 70) >= 82;
      if (filtro === "VIP") return isVipLiberado(item);
      if (filtro === "ALERTA") return item.alert?.includes("GOL") || item.alert?.includes("IMINENTE");

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
  const alertCount = signals.filter((s) => s.alert?.includes("GOL") || s.alert?.includes("IMINENTE")).length;

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
          <div style={subTitle}>Scanner live • odds • pressão • mercados</div>
        </div>

        <div style={statusWrap}>
          <span style={pill}>🔴 Live: {liveCount}</span>
          <span style={pill}>🚨 Alertas: {alertCount}</span>
          <span style={pill}>👑 VIP</span>
          <span style={pill}>🔄 {lastUpdate || "carregando..."}</span>
        </div>
      </header>

      {liveCount === 0 && (
        <div style={notice}>
          📊 Nenhum LIVE real disponível agora. Mostrando base IA/histórico enquanto monitora automaticamente.
        </div>
      )}

      <nav style={filters}>
        {[
          "TODOS",
          "LIVE",
          "ALERTA",
          "OVER05",
          "OVER15",
          "OVER25",
          "OVER35",
          "CARTOES",
          "CANTOS",
          "BTTS",
          "TOP IA",
          "VIP",
          "HISTORICO"
        ].map((btn) => (
          <button key={btn} onClick={() => setFiltro(btn)} style={filtro === btn ? activeBtn : btnStyle}>
            {btn}
          </button>
        ))}
      </nav>

      <input
        placeholder="Buscar jogo, liga ou mercado..."
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
            const stats = estatisticasFake(item);
            const status = mercadoStatus(item);
            const cat = categoriaMercado(item);

            return (
              <section
                key={item.id || index}
                style={card}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 0 25px rgba(0,255,135,.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 0 18px rgba(0,255,135,.10)";
                }}
              >
                <div style={cardHeader}>
                  <div style={teams}>
                    {item.logoHome && <img src={item.logoHome} alt="" style={logo} />}
                    <div>
                      <h2 style={match}>{item.match}</h2>
                      <p style={league}>{item.league}</p>
                    </div>
                    {item.logoAway && <img src={item.logoAway} alt="" style={logo} />}
                  </div>

                  <div style={rightBadges}>
                    <span style={liveReal ? liveBadge : baseBadge}>{liveReal ? "AO VIVO" : "BASE"}</span>
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

                    <div style={bars}>
                      <label>IA {item.confidence || 70}%</label>
                      <div style={barBg}><div style={{ ...bar, width: `${item.confidence || 70}%` }} /></div>

                      <label>Pressão {item.pressure || 70}%</label>
                      <div style={barBg}><div style={{ ...barGold, width: `${item.pressure || 70}%` }} /></div>
                    </div>
                  </div>

                  <div style={miniMap}>
                    <div style={field}>
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${item.pressure || 70}%`,
                          background: "linear-gradient(90deg,rgba(255,255,0,.12),rgba(255,0,0,.10))"
                        }}
                      />
                      <div style={midLine}></div>
                      <div style={{ ...dot, left: `${Math.min(82, stats.ataques)}%`, top: "44%" }}></div>
                      <div style={{ ...dot2, left: `${100 - Math.min(82, stats.ataques)}%`, top: "56%" }}></div>
                    </div>

                    <div style={statsGrid}>
                      <span>Posse {stats.posseCasa}%</span>
                      <span>Final. {stats.finalizacoes}</span>
                      <span>Ataques {stats.ataques}</span>
                      <span>Cantos {stats.cantos}</span>
                      <span>Cartões {stats.cartoes}</span>
                      <span>Escalação 4-3-3</span>
                    </div>
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

const page = { minHeight: "100vh", background: "#07110c", color: "#fff", padding: 14, fontFamily: "Arial, sans-serif" };
const topBar = { background: "#0b1f13", border: "1px solid #1f8f4d", borderRadius: 10, padding: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 };
const title = { color: "#00ff87", fontSize: "clamp(30px, 5vw, 52px)", margin: 0, fontWeight: 900 };
const subTitle = { color: "#9ca3af", marginTop: 4 };
const statusWrap = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" };
const pill = { border: "1px solid #00ff87", background: "#06150d", padding: "8px 10px", borderRadius: 8, fontWeight: 700, fontSize: 13 };
const notice = { background: "#4a1f08", border: "1px solid #ff8a00", padding: 12, borderRadius: 8, marginBottom: 12, fontWeight: 700 };
const filters = { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 10 };
const btnStyle = { background: "#08140d", color: "#fff", border: "1px solid #00ff87", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 800, whiteSpace: "nowrap" };
const activeBtn = { ...btnStyle, background: "#00ff87", color: "#001b0b" };
const search = { width: "100%", boxSizing: "border-box", background: "#0b1720", border: "1px solid #00ff87", color: "#fff", padding: 13, borderRadius: 8, marginBottom: 12, fontSize: 15 };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 10, alignItems: "start" };
const card = { background: "linear-gradient(180deg,#0b1320,#07110c)", border: "1px solid rgba(0,255,135,.45)", borderRadius: 12, padding: 10, minHeight: 540, boxShadow: "0 0 18px rgba(0,255,135,.10)", transition: ".25s" };
const cardHeader = { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 10 };
const teams = { display: "flex", gap: 10, alignItems: "center" };
const logo = { width: 34, height: 34, objectFit: "contain", background: "#fff", borderRadius: "50%", padding: 3 };
const match = { color: "#00ff87", fontSize: "clamp(15px,2vw,20px)", margin: 0, lineHeight: 1.05, fontWeight: 900 };
const league = { color: "#94a3b8", margin: "4px 0 0", fontSize: 13 };
const rightBadges = { display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" };
const liveBadge = { background: "#ef4444", padding: "5px 8px", borderRadius: 999, fontSize: 12, fontWeight: 900 };
const baseBadge = { background: "#334155", padding: "5px 8px", borderRadius: 999, fontSize: 12, fontWeight: 900 };
const vipBadge = { background: "#facc15", color: "#000", padding: "5px 8px", borderRadius: 999, fontSize: 12, fontWeight: 900 };
const marketBadge = { background: "#0ea5e9", padding: "5px 8px", borderRadius: 999, fontSize: 12, fontWeight: 900 };
const bodyGrid = { display: "grid", gridTemplateColumns: "1fr 180px", gap: 8, alignItems: "start" };
const mainInfo = { display: "grid", gap: 10 };
const scoreBox = { background: "#071a10", border: "1px solid #174f32", borderRadius: 8, padding: 10, display: "grid", gap: 2 };
const signalBox = { background: "#071a10", border: "1px solid #174f32", borderRadius: 8, padding: 10, display: "grid", gap: 5 };
const bars = { display: "grid", gap: 5, fontSize: 13, fontWeight: 700 };
const barBg = { height: 10, background: "#1e293b", borderRadius: 999, overflow: "hidden" };
const bar = { height: "100%", background: "#00ff87" };
const barGold = { height: "100%", background: "#facc15" };
const miniMap = { background: "#071a10", border: "1px solid #174f32", borderRadius: 8, padding: 8 };
const field = { height: 95, background: "linear-gradient(90deg,#14532d,#166534)", border: "2px solid #d1fae5", borderRadius: 8, position: "relative", overflow: "hidden", boxShadow: "inset 0 0 25px rgba(255,255,255,.05)" };
const midLine = { position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,.7)" };
const dot = { position: "absolute", width: 14, height: 14, borderRadius: "50%", background: "#facc15", boxShadow: "0 0 12px #facc15" };
const dot2 = { position: "absolute", width: 12, height: 12, borderRadius: "50%", background: "#00e5ff", boxShadow: "0 0 12px #00e5ff" };
const statsGrid = { marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12, color: "#d1d5db" };
const footer = { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, justifyContent: "space-between" };
const betano = { background: "#22c55e", color: "#fff", border: 0, borderRadius: 8, padding: "9px 12px", fontWeight: 900 };
const novibet = { ...betano, background: "#2563eb" };
const bet365 = { ...betano, background: "#f59e0b" };
const vipBtn = { ...betano, background: "#facc15", color: "#000" };
const oddBlink = { color: "#facc15", fontWeight: 900, animation: "pulse 1s infinite" };
const popup = { position: "fixed", top: 18, right: 18, zIndex: 9999, background: "#7f1d1d", border: "2px solid #ef4444", padding: 16, borderRadius: 10, boxShadow: "0 0 25px rgba(239,68,68,.7)" };
const empty = { background: "#101820", border: "1px solid #00ff87", borderRadius: 10, padding: 18, fontWeight: 800 };
