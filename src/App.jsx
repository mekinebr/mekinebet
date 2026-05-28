import React, { useEffect, useMemo, useState } from "react";

const API_URL = "https://mekinebet.onrender.com/api/signals";

const fallbackLogo = (name = "Time") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=071a10&color=00ff87&bold=true&size=96`;

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const [popupAlerta, setPopupAlerta] = useState(null);

  async function carregar() {
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      const data = await res.json();
      setSignals(data.activeSignals || []);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    const timer = setInterval(carregar, 20000);
    return () => clearInterval(timer);
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

  function timesDoJogo(item) {
    const partes = String(item.match || "").split(/\s+vs\s+|\s+x\s+/i);
    return {
      casa: item.homeTeam || item.home || partes[0] || "Casa",
      fora: item.awayTeam || item.away || partes[1] || "Fora"
    };
  }

  function logoCasa(item) {
    const t = timesDoJogo(item);
    return item.logoHome || item.homeLogo || item.teams?.home?.logo || fallbackLogo(t.casa);
  }

  function logoFora(item) {
    const t = timesDoJogo(item);
    return item.logoAway || item.awayLogo || item.teams?.away?.logo || fallbackLogo(t.fora);
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
    const stats = statsDoJogo(item);
    const market = String(item.market || "").toLowerCase();

    if (market.includes("0.5") || market.includes("0,5")) {
      if (gols >= 1) return "✅ GREEN";
      if (min >= 12 && pressure >= 70) return "🔥 GOL IMINENTE";
      return "📊 MONITORANDO";
    }

    if (market.includes("1.5") || market.includes("1,5")) {
      if (gols >= 2) return "✅ GREEN";
      if (gols === 1 && pressure >= 72) return "🔥 2º GOL FORTE";
      return "📊 MONITORANDO";
    }

    if (market.includes("2.5") || market.includes("2,5")) {
      if (gols >= 3) return "✅ GREEN";
      if (gols >= 2 && pressure >= 74) return "🔥 OVER FORTE";
      return "📊 MONITORANDO";
    }

    if (market.includes("3.5") || market.includes("3,5")) {
      if (gols >= 4) return "✅ GREEN";
      if (gols >= 3 && pressure >= 82) return "🚨 JOGO MALUCO";
      return "📉 RISCO MÉDIO";
    }

    if (market.includes("btts") || market.includes("ambas")) {
      if (gols >= 2) return "🔥 BTTS QUENTE";
      if (pressure >= 75 && stats.ataques >= 30) return "⚡ AMBAS PRESSIONANDO";
      return "👀 OBSERVAÇÃO";
    }

    if (market.includes("cart") || market.includes("card")) return "🟨 CARTÕES AO VIVO";
    if (market.includes("canto") || market.includes("corner")) return "🚩 CANTOS AO VIVO";

    return "📊 MONITORAMENTO IA";
  }

  function categoriaMercado(item) {
    const market = String(item.market || "").toLowerCase();
    if (market.includes("0.5") || market.includes("0,5")) return "OVER 0,5";
    if (market.includes("1.5") || market.includes("1,5")) return "OVER 1,5";
    if (market.includes("2.5") || market.includes("2,5")) return "OVER 2,5";
    if (market.includes("3.5") || market.includes("3,5")) return "OVER 3,5";
    if (market.includes("cart") || market.includes("card")) return "CARTÕES";
    if (market.includes("canto") || market.includes("corner")) return "CANTOS";
    if (market.includes("btts") || market.includes("ambas")) return "BTTS";
    return item.category?.toUpperCase() || "BASE";
  }

  function isVip(item) {
    return (item.confidence || 70) >= 82 || String(item.alert || "").includes("GOL");
  }

  const sinaisFiltrados = useMemo(() => {
    return signals
      .filter((item) => {
        const texto = `${item.match} ${item.league} ${item.market}`.toLowerCase();
        if (!texto.includes(busca.toLowerCase())) return false;

        const cat = categoriaMercado(item);

        if (filtro === "TODOS") return true;
        if (filtro === "LIVE") return isLiveReal(item);
        if (filtro === "ALERTA") return mercadoStatus(item).includes("🔥") || mercadoStatus(item).includes("🚨");
        if (filtro === "OVER05") return cat === "OVER 0,5";
        if (filtro === "OVER15") return cat === "OVER 1,5";
        if (filtro === "OVER25") return cat === "OVER 2,5";
        if (filtro === "OVER35") return cat === "OVER 3,5";
        if (filtro === "CARTÕES") return cat.includes("CARTÕES");
        if (filtro === "CANTOS") return cat.includes("CANTOS");
        if (filtro === "BTTS") return cat === "BTTS";
        if (filtro === "TOP IA") return (item.confidence || 70) >= 82;
        if (filtro === "VIP") return isVip(item);
        if (filtro === "HISTORICO") return !isLiveReal(item);
        return true;
      })
      .sort((a, b) => (b.confidence || 70) + (b.pressure || 70) - ((a.confidence || 70) + (a.pressure || 70)));
  }, [signals, busca, filtro]);

  const liveCount = signals.filter(isLiveReal).length;
  const alertCount = signals.filter((s) => mercadoStatus(s).includes("🔥") || mercadoStatus(s).includes("🚨")).length;

  return (
    <div style={page}>
      <style>
        {`
          @keyframes pulse { 0%{opacity:1} 50%{opacity:.45} 100%{opacity:1} }

          @media(max-width:900px){
            .cardsGrid{grid-template-columns:1fr!important;gap:12px!important}
            .filterGrid{grid-template-columns:repeat(4,1fr)!important}
            .matchBody{grid-template-columns:1fr!important}
            .cardHeaderMobile{flex-direction:column!important}
            .teamsRow{width:100%!important}
            .badgesRow{justify-content:flex-start!important}
            .barsMobile{grid-template-columns:1fr!important}
            .bottomBarMobile{font-size:12px!important;gap:8px!important}
          }

          const page = { minHeight: "100vh", background: "#1f1f1f", color: "#fff", padding: 6, fontFamily: "Arial, Helvetica, sans-serif", overflowX: "hidden" };

