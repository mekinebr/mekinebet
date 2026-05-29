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

const TEAM_COLORS = {
  "ipswich town fc": "#2563eb",
  "west ham united fc": "#7a263a",
  "liverpool fc": "#ef4444",
  "crystal palace fc": "#2563eb",
  "southampton fc": "#ef4444",
  "arsenal fc": "#facc15",
  "tottenham hotspur fc": "#f8fafc",
  "brighton & hove albion fc": "#2563eb",
  "wolverhampton wanderers fc": "#f59e0b",
  "brentford fc": "#ef4444",
  "newcastle united fc": "#e5e7eb",
  "everton fc": "#2563eb"
};

const DEMO_SIGNALS = [
  { match: "Ipswich Town FC vs West Ham United FC", league: "English Premier League 2024/25", score: "1 - 3", market: "BTTS / Ambas Marcam", odd: "1.72", confidence: 84, pressure: 70, type: "base" },
  { match: "Liverpool FC vs Crystal Palace FC", league: "English Premier League 2024/25", score: "1 - 1", market: "BTTS / Ambas Marcam", odd: "1.72", confidence: 84, pressure: 70, type: "base" },
  { match: "Southampton FC vs Arsenal FC", league: "English Premier League 2024/25", score: "1 - 2", market: "BTTS / Ambas Marcam", odd: "1.72", confidence: 84, pressure: 70, type: "base" },
  { match: "Tottenham Hotspur FC vs Brighton & Hove Albion FC", league: "English Premier League 2024/25", score: "2 - 1", market: "Over 2,5", odd: "1.86", confidence: 82, pressure: 73, type: "base" },
  { match: "Wolverhampton Wanderers FC vs Brentford FC", league: "English Premier League 2024/25", score: "0 - 1", market: "Over 1,5", odd: "1.65", confidence: 79, pressure: 68, type: "base" },
  { match: "Newcastle United FC vs Everton FC", league: "English Premier League 2024/25", score: "2 - 0", market: "Over 2,5", odd: "1.91", confidence: 86, pressure: 74, type: "base" }
];

