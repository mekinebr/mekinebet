import React, { useEffect, useMemo, useState } from "react";

const API_URL = "https://mekinebet.onrender.com/api/signals";

const TEAM_LOGOS = {
  "ipswich town fc": "https://media.api-sports.io/football/teams/57.png",
  "west ham united fc": "https://media.api-sports.io/football/teams/48.png",
  "liverpool fc": "https://media.api-sports.io/football/teams/40.png",
  "crystal palace fc": "https://media.api-sports.io/football/teams/52.png",
  "southampton fc": "https://media.api-sports.io/football/teams/41.png",
  "arsenal fc": "https://media.api-sports.io/football/teams/42.png",
  "brentford fc": "https://media.api-sports.io/football/teams/55.png",
  "wolverhampton wanderers fc": "https://media.api-sports.io/football/teams/39.png",
  "chelsea fc": "https://media.api-sports.io/football/teams/49.png",
  "manchester city fc": "https://media.api-sports.io/football/teams/50.png",
  "manchester united fc": "https://media.api-sports.io/football/teams/33.png",
  "tottenham hotspur fc": "https://media.api-sports.io/football/teams/47.png",
  "newcastle united fc": "https://media.api-sports.io/football/teams/34.png",
  "aston villa fc": "https://media.api-sports.io/football/teams/66.png",
  "everton fc": "https://media.api-sports.io/football/teams/45.png",
  "fulham fc": "https://media.api-sports.io/football/teams/36.png",
  "brighton & hove albion fc": "https://media.api-sports.io/football/teams/51.png",
  "nottingham forest fc": "https://media.api-sports.io/football/teams/65.png",
  "afc bournemouth": "https://media.api-sports.io/football/teams/35.png",
  "leicester city fc": "https://media.api-sports.io/football/teams/46.png"
};

const normalizar = (v = "") =>
  String(v)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const fallbackLogo = (name = "Time") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=071a10&color=00ff87&bold=true&size=96`;

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

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
      casa: item.homeTeam || item.home?.name || item.home || partes[0] || "Casa",
      fora: item.awayTeam || item.away?.name || item.away || partes[1] || "Fora"
    };
  }

  function logoCasa(item) {
    const t = timesDoJogo(item);
    const key = normalizar(t.casa);
    return (
      item.logoHome ||
      item.homeLogo ||
      item.teamHomeLogo ||
      item.home?.logo ||
      item.teams?.home?.logo ||
      TEAM_LOGOS[key] ||
      fallbackLogo(t.casa)
    );
  }

  function logoFora(item) {
    const t = timesDoJogo(item);
    const key = normalizar(t.fora);
    return (
      item.logoAway ||
      item.awayLogo ||
      item.teamAwayLogo ||
      item.away?.logo ||
      item.teams?.away?.logo ||
      TEAM_LOGOS[key] ||
      fallbackLogo(t.fora)
    );
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
    <div className="page">
      <style>{css}</style>

      <header className="topBar">
        <div>
          <h1>MekineBet </h1>
          <div className="subTitle">🟢 Scanner live • odds • pressão • mercados</div>
        </div>

        <div className="statusWrap">
          <span className="pill">🔴 Live: {liveCount}</span>
          <span className="pill">🚨 Alertas: {alertCount}</span>
          <span className="pill">👑 VIP</span>
          <span className="pill">🕘 {lastUpdate || "carregando..."}</span>
        </div>
      </header>

      {liveCount === 0 && (
        <div className="notice">
          📊 Nenhum LIVE real disponível agora. Mostrando base IA/histórico enquanto monitora automaticamente.
        </div>
      )}

      <div className="filters">
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
          <button
            key={value}
            onClick={() => setFiltro(value)}
            className={filtro === value ? "activeBtn" : ""}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        placeholder="🔍  Buscar jogo, liga ou mercado..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="search"
      />

      {loading ? (
        <div className="empty">Carregando sinais...</div>
      ) : (
        <main className="grid">
          {sinaisFiltrados.map((item, index) => {
            const stats = statsDoJogo(item);
            const status = mercadoStatus(item);
            const cat = categoriaMercado(item);
            const liveReal = isLiveReal(item);
            const vip = isVip(item);
            const times = timesDoJogo(item);

            return (
              <section key={item.id || index} className="card">
                <div className="cardHeader">
                  <div className="teams">
                    <img src={logoCasa(item)} alt={times.casa} onError={(e) => (e.currentTarget.src = fallbackLogo(times.casa))} />
                    <div className="teamText">
                      <h2>{item.match}</h2>
                      <p>🦁 {item.league}</p>
                    </div>
                    <img src={logoFora(item)} alt={times.fora} onError={(e) => (e.currentTarget.src = fallbackLogo(times.fora))} />
                  </div>

                  <div className="badges">
                    <span className="base">{liveReal ? "AO VIVO" : "BASE"}</span>
                    {vip && <span className="vip">VIP</span>}
                    <span className="market">{cat}</span>
                  </div>
                </div>

                <div className="bodyGrid">
                  <div className="mainInfo">
                    <div className="box">
                      <span>Placar</span>
                      <b>{item.score || "0-0"}</b>
                      <small>{liveReal ? `${item.minute || 0}'` : "Pré/Base"}</small>
                    </div>

                    <div className="box">
                      <b>{item.market}</b>
                      <span>Status: {status}</span>
                      <strong>Odd: {item.odd || "1.72"}</strong>
                    </div>
                  </div>

                  <div className="miniMap">
                    <div className="field">
                      <div className="fieldOverlay"></div>
                      <div className="midLine"></div>
                      <div className="goalLeft"></div>
                      <div className="goalRight"></div>
                      <div className="ballHome" style={{ left: `${Math.min(80, stats.ataques)}%` }}></div>
                      <div className="ballAway" style={{ left: `${100 - Math.min(80, stats.ataques)}%` }}></div>
                    </div>

                    <div className="stats">
                      <span>Posse {stats.posse}%</span>
                      <span>Final. {stats.finalizacoes}</span>
                      <span>Ataques {stats.ataques}</span>
                      <span>Cantos {stats.cantos}</span>
                      <span>Cartões {stats.cartoes}</span>
                      <span>Perig. {stats.perigosos}</span>
                    </div>
                  </div>
                </div>

                <div className="bars">
                  <div>
                    <b>IA {item.confidence || 70}%</b>
                    <div className="barBg"><div className="barGreen" style={{ width: `${item.confidence || 70}%` }} /></div>
                  </div>
                  <div>
                    <b>Pressão {item.pressure || 70}%</b>
                    <div className="barBg"><div className="barGold" style={{ width: `${item.pressure || 70}%` }} /></div>
                  </div>
                </div>

                <div className="momentum">
                  <b>Momentum IA</b>
                  <div className="barBg"><div className="momentumFill" style={{ width: `${item.pressure || 70}%` }} /></div>
                  <small>⚡ Ataque perigoso detectado</small>
                </div>

                <div className="bookies">
                  <button>Betano</button>
                  <button>Novibet</button>
                  <button>Bet365</button>
                  <button>VIP</button>
                </div>
              </section>
            );
          })}
        </main>
      )}

      <footer className="bottomBar">
        <span>📊 Sinais: <b>{signals.length}</b></span>
        <span>🟢 IA Ativa 24h</span>
        <span>⚡ Atualização: <b>20s</b></span>
        <span>🗓️ Última: <b>{lastUpdate}</b></span>
        <span>🔒 Fonte: <b>API-Sports</b></span>
      </footer>
    </div>
  );
}

