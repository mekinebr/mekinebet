import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://mekinebet-api.onrender.com").replace(/\/$/, "");
const API_URL = `${API_BASE_URL}/api/signals`;

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
  "brighton & hove albion fc": "https://media.api-sports.io/football/teams/51.png",
  "flamengo": "https://media.api-sports.io/football/teams/127.png",
  "cr flamengo": "https://media.api-sports.io/football/teams/127.png",
  "flamengo rj": "https://media.api-sports.io/football/teams/127.png",
  "palmeiras": "https://media.api-sports.io/football/teams/121.png",
  "se palmeiras": "https://media.api-sports.io/football/teams/121.png",
  "sao paulo": "https://media.api-sports.io/football/teams/126.png",
  "são paulo": "https://media.api-sports.io/football/teams/126.png",
  "corinthians": "https://media.api-sports.io/football/teams/131.png",
  "vasco da gama": "https://media.api-sports.io/football/teams/133.png",
  "botafogo": "https://media.api-sports.io/football/teams/120.png",
  "fluminense": "https://media.api-sports.io/football/teams/124.png",
  "atletico mineiro": "https://media.api-sports.io/football/teams/1062.png",
  "atlético mineiro": "https://media.api-sports.io/football/teams/1062.png",
  "gremio": "https://media.api-sports.io/football/teams/130.png",
  "grêmio": "https://media.api-sports.io/football/teams/130.png",
  "internacional": "https://media.api-sports.io/football/teams/119.png"
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
  "everton fc": "#2563eb",
  "flamengo": "#ef4444",
  "cr flamengo": "#ef4444",
  "flamengo rj": "#ef4444",
  "palmeiras": "#22c55e",
  "se palmeiras": "#22c55e",
  "sao paulo": "#f8fafc",
  "são paulo": "#f8fafc",
  "corinthians": "#f8fafc",
  "vasco da gama": "#f8fafc",
  "botafogo": "#e5e7eb",
  "fluminense": "#7f1d1d",
  "atletico mineiro": "#f8fafc",
  "atlético mineiro": "#f8fafc",
  "gremio": "#60a5fa",
  "grêmio": "#60a5fa",
  "internacional": "#ef4444"
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

const valor = (...vals) => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