const normalizar = (v = "") =>
  String(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

const fallbackLogo = (name = "Time") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=071a10&color=00ff87&bold=true&size=96`;

export default function App() {
  const [signals, setSignals] = useState(DEMO_SIGNALS);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  async function carregar() {
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      const data = await res.json();
      const lista = Array.isArray(data?.activeSignals) ? data.activeSignals : [];
      setSignals(lista.length ? lista : DEMO_SIGNALS);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) {
      setSignals(DEMO_SIGNALS);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
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
      .replace(/Brighton & Hove Albion/gi, "Brighton")
      .replace(/Crystal Palace/gi, "Crystal")
      .replace(/Southampton/gi, "Saints")
      .replace(/Wolverhampton Wanderers/gi, "Wolves")
      .replace(/Tottenham Hotspur/gi, "Tottenham")
      .replace(/Newcastle United/gi, "Newcastle")
      .replace(/West Ham United/gi, "West Ham")
      .replace(/Ipswich Town/gi, "Ipswich")
      .replace(/\bAFC\b|\bFC\b|\bUnited\b|\bTown\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function sigla(nome = "") {
    return nomeCurto(nome).split(" ").map((p) => p[0]).join("").slice(0, 3).toUpperCase();
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

  function teamColor(nome = "", fallback = "#22c55e") {
    return TEAM_COLORS[normalizar(nome)] || fallback;
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
    const home = {
      posse: item.possession || Math.min(72, Math.max(42, conf - 18)),
      finalizacoes: item.shots || Math.max(8, Math.round(press / 6 + gols * 2)),
      noGol: item.shotsOnGoal || Math.max(2, Math.round((press / 18) + gols)),
      ataques: item.attacks || Math.max(18, Math.round(press / 2)),
      cantos: item.corners || Math.max(2, Math.round(press / 18)),
      cartoes: item.cards || Math.max(0, Math.round((100 - conf) / 30)),
      perigosos: item.dangerousAttacks || Math.max(8, Math.round(press / 3))
    };
    const away = {
      posse: Math.max(28, 100 - home.posse),
      finalizacoes: Math.max(3, Math.round(home.finalizacoes * 0.55)),
      noGol: Math.max(0, Math.round(home.noGol * 0.45)),
      ataques: Math.max(12, Math.round(home.ataques * 0.58)),
      cantos: Math.max(1, Math.round(home.cantos * 0.55)),
      cartoes: Math.max(0, Math.round(home.cartoes * 0.8)),
      perigosos: Math.max(6, Math.round(home.perigosos * 0.55))
    };
    return { home, away };
  }

  function mercadoStatus(item) {
    const gols = totalGols(item);
    const min = minuto(item);
    const pressure = item.pressure || 70;
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
      if (pressure >= 75) return "⚡ AMBAS PRESSIONANDO";
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

  function timelineEvents(item, index, homeColor, awayColor) {
    const stats = statsDoJogo(item);
    const current = Math.min(90, Math.max(1, minuto(item) || (index === 3 ? 65 : index === 4 ? 50 : index === 5 ? 80 : 72)));

    const iconsByMinute = {
      12: "⚽",
      27: "🚩",
      38: "⚽",
      52: "🟨",
      69: "⚽",
      75: "🚩",
      84: "🟨"
    };

    return Array.from({ length: 90 }, (_, i) => {
      const minute = i + 1;

      // Um ataque por vez: em cada minuto só existe casa OU fora.
      // Nunca desenha os dois times atacando ao mesmo tempo.
      const wave = Math.sin((minute + index * 7) / 4) + Math.cos((minute + stats.home.ataques) / 7);
      const team = wave >= 0 ? "home" : "away";

      const dangerSeed = Math.abs(Math.sin((minute * 3.7 + stats.home.perigosos + index * 11) / 9));
      const level = dangerSeed > 0.84 ? 3 : dangerSeed > 0.55 ? 2 : 1;

      // Minutos sem ataque ficam bem baixos, apenas cruzando o meio-campo.
      const quiet = (minute + index) % 6 === 0;
      const finalLevel = quiet && !iconsByMinute[minute] ? 1 : level;

      return {
        m: minute,
        team,
        level: finalLevel,
        icon: iconsByMinute[minute] || "",
        color: team === "home" ? homeColor : awayColor
      };
    }).filter((ev) => ev.m <= Math.max(90, current));
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
          <h1>MekineBet AO VIVO <span className="liveDot"></span></h1>
          <div className="subTitle">🟢 Scanner live • odds • pressão • mercados</div>
        </div>
        <div className="statusWrap">
          <span className="pill">🟢 Live: {liveCount}</span>
          <span className="pill">🚨 Alertas: {alertCount}</span>
          <span className="pill">👑 VIP</span>
          <span className="pill">🕘 {lastUpdate || "carregando..."}</span>
        </div>
      </header>

      {liveCount === 0 && (
        <div className="notice">📊 Nenhum LIVE real disponível agora. Mostrando base IA/histórico enquanto monitora automaticamente.</div>
      )}

      <div className="filters">
        {[
          ["TODOS", "▣ TODOS"], ["LIVE", "◉ LIVE"], ["ALERTA", "⚠️ ALERTA"], ["OVER05", "⌁ OVER 0,5"],
          ["OVER15", "⌁ OVER 1,5"], ["OVER25", "⌁ OVER 2,5"], ["OVER35", "⌁ OVER 3,5"],
          ["CARTÕES", "🟨 CARTÕES"], ["CANTOS", "🚩 CANTOS"], ["BTTS", "👥 BTTS"],
          ["TOP IA", "🧠 TOP IA"], ["VIP", "👑 VIP"], ["HISTORICO", "🕘 HISTÓRICO"]
        ].map(([value, label]) => (
          <button key={value} onClick={() => setFiltro(value)} className={filtro === value ? "activeBtn" : ""}>{label}</button>
        ))}
      </div>

      <input placeholder="🔍  Buscar jogo, liga ou mercado..." value={busca} onChange={(e) => setBusca(e.target.value)} className="search" />

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
            const homeColor = teamColor(times.casa, "#22c55e");
            const awayColor = teamColor(times.fora, "#6366f1");
            const currentMinute = Math.min(90, Math.max(1, minuto(item) || (index === 3 ? 65 : index === 4 ? 50 : index === 5 ? 80 : 72)));
            const events = timelineEvents(item, index, homeColor, awayColor);
            const timelineLeft = (m) => `calc(46px + ${(Math.max(0, Math.min(90, m)) / 90) * 100}% - ${((Math.max(0, Math.min(90, m)) / 90) * 51).toFixed(2)}px)`;

            return (
              <section key={item.id || index} className="card">
                <div className="matchHero">
                  <div className="teamSide">
                    <img className="heroLogo" src={logoCasa(item)} alt={times.casa} onError={(e) => (e.currentTarget.src = fallbackLogo(times.casa))} />
                    <small style={{ color: homeColor }}>{nomeCurto(times.casa)}</small>
                  </div>
                  <div className="heroCenter">
                    <h2><span style={{ color: homeColor }}>{nomeCurto(times.casa)}</span> <em>vs</em> <span style={{ color: awayColor }}>{nomeCurto(times.fora)}</span></h2>
                    <p>{item.league || "Liga"}</p>
                    <b>{item.score || "0-0"}</b>
                    <strong>{currentMinute}'</strong>
                  </div>
                  <div className="teamSide right">
                    <img className="heroLogo" src={logoFora(item)} alt={times.fora} onError={(e) => (e.currentTarget.src = fallbackLogo(times.fora))} />
                    <small style={{ color: awayColor }}>{nomeCurto(times.fora)}</small>
                  </div>
                </div>

                <div className="badges">
                  <span className="base">{liveReal ? "AO VIVO" : "BASE"}</span>
                  {vip && <span className="vip">VIP</span>}
                  <span className="market">{cat}</span>
                </div>

                <div className="betStats">
                  <div className="statDial" style={{ "--home": homeColor, "--away": awayColor }}>
                    <small>ATAQUES</small>
                    <div><b style={{ color: homeColor }}>{stats.home.ataques}</b><i></i><b style={{ color: awayColor }}>{stats.away.ataques}</b></div>
                  </div>
                  <div className="statDial" style={{ "--home": homeColor, "--away": awayColor }}>
                    <small>ATAQUES PERIGOSOS</small>
                    <div><b style={{ color: homeColor }}>{stats.home.perigosos}</b><i></i><b style={{ color: awayColor }}>{stats.away.perigosos}</b></div>
                  </div>
                  <div className="shotBox">
                    <small>FINALIZAÇÕES / CHUTES AO GOL</small>
                    <strong>{stats.home.finalizacoes}/{stats.home.noGol}</strong>
                    <div className="shotBars"><span style={{ width: `${Math.min(90, stats.home.finalizacoes * 4)}%`, background: homeColor }}></span><em style={{ width: `${Math.min(90, stats.away.finalizacoes * 5)}%`, background: awayColor }}></em></div>
                    <strong>{stats.away.finalizacoes}/{stats.away.noGol}</strong>
                  </div>
                  <div className="miniCounters homeCounters">
                    <span>🚩 <b>{stats.home.cantos}</b></span><span>🟨 <b>{stats.home.cartoes}</b></span><span>🟥 <b>0</b></span>
                  </div>
                  <div className="miniCounters awayCounters">
                    <span>🟨 <b>{stats.away.cartoes}</b></span><span>🟥 <b>0</b></span><span>🚩 <b>{stats.away.cantos}</b></span>
                  </div>
                  <div className="posseWide">
                    <span>{stats.home.posse}%</span>
                    <div><i style={{ width: `${stats.home.posse}%`, background: homeColor }}></i><em style={{ width: `${stats.away.posse}%`, background: awayColor }}></em></div>
                    <span>{stats.away.posse}%</span>
                  </div>
                </div>

                <div className="miniMap">
                  <div className="eventBubble"><span>⚽</span><div><b>{status.replace("🔥", "")}</b><small>{item.pressure || 70}% pressão</small></div></div>
                  <div className="field3d">
                    <div className="grass"></div><div className="shade"></div><div className="midLine"></div><div className="centerCircle"></div><div className="boxLeft"></div><div className="boxRight"></div><div className="goalLeft"></div><div className="goalRight"></div>
                    <div className="dot d1" style={{ background: homeColor }}></div><div className="dot d2" style={{ background: homeColor }}></div><div className="dot d3" style={{ background: awayColor }}></div><div className="dot d4" style={{ background: awayColor }}></div>
                  </div>
                  <div className="mapStats"><span>Posse {stats.home.posse}%</span><span>Final. {stats.home.finalizacoes}</span><span>Atq. {stats.home.ataques}</span></div>
                </div>

                <div className="flowCard">
                  <h3>CRONOLOGIA DA PARTIDA</h3>
                  <div className="flowMinuteScale"><span>0'</span><span>15'</span><span>30'</span><span>45'</span><span>60'</span><span>75'</span><span>90'</span></div>
                  <div className="flowWrap">
                    <div className="teamMini homeMini"><span>{sigla(times.casa)}</span><img src={logoCasa(item)} alt="" /></div>
                    <div className="teamMini awayMini"><span>{sigla(times.fora)}</span><img src={logoFora(item)} alt="" /></div>
                    <div className="middleLine"></div>
                    <div className="nowLine" style={{ left: timelineLeft(currentMinute) }}><b>{currentMinute}'</b></div>
                    {events.map((ev, i) => (
                      <React.Fragment key={i}>
                        <span
                          className={`flowSpike ${ev.team}`}
                          style={{
                            left: timelineLeft(ev.m),
                            height: `${ev.level === 3 ? 32 : ev.level === 2 ? 23 : 13}px`,
                            background: ev.color,
                            boxShadow: `0 0 8px ${ev.color}`
                          }}
                        />
                        {ev.icon && <span className={`flowIcon ${ev.team}`} style={{ left: timelineLeft(ev.m) }}>{ev.icon}</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flowLegend">
                    <span><i className="leve"></i>Ataque leve</span><span><i className="perigoso"></i>Ataque perigoso</span><span><i className="clara"></i>Chance clara</span><span>⚽ Gol</span><span>🟨 Cartão</span><span>🚩 Escanteio</span>
                  </div>
                </div>

                <div className="marketLine">
                  <div><b>{item.market}</b><span>Status: {status}</span><strong>Odd: {item.odd || "1.72"}</strong></div>
                  <div><b>IA {item.confidence || 70}%</b><span className="bar"><i style={{ width: `${item.confidence || 70}%` }}></i></span><small>Pressão {item.pressure || 70}%</small></div>
                </div>

                <div className="bookies"><button>Betano</button><button>Novibet</button><button>Bet365</button><button>VIP</button></div>
              </section>
            );
          })}
        </main>
      )}
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
*{box-sizing:border-box}body{margin:0;background:#081016;font-family:'Inter',Arial,sans-serif}.page{min-height:100vh;background:radial-gradient(circle at top,#0b1d22,#05090c 60%);color:#fff;padding:10px;overflow-x:hidden}.topBar{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px}h1{color:#58f5a5;font-size:clamp(24px,3vw,40px);margin:0;font-weight:900;line-height:1}.liveDot{display:inline-block;width:14px;height:14px;background:#22c55e;border-radius:50%;box-shadow:0 0 18px #22c55e}.subTitle{font-size:12px;font-weight:800;color:#d1d5db;margin-top:4px}.statusWrap{display:flex;gap:10px;flex-wrap:wrap}.pill{background:#071014;border:1px solid #0f7a3e;border-radius:8px;padding:8px 16px;font-weight:900}.notice{background:#4a1c08;border:1px solid #ff7b00;padding:7px;border-radius:7px;margin-bottom:7px;font-weight:900;font-size:12px}.filters{display:grid;grid-template-columns:repeat(13,minmax(0,1fr));gap:7px;margin-bottom:7px}.filters button{background:#101820;color:#fff;border:1px solid rgba(255,255,255,.18);padding:8px 3px;border-radius:7px;cursor:pointer;font-weight:900;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.filters .activeBtn{background:#1ccc67;color:#001b0b}.search{width:100%;background:#111b21;border:1px solid #0f7a3e;color:#fff;padding:9px;border-radius:7px;margin-bottom:9px;font-size:13px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:start}.card{background:linear-gradient(180deg,#07141a,#06110d);border:1px solid rgba(0,214,111,.42);border-radius:12px;box-shadow:0 0 18px rgba(0,255,112,.06);overflow:hidden;padding:8px;min-height:610px}.matchHero{display:grid;grid-template-columns:72px 1fr 72px;align-items:center;text-align:center;min-height:86px;gap:8px}.teamSide{display:grid;gap:3px;justify-items:center}.teamSide.right{justify-items:center}.heroLogo{width:54px;height:54px;object-fit:contain;filter:drop-shadow(0 0 5px rgba(255,255,255,.22))}.teamSide small{font-weight:900;font-size:10px}.heroCenter h2{font-size:17px;margin:0;font-weight:900;line-height:1}.heroCenter h2 em{font-style:normal;color:#fff}.heroCenter p{font-size:10px;color:#d1d5db;margin:5px 0}.heroCenter b{display:block;font-size:30px;line-height:1}.heroCenter strong{color:#ef4444;font-size:13px}.badges{display:flex;justify-content:flex-end;gap:4px;margin-top:-15px;margin-bottom:5px}.badges span{border-radius:999px;padding:3px 8px;font-size:9px;font-weight:900}.base{background:#374151}.vip{background:#facc15;color:#000}.market{background:#0ea5e9}.betStats{position:relative;display:grid;grid-template-columns:1fr 1fr 1.25fr auto auto;gap:8px;align-items:end;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08);padding:10px 4px 8px;margin-bottom:7px}.statDial small,.shotBox small{display:block;color:#e5e7eb;font-size:8px;font-weight:900;text-align:center}.statDial div{display:flex;gap:8px;align-items:center;justify-content:center}.statDial b{font-size:16px}.statDial i{width:38px;height:38px;border-radius:50%;display:inline-block;position:relative;background:conic-gradient(var(--home) 0 62%, #d1d5db 62% 70%, var(--away) 70% 100%);box-shadow:0 0 10px rgba(255,255,255,.08)}.statDial i:before{content:'';position:absolute;inset:7px;background:#07141a;border-radius:50%}.statDial i:after{content:'▶';position:absolute;left:13px;top:9px;color:#d1d5db;font-size:12px}.shotBox{display:grid;grid-template-columns:auto 1fr auto;gap:5px;align-items:center}.shotBox small{grid-column:1/-1}.shotBox strong{font-size:17px}.shotBars{display:grid;gap:5px}.shotBars span,.shotBars em{height:4px;border-radius:999px;display:block}.shotBars em{opacity:.82}.miniCounters{display:grid;grid-template-columns:repeat(3,20px);gap:2px;justify-items:center;font-size:13px}.miniCounters b{display:block;text-align:center;color:#fff}.posseWide{grid-column:1/-1;display:grid;grid-template-columns:40px 1fr 40px;gap:8px;align-items:center;font-weight:900}.posseWide div{display:flex;height:4px;background:#1f2937;border-radius:999px;overflow:hidden}.posseWide i,.posseWide em{display:block;height:100%}.miniMap{position:relative;margin:0 auto 8px;max-width:380px}.eventBubble{position:absolute;z-index:3;left:50%;top:-3px;transform:translateX(-50%);background:#050505;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:5px 13px;display:flex;gap:8px;align-items:center;box-shadow:0 6px 18px rgba(0,0,0,.55)}.eventBubble span{background:#fff;border-radius:50%;width:24px;height:24px;display:grid;place-items:center}.eventBubble b{font-size:10px}.eventBubble small{display:block;font-size:9px;color:#7dd3fc}.field3d{position:relative;height:88px;margin:22px auto 0;border:1px solid rgba(0,255,112,.45);border-radius:14px;overflow:hidden;background:repeating-linear-gradient(90deg,#3d991f 0 28px,#2d841b 28px 56px);transform:perspective(260px) rotateX(28deg);box-shadow:inset 0 10px 18px rgba(255,255,255,.13),0 12px 20px rgba(0,0,0,.4)}.grass{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.2),transparent 30%),repeating-linear-gradient(90deg,rgba(255,255,255,.08) 0 1px,transparent 1px 16px)}.shade{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.12),transparent 45%)}.midLine{position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,.85)}.centerCircle{position:absolute;left:50%;top:50%;width:32px;height:32px;border:1px solid rgba(255,255,255,.9);border-radius:50%;transform:translate(-50%,-50%)}.boxLeft,.boxRight{position:absolute;top:26%;width:38px;height:48%;border:1px solid rgba(255,255,255,.8)}.boxLeft{left:0;border-left:0}.boxRight{right:0;border-right:0}.goalLeft,.goalRight{position:absolute;top:41%;width:5px;height:18%;background:#fff}.goalLeft{left:0}.goalRight{right:0}.dot{position:absolute;width:7px;height:7px;border-radius:50%;box-shadow:0 0 8px currentColor}.d1{left:35%;top:42%}.d2{left:45%;top:58%}.d3{left:56%;top:42%}.d4{left:68%;top:55%}.mapStats{display:grid;grid-template-columns:repeat(3,1fr);font-size:9px;text-align:center;font-weight:800;margin-top:2px}.flowCard{border:1px solid rgba(255,255,255,.13);border-radius:9px;background:linear-gradient(180deg,rgba(7,20,28,.92),rgba(5,12,15,.9));padding:7px;margin-top:5px}.flowCard h3{text-align:center;margin:0 0 4px;font-size:11px}.flowMinuteScale{display:grid;grid-template-columns:repeat(7,1fr);font-size:9px;font-weight:900;color:#e5e7eb;padding:0 22px 3px 46px}.flowWrap{position:relative;height:112px;padding-left:46px;border-radius:7px;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(0,0,0,.06));overflow:hidden}
.flowWrap:before{content:'';position:absolute;left:46px;right:5px;top:0;bottom:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.08) 0 1px,transparent 1px calc((100% - 51px)/90));pointer-events:none}.teamMini{position:absolute;left:0;width:42px;display:grid;justify-items:center;font-size:10px;font-weight:900}.teamMini img{width:28px;height:28px;object-fit:contain}.homeMini{top:10px}.awayMini{bottom:10px}.middleLine{position:absolute;left:45px;right:5px;top:50%;height:1px;background:rgba(255,255,255,.75)}.nowLine{position:absolute;top:0;bottom:0;width:2px;background:#ef4444;z-index:6}.nowLine b{position:absolute;top:-1px;left:50%;transform:translateX(-50%);background:#ef4444;color:#fff;border-radius:999px;padding:2px 5px;font-size:10px}.flowSpike{position:absolute;width:2px;border-radius:2px;left:0;z-index:4;opacity:.92}.flowSpike.home{bottom:50%;margin-bottom:1px}.flowSpike.away{top:50%;margin-top:1px}.flowIcon{position:absolute;z-index:7;transform:translateX(-45%);font-size:15px}.flowIcon.home{bottom:calc(50% + 34px)}.flowIcon.away{top:calc(50% + 34px)}.flowLegend{display:grid;grid-template-columns:repeat(6,auto);justify-content:space-between;gap:6px;font-size:9px;margin-top:6px;color:#e5e7eb}.flowLegend span{white-space:nowrap}.flowLegend i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:3px}.leve{background:#22c55e;opacity:.55}.perigoso{background:#22c55e}.clara{background:#84cc16}.marketLine{display:grid;grid-template-columns:1.4fr 1fr;gap:8px;border:1px solid #0f7a3e;border-radius:8px;padding:8px;margin-top:8px}.marketLine b{display:block}.marketLine span{font-size:11px}.marketLine strong{color:#facc15}.bar{display:block;height:7px;background:#1f2937;border-radius:999px;overflow:hidden;margin-top:4px}.bar i{display:block;height:100%;background:#22c55e}.bookies{display:flex;gap:8px;justify-content:space-between;margin-top:8px}.bookies button{border:0;border-radius:6px;padding:8px 14px;font-weight:900;color:#fff}.bookies button:nth-child(1){background:#22c55e}.bookies button:nth-child(2){background:#2563eb}.bookies button:nth-child(3){background:#f97316}.bookies button:nth-child(4){background:#facc15;color:#000}.empty{border:1px solid #0f7a3e;padding:18px;border-radius:10px}.footerBar{display:none}@media(max-width:1100px){.grid{grid-template-columns:1fr}.filters{grid-template-columns:repeat(3,1fr)}.betStats{grid-template-columns:1fr 1fr}.shotBox,.posseWide{grid-column:1/-1}.miniCounters{grid-template-columns:repeat(3,1fr)}.marketLine{grid-template-columns:1fr}.topBar{align-items:flex-start}.flowLegend{grid-template-columns:repeat(3,1fr)}}

/* ===== AJUSTE FINAL DE ALINHAMENTO PC ===== */
.grid{align-items:stretch!important}
.card{display:flex!important;flex-direction:column!important;min-height:640px!important;height:100%!important}
.matchHero{height:88px!important;min-height:88px!important}
.heroCenter h2{font-size:16px!important;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.heroCenter b{font-size:28px!important}
.badges{min-height:22px!important;align-items:center!important}
.betStats{grid-template-columns:1fr 1fr 1.25fr 64px 64px!important;min-height:96px!important;align-items:center!important}
.statDial{min-width:0!important}.statDial div{gap:6px!important}.statDial b{width:24px;text-align:center!important}.statDial i{width:34px!important;height:34px!important}.statDial i:after{left:11px!important;top:7px!important}
.shotBox{min-width:0!important}.shotBox strong{text-align:center;min-width:36px!important}.miniCounters{justify-content:center!important;align-self:center!important}.miniCounters span{display:grid;gap:1px;justify-items:center;font-size:12px!important}
.posseWide{margin-top:2px!important}.posseWide span:first-child{text-align:left}.posseWide span:last-child{text-align:right}
.miniMap{width:100%!important;max-width:none!important;padding:0 8px!important}.field3d{height:82px!important;margin-top:20px!important}.mapStats{padding:0 6px!important}
.flowCard{margin-top:8px!important;min-height:170px!important}.flowCard h3{height:16px!important;line-height:16px!important}.flowMinuteScale{padding-left:52px!important;padding-right:10px!important;align-items:center!important}.flowWrap{height:114px!important;padding-left:52px!important;padding-right:10px!important}.flowWrap:before{left:52px!important;right:10px!important}.middleLine{left:52px!important;right:10px!important}.teamMini{width:48px!important}.teamMini img{width:25px!important;height:25px!important}.flowSpike{width:2px!important;transform:translateX(-1px)!important}.flowIcon{font-size:13px!important;transform:translateX(-50%)!important}.nowLine{transform:translateX(-1px)!important}.flowLegend{min-height:18px!important;align-items:center!important;overflow:hidden!important}.flowLegend span{text-align:center!important;font-size:8px!important}
.marketLine{margin-top:auto!important;min-height:64px!important;align-items:center!important}.bookies{height:38px!important;align-items:center!important}.bookies button{min-width:80px!important}
@media(max-width:1100px){.card{min-height:auto!important}.matchHero{height:auto!important}.betStats{grid-template-columns:1fr 1fr!important}.flowLegend{grid-template-columns:repeat(3,1fr)!important}.bookies button{min-width:auto!important;flex:1}}

`;