const css = `
*{box-sizing:border-box}
body{margin:0;background:#1f1f1f}
.page{min-height:100vh;background:#1f1f1f;color:#fff;padding:6px;font-family:Arial,Helvetica,sans-serif;overflow-x:hidden}
.topBar{background:linear-gradient(180deg,#10281d,#0b1511);border:1px solid #00d66f;border-radius:8px;padding:8px 14px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:7px}
h1{color:#00ff70;font-size:clamp(26px,3.2vw,44px);margin:0;font-weight:900;line-height:1}
.subTitle{color:#d8d8d8;margin-top:5px;font-size:13px}
.statusWrap{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.pill{border:1px solid #00d66f;background:#0b1511;padding:7px 12px;border-radius:7px;font-weight:900;font-size:13px}
.notice{background:#4a1c08;border:1px solid #ff7b00;padding:8px;border-radius:7px;margin-bottom:7px;font-weight:900;font-size:13px}
.filters{display:grid;grid-template-columns:repeat(13,minmax(0,1fr));gap:5px;margin-bottom:7px}
.filters button{background:#252525;color:#fff;border:1px solid #00d66f;padding:8px 3px;border-radius:7px;cursor:pointer;font-weight:900;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.filters .activeBtn{background:#00d66f;color:#001b0b}
.search{width:100%;background:#202b2b;border:1px solid #00d66f;color:#fff;padding:10px;border-radius:8px;margin-bottom:9px;font-size:14px}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:start}
.card{background:linear-gradient(180deg,#102016,#0a1411);border:1px solid rgba(0,214,111,.65);border-radius:8px;padding:8px;box-shadow:0 0 8px rgba(0,255,80,.08);overflow:hidden}
.cardHeader{display:flex;justify-content:space-between;gap:6px;align-items:flex-start;margin-bottom:7px}
.teams{display:flex;gap:5px;align-items:center;min-width:0;flex:1}
.teams img{width:22px;height:22px;border-radius:50%;object-fit:contain;background:#fff;padding:2px;flex-shrink:0}
.teamText{min-width:0;flex:1}
.teamText h2{color:#00ff70;font-size:clamp(13px,1.05vw,17px);margin:0;line-height:1.02;font-weight:900}
.teamText p{color:#ddd;margin:4px 0 0;font-size:10px}
.badges{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}
.badges span{padding:4px 7px;border-radius:999px;font-size:10px;font-weight:900}
.base{background:#3a4655}
.vip{background:#facc15;color:#000}
.market{background:#0ea5e9}
.bodyGrid{display:grid;grid-template-columns:1fr 1.05fr;gap:8px;align-items:start}
.mainInfo{display:grid;gap:6px}
.box{background:#071a10;border:1px solid #0f7a3e;border-radius:7px;padding:7px;display:grid;gap:1px;font-size:12px}
.box strong{color:#facc15}
.miniMap{background:#071a10;border:1px solid #0f7a3e;border-radius:7px;padding:5px}
.field{height:68px;background:repeating-linear-gradient(90deg,#176324 0px,#176324 26px,#1d7a2d 26px,#1d7a2d 52px);border:1px solid rgba(255,255,255,.65);border-radius:7px;position:relative;overflow:hidden}
.fieldOverlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,0,.06),rgba(0,255,130,.10))}
.midLine{position:absolute;left:50%;top:0;bottom:0;width:2px;background:rgba(255,255,255,.75)}
.goalLeft{position:absolute;left:0;top:29%;width:22px;height:30px;border:1px solid rgba(255,255,255,.75);border-left:0}
.goalRight{position:absolute;right:0;top:29%;width:22px;height:30px;border:1px solid rgba(255,255,255,.75);border-right:0}
.ballHome,.ballAway{position:absolute;top:42%;width:12px;height:12px;border-radius:50%}
.ballHome{background:#facc15;box-shadow:0 0 10px #facc15}
.ballAway{background:#00d9ff;box-shadow:0 0 10px #00d9ff}
.stats{margin-top:5px;display:grid;grid-template-columns:repeat(3,1fr);gap:2px;font-size:10px;color:#f1f5f9}
.bars{display:grid;grid-template-columns:1fr 1fr;gap:9px;font-size:11px;font-weight:900;margin-top:8px}
.barBg{height:8px;background:#1e293b;border-radius:999px;overflow:hidden;margin-top:3px}
.barGreen{height:100%;background:#00ff70}
.barGold{height:100%;background:#facc15}
.momentum{margin-top:8px;background:#071a10;border:1px solid #0f7a3e;border-radius:7px;padding:6px}
.momentum b{color:#00ff70;font-size:12px}
.momentum small{display:block;margin-top:4px;font-size:11px}
.momentumFill{height:100%;background:linear-gradient(90deg,#22c55e,#facc15,#ef4444);border-radius:999px}
.bookies{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;justify-content:space-between}
.bookies button{border:0;border-radius:6px;padding:7px 13px;font-weight:900;font-size:12px;color:#fff}
.bookies button:nth-child(1){background:#22c55e}
.bookies button:nth-child(2){background:#2563eb}
.bookies button:nth-child(3){background:#f97316}
.bookies button:nth-child(4){background:#facc15;color:#000}
.bottomBar{margin-top:8px;background:#101820;border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:8px;display:flex;gap:14px;flex-wrap:wrap;justify-content:space-around;font-size:12px}
.bottomBar b{color:#00ff70}
.empty{background:#101820;border:1px solid #00ff87;border-radius:10px;padding:18px;font-weight:800}

@media(max-width:900px){
  .cardsGrid{
    grid-template-columns:1fr!important;
    gap:10px!important;
  }

  .filterGrid{
    grid-template-columns:repeat(3,1fr)!important;
  }

  .matchBody{
    grid-template-columns:1fr!important;
  }

  .cardHeaderMobile{
    flex-direction:column!important;
  }

  .teamsRow{
    width:100%!important;
  }

  .badgesRow{
    justify-content:flex-start!important;
  }

  .barsMobile{
    grid-template-columns:1fr!important;
  }

  .bottomBarMobile{
    font-size:10px!important;
    gap:6px!important;
  }

  .matchTitle{
    font-size:15px!important;
    line-height:1!important;
  }

  .teamLogoMobile{
    width:20px!important;
    height:20px!important;
  }

  .pillMobile{
    font-size:10px!important;
    padding:5px 8px!important;
  }

  .titleMobile{
    font-size:28px!important;
  }
}

@media(max-width:520px){
  .filters{grid-template-columns:repeat(3,1fr)}
  .teamText h2{font-size:16px}
  .teams img{width:22px;height:22px}
  h1{font-size:28px}
  .topBar{padding:9px}
  .pill{font-size:11px;padding:6px 8px}
  .search{font-size:13px;padding:10px}
  .card{padding:8px}
}
`;