const normalizarSinal = (item = {}) => {
  const match = valor(item.match, item.partida, item.game, "");
  const home = valor(item.homeTeam, item.home, item.casa, item.mandante, item.teams?.home?.name, "");
  const away = valor(item.awayTeam, item.away, item.fora, item.visitante, item.teams?.away?.name, "");
  const market = valor(item.market, item.mercado, item.signal, item.sinal, "Monitoramento IA");
  const confidence = Number(valor(item.confidence, item.confianca, item.confiança, 70)) || 70;
  const pressure = Number(valor(item.pressure, item.pressao, item.pressão, 70)) || 70;

  return {
    ...item,
    match: match || `${home || "Casa"} vs ${away || "Fora"}`,
    home,
    away,
    homeTeam: home,
    awayTeam: away,
    league: valor(item.league, item.liga, "Futebol"),
    score: valor(item.score, item.placar, "0 - 0"),
    market,
    odd: valor(item.odd, item.odds, item.cotacao, item.cotação, "1.72"),
    minute: valor(item.minute, item.minuto, item.tempo, 0),
    type: valor(item.type, item.tipo, "live"),
    category: valor(item.category, item.categoria, ""),
    status: valor(item.status, item.estado, "AO VIVO"),
    confidence,
    pressure,
    alert: valor(item.alert, item.alerta, ""),
    possession: Number(valor(item.possession, item.posse, item.ballPossession, 0)) || undefined,
    shots: Number(valor(item.shots, item.finalizacoes, item.finalizações, item.chutes, 0)) || undefined,
    shotsOnGoal: Number(valor(item.shotsOnGoal, item.chutesNoGol, item.chutes_no_gol, item.noGol, 0)) || undefined,
    attacks: Number(valor(item.attacks, item.ataques, 0)) || undefined,
    dangerousAttacks: Number(valor(item.dangerousAttacks, item.ataquesPerigosos, item.perigosos, 0)) || undefined,
    corners: Number(valor(item.corners, item.escanteios, item.cantos, 0)) || undefined,
    cards: Number(valor(item.cards, item.cartoes, item.cartões, 0)) || undefined,
    logoHome: valor(item.logoHome, item.logoCasa, item.homeLogo, item.teams?.home?.logo, ""),
    logoAway: valor(item.logoAway, item.logoFora, item.awayLogo, item.teams?.away?.logo, ""),
    weather: valor(item.weather, item.clima, item.tempoClima, "")
  };
};

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
      const lista = Array.isArray(data?.activeSignals) ? data.activeSignals : [];
      setSignals(lista.map(normalizarSinal));
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) {
      console.error("Erro ao buscar API MekineBet:", e);
      setSignals([]);
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


  function climaDoJogo(item, index = 0) {
    const raw = String(item.weather || item.clima || item.condition || "").toLowerCase();
    if (raw.includes("rain") || raw.includes("chuva")) return { icon: "🌧️", label: "Chuva", cls: "rain" };
    if (raw.includes("storm") || raw.includes("temp")) return { icon: "⛈️", label: "Temporal", cls: "rain" };
    if (raw.includes("cloud") || raw.includes("nublado")) return { icon: "☁️", label: "Nublado", cls: "cloud" };
    if (raw.includes("sun") || raw.includes("sol") || raw.includes("clear") || raw.includes("limpo")) return { icon: "☀️", label: "Sol", cls: "sun" };

    const presets = [
      { icon: "☀️", label: "Sol", cls: "sun" },
      { icon: "🌧️", label: "Chuva leve", cls: "rain" },
      { icon: "☁️", label: "Nublado", cls: "cloud" },
      { icon: "🌦️", label: "Tempo instável", cls: "rain" }
    ];
    return presets[index % presets.length];
  }

  function alertaForte(item) {
    const alertRaw = String(item.alert ?? item.alerta ?? "").toLowerCase();
    return (
      item.alert === true ||
      alertRaw.includes("sinal") ||
      alertRaw.includes("forte") ||
      alertRaw.includes("🚨") ||
      alertRaw.includes("🔥") ||
      Number(item.pressure || 0) >= 85 ||
      Number(item.confidence || 0) >= 90 ||
      Number(item.pressao || 0) >= 85 ||
      Number(item.confianca || item["confiança"] || 0) >= 90
    );
  }

  function mercadoStatus(item) {
    const gols = totalGols(item);
    const min = minuto(item);
    const pressure = Number(item.pressure || 0);
    const confidence = Number(item.confidence || 0);
    const market = String(item.market || "").toLowerCase();
    const alertText = String(item.alert ?? item.alerta ?? "").trim();

    if (alertText && alertText !== "true" && alertText !== "false") {
      return alertText;
    }

    if (alertaForte(item)) return "🚨 SINAL MUITO FORTE";

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
    if (pressure >= 80 || confidence >= 85) return "🔥 ENTRADA FORTE";
    return "📊 MONITORAMENTO IA";
  }

  function categoriaMercado(item) {
    const market = String(item.market || "").toLowerCase();
    const category = String(item.category || item.categoria || "").toLowerCase();
    if (market.includes("0.5") || market.includes("0,5") || category.includes("over05")) return "OVER 0,5";
    if (market.includes("1.5") || market.includes("1,5") || category.includes("over15")) return "OVER 1,5";
    if (market.includes("2.5") || market.includes("2,5") || category.includes("over25")) return "OVER 2,5";
    if (market.includes("3.5") || market.includes("3,5") || category.includes("over35")) return "OVER 3,5";
    if (market.includes("cart") || market.includes("card") || category.includes("cart")) return "CARTÕES";
    if (market.includes("canto") || market.includes("corner") || category.includes("canto")) return "CANTOS";
    if (market.includes("btts") || market.includes("ambas") || category.includes("btts")) return "BTTS";
    return item.category?.toUpperCase() || "BASE";
  }

  function isVip(item) {
    return (item.confidence || 70) >= 82 || alertaForte(item) || String(item.alert || "").includes("GOL");
  }

  function pctValue(a = 0, b = 0) {
    const total = Math.max(1, Number(a || 0) + Number(b || 0));
    return Math.max(0, Math.min(100, (Number(a || 0) / total) * 100));
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
        if (filtro === "ALERTA") return alertaForte(item) || mercadoStatus(item).includes("🔥") || mercadoStatus(item).includes("🚨");
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
  const alertCount = signals.filter((s) => alertaForte(s) || mercadoStatus(s).includes("🔥") || mercadoStatus(s).includes("🚨")).length;

  return (
    <div className="page">
      <style>{css}</style>

      <header className="topBar">
        <div>
          <h1>MekineBet <span className="liveDot"></span></h1>
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
            const weather = climaDoJogo(item, index);
            const events = timelineEvents(item, index, homeColor, awayColor);
            const timelineLeft = (m) => `calc(46px + ${(Math.max(0, Math.min(90, m)) / 90) * 100}% - ${((Math.max(0, Math.min(90, m)) / 90) * 51).toFixed(2)}px)`;
            const atkHomePct = pctValue(stats.home.ataques, stats.away.ataques);
            const dangerHomePct = pctValue(stats.home.perigosos, stats.away.perigosos);
            const posseHomePct = pctValue(stats.home.posse, stats.away.posse);
            const shotsHomePct = pctValue(stats.home.finalizacoes, stats.away.finalizacoes);
            const onGoalHomePct = pctValue(stats.home.noGol, stats.away.noGol);

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

                <div className="betStats proStats" style={{ "--home": homeColor, "--away": awayColor }}>
                  <div className="statsTopGrid">
                    <div className="metricPair">
                      <small>ATAQUES</small>
                      <div className="metricNumbers">
                        <b style={{ color: homeColor }}>{stats.home.ataques}</b>
                        <span className="metricVs" style={{ "--pct": `${atkHomePct}%` }}></span>
                        <b style={{ color: awayColor }}>{stats.away.ataques}</b>
                      </div>
                      <div className="dualMiniBar">
                        <i style={{ width: `${Math.min(100, (stats.home.ataques / Math.max(1, stats.home.ataques + stats.away.ataques)) * 100)}%`, background: homeColor }}></i>
                        <em style={{ width: `${Math.min(100, (stats.away.ataques / Math.max(1, stats.home.ataques + stats.away.ataques)) * 100)}%`, background: awayColor }}></em>
                      </div>
                    </div>

                    <div className="metricPair">
                      <small>ATAQUES PERIGOSOS</small>
                      <div className="metricNumbers">
                        <b style={{ color: homeColor }}>{stats.home.perigosos}</b>
                        <span className="metricVs danger" style={{ "--pct": `${dangerHomePct}%` }}></span>
                        <b style={{ color: awayColor }}>{stats.away.perigosos}</b>
                      </div>
                      <div className="dualMiniBar">
                        <i style={{ width: `${Math.min(100, (stats.home.perigosos / Math.max(1, stats.home.perigosos + stats.away.perigosos)) * 100)}%`, background: homeColor }}></i>
                        <em style={{ width: `${Math.min(100, (stats.away.perigosos / Math.max(1, stats.home.perigosos + stats.away.perigosos)) * 100)}%`, background: awayColor }}></em>
                      </div>
                    </div>

                    <div className="metricPair posseMetric">
                      <small>% POSSE</small>
                      <div className="metricNumbers">
                        <b style={{ color: homeColor }}>{stats.home.posse}%</b>
                        <span className="metricVs ball" style={{ "--pct": `${posseHomePct}%` }}></span>
                        <b style={{ color: awayColor }}>{stats.away.posse}%</b>
                      </div>
                      <div className="dualMiniBar">
                        <i style={{ width: `${stats.home.posse}%`, background: homeColor }}></i>
                        <em style={{ width: `${stats.away.posse}%`, background: awayColor }}></em>
                      </div>
                    </div>
                  </div>

                  <div className="statsMiddleRow">
                    <div className="sideCounters sideHome">
                      <strong style={{ color: homeColor }}>{sigla(times.casa)}</strong>
                      <span>🚩 <b>{stats.home.cantos}</b></span>
                      <span>🟨 <b>{stats.home.cartoes}</b></span>
                      <span>🟥 <b>0</b></span>
                    </div>

                    <div className="shotBox shotBoxPro">
                      <small>FINALIZAÇÕES / CHUTES AO GOL</small>
                      <strong style={{ color: homeColor }}>{stats.home.finalizacoes}/{stats.home.noGol}</strong>
                      <div className="shotBars shotSplitBars">
                        <div className="splitBar" title="Finalizações">
                          <i style={{ width: `${shotsHomePct}%`, background: homeColor }}></i>
                          <em style={{ width: `${100 - shotsHomePct}%`, background: awayColor }}></em>
                        </div>
                        <div className="splitBar" title="Chutes ao gol">
                          <i style={{ width: `${onGoalHomePct}%`, background: homeColor }}></i>
                          <em style={{ width: `${100 - onGoalHomePct}%`, background: awayColor }}></em>
                        </div>
                      </div>
                      <strong style={{ color: awayColor }}>{stats.away.finalizacoes}/{stats.away.noGol}</strong>
                    </div>

                    <div className="sideCounters sideAway">
                      <strong style={{ color: awayColor }}>{sigla(times.fora)}</strong>
                      <span>🚩 <b>{stats.away.cantos}</b></span>
                      <span>🟨 <b>{stats.away.cartoes}</b></span>
                      <span>🟥 <b>0</b></span>
                    </div>
                  </div>
                </div>

                <div className={`miniMap weather-${weather.cls}`}>
                  <div className="eventBubble"><span>⚽</span><div><b>{status.replace("🔥", "")}</b><small>{item.pressure || 70}% pressão</small></div></div>
                  <div className="weatherBadge"><span>{weather.icon}</span><b>{weather.label}</b></div>
                  <div className="stadiumLights"><i></i><i></i><i></i><i></i><i></i></div>
                  <div className="field3d">
                    <div className="grass"></div><div className="shade"></div><div className="midLine"></div><div className="centerCircle"></div><div className="boxLeft"></div><div className="boxRight"></div><div className="goalLeft"></div><div className="goalRight"></div>
                    <div className="dot d1" style={{ background: homeColor }}></div><div className="dot d2" style={{ background: homeColor }}></div><div className="dot d3" style={{ background: awayColor }}></div><div className="dot d4" style={{ background: awayColor }}></div>
                    <div className="weatherLayer"></div>
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


/* ===== AJUSTES SOLICITADOS: ESTATÍSTICA BET365 ALINHADA ===== */
.teamSide small{
  max-width:68px!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  line-height:1!important;
}
.heroCenter h2{
  font-size:15px!important;
  padding:0 4px!important;
}
.badges{
  margin-top:-13px!important;
  position:relative!important;
  z-index:5!important;
}

.proStats{
  display:grid!important;
  grid-template-columns:1fr!important;
  gap:6px!important;
  min-height:112px!important;
  padding:8px 6px!important;
  align-items:stretch!important;
}

.statsTopGrid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:7px;
  align-items:stretch;
}

.metricPair{
  min-width:0;
  background:rgba(255,255,255,.025);
  border-right:1px solid rgba(255,255,255,.10);
  padding:0 5px 3px;
}

.metricPair:last-child{border-right:0}

.metricPair small{
  display:block;
  text-align:center;
  color:#e5e7eb;
  font-size:7.4px;
  font-weight:900;
  line-height:1.1;
  height:18px;
  white-space:normal;
}

.metricNumbers{
  display:grid;
  grid-template-columns:1fr 26px 1fr;
  align-items:center;
  gap:2px;
  min-height:25px;
}

.metricNumbers b{
  text-align:center;
  font-size:16px;
  font-weight:900;
  line-height:1;
}

.metricVs{
  width:25px;
  height:25px;
  margin:auto;
  border-radius:50%;
  display:block;
  position:relative;
  background:conic-gradient(var(--home) 0 55%, rgba(226,232,240,.75) 55% 64%, var(--away) 64% 100%);
  box-shadow:0 0 7px rgba(255,255,255,.10);
}

.metricVs:before{
  content:"";
  position:absolute;
  inset:6px;
  border-radius:50%;
  background:#07141a;
}

.metricVs:after{
  content:"▶";
  position:absolute;
  left:8px;
  top:4px;
  color:#dbeafe;
  font-size:11px;
  z-index:2;
}

.metricVs.danger:after{content:"➤";left:7px}
.metricVs.ball:after{content:"●";left:9px;top:5px;font-size:9px;color:#fff}

.dualMiniBar{
  height:4px;
  display:flex;
  gap:2px;
  background:#111827;
  border-radius:999px;
  overflow:hidden;
  margin-top:2px;
}

.dualMiniBar i,
.dualMiniBar em{
  display:block;
  height:100%;
  opacity:.95;
}

.statsMiddleRow{
  display:grid;
  grid-template-columns:58px minmax(0,1fr) 58px;
  gap:7px;
  align-items:center;
}

.sideCounters{
  min-width:0;
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:2px;
  justify-items:center;
  align-items:center;
  font-size:10px;
  padding:3px;
  border-radius:7px;
  background:rgba(255,255,255,.025);
  border:1px solid rgba(255,255,255,.08);
}

.sideCounters strong{
  grid-column:1/-1;
  font-size:8px;
  font-weight:900;
  max-width:48px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.sideCounters span{
  display:grid;
  justify-items:center;
  gap:1px;
  line-height:1;
}

.sideCounters b{
  color:#fff;
  font-size:10px;
  line-height:1;
}

.shotBoxPro{
  display:grid!important;
  grid-template-columns:42px 1fr 42px!important;
  gap:5px!important;
  align-items:center!important;
  min-width:0!important;
  background:rgba(0,0,0,.14);
  border:1px solid rgba(255,255,255,.07);
  border-radius:7px;
  padding:5px 6px;
}

.shotBoxPro small{
  grid-column:1/-1!important;
  font-size:7.6px!important;
  text-align:center!important;
  color:#e5e7eb!important;
  font-weight:900!important;
  line-height:1!important;
}

.shotBoxPro strong{
  font-size:15px!important;
  text-align:center!important;
  min-width:0!important;
  white-space:nowrap!important;
}

.shotBoxPro .shotBars{
  display:grid!important;
  gap:4px!important;
  min-width:0!important;
}

.shotBoxPro .shotBars span,
.shotBoxPro .shotBars em{
  height:4px!important;
  border-radius:999px!important;
}

.posseWide{display:none!important}

@media(max-width:1100px){
  .statsTopGrid{grid-template-columns:1fr!important}
  .statsMiddleRow{grid-template-columns:1fr!important}
  .sideCounters{grid-template-columns:repeat(3,1fr)!important}
}



/* ===== AJUSTE EXTRA: LOGOS MENORES, STATS PROPORCIONAIS E SINAL VISÍVEL ===== */
.heroLogo{width:46px!important;height:46px!important}
.matchHero{grid-template-columns:62px 1fr 62px!important;min-height:78px!important;height:78px!important}
.teamSide small{font-size:9px!important;max-width:60px!important}
.heroCenter h2{font-size:14px!important}
.heroCenter b{font-size:27px!important}

.statsTopGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important}
.metricPair{border:1px solid rgba(255,255,255,.07)!important;border-radius:7px!important;background:rgba(0,0,0,.16)!important;padding:4px!important}
.metricVs{background:conic-gradient(var(--home) 0 50%, var(--away) 50% 100%)!important}
.metricVs:before{background:#07141a!important}
.dualMiniBar{height:5px!important;background:#101820!important;gap:0!important}
.dualMiniBar i{border-radius:999px 0 0 999px!important}
.dualMiniBar em{border-radius:0 999px 999px 0!important}

.shotBoxPro{grid-template-columns:40px 1fr 40px!important;padding:5px!important}
.shotBoxPro .shotBars{gap:5px!important}
.shotBoxPro .shotBars span,.shotBoxPro .shotBars em{height:5px!important;max-width:100%!important}
.shotBoxPro small:after{content:'  •  1ª linha: Finalizações / 2ª linha: No gol';font-size:6.8px;color:#9ca3af;font-weight:800}

.sideCounters{padding:4px 2px!important}
.sideCounters strong{font-size:7.5px!important}

.marketLine{border:1px solid rgba(250,204,21,.45)!important;background:linear-gradient(180deg,rgba(250,204,21,.09),rgba(0,0,0,.18))!important;box-shadow:0 0 12px rgba(250,204,21,.10)!important}
.marketLine div:first-child b{font-size:13px!important;color:#fff!important;text-transform:uppercase!important;text-align:center!important}
.marketLine div:first-child span{display:block!important;text-align:center!important;font-size:12px!important;color:#fff!important;font-weight:900!important}
.marketLine div:first-child strong{display:block!important;text-align:center!important;font-size:14px!important;color:#facc15!important}
.marketLine div:first-child{background:rgba(0,0,0,.22)!important;border-radius:7px!important;padding:5px!important;border:1px solid rgba(250,204,21,.25)!important}

@media(max-width:700px){
  .page{padding:6px!important}
  h1{font-size:25px!important}
  .statusWrap{gap:5px!important}.pill{padding:6px 8px!important;font-size:11px!important}
  .filters{grid-template-columns:repeat(3,1fr)!important;gap:5px!important}
  .filters button{font-size:9px!important;padding:7px 2px!important}
  .card{padding:7px!important}
  .matchHero{grid-template-columns:50px 1fr 50px!important;height:auto!important;min-height:70px!important}
  .heroLogo{width:40px!important;height:40px!important}
  .heroCenter h2{font-size:12px!important}
  .heroCenter b{font-size:24px!important}
  .badges{margin-top:0!important;justify-content:center!important}
  .proStats{padding:6px 5px!important}
  .statsTopGrid{grid-template-columns:1fr!important;gap:4px!important}
  .metricPair{display:grid!important;grid-template-columns:72px 1fr!important;gap:4px!important;align-items:center!important}
  .metricPair small{height:auto!important;text-align:left!important;font-size:7.8px!important}
  .metricNumbers{grid-template-columns:35px 24px 35px!important;justify-content:center!important}
  .dualMiniBar{grid-column:1/-1!important}
  .statsMiddleRow{grid-template-columns:1fr!important;gap:5px!important}
  .sideCounters{grid-template-columns:repeat(3,1fr)!important}
  .shotBoxPro{grid-template-columns:38px 1fr 38px!important}
  .miniMap{padding:0!important}.field3d{height:76px!important}
  .flowLegend{grid-template-columns:repeat(2,1fr)!important}
  .marketLine{grid-template-columns:1fr!important}
}

/* ===== PACOTE FINAL: PADRÃO BET365 COMPACTO / ALINHADO ===== */
:root{--mb-border:rgba(0,214,111,.34)}
.page{padding:7px!important;background:#111!important}
.topBar{padding:0 2px!important;margin-bottom:6px!important}
h1{font-size:clamp(25px,2.7vw,38px)!important;letter-spacing:-1px!important}
.subTitle{font-size:11px!important;font-weight:700!important}.pill{padding:7px 13px!important;border-radius:8px!important;font-size:13px!important}
.notice{font-size:11px!important;padding:6px 8px!important;margin-bottom:6px!important}
.filters{gap:5px!important;margin-bottom:6px!important;grid-template-columns:repeat(13,minmax(0,1fr))!important}
.filters button{height:31px!important;padding:5px 3px!important;border-radius:6px!important;font-size:9px!important;font-weight:800!important;letter-spacing:-.15px!important;text-transform:none!important}
.search{height:35px!important;padding:7px 10px!important;font-size:12px!important;margin-bottom:7px!important;border-radius:6px!important}
.grid{gap:8px!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;align-items:stretch!important}
.card{padding:6px!important;min-height:560px!important;border-radius:9px!important;background:linear-gradient(180deg,#071519,#06110d)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
.matchHero{grid-template-columns:52px minmax(0,1fr) 52px!important;height:70px!important;min-height:70px!important;gap:5px!important;position:relative!important;z-index:3!important}
.heroLogo{width:38px!important;height:38px!important;max-width:38px!important;max-height:38px!important;object-fit:contain!important;filter:drop-shadow(0 0 4px rgba(255,255,255,.18))!important}
.teamSide{min-width:0!important;overflow:hidden!important}.teamSide small{font-size:8px!important;line-height:1!important;max-width:48px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.heroCenter{min-width:0!important;overflow:hidden!important}.heroCenter h2{font-size:13px!important;line-height:1.02!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:100%!important}.heroCenter p{font-size:8.5px!important;margin:3px 0!important}.heroCenter b{font-size:26px!important}.heroCenter strong{font-size:11px!important}
.badges{margin-top:-8px!important;margin-bottom:3px!important;min-height:18px!important;gap:3px!important;position:relative!important;z-index:8!important;justify-content:flex-end!important}.badges span{font-size:8px!important;padding:2px 6px!important}

/* estatísticas compactas bet365 */
.proStats{min-height:86px!important;padding:5px 5px!important;gap:4px!important;margin-bottom:5px!important;border-top:1px solid rgba(255,255,255,.06)!important;border-bottom:1px solid rgba(255,255,255,.06)!important;background:rgba(0,0,0,.06)!important}
.statsTopGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:4px!important}
.metricPair{padding:3px 4px!important;border-radius:5px!important;background:rgba(255,255,255,.018)!important;border:1px solid rgba(255,255,255,.055)!important;min-height:44px!important}
.metricPair small{font-size:6.8px!important;height:12px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#fff!important;font-weight:800!important}
.metricNumbers{grid-template-columns:1fr 20px 1fr!important;min-height:22px!important}.metricNumbers b{font-size:14px!important}.metricVs{width:20px!important;height:20px!important;background:conic-gradient(var(--home) 0 50%, var(--away) 50% 100%)!important}.metricVs:before{inset:5px!important;background:#07141a!important}.metricVs:after{left:6.5px!important;top:3.2px!important;font-size:9px!important;color:#e5e7eb!important}.metricVs.danger:after{left:6px!important}.metricVs.ball:after{left:7px!important;top:4px!important;font-size:7px!important}.dualMiniBar{height:3px!important;margin-top:1px!important;gap:0!important;background:#0b1117!important}
.statsMiddleRow{grid-template-columns:45px minmax(0,1fr) 45px!important;gap:5px!important}.sideCounters{font-size:8px!important;padding:2px!important;border-radius:5px!important}.sideCounters strong{font-size:6.8px!important;max-width:38px!important}.sideCounters b{font-size:8px!important}.sideCounters span{font-size:9px!important}
.shotBoxPro{grid-template-columns:34px minmax(0,1fr) 34px!important;padding:4px 5px!important;border-radius:5px!important;gap:4px!important}.shotBoxPro small{font-size:6.8px!important;line-height:1!important}.shotBoxPro small:after{content:''!important}.shotBoxPro strong{font-size:13px!important}.shotBoxPro .shotBars{gap:3px!important}.shotBoxPro .shotBars span,.shotBoxPro .shotBars em{height:4px!important;border-radius:999px!important}

/* mini campo compacto sem sinal no meio */
.eventBubble{display:none!important}.miniMap{width:100%!important;max-width:none!important;margin:0 auto 5px!important;padding:0 4px!important}.field3d{height:72px!important;margin:5px auto 0!important;border-radius:12px!important;transform:perspective(245px) rotateX(25deg)!important}.mapStats{font-size:8px!important;margin-top:1px!important}.dot{width:6px!important;height:6px!important}

/* cronologia menor, mais limpa e alinhada */
.flowCard{margin-top:5px!important;min-height:132px!important;padding:5px!important;border-radius:7px!important}.flowCard h3{font-size:9.5px!important;height:13px!important;line-height:13px!important;margin-bottom:2px!important}.flowMinuteScale{font-size:7.5px!important;padding:0 8px 2px 42px!important}.flowWrap{height:82px!important;padding-left:42px!important;padding-right:8px!important;border-radius:6px!important}.flowWrap:before{left:42px!important;right:8px!important}.middleLine{left:42px!important;right:8px!important}.teamMini{width:38px!important;font-size:7px!important}.teamMini img{width:18px!important;height:18px!important}.homeMini{top:7px!important}.awayMini{bottom:7px!important}.flowSpike{width:1.6px!important;transform:translateX(-.8px)!important}.flowSpike.home{margin-bottom:1px!important}.flowSpike.away{margin-top:1px!important}.flowIcon{font-size:10px!important}.flowIcon.home{bottom:calc(50% + 24px)!important}.flowIcon.away{top:calc(50% + 24px)!important}.nowLine{width:1.6px!important}.nowLine b{font-size:8px!important;padding:1px 4px!important}.flowLegend{font-size:7px!important;gap:3px!important;min-height:14px!important;margin-top:4px!important}.flowLegend i{width:6px!important;height:6px!important}

/* sinal principal mais visível porém compacto */
.marketLine{margin-top:auto!important;min-height:54px!important;padding:6px!important;grid-template-columns:1.25fr 1fr!important;border-radius:7px!important}.marketLine div:first-child{padding:4px!important}.marketLine div:first-child b{font-size:12px!important}.marketLine div:first-child span{font-size:10px!important}.marketLine div:first-child strong{font-size:13px!important}.marketLine b{font-size:11px!important}.marketLine small{font-size:9px!important}.bar{height:5px!important}.bookies{height:32px!important;margin-top:5px!important;gap:6px!important}.bookies button{padding:6px 10px!important;min-width:68px!important;border-radius:5px!important;font-size:11px!important}

/* celular organizado */
@media(max-width:1100px){
  .grid{grid-template-columns:1fr!important;gap:8px!important}.card{min-height:auto!important}.filters{grid-template-columns:repeat(4,1fr)!important}.filters button{font-size:8.5px!important}.topBar{flex-direction:column!important;align-items:flex-start!important}.statusWrap{gap:5px!important}.pill{font-size:11px!important;padding:6px 8px!important}
  .matchHero{grid-template-columns:46px minmax(0,1fr) 46px!important;height:66px!important;min-height:66px!important}.heroLogo{width:34px!important;height:34px!important}.teamSide small{font-size:7.5px!important;max-width:42px!important}.heroCenter h2{font-size:12px!important}.heroCenter b{font-size:24px!important}.badges{margin-top:0!important;justify-content:center!important}
  .statsTopGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:3px!important}.metricPair small{font-size:6px!important}.metricNumbers{grid-template-columns:1fr 18px 1fr!important}.metricNumbers b{font-size:12px!important}.metricVs{width:18px!important;height:18px!important}.metricVs:after{font-size:8px!important;left:6px!important;top:3px!important}
  .statsMiddleRow{grid-template-columns:42px minmax(0,1fr) 42px!important;gap:4px!important}.shotBoxPro{grid-template-columns:32px minmax(0,1fr) 32px!important}.shotBoxPro strong{font-size:12px!important}.sideCounters strong{display:none!important}.field3d{height:68px!important}.flowCard{min-height:126px!important}.flowWrap{height:78px!important}.flowLegend{grid-template-columns:repeat(3,1fr)!important;overflow:hidden!important}.marketLine{grid-template-columns:1fr!important}.bookies button{min-width:auto!important;flex:1!important}
}
@media(max-width:520px){.page{padding:5px!important}h1{font-size:23px!important}.filters{grid-template-columns:repeat(3,1fr)!important}.search{height:32px!important}.proStats{padding:4px!important}.statsTopGrid{grid-template-columns:1fr!important}.metricPair{display:grid!important;grid-template-columns:80px 1fr!important;align-items:center!important}.metricPair small{text-align:left!important;height:auto!important;font-size:7px!important}.metricNumbers{grid-template-columns:34px 18px 34px!important;justify-content:end!important}.dualMiniBar{grid-column:1/-1!important}.statsMiddleRow{grid-template-columns:1fr!important}.sideCounters{grid-template-columns:repeat(3,1fr)!important}.flowLegend{display:none!important}}


/* ===== CORREÇÃO FINAL MOBILE: ESTATÍSTICAS PROPORCIONAIS IGUAL PC ===== */
@media(max-width:700px){
  .proStats{
    display:grid!important;
    grid-template-columns:1fr!important;
    gap:4px!important;
    min-height:auto!important;
    padding:5px!important;
  }

  .statsTopGrid{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:3px!important;
  }

  .metricPair{
    display:block!important;
    min-width:0!important;
    min-height:42px!important;
    padding:3px!important;
  }

  .metricPair small{
    display:block!important;
    text-align:center!important;
    height:10px!important;
    font-size:5.7px!important;
    line-height:1!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
    letter-spacing:-.25px!important;
  }

  .metricNumbers{
    display:grid!important;
    grid-template-columns:1fr 16px 1fr!important;
    gap:1px!important;
    align-items:center!important;
    justify-content:center!important;
    min-height:18px!important;
  }

  .metricNumbers b{
    font-size:11px!important;
    width:auto!important;
    min-width:0!important;
    text-align:center!important;
  }

  .metricVs{
    width:16px!important;
    height:16px!important;
    background:conic-gradient(var(--home) 0 50%, var(--away) 50% 100%)!important;
  }

  .metricVs:before{inset:4px!important}
  .metricVs:after{
    font-size:7px!important;
    left:5.4px!important;
    top:2.4px!important;
  }
  .metricVs.danger:after{left:5px!important}
  .metricVs.ball:after{left:5.8px!important;top:3px!important;font-size:6px!important}

  .dualMiniBar{
    grid-column:auto!important;
    height:3px!important;
    margin-top:1px!important;
  }

  .statsMiddleRow{
    display:grid!important;
    grid-template-columns:38px minmax(0,1fr) 38px!important;
    gap:4px!important;
    align-items:center!important;
  }

  .sideCounters{
    display:grid!important;
    grid-template-columns:repeat(3,1fr)!important;
    padding:2px!important;
    gap:1px!important;
    min-height:35px!important;
  }

  .sideCounters strong{
    display:block!important;
    grid-column:1/-1!important;
    font-size:6px!important;
    max-width:34px!important;
  }

  .sideCounters span{
    font-size:8px!important;
  }

  .sideCounters b{
    font-size:7px!important;
  }

  .shotBoxPro{
    display:grid!important;
    grid-template-columns:30px minmax(0,1fr) 30px!important;
    gap:3px!important;
    padding:3px 4px!important;
    min-height:35px!important;
  }

  .shotBoxPro small{
    font-size:5.9px!important;
    height:8px!important;
    line-height:1!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }

  .shotBoxPro strong{
    font-size:11px!important;
  }

  .shotBoxPro .shotBars{
    gap:2px!important;
  }

  .shotBoxPro .shotBars span,
  .shotBoxPro .shotBars em{
    height:3px!important;
  }

  .matchHero{
    grid-template-columns:42px minmax(0,1fr) 42px!important;
    height:60px!important;
    min-height:60px!important;
  }

  .heroLogo{
    width:31px!important;
    height:31px!important;
    max-width:31px!important;
    max-height:31px!important;
  }

  .teamSide small{
    font-size:6.8px!important;
    max-width:39px!important;
  }

  .heroCenter h2{
    font-size:11px!important;
    line-height:1!important;
  }

  .heroCenter p{
    font-size:7px!important;
    margin:2px 0!important;
  }

  .heroCenter b{
    font-size:22px!important;
  }

  .heroCenter strong{
    font-size:10px!important;
  }

  .badges span{
    font-size:7px!important;
    padding:2px 5px!important;
  }

  .field3d{
    height:62px!important;
  }

  .flowCard{
    min-height:112px!important;
    padding:4px!important;
  }

  .flowWrap{
    height:68px!important;
  }

  .flowMinuteScale{
    font-size:6.8px!important;
  }
}

@media(max-width:520px){
  .statsTopGrid{
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
  }

  .metricPair{
    display:block!important;
  }

  .metricPair small{
    text-align:center!important;
  }

  .metricNumbers{
    grid-template-columns:1fr 15px 1fr!important;
  }

  .statsMiddleRow{
    grid-template-columns:36px minmax(0,1fr) 36px!important;
  }

  .sideCounters strong{
    display:block!important;
  }

  .shotBoxPro{
    grid-template-columns:28px minmax(0,1fr) 28px!important;
  }

  .shotBoxPro strong{
    font-size:10px!important;
  }
}



/* ===== CORREÇÃO PROPORCIONAL FINAL: MOBILE + PC ===== */
.metricVs{
  background:var(--ring-bg)!important;
}
.metricVs:before{background:#07141a!important}
.metricNumbers b{
  font-variant-numeric:tabular-nums!important;
}
.shotSplitBars{
  display:grid!important;
  gap:3px!important;
}
.splitBar{
  width:100%!important;
  height:4px!important;
  display:flex!important;
  overflow:hidden!important;
  border-radius:999px!important;
  background:#0b1117!important;
}
.splitBar i,
.splitBar em{
  display:block!important;
  height:100%!important;
  min-width:1px!important;
  opacity:.98!important;
}
.splitBar i{border-radius:999px 0 0 999px!important}
.splitBar em{border-radius:0 999px 999px 0!important}

.sideCounters{
  align-self:stretch!important;
}
.sideCounters span{
  min-width:0!important;
}
.statsMiddleRow{
  align-items:stretch!important;
}
.shotBoxPro{
  align-self:stretch!important;
}

@media(max-width:700px){
  .proStats{
    overflow:hidden!important;
  }
  .statsTopGrid{
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
  }
  .metricPair{
    min-width:0!important;
    overflow:hidden!important;
  }
  .metricNumbers{
    grid-template-columns:minmax(18px,1fr) 16px minmax(18px,1fr)!important;
  }
  .statsMiddleRow{
    grid-template-columns:38px minmax(0,1fr) 38px!important;
  }
  .sideCounters{
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    overflow:hidden!important;
  }
  .sideCounters strong{
    display:block!important;
    grid-column:1/-1!important;
  }
  .shotBoxPro{
    grid-template-columns:31px minmax(0,1fr) 31px!important;
    overflow:hidden!important;
  }
  .shotBoxPro strong{
    font-size:10.5px!important;
    min-width:0!important;
  }
  .shotSplitBars{
    gap:2px!important;
  }
  .splitBar{
    height:3px!important;
  }
}

@media(max-width:430px){
  .statsTopGrid{
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:2px!important;
  }
  .metricPair small{
    font-size:5.3px!important;
    letter-spacing:-.35px!important;
  }
  .metricNumbers b{
    font-size:10px!important;
  }
  .metricVs{
    width:15px!important;
    height:15px!important;
  }
  .statsMiddleRow{
    grid-template-columns:34px minmax(0,1fr) 34px!important;
  }
  .sideCounters span{
    font-size:7px!important;
  }
  .sideCounters b{
    font-size:6.5px!important;
  }
}



/* ===== CORREÇÃO DEFINITIVA MOBILE: CARTÕES EM CADA LADO + GRÁFICO REDONDO PROPORCIONAL ===== */

/* Mantém o layout das estatísticas igual ao PC também no celular */
@media(max-width:700px){
  .proStats{
    width:100%!important;
    display:grid!important;
    grid-template-columns:1fr!important;
    gap:4px!important;
  }

  .statsTopGrid{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:3px!important;
  }

  .metricPair{
    display:block!important;
    min-width:0!important;
    overflow:visible!important;
  }

  .metricNumbers{
    display:grid!important;
    grid-template-columns:minmax(20px,1fr) 18px minmax(20px,1fr)!important;
    justify-items:center!important;
    align-items:center!important;
  }

  .metricNumbers b{
    display:block!important;
    min-width:0!important;
    width:auto!important;
    text-align:center!important;
    font-size:11px!important;
  }

  /* O gráfico redondo volta a aparecer e muda conforme a proporção real */
  .metricVs,
  .metricVs.danger,
  .metricVs.ball{
    display:block!important;
    visibility:visible!important;
    opacity:1!important;
    width:18px!important;
    height:18px!important;
    min-width:18px!important;
    min-height:18px!important;
    border-radius:50%!important;
    position:relative!important;
    flex:0 0 18px!important;
    background:conic-gradient(var(--home) 0 var(--pct,50%), var(--away) var(--pct,50%) 100%)!important;
    box-shadow:0 0 5px rgba(255,255,255,.16)!important;
  }

  .metricVs:before,
  .metricVs.danger:before,
  .metricVs.ball:before{
    content:""!important;
    position:absolute!important;
    inset:4px!important;
    background:#07141a!important;
    border-radius:50%!important;
    z-index:1!important;
  }

  .metricVs:after{
    content:"▶"!important;
    position:absolute!important;
    left:5.8px!important;
    top:2.6px!important;
    color:#e5e7eb!important;
    font-size:7px!important;
    z-index:2!important;
  }

  .metricVs.danger:after{
    content:"➤"!important;
    left:5.2px!important;
    top:2.4px!important;
  }

  .metricVs.ball:after{
    content:"●"!important;
    left:6.5px!important;
    top:3.2px!important;
    font-size:6px!important;
  }

  /* Cartões/escanteios sempre separados: casa esquerda, fora direita */
  .statsMiddleRow{
    display:grid!important;
    grid-template-columns:42px minmax(0,1fr) 42px!important;
    grid-template-areas:"home shots away"!important;
    align-items:center!important;
    gap:4px!important;
  }

  .sideHome{
    grid-area:home!important;
    justify-self:stretch!important;
  }

  .sideAway{
    grid-area:away!important;
    justify-self:stretch!important;
  }

  .shotBoxPro{
    grid-area:shots!important;
    min-width:0!important;
  }

  .sideCounters{
    display:grid!important;
    grid-template-columns:repeat(3,1fr)!important;
    gap:1px!important;
    align-items:center!important;
    justify-items:center!important;
    min-height:35px!important;
    padding:2px!important;
  }

  .sideCounters strong{
    display:block!important;
    grid-column:1/-1!important;
    font-size:6px!important;
    max-width:36px!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }

  .sideCounters span{
    display:grid!important;
    justify-items:center!important;
    font-size:8px!important;
    line-height:1!important;
  }

  .sideCounters b{
    font-size:7px!important;
    line-height:1!important;
  }

  /* Finalizações e chutes ao gol: duas linhas proporcionais, casa vs fora */
  .shotSplitBars{
    display:grid!important;
    gap:2px!important;
  }

  .splitBar{
    width:100%!important;
    height:3px!important;
    display:flex!important;
    overflow:hidden!important;
    border-radius:999px!important;
    background:#0b1117!important;
  }

  .splitBar i,
  .splitBar em{
    display:block!important;
    height:100%!important;
    min-width:1px!important;
  }
}

/* Em celulares menores, não empilha os cartões dos dois times: mantém casa | finalizações | fora */
@media(max-width:520px){
  .statsTopGrid{
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
  }

  .metricPair{
    display:block!important;
    min-height:42px!important;
  }

  .metricPair small{
    text-align:center!important;
    font-size:5.6px!important;
  }

  .statsMiddleRow{
    grid-template-columns:40px minmax(0,1fr) 40px!important;
    grid-template-areas:"home shots away"!important;
  }

  .sideCounters{
    grid-template-columns:repeat(3,1fr)!important;
  }

  .sideCounters strong{
    display:block!important;
  }

  .shotBoxPro{
    grid-template-columns:30px minmax(0,1fr) 30px!important;
  }
}

/* ===== AJUSTE FINAL: GRÁFICO REDONDO PC + MOBILE E MINI CAMPO 5D COM CLIMA ===== */
.metricVs{
  display:block!important;
  border-radius:50%!important;
  background:conic-gradient(var(--home) 0 var(--pct,50%), var(--away) var(--pct,50%) 100%)!important;
  box-shadow:0 0 8px rgba(255,255,255,.16), inset 0 0 2px rgba(255,255,255,.35)!important;
  flex:none!important;
}
.metricVs:before{display:block!important;content:""!important;position:absolute!important;border-radius:50%!important;background:#07141a!important;z-index:1!important}
.metricVs:after{display:block!important;z-index:2!important}
.statsTopGrid .metricPair .metricNumbers .metricVs{visibility:visible!important;opacity:1!important}

/* PC mantém os redondos visíveis */
@media(min-width:701px){
  .metricVs{width:22px!important;height:22px!important;position:relative!important}
  .metricVs:before{inset:5px!important}
  .metricVs:after{left:7px!important;top:3.5px!important;font-size:9px!important;color:#e5e7eb!important;position:absolute!important}
  .metricVs.danger:after{left:6.5px!important}
  .metricVs.ball:after{left:7.5px!important;top:4px!important;font-size:7px!important}
}

/* Mobile também mantém os redondos visíveis, sem sumir */
@media(max-width:700px){
  .metricVs{width:16px!important;height:16px!important;position:relative!important;min-width:16px!important;min-height:16px!important}
  .metricVs:before{inset:4px!important}
  .metricVs:after{left:5.4px!important;top:2.4px!important;font-size:7px!important;position:absolute!important;color:#e5e7eb!important}
  .metricVs.danger:after{left:5px!important}
  .metricVs.ball:after{left:5.8px!important;top:3px!important;font-size:6px!important}
}

/* Mini campo mais realista 5D, com estádio, luz e clima */
.miniMap{
  position:relative!important;
  perspective:520px!important;
  isolation:isolate!important;
  overflow:hidden!important;
  border-radius:14px!important;
}
.stadiumLights{
  position:absolute!important;
  left:18px!important;
  right:18px!important;
  top:0!important;
  height:18px!important;
  display:flex!important;
  justify-content:space-around!important;
  pointer-events:none!important;
  z-index:3!important;
}
.stadiumLights i{
  width:24px!important;
  height:13px!important;
  border-radius:0 0 18px 18px!important;
  background:radial-gradient(circle at 50% 15%,rgba(255,255,255,.95),rgba(190,230,255,.45) 38%,transparent 72%)!important;
  filter:blur(.2px)!important;
  opacity:.8!important;
}
.weatherBadge{
  position:absolute!important;
  right:10px!important;
  top:7px!important;
  z-index:5!important;
  display:flex!important;
  align-items:center!important;
  gap:4px!important;
  padding:3px 7px!important;
  border-radius:999px!important;
  border:1px solid rgba(255,255,255,.18)!important;
  background:rgba(2,6,10,.68)!important;
  box-shadow:0 4px 12px rgba(0,0,0,.35)!important;
  font-size:8px!important;
  font-weight:900!important;
  color:#e5e7eb!important;
}
.weatherBadge span{font-size:12px!important;line-height:1!important}
.field3d{
  height:76px!important;
  margin-top:10px!important;
  border-radius:14px!important;
  background:
    radial-gradient(circle at 50% -20%,rgba(255,255,255,.22),transparent 30%),
    repeating-linear-gradient(90deg,#41a72b 0 24px,#2f8d22 24px 48px)!important;
  transform:perspective(360px) rotateX(31deg) scale(1.01)!important;
  transform-origin:center bottom!important;
  box-shadow:
    inset 0 11px 18px rgba(255,255,255,.14),
    inset 0 -24px 24px rgba(0,0,0,.42),
    0 11px 18px rgba(0,0,0,.55)!important;
}
.field3d:before{
  content:""!important;
  position:absolute!important;
  inset:-8px 0 0!important;
  background:linear-gradient(180deg,rgba(255,255,255,.18),transparent 38%,rgba(0,0,0,.24))!important;
  z-index:1!important;
  pointer-events:none!important;
}
.field3d:after{
  content:""!important;
  position:absolute!important;
  inset:0!important;
  background:
    repeating-linear-gradient(0deg,rgba(255,255,255,.04) 0 1px,transparent 1px 10px),
    radial-gradient(circle at 52% 42%,rgba(255,255,255,.15),transparent 40%)!important;
  z-index:1!important;
  pointer-events:none!important;
}
.field3d > *{position:absolute;z-index:2}.field3d .weatherLayer{z-index:4!important;pointer-events:none!important;inset:0!important}
.weather-rain .weatherLayer{
  background:repeating-linear-gradient(115deg,rgba(180,220,255,.0) 0 7px,rgba(180,220,255,.55) 7px 8px,rgba(180,220,255,.0) 8px 14px)!important;
  opacity:.42!important;
  animation:rainMove .7s linear infinite!important;
}
.weather-rain .field3d{filter:saturate(.9) brightness(.88)!important}
.weather-cloud .field3d{filter:saturate(.9) brightness(.82)!important}
.weather-sun .field3d{filter:saturate(1.15) brightness(1.08)!important}
.weather-sun .weatherLayer{background:radial-gradient(circle at 82% 7%,rgba(255,220,90,.25),transparent 22%)!important}
.weather-cloud .weatherLayer{background:linear-gradient(180deg,rgba(180,200,220,.25),transparent 40%)!important}
@keyframes rainMove{from{background-position:0 0}to{background-position:-12px 22px}}

@media(max-width:700px){
  .field3d{height:66px!important;margin-top:8px!important;transform:perspective(330px) rotateX(29deg) scale(1.01)!important}
  .weatherBadge{right:8px!important;top:5px!important;font-size:7px!important;padding:2px 6px!important}
  .weatherBadge span{font-size:10px!important}.stadiumLights{height:14px!important;left:14px!important;right:14px!important}.stadiumLights i{width:18px!important;height:10px!important}
}

/* ===== AJUSTE API REAL: 1 CARD CENTRALIZADO, ALERTA E LOGOS ===== */
.grid.isSingle{
  grid-template-columns:minmax(320px,440px)!important;
  justify-content:center!important;
}
.grid.isSingle .card{
  width:100%!important;
}
.heroLogo{
  border-radius:6px!important;
  background:rgba(255,255,255,.04)!important;
  padding:1px!important;
}
.metricVs{
  background:conic-gradient(var(--home) 0 var(--pct), var(--away) var(--pct) 100%)!important;
}
.marketLine{
  border-color:rgba(250,204,21,.75)!important;
  box-shadow:0 0 16px rgba(250,204,21,.18)!important;
}
.marketLine div:first-child b::before{
  content:"🔥 ";
}
@media(max-width:700px){
  .grid.isSingle{grid-template-columns:1fr!important}
}


/* ===== VOLTAR COMO ERA: JOGO NÃO FICA CENTRALIZADO ===== */
.grid.isSingle{grid-template-columns:repeat(3,minmax(0,1fr))!important;justify-content:stretch!important}
.grid.isSingle .card{max-width:none!important;margin:0!important}
@media(max-width:1100px){.grid.isSingle{grid-template-columns:1fr!important}}

`;