const topBar = { background: "linear-gradient(180deg,#10281d,#0b1511)", border: "1px solid #00d66f", borderRadius: 8, padding: "8px 14px", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 7, boxSizing: "border-box" };
const title = { color: "#00ff70", fontSize: "clamp(26px,3.2vw,44px)", margin: 0, fontWeight: 900, lineHeight: 1 };
const subTitle = { color: "#d8d8d8", marginTop: 5, fontSize: 13 };
const statusWrap = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" };
const pill = { border: "1px solid #00d66f", background: "#0b1511", padding: "7px 12px", borderRadius: 7, fontWeight: 900, fontSize: 13 };

const notice = { background: "#4a1c08", border: "1px solid #ff7b00", padding: 8, borderRadius: 7, marginBottom: 7, fontWeight: 900, fontSize: 13 };

const filters = { display: "grid", gridTemplateColumns: "repeat(13,minmax(0,1fr))", gap: 5, marginBottom: 7, width: "100%" };
const btnStyle = { background: "#252525", color: "#fff", border: "1px solid #00d66f", padding: "8px 3px", borderRadius: 7, cursor: "pointer", fontWeight: 900, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const activeBtn = { ...btnStyle, background: "#00d66f", color: "#001b0b" };

const search = { width: "100%", boxSizing: "border-box", background: "#202b2b", border: "1px solid #00d66f", color: "#fff", padding: 10, borderRadius: 8, marginBottom: 9, fontSize: 14 };

const grid = { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, alignItems: "start" };
const card = { background: "linear-gradient(180deg,#102016,#0a1411)", border: "1px solid rgba(0,214,111,.65)", borderRadius: 8, padding: 8, boxShadow: "0 0 8px rgba(0,255,80,.08)", overflow: "hidden", boxSizing: "border-box" };

const cardHeader = { display: "flex", justifyContent: "space-between", gap: 6, alignItems: "flex-start", marginBottom: 7 };
const teams = { display: "flex", gap: 5, alignItems: "center", minWidth: 0, flex: 1 };
const teamLogo = { width: 22, height: 22, borderRadius: "50%", objectFit: "contain", background: "#fff", padding: 2, flexShrink: 0 };

const match = { color: "#00ff70", fontSize: "clamp(13px,1.05vw,17px)", margin: 0, lineHeight: 1.02, fontWeight: 900, whiteSpace: "normal", wordBreak: "normal" };
const league = { color: "#dddddd", margin: "4px 0 0", fontSize: 10 };

const rightBadges = { display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" };
const baseBadge = { background: "#3a4655", padding: "4px 7px", borderRadius: 999, fontSize: 10, fontWeight: 900 };
const vipBadge = { background: "#facc15", color: "#000", padding: "4px 7px", borderRadius: 999, fontSize: 10, fontWeight: 900 };
const marketBadge = { background: "#0ea5e9", padding: "4px 7px", borderRadius: 999, fontSize: 10, fontWeight: 900 };

const bodyGrid = { display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 8, alignItems: "start" };
const mainInfo = { display: "grid", gap: 6 };
const scoreBox = { background: "#071a10", border: "1px solid #0f7a3e", borderRadius: 7, padding: 7, display: "grid", gap: 1, fontSize: 12 };
const signalBox = { background: "#071a10", border: "1px solid #0f7a3e", borderRadius: 7, padding: 7, display: "grid", gap: 2, fontSize: 12 };

const miniMap = { background: "#071a10", border: "1px solid #0f7a3e", borderRadius: 7, padding: 5 };
const field = { height: 68, background: "repeating-linear-gradient(90deg,#176324 0px,#176324 26px,#1d7a2d 26px,#1d7a2d 52px)", border: "1px solid rgba(255,255,255,.65)", borderRadius: 7, position: "relative", overflow: "hidden" };
const fieldOverlay = { position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(255,255,0,.06),rgba(0,255,130,.10))" };
const midLine = { position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,.75)" };
const goalLeft = { position: "absolute", left: 0, top: "29%", width: 22, height: 30, border: "1px solid rgba(255,255,255,.75)", borderLeft: 0 };
const goalRight = { position: "absolute", right: 0, top: "29%", width: 22, height: 30, border: "1px solid rgba(255,255,255,.75)", borderRight: 0 };
const ballHome = { position: "absolute", top: "42%", width: 12, height: 12, borderRadius: "50%", background: "#facc15", boxShadow: "0 0 10px #facc15" };
const ballAway = { position: "absolute", top: "45%", width: 12, height: 12, borderRadius: "50%", background: "#00d9ff", boxShadow: "0 0 10px #00d9ff" };

const statsGrid = { marginTop: 5, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, fontSize: 10, color: "#f1f5f9" };

const bars = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, fontSize: 11, fontWeight: 900, marginTop: 8 };
const barBg = { height: 8, background: "#1e293b", borderRadius: 999, overflow: "hidden", marginTop: 3 };
const bar = { height: "100%", background: "#00ff70" };
const barGold = { height: "100%", background: "#facc15" };

const momentumBox = { marginTop: 8, background: "#071a10", border: "1px solid #0f7a3e", borderRadius: 7, padding: 6 };
const momentumTitle = { color: "#00ff70", fontSize: 12 };
const momentumBar = { height: 8, background: "#1e293b", borderRadius: 999, overflow: "hidden", marginTop: 4 };
const momentumFill = { height: "100%", background: "linear-gradient(90deg,#22c55e,#facc15,#ef4444)", borderRadius: 999 };
const momentumInfo = { marginTop: 4, fontSize: 11, color: "#fff" };

const footer = { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, justifyContent: "space-between" };
const betano = { background: "#22c55e", color: "#fff", border: 0, borderRadius: 6, padding: "7px 13px", fontWeight: 900, fontSize: 12 };
const novibet = { ...betano, background: "#2563eb" };
const bet365 = { ...betano, background: "#f97316" };
const vipBtn = { ...betano, background: "#facc15", color: "#000" };

const oddBlink = { color: "#facc15", fontWeight: 900 };
const bottomBar = { marginTop: 8, background: "#101820", border: "1px solid rgba(255,255,255,.25)", borderRadius: 8, padding: 8, display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "space-around", fontSize: 12 };
const green = { color: "#00ff70" };
const popup = { position: "fixed", top: 18, right: 18, zIndex: 9999, background: "#7f1d1d", border: "2px solid #ef4444", padding: 16, borderRadius: 10 };
const empty = { background: "#101820", border: "1px solid #00ff87", borderRadius: 10, padding: 18, fontWeight: 800 };
        `}
      </style>

      {popupAlerta && <div style={popup}>{popupAlerta.match}</div>}

      <header className="topBarMobile" style={topBar}>
        <div>
          <h1 className="titleMobile" style={title}>MekineBet AO VIVO</h1>
          <div style={subTitle}>🟢 Scanner live • odds • pressão • mercados</div>
        </div>

        <div style={statusWrap}>
          <span className="pillMobile" style={pill}>🔴 Live: {liveCount}</span>
          <span className="pillMobile" style={pill}>🚨 Alertas: {alertCount}</span>
          <span className="pillMobile" style={pill}>👑 VIP</span>
          <span className="pillMobile" style={pill}>🕘 {lastUpdate || "carregando..."}</span>
        </div>
      </header>

      {liveCount === 0 && (
        <div style={notice}>
          📊 Nenhum LIVE real disponível agora. Mostrando base IA/histórico enquanto monitora automaticamente.
        </div>
      )}

      <div className="filterGrid" style={filters}>
        {[
          ["TODOS", "▦ TODOS"],
          ["LIVE", "📡 LIVE"],
          ["ALERTA", "🔔 ALERTA"],
          ["OVER05", "↗ OVER 0,5"],
          ["OVER15", "↗ OVER 1,5"],
          ["OVER25", "↗ OVER 2,5"],
          ["OVER35", "↗ OVER 3,5"],
          ["CARTÕES", "🟨 CARTÕES"],
          ["CANTOS", "🚩 CANTOS"],
          ["BTTS", "👥 BTTS"],
          ["TOP IA", "🧠 TOP IA"],
          ["VIP", "👑 VIP"],
          ["HISTORICO", "🕘 HISTÓRICO"]
        ].map(([value, label]) => (
          <button key={value} onClick={() => setFiltro(value)} style={filtro === value ? activeBtn : btnStyle}>
            {label}
          </button>
        ))}
      </div>

      <input
        className="searchMobile"
        placeholder="🔍  Buscar jogo, liga ou mercado..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={search}
      />

      {loading ? (
        <div style={empty}>Carregando sinais...</div>
      ) : (
        <main className="cardsGrid" style={grid}>
          {sinaisFiltrados.map((item, index) => {
            const stats = statsDoJogo(item);
            const status = mercadoStatus(item);
            const cat = categoriaMercado(item);
            const liveReal = isLiveReal(item);
            const vip = isVip(item);
            const times = timesDoJogo(item);

            return (
              <section className="cardMobile" key={item.id || index} style={card}>
                <div className="cardHeaderMobile" style={cardHeader}>
                  <div className="teamsRow" style={teams}>
                    <img className="teamLogoMobile" src={logoCasa(item)} alt={times.casa} style={teamLogo} onError={(e) => (e.currentTarget.src = fallbackLogo(times.casa))} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h2 className="matchTitle" style={match}>{item.match}</h2>
                      <p style={league}>🦁 {item.league}</p>
                    </div>
                    <img className="teamLogoMobile" src={logoFora(item)} alt={times.fora} style={teamLogo} onError={(e) => (e.currentTarget.src = fallbackLogo(times.fora))} />
                  </div>

                  <div className="badgesRow" style={rightBadges}>
                    <span style={baseBadge}>{liveReal ? "AO VIVO" : "BASE"}</span>
                    {vip && <span style={vipBadge}>VIP</span>}
                    <span style={marketBadge}>{cat}</span>
                  </div>
                </div>

                <div className="matchBody" style={bodyGrid}>
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
                      <div style={fieldOverlay}></div>
                      <div style={midLine}></div>
                      <div style={goalLeft}></div>
                      <div style={goalRight}></div>
                      <div style={{ ...ballHome, left: `${Math.min(80, stats.ataques)}%` }}></div>
                      <div style={{ ...ballAway, left: `${100 - Math.min(80, stats.ataques)}%` }}></div>
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

                <div className="barsMobile" style={bars}>
                  <div>
                    <b>IA {item.confidence || 70}%</b>
                    <div style={barBg}><div style={{ ...bar, width: `${item.confidence || 70}%` }} /></div>
                  </div>
                  <div>
                    <b>Pressão {item.pressure || 70}%</b>
                    <div style={barBg}><div style={{ ...barGold, width: `${item.pressure || 70}%` }} /></div>
                  </div>
                </div>

                <div style={momentumBox}>
                  <b style={momentumTitle}>Momentum IA</b>
                  <div style={momentumBar}><div style={{ ...momentumFill, width: `${item.pressure || 70}%` }} /></div>
                  <div style={momentumInfo}>⚡ Ataque perigoso detectado</div>
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

      <footer className="bottomBarMobile" style={bottomBar}>
        <span>📊 Sinais: <b style={green}>{signals.length}</b></span>
        <span>🟢 IA Ativa 24h</span>
        <span>⚡ Atualização: <b style={green}>20s</b></span>
        <span>🗓️ Última: <b style={green}>{lastUpdate}</b></span>
        <span>🔒 Fonte: <b style={green}>API-Sports</b></span>
      </footer>
    </div>
  );
}

const page = { minHeight: "100vh", background: "#1f1f1f", color: "#fff", padding: 6, fontFamily: "Arial, Helvetica, sans-serif", overflowX: "hidden" };

const topBar = { background: "linear-gradient(180deg,#10281d,#0b1511)", border: "1px solid #00d66f", borderRadius: 8, padding: "8px 14px", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 7, boxSizing: "border-box" };
const title = { color: "#00ff70", fontSize: "clamp(26px,3.2vw,44px)", margin: 0, fontWeight: 900, lineHeight: 1 };
const subTitle = { color: "#d8d8d8", marginTop: 5, fontSize: 13 };
const statusWrap = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" };
const pill = { border: "1px solid #00d66f", background: "#0b1511", padding: "7px 12px", borderRadius: 7, fontWeight: 900, fontSize: 13 };

const notice = { background: "#4a1c08", border: "1px solid #ff7b00", padding: 8, borderRadius: 7, marginBottom: 7, fontWeight: 900, fontSize: 13 };

const filters = { display: "grid", gridTemplateColumns: "repeat(13,minmax(0,1fr))", gap: 5, marginBottom: 7, width: "100%" };
const btnStyle = { background: "#252525", color: "#fff", border: "1px solid #00d66f", padding: "8px 3px", borderRadius: 7, cursor: "pointer", fontWeight: 900, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const activeBtn = { ...btnStyle, background: "#00d66f", color: "#001b0b" };

const search = { width: "100%", boxSizing: "border-box", background: "#202b2b", border: "1px solid #00d66f", color: "#fff", padding: 10, borderRadius: 8, marginBottom: 9, fontSize: 14 };

const grid = { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, alignItems: "start" };
const card = { background: "linear-gradient(180deg,#102016,#0a1411)", border: "1px solid rgba(0,214,111,.65)", borderRadius: 8, padding: 8, boxShadow: "0 0 8px rgba(0,255,80,.08)", overflow: "hidden", boxSizing: "border-box" };

const cardHeader = { display: "flex", justifyContent: "space-between", gap: 6, alignItems: "flex-start", marginBottom: 7 };
const teams = { display: "flex", gap: 5, alignItems: "center", minWidth: 0, flex: 1 };
const teamLogo = { width: 22, height: 22, borderRadius: "50%", objectFit: "contain", background: "#fff", padding: 2, flexShrink: 0 };

const match = { color: "#00ff70", fontSize: "clamp(13px,1.05vw,17px)", margin: 0, lineHeight: 1.02, fontWeight: 900, whiteSpace: "normal", wordBreak: "normal" };
const league = { color: "#dddddd", margin: "4px 0 0", fontSize: 10 };

const rightBadges = { display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" };
const baseBadge = { background: "#3a4655", padding: "4px 7px", borderRadius: 999, fontSize: 10, fontWeight: 900 };
const vipBadge = { background: "#facc15", color: "#000", padding: "4px 7px", borderRadius: 999, fontSize: 10, fontWeight: 900 };
const marketBadge = { background: "#0ea5e9", padding: "4px 7px", borderRadius: 999, fontSize: 10, fontWeight: 900 };

const bodyGrid = { display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 8, alignItems: "start" };
const mainInfo = { display: "grid", gap: 6 };
const scoreBox = { background: "#071a10", border: "1px solid #0f7a3e", borderRadius: 7, padding: 7, display: "grid", gap: 1, fontSize: 12 };
const signalBox = { background: "#071a10", border: "1px solid #0f7a3e", borderRadius: 7, padding: 7, display: "grid", gap: 2, fontSize: 12 };

const miniMap = { background: "#071a10", border: "1px solid #0f7a3e", borderRadius: 7, padding: 5 };
const field = { height: 68, background: "repeating-linear-gradient(90deg,#176324 0px,#176324 26px,#1d7a2d 26px,#1d7a2d 52px)", border: "1px solid rgba(255,255,255,.65)", borderRadius: 7, position: "relative", overflow: "hidden" };
const fieldOverlay = { position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(255,255,0,.06),rgba(0,255,130,.10))" };
const midLine = { position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,.75)" };
const goalLeft = { position: "absolute", left: 0, top: "29%", width: 22, height: 30, border: "1px solid rgba(255,255,255,.75)", borderLeft: 0 };
const goalRight = { position: "absolute", right: 0, top: "29%", width: 22, height: 30, border: "1px solid rgba(255,255,255,.75)", borderRight: 0 };
const ballHome = { position: "absolute", top: "42%", width: 12, height: 12, borderRadius: "50%", background: "#facc15", boxShadow: "0 0 10px #facc15" };
const ballAway = { position: "absolute", top: "45%", width: 12, height: 12, borderRadius: "50%", background: "#00d9ff", boxShadow: "0 0 10px #00d9ff" };

const statsGrid = { marginTop: 5, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, fontSize: 10, color: "#f1f5f9" };

const bars = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, fontSize: 11, fontWeight: 900, marginTop: 8 };
const barBg = { height: 8, background: "#1e293b", borderRadius: 999, overflow: "hidden", marginTop: 3 };
const bar = { height: "100%", background: "#00ff70" };
const barGold = { height: "100%", background: "#facc15" };

const momentumBox = { marginTop: 8, background: "#071a10", border: "1px solid #0f7a3e", borderRadius: 7, padding: 6 };
const momentumTitle = { color: "#00ff70", fontSize: 12 };
const momentumBar = { height: 8, background: "#1e293b", borderRadius: 999, overflow: "hidden", marginTop: 4 };
const momentumFill = { height: "100%", background: "linear-gradient(90deg,#22c55e,#facc15,#ef4444)", borderRadius: 999 };
const momentumInfo = { marginTop: 4, fontSize: 11, color: "#fff" };

const footer = { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, justifyContent: "space-between" };
const betano = { background: "#22c55e", color: "#fff", border: 0, borderRadius: 6, padding: "7px 13px", fontWeight: 900, fontSize: 12 };
const novibet = { ...betano, background: "#2563eb" };
const bet365 = { ...betano, background: "#f97316" };
const vipBtn = { ...betano, background: "#facc15", color: "#000" };

const oddBlink = { color: "#facc15", fontWeight: 900 };
const bottomBar = { marginTop: 8, background: "#101820", border: "1px solid rgba(255,255,255,.25)", borderRadius: 8, padding: 8, display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "space-around", fontSize: 12 };
const green = { color: "#00ff70" };
const popup = { position: "fixed", top: 18, right: 18, zIndex: 9999, background: "#7f1d1d", border: "2px solid #ef4444", padding: 16, borderRadius: 10 };
const empty = { background: "#101820", border: "1px solid #00ff87", borderRadius: 10, padding: 18, fontWeight: 800 };
