import React, { useEffect, useMemo, useState } from "react";

const API_URL = "https://mekinebet.onrender.com/api/signals";

const TEAM_LOGOS = {
  "ipswich town fc": "https://media.api-sports.io/football/teams/57.png",
  "west ham united fc": "https://media.api-sports.io/football/teams/48.png",
  "liverpool fc": "https://media.api-sports.io/football/teams/40.png",
  "crystal palace fc": "https://media.api-sports.io/football/teams/52.png",
  "southampton fc": "https://media.api-sports.io/football/teams/41.png",
  "arsenal fc": "https://media.api-sports.io/football/teams/42.png",
  "tottenham hotspur fc": "https://media.api-sports.io/football/teams/47.png",
  "wolverhampton wanderers fc": "https://media.api-sports.io/football/teams/39.png",
  "newcastle united fc": "https://media.api-sports.io/football/teams/34.png",
  "everton fc": "https://media.api-sports.io/football/teams/45.png",
  "brentford fc": "https://media.api-sports.io/football/teams/55.png",
  "brighton & hove albion fc": "https://media.api-sports.io/football/teams/51.png"
};

const normalizar = (v = "") =>
  String(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

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

  function timesDoJogo(item) {
    const partes = String(item.match || "").split(/\s+vs\s+|\s+x\s+/i);
    return {
      casa: item.homeTeam || item.home?.name || item.home || partes[0] || "Casa",
      fora: item.awayTeam || item.away?.name || item.away || partes[1] || "Fora"
    };
  }

  function nomeCurto(nome = "") {
    return String(nome)
      .replace(/Football Club/gi, "")
      .replace(/\bAFC\b/gi, "")
      .replace(/\bFC\b/gi, "")
      .replace(/\bTown\b/gi, "")
      .replace(/\bUnited\b/gi, "")
      .replace(/\bWanderers\b/gi, "Wolves")
      .replace(/\bHotspur\b/gi, "Spurs")
      .replace(/\bCrystal Palace\b/gi, "Crystal")
      .replace(/\bSouthampton\b/gi, "Saints")
      .replace(/\bManchester\b/gi, "Man.")
      .replace(/\bBrighton & Hove Albion\b/gi, "Brighton")
      .replace(/\bNottingham Forest\b/gi, "Nottm Forest")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tituloJogo(item) {
    const t = timesDoJogo(item);
    return `${nomeCurto(t.casa)} vs ${nomeCurto(t.fora)}`;
  }

  function logoCasa(item) {
    const t = timesDoJogo(item);
    const key = normalizar(t.casa);
    return item.logoHome || item.homeLogo || item.teamHomeLogo || item.home?.logo || item.teams?.home?.logo || TEAM_LOGOS[key] || fallbackLogo(t.casa);
  }

  function logoFora(item) {
    const t = timesDoJogo(item);
    const key = normalizar(t.fora);
    return item.logoAway || item.awayLogo || item.teamAwayLogo || item.away?.logo || item.teams?.away?.logo || TEAM_LOGOS[key] || fallbackLogo(t.fora);
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
        if (filtro === "LIVE") return item.type === "live";
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
        if (filtro === "HISTORICO") return item.type !== "live";
        return true;
      })
      .sort((a, b) => (b.confidence || 70) + (b.pressure || 70) - ((a.confidence || 70) + (a.pressure || 70)));
  }, [signals, busca, filtro]);

  const liveCount = signals.filter((s) => s.type === "live").length;
  const alertCount = signals.filter((s) => mercadoStatus(s).includes("🔥") || mercadoStatus(s).includes("🚨")).length;

  return (
    <div className="page">
      <style>{css}</style>

      <header className="topBar">
        <div>
          <h1>MekineBet AO VIVO</h1>
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
          <button key={value} onClick={() => setFiltro(value)} className={filtro === value ? "activeBtn" : ""}>
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
            const vip = isVip(item);
            const liveReal = item.type === "live";
            const times = timesDoJogo(item);
            const ballX = Math.min(82, Math.max(18, stats.ataques));
            const ballY = Math.min(72, Math.max(24, stats.perigosos + 22));

            return (
              <section key={item.id || index} className="card">
                <div className="matchHero">
                  <div className="logoSlot">
                    <img className="heroLogo" src={logoCasa(item)} alt={times.casa} onError={(e) => (e.currentTarget.src = fallbackLogo(times.casa))} />
                  </div>

                  <div className="heroCenter">
                    <h2>{tituloJogo(item)}</h2>
                    <p>{item.league || "Liga"}</p>
                  </div>

                  <div className="logoSlot">
                    <img className="heroLogo" src={logoFora(item)} alt={times.fora} onError={(e) => (e.currentTarget.src = fallbackLogo(times.fora))} />
                  </div>
                </div>

                <div className="badges">
                  <span className="base">{liveReal ? "AO VIVO" : "BASE"}</span>
                  {vip && <span className="vip">VIP</span>}
                  <span className="market">{cat}</span>
                </div>

                <div className="bodyGrid">
                  <div className="box scoreBox">
                    <span>Placar</span>
                    <b>{item.score || "0-0"}</b>
                    <small>{liveReal ? `${item.minute || 0}'` : "Pré/Base"}</small>
                  </div>

                  <div className="miniMap">
                    <div className="stadium">
                      <div className="lights"></div>
                      <div className="eventBubble">
                        <span>⚽</span>
                        <div>
                          <b>{status.replace("🔥", "").replace("✅", "").replace("📊", "")}</b>
                          <small>{stats.perigosos}% pressão</small>
                        </div>
                      </div>

                      <div className="field3d">
                        <div className="grass"></div>
                        <div className="shade"></div>
                        <div className="midLine"></div>
                        <div className="centerCircle"></div>
                        <div className="boxLeft"></div>
                        <div className="boxRight"></div>
                        <div className="goalLeft"></div>
                        <div className="goalRight"></div>
                        <div className="player p1"></div>
                        <div className="player p2"></div>
                        <div className="player p3"></div>
                        <div className="ballLive" style={{ left: `${ballX}%`, top: `${ballY}%` }}></div>
                      </div>
                    </div>

                    <div className="stats">
                      <span>Posse {stats.posse}%</span>
                      <span>Final. {stats.finalizacoes}</span>
                      <span>Ataq {stats.ataques}</span>
                      <span>Can {stats.cantos}</span>
                      <span>Car {stats.cartoes}</span>
                      <span>Per {stats.perigosos}</span>
                    </div>
                  </div>
                </div>

                <div className="box marketBox">
                  <b>{item.market}</b>
                  <span>Status: {status}</span>
                  <strong>Odd: {item.odd || "1.72"}</strong>
                </div>

                <div className="bars metricsRow">
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

      <footer className="footerBar">
        <span>📊 Sinais: <b>{signals.length}</b></span>
        <span>🟢 IA Online</span>
        <span>⚡ Atualização: <b>20s</b></span>
        <span>🔒 API-Sports</span>
      </footer>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

*{box-sizing:border-box}
body{margin:0;background:#1f1f1f;font-family:'Inter',Arial,sans-serif}
.page{min-height:100vh;background:#1f1f1f;color:#fff;padding:6px;overflow-x:hidden}
.topBar{background:linear-gradient(180deg,#10281d,#0b1511);border:1px solid #00d66f;border-radius:8px;padding:7px 12px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px}
h1{color:#00ff70;font-size:clamp(22px,2.5vw,34px);margin:0;font-weight:900;line-height:1}
.subTitle{color:#d8d8d8;margin-top:3px;font-size:11px}
.statusWrap{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
.pill{border:1px solid #00d66f;background:#0b1511;padding:6px 10px;border-radius:7px;font-weight:900;font-size:12px}
.notice{background:#4a1c08;border:1px solid #ff7b00;padding:7px;border-radius:7px;margin-bottom:6px;font-weight:900;font-size:12px}
.filters{display:grid;grid-template-columns:repeat(13,minmax(0,1fr));gap:4px;margin-bottom:6px}
.filters button{background:#252525;color:#fff;border:1px solid #00d66f;padding:7px 2px;border-radius:6px;cursor:pointer;font-weight:900;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.filters .activeBtn{background:#00d66f;color:#001b0b}
.search{width:100%;background:#202b2b;border:1px solid #00d66f;color:#fff;padding:9px;border-radius:7px;margin-bottom:7px;font-size:13px}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;align-items:stretch}

.card{background:linear-gradient(180deg,#102016,#0a1411);border:1px solid rgba(0,214,111,.58);border-radius:9px;padding:7px;box-shadow:0 0 8px rgba(0,255,80,.08);overflow:hidden;display:flex;flex-direction:column;height:350px;min-height:350px;max-height:350px}

.matchHero{position:relative;display:grid;grid-template-columns:58px minmax(0,1fr) 58px;align-items:center;gap:8px;min-height:58px;padding:5px 8px;margin-bottom:5px;border:1px solid rgba(0,214,111,.45);border-radius:12px;overflow:hidden;background:radial-gradient(circle at 50% 100%,rgba(0,255,112,.18),transparent 45%),linear-gradient(180deg,#101f18,#07100c);box-shadow:inset 0 0 18px rgba(0,255,112,.06)}
.matchHero:after{content:"✦";position:absolute;right:8px;bottom:2px;color:rgba(255,255,255,.35);font-size:16px}
.logoSlot{width:58px;height:58px;display:flex;align-items:center;justify-content:center}
.heroLogo{width:54px;height:54px;border-radius:50%;object-fit:contain;background:#fff;padding:3px;border:2px solid rgba(255,255,255,.22);box-shadow:0 0 12px rgba(255,255,255,.15),0 0 20px rgba(0,255,120,.15)}
.heroCenter{min-width:0;text-align:center}
.heroCenter h2{color:#00ff70;font-size:14px;margin:0;line-height:1;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}
.heroCenter p{margin:4px 0 0;color:#c8d6cc;font-size:8.5px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.badges{display:flex;gap:4px;flex-wrap:nowrap;justify-content:flex-end;align-items:flex-start;margin-bottom:5px}
.badges span{padding:3px 7px;border-radius:999px;font-size:9px;font-weight:900;white-space:nowrap}
.base{background:#3a4655}
.vip{background:#facc15;color:#000}
.market{background:#0ea5e9}

.bodyGrid{display:grid;grid-template-columns:.74fr 1.26fr;gap:6px;align-items:start}
.box{background:#071a10;border:1px solid #0f7a3e;border-radius:6px;padding:6px;display:grid;gap:1px;font-size:10.5px}
.scoreBox{height:70px;align-content:center}
.scoreBox b{font-size:18px;line-height:1}
.marketBox{margin-top:5px;text-align:center}
.marketBox strong{color:#facc15}

.miniMap{background:#050c0a;border:1px solid #0f7a3e;border-radius:8px;padding:4px;width:100%;overflow:hidden}
.stadium{position:relative;width:100%;max-width:260px;margin:0 auto;height:118px;border-radius:10px;overflow:hidden;background:radial-gradient(circle at 50% 0%,rgba(255,255,255,.55),transparent 22%),linear-gradient(180deg,#1c2c35 0%,#07110d 38%,#020605 100%);box-shadow:inset 0 0 28px rgba(255,255,255,.12)}
.lights{position:absolute;left:0;right:0;top:0;height:34px;background:radial-gradient(circle at 10% 30%,rgba(255,255,255,.95),transparent 7%),radial-gradient(circle at 22% 20%,rgba(255,255,255,.95),transparent 7%),radial-gradient(circle at 35% 15%,rgba(255,255,255,.95),transparent 7%),radial-gradient(circle at 50% 12%,rgba(255,255,255,.95),transparent 7%),radial-gradient(circle at 65% 15%,rgba(255,255,255,.95),transparent 7%),radial-gradient(circle at 78% 20%,rgba(255,255,255,.95),transparent 7%),radial-gradient(circle at 90% 30%,rgba(255,255,255,.95),transparent 7%);filter:blur(.2px);opacity:.9}
.eventBubble{position:absolute;z-index:6;top:15px;left:50%;transform:translateX(-50%);min-width:118px;height:32px;background:#050505;border-radius:999px;display:flex;align-items:center;gap:7px;padding:4px 10px;box-shadow:0 4px 12px rgba(0,0,0,.65);border:1px solid rgba(255,255,255,.15)}
.eventBubble span{width:24px;height:24px;background:#fff;color:#111;border-radius:50%;display:grid;place-items:center;font-size:12px}
.eventBubble b{display:block;color:#fff;font-size:9.5px;line-height:1;max-width:76px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.eventBubble small{display:block;color:#9ca3af;font-size:8px}

.field3d{position:absolute;left:8px;right:8px;bottom:8px;height:68px;border:1px solid rgba(255,255,255,.65);border-radius:5px;overflow:hidden;background:repeating-linear-gradient(90deg,#3d991f 0 22px,#2d841b 22px 44px);transform:perspective(220px) rotateX(38deg);transform-origin:center bottom;box-shadow:inset 0 10px 14px rgba(255,255,255,.15),inset 0 -10px 18px rgba(0,0,0,.35),0 10px 20px rgba(0,0,0,.55)}
.grass{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.18),transparent 30%),repeating-linear-gradient(90deg,rgba(255,255,255,.08) 0 1px,transparent 1px 16px)}
.shade{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.12),transparent 45%)}
.midLine{position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,.85)}
.centerCircle{position:absolute;left:50%;top:50%;width:28px;height:28px;border:1px solid rgba(255,255,255,.85);border-radius:50%;transform:translate(-50%,-50%)}
.boxLeft,.boxRight{position:absolute;top:22%;width:28px;height:56%;border:1px solid rgba(255,255,255,.85)}
.boxLeft{left:0;border-left:0}
.boxRight{right:0;border-right:0}
.goalLeft,.goalRight{position:absolute;top:40%;width:4px;height:20%;background:rgba(255,255,255,.9)}
.goalLeft{left:0}
.goalRight{right:0}
.player{position:absolute;width:7px;height:7px;border-radius:50%;box-shadow:0 0 8px currentColor}
.p1{left:28%;top:50%;background:#facc15;color:#facc15}
.p2{left:60%;top:48%;background:#00d9ff;color:#00d9ff}
.p3{left:73%;top:34%;background:#00ff70;color:#00ff70}
.ballLive{position:absolute;width:7px;height:7px;border-radius:50%;background:#fff;box-shadow:0 0 8px #fff,0 0 14px #00ff70;transform:translate(-50%,-50%);transition:all .8s ease;animation:ballPulse 1.4s infinite}
@keyframes ballPulse{0%,100%{scale:1}50%{scale:1.35}}

.stats{margin-top:3px;display:grid;grid-template-columns:repeat(3,1fr);gap:1px;font-size:8px;color:#f1f5f9;text-align:center}
.bars,.metricsRow{display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:10px;font-weight:900;margin-top:5px;align-items:center}
.barBg{height:6px;background:#1e293b;border-radius:999px;overflow:hidden;margin-top:2px}
.barGreen{height:100%;background:#00ff70}
.barGold{height:100%;background:#facc15}
.momentum{margin-top:5px;background:#071a10;border:1px solid #0f7a3e;border-radius:6px;padding:5px}
.momentum b{color:#00ff70;font-size:11px}
.momentum small{display:block;margin-top:3px;font-size:10px}
.momentumFill{height:100%;background:linear-gradient(90deg,#22c55e,#facc15,#ef4444);border-radius:999px}
.bookies{display:flex;gap:5px;flex-wrap:wrap;margin-top:auto;padding-top:6px;justify-content:space-between}
.bookies button{border:0;border-radius:5px;padding:6px 10px;font-weight:900;font-size:11px;color:#fff}
.bookies button:nth-child(1){background:#22c55e}
.bookies button:nth-child(2){background:#2563eb}
.bookies button:nth-child(3){background:#f97316}
.bookies button:nth-child(4){background:#facc15;color:#000}
.empty{background:#101820;border:1px solid #00ff87;border-radius:10px;padding:18px;font-weight:800}
.footerBar{margin-top:8px;min-height:42px;border:1px solid rgba(0,255,100,.22);background:#101820;border-radius:8px;display:flex;justify-content:space-around;align-items:center;gap:12px;flex-wrap:wrap;font-size:13px;font-weight:700;padding:8px}
.footerBar b{color:#00ff70}

@media(max-width:900px){
  .grid{grid-template-columns:1fr!important;gap:10px!important}
  .filters{grid-template-columns:repeat(3,1fr)!important}
  .bodyGrid{grid-template-columns:1fr!important}
  .badges{justify-content:flex-start!important}
  .bars,.metricsRow{grid-template-columns:1fr!important}
  .matchHero{grid-template-columns:52px minmax(0,1fr) 52px}
  .logoSlot{width:52px;height:52px}
  .heroLogo{width:50px;height:50px}
  .card{height:auto;max-height:none;min-height:350px}
  .stadium{max-width:100%;height:145px}
  .field3d{height:86px}
}
`;
