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


const PT_BR_NAMES = {
  "peru": "Peru",
  "spain": "Espanha",
  "france": "França",
  "northern ireland": "Irlanda do Norte",
  "netherlands": "Holanda",
  "uzbekistan": "Uzbequistão",
  "brazil": "Brasil",
  "germany": "Alemanha",
  "italy": "Itália",
  "england": "Inglaterra",
  "portugal": "Portugal",
  "argentina": "Argentina",
  "chile": "Chile",
  "uruguay": "Uruguai",
  "colombia": "Colômbia",
  "vila nova": "Vila Nova",
  "botafogo sp": "Botafogo-SP",
  "america mineiro": "América Mineiro",
  "atletico goianiense": "Atlético Goianiense"
};

function nomePtBr(nome = "") {
  const raw = String(nome || "").trim();
  const key = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/\\s+/g, " ")
    .trim();

  return PT_BR_NAMES[key] || raw;
}


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
      const lista = Array.isArray(data?.activeSignals) ? data.activeSignals : [];

      // Somente jogos/sinais reais vindos da API/backend.
      // Sem DEMO, sem BASE, sem histórico e sem pré-live.
      const reais = lista.filter(
        (item) =>
          item.fixtureId ||
          item.gameId ||
          item.fixture?.id ||
          String(item.source || "").toLowerCase().includes("api")
      );
      setSignals(reais);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) {
      setSignals([]);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    const timer = setInterval(carregar, 5000);
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
    return nomePtBr(String(nome))
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

  const COLOR_PALETTE = ["#22c55e", "#2563eb", "#ef4444", "#f59e0b", "#a855f7", "#06b6d4", "#facc15", "#e5e7eb"];

  function colorDistance(a = "#22c55e", b = "#2563eb") {
    const toRgb = (hex) => {
      const clean = String(hex).replace("#", "").padEnd(6, "0").slice(0, 6);
      return [
        parseInt(clean.slice(0, 2), 16),
        parseInt(clean.slice(2, 4), 16),
        parseInt(clean.slice(4, 6), 16)
      ];
    };
    const ca = toRgb(a);
    const cb = toRgb(b);
    return Math.sqrt((ca[0]-cb[0])**2 + (ca[1]-cb[1])**2 + (ca[2]-cb[2])**2);
  }

  function hashColor(nome = "") {
    const idx = normalizar(nome).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % COLOR_PALETTE.length;
    return COLOR_PALETTE[idx];
  }

  function coresDoJogo(casa = "Casa", fora = "Fora") {
    const homeColor = teamColor(casa, hashColor(casa));
    let awayColor = teamColor(fora, hashColor(fora));
    if (colorDistance(homeColor, awayColor) < 90) {
      awayColor = COLOR_PALETTE.find((c) => colorDistance(c, homeColor) >= 110) || "#6366f1";
    }
    return { homeColor, awayColor };
  }

  function pctStat(a = 0, b = 0) {
    const total = Math.max(1, Number(a || 0) + Number(b || 0));
    return {
      home: Math.max(0, Math.min(100, (Number(a || 0) / total) * 100)),
      away: Math.max(0, Math.min(100, (Number(b || 0) / total) * 100))
    };
  }

  function StatLineBet365({ label, home, away, homeColor, awayColor }) {
    const h = Number(home || 0);
    const a = Number(away || 0);
    const pct = pctStat(h, a);
    const homeBetter = h >= a && h > 0;
    const awayBetter = a > h && a > 0;

    return (
      <div className="bet365StatLine">
        <b style={{ color: homeBetter ? homeColor : "#e5e7eb" }}>{h}</b>
        <div className="bet365LineCenter">
          <small>{label}</small>
          <div className="bet365DualLine">
            <i
              className={homeBetter ? "better" : ""}
              style={{
                width: `${pct.home}%`,
                background: homeColor,
                boxShadow: homeBetter ? `0 0 8px ${homeColor}` : "none"
              }}
            ></i>
            <em
              className={awayBetter ? "better" : ""}
              style={{
                width: `${pct.away}%`,
                background: awayColor,
                boxShadow: awayBetter ? `0 0 8px ${awayColor}` : "none"
              }}
            ></em>
          </div>
        </div>
        <b style={{ color: awayBetter ? awayColor : "#e5e7eb" }}>{a}</b>
      </div>
    );
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

  function toNumber(v, fallback = 0) {
    if (v === undefined || v === null || v === "") return fallback;
    if (typeof v === "object" && v !== null) {
      if ("value" in v) return toNumber(v.value, fallback);
      if ("total" in v) return toNumber(v.total, fallback);
    }
    const n = Number(String(v).replace("%", "").replace(",", ".").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  }

  function pickValue(...values) {
    for (const v of values) {
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return undefined;
  }

  function nested(obj, paths = []) {
    for (const path of paths) {
      const value = String(path)
        .split(".")
        .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return undefined;
  }

  function apiStats(item) {
    return item.stats || item.statistics || item.realStatistics || item.matchStats || {};
  }

  function apiHomeStats(item) {
    const s = apiStats(item);
    return (
      s.home ||
      s.casa ||
      s.local ||
      s.teams?.home ||
      s.homeTeam ||
      item.homeStats ||
      item.statsHome ||
      item.statisticsHome ||
      item.home?.statistics ||
      {}
    );
  }

  function apiAwayStats(item) {
    const s = apiStats(item);
    return (
      s.away ||
      s.fora ||
      s.visitante ||
      s.teams?.away ||
      s.awayTeam ||
      item.awayStats ||
      item.statsAway ||
      item.statisticsAway ||
      item.away?.statistics ||
      {}
    );
  }

  function statsArrayValue(list, teamName, wantedNames = []) {
    if (!Array.isArray(list)) return undefined;
    const teamNorm = normalizar(teamName || "");

    const teamBlock = list.find((row) => {
      const name = normalizar(row?.team?.name || row?.teamName || row?.name || "");
      return name && teamNorm && (name === teamNorm || name.includes(teamNorm) || teamNorm.includes(name));
    });

    const statsList = teamBlock?.statistics || teamBlock?.stats || [];
    if (!Array.isArray(statsList)) return undefined;

    const wanted = wantedNames.map(normalizar);
    const stat = statsList.find((s) => wanted.includes(normalizar(s?.type || s?.name || s?.key || "")));
    return stat?.value ?? stat?.total;
  }


  function statNumber(item, side, keys, fallback = 0) {
    const teamStats = side === "home" ? apiHomeStats(item) : apiAwayStats(item);
    const times = timesDoJogo(item);
    const teamName = side === "home" ? times.casa : times.fora;
    const prefix = side === "home" ? ["", "Home", "Casa"] : ["Away", "Fora", "Visitante"];
    const directKeys = [];

    keys.forEach((k) => {
      prefix.forEach((p) => {
        directKeys.push(p ? `${k}${p}` : k);
        directKeys.push(p ? `${p}${k[0].toUpperCase()}${k.slice(1)}` : k);
      });
    });

    const candidates = [
      ...directKeys.map((k) => item[k]),
      ...keys.map((k) => teamStats[k]),
      ...keys.map((k) => nested(teamStats, [k, `${k}.value`, `${k}.total`])),
      ...keys.map((k) => nested(item, [`stats.${side}.${k}`, `statistics.${side}.${k}`, `realStats.${side}.${k}`])),
      statsArrayValue(item.statistics, teamName, keys),
      statsArrayValue(item.stats, teamName, keys),
      statsArrayValue(item.realStats, teamName, keys),
      statsArrayValue(item.matchStats, teamName, keys)
    ];

    return toNumber(pickValue(...candidates), fallback);
  }

  function hasAnyStat(item) {
    const s = apiStats(item);
    return Boolean(
      item.realStats === true ||
      item.hasRealStats === true ||
      String(item.statsMode || item.statsSource || "").toLowerCase() === "real" ||
      Object.keys(s || {}).length ||
      Object.keys(apiHomeStats(item) || {}).length ||
      Object.keys(apiAwayStats(item) || {}).length ||
      item.attacks !== undefined ||
      item.shots !== undefined ||
      item.dangerousAttacks !== undefined
    );
  }

  function jogoAoVivoReal(item) {
    const type = String(item.type || item.tipo || "").toLowerCase();
    const status = String(item.status || item.estado || item.fixture?.status?.short || "").toUpperCase();

    return (
      type === "live" ||
      status.includes("AO VIVO") ||
      ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"].includes(status)
    );
  }

  function jogoStatsReal(item) {
    return hasAnyStat(item);
  }

  function jogoEventosReal(item) {
    return (
      item.hasRealEvents === true ||
      String(item.eventsMode || "").toLowerCase() === "real" ||
      (Array.isArray(item.matchEvents) && item.matchEvents.length > 0)
    );
  }

  function jogoFonteReal(item) {
    const source = String(item.source || "").toLowerCase();

    return Boolean(
      item.fixtureId ||
      item.gameId ||
      item.fixture?.id ||
      source.includes("api-football") ||
      source.includes("api")
    );
  }

  function sinalReal(item) {
    const mercado = String(item.market || item.mercado || "").trim();
    const conf = Number(item.confidence || item.confianca || 0);

    return (
      jogoAoVivoReal(item) &&
      jogoFonteReal(item) &&
      mercado !== "" &&
      conf >= 30
    );
  }


  function estatisticasEstimadasDoJogo(item) {
    const min = Math.max(1, Math.min(90, minuto(item) || 1));
    const gols = totalGols(item);
    const pressure = Number(item?.pressure || item?.pressao || 55);
    const conf = Number(item?.confidence || item?.confianca || 55);
    const eventos = Array.isArray(item?.matchEvents) ? item.matchEvents : [];

    const nums = String(item?.score || "0-0").match(/\d+/g) || [0, 0];
    const homeGoals = Number(nums[0] || 0);
    const awayGoals = Number(nums[1] || 0);

    const homeEvents = eventos.filter((ev) => {
      const name = normalizar(ev?.teamName || ev?.team?.name || "");
      const t = timesDoJogo(item);
      return name && normalizar(t.casa) && (name.includes(normalizar(t.casa)) || normalizar(t.casa).includes(name));
    }).length;

    const awayEvents = eventos.filter((ev) => {
      const name = normalizar(ev?.teamName || ev?.team?.name || "");
      const t = timesDoJogo(item);
      return name && normalizar(t.fora) && (name.includes(normalizar(t.fora)) || normalizar(t.fora).includes(name));
    }).length;

    const wave = Math.sin((min + homeGoals * 7 + awayGoals * 5) / 8);
    const homeBase = 48 + wave * 10 + (homeGoals - awayGoals) * 4 + (homeEvents - awayEvents) * 2;
    const homePosse = Math.max(35, Math.min(65, Math.round(homeBase)));
    const awayPosse = 100 - homePosse;

    const ritmo = Math.max(0.55, Math.min(1.45, (pressure + conf) / 130));
    const totalAtaques = Math.round((min * 1.15 + gols * 8 + eventos.length * 2) * ritmo);
    const homeShare = homePosse / 100;

    const homeAtaques = Math.max(homeGoals * 4, Math.round(totalAtaques * homeShare));
    const awayAtaques = Math.max(awayGoals * 4, totalAtaques - homeAtaques);

    const homeFinal = Math.max(homeGoals, Math.round(homeAtaques / 9 + homeGoals * 1.5));
    const awayFinal = Math.max(awayGoals, Math.round(awayAtaques / 9 + awayGoals * 1.5));

    const homeNoGol = Math.max(homeGoals, Math.min(homeFinal, Math.round(homeFinal * 0.38 + homeGoals * 0.8)));
    const awayNoGol = Math.max(awayGoals, Math.min(awayFinal, Math.round(awayFinal * 0.38 + awayGoals * 0.8)));

    const homePerigosos = Math.round(homeAtaques * 0.34 + homeNoGol * 2 + homeGoals * 3);
    const awayPerigosos = Math.round(awayAtaques * 0.34 + awayNoGol * 2 + awayGoals * 3);

    const homeCantos = Math.max(0, Math.round(homeFinal / 3.5 + homePerigosos / 28));
    const awayCantos = Math.max(0, Math.round(awayFinal / 3.5 + awayPerigosos / 28));

    return {
      home: {
        posse: homePosse,
        finalizacoes: homeFinal,
        noGol: homeNoGol,
        ataques: homeAtaques,
        perigosos: homePerigosos,
        cantos: homeCantos,
        cartoes: 0,
        vermelhos: 0
      },
      away: {
        posse: awayPosse,
        finalizacoes: awayFinal,
        noGol: awayNoGol,
        ataques: awayAtaques,
        perigosos: awayPerigosos,
        cantos: awayCantos,
        cartoes: 0,
        vermelhos: 0
      },
      real: false,
      estimated: true
    };
  }

  function statsDoJogo(item) {
    const real = jogoStatsReal(item);

    const home = {
      posse: real ? statNumber(item, "home", ["posse", "possession", "ballPossession", "Ball Possession"], 0) : 0,
      finalizacoes: real ? statNumber(item, "home", ["finalizacoes", "finalizações", "shots", "totalShots", "chutes", "Total Shots", "Shots total"], 0) : 0,
      noGol: real ? statNumber(item, "home", ["noGol", "shotsOnGoal", "chutesNoGol", "onGoal", "shotsOnTarget", "Shots on Goal"], 0) : 0,
      ataques: real ? statNumber(item, "home", ["ataques", "attacks", "Attacks"], 0) : 0,
      cantos: real ? statNumber(item, "home", ["cantos", "corners", "escanteios", "Corner Kicks"], 0) : 0,
      cartoes: real ? statNumber(item, "home", ["cartoes", "cartões", "yellowCards", "cards", "Yellow Cards"], 0) : 0,
      vermelhos: real ? statNumber(item, "home", ["vermelhos", "redCards", "cartoesVermelhos", "Red Cards"], 0) : 0,
      perigosos: real ? statNumber(item, "home", ["perigosos", "dangerousAttacks", "ataquesPerigosos", "Dangerous Attacks"], 0) : 0
    };

    const away = {
      posse: real ? statNumber(item, "away", ["posse", "possession", "ballPossession", "Ball Possession"], 0) : 0,
      finalizacoes: real ? statNumber(item, "away", ["finalizacoes", "finalizações", "shots", "totalShots", "chutes", "Total Shots", "Shots total"], 0) : 0,
      noGol: real ? statNumber(item, "away", ["noGol", "shotsOnGoal", "chutesNoGol", "onGoal", "shotsOnTarget", "Shots on Goal"], 0) : 0,
      ataques: real ? statNumber(item, "away", ["ataques", "attacks", "Attacks"], 0) : 0,
      cantos: real ? statNumber(item, "away", ["cantos", "corners", "escanteios", "Corner Kicks"], 0) : 0,
      cartoes: real ? statNumber(item, "away", ["cartoes", "cartões", "yellowCards", "cards", "Yellow Cards"], 0) : 0,
      vermelhos: real ? statNumber(item, "away", ["vermelhos", "redCards", "cartoesVermelhos", "Red Cards"], 0) : 0,
      perigosos: real ? statNumber(item, "away", ["perigosos", "dangerousAttacks", "ataquesPerigosos", "Dangerous Attacks"], 0) : 0
    };

    // Se a API mandar só posse de casa, calcula a posse de fora. Se mandar as duas, respeita os números reais.
    if (home.posse > 0 && away.posse === 0) away.posse = Math.max(0, 100 - home.posse);
    if (away.posse > 0 && home.posse === 0) home.posse = Math.max(0, 100 - away.posse);

    const totalNumerico =
      home.ataques + away.ataques +
      home.perigosos + away.perigosos +
      home.finalizacoes + away.finalizacoes +
      home.noGol + away.noGol +
      home.cantos + away.cantos +
      home.posse + away.posse;

    if (!real || totalNumerico <= 0) {
      return estatisticasEstimadasDoJogo(item);
    }

    return { home, away, real, estimated: false };
  }


  function temEstatisticasNumericas(item) {
    const s = statsDoJogo(item);

    const total =
      s.home.ataques + s.away.ataques +
      s.home.perigosos + s.away.perigosos +
      s.home.finalizacoes + s.away.finalizacoes +
      s.home.noGol + s.away.noGol +
      s.home.cantos + s.away.cantos +
      s.home.posse + s.away.posse;

    return total > 0;
  }


  function temStatsNumericasReais(item) {
    const s = statsDoJogo(item);

    const total =
      s.home.ataques + s.away.ataques +
      s.home.perigosos + s.away.perigosos +
      s.home.finalizacoes + s.away.finalizacoes +
      s.home.noGol + s.away.noGol +
      s.home.cantos + s.away.cantos +
      s.home.posse + s.away.posse;

    return total > 0;
  }

  function mercadoStatus(item) {
    const alertText = String(item.alert ?? item.alerta ?? "").trim();
    if (alertText && alertText !== "true" && alertText !== "false") return alertText;

    if (!sinalReal(item)) return "❌ SEM SINAL REAL";

    const stats = statsDoJogo(item);
const gols = totalGols(item);
    const min = minuto(item);
    const pressure = Number(item.pressure || item.pressao || 0);
    const confidence = Number(item.confidence || item.confianca || 0);
    const market = String(item.market || item.mercado || "").toLowerCase();

    const totalDanger = stats.home.perigosos + stats.away.perigosos;
    const totalShots = stats.home.finalizacoes + stats.away.finalizacoes;
    const totalOnGoal = stats.home.noGol + stats.away.noGol;
    const totalCorners = stats.home.cantos + stats.away.cantos;
    const totalCards = stats.home.cartoes + stats.away.cartoes;

    if (market.includes("0.5") || market.includes("0,5")) {
      if (gols >= 1) return "✅ GREEN REAL";
      if (min <= 45 && totalDanger >= 18 && totalOnGoal >= 3 && pressure >= 55) return "🔥 OVER 0.5 REAL";
      if (totalShots >= 8 && totalOnGoal >= 3) return "📊 OVER 0.5 OBSERVAR";
      return "❌ SEM ENTRADA";
    }

    if (market.includes("1.5") || market.includes("1,5")) {
      if (gols >= 2) return "✅ GREEN REAL";
      if (min >= 35 && totalDanger >= 24 && totalOnGoal >= 4 && pressure >= 60) return "🔥 OVER 1.5 REAL";
      return "❌ SEM ENTRADA";
    }

    if (market.includes("2.5") || market.includes("2,5")) {
      if (gols >= 3) return "✅ GREEN REAL";
      if (min >= 55 && totalDanger >= 30 && totalOnGoal >= 5 && pressure >= 65) return "🚨 OVER 2.5 REAL";
      return "❌ SEM ENTRADA";
    }

    if (market.includes("3.5") || market.includes("3,5")) {
      if (gols >= 4) return "✅ GREEN REAL";
      if (min >= 60 && totalDanger >= 38 && totalOnGoal >= 7 && pressure >= 75) return "🚨 OVER 3.5 REAL";
      return "❌ SEM ENTRADA";
    }

    if (market.includes("btts") || market.includes("ambas")) {
      if (stats.home.noGol >= 2 && stats.away.noGol >= 2 && stats.home.perigosos >= 10 && stats.away.perigosos >= 10) return "⚽ BTTS REAL";
      return "❌ SEM ENTRADA";
    }

    if (market.includes("canto") || market.includes("corner")) {
      if (totalCorners >= 5 || totalDanger >= 28) return "🚩 CANTOS REAL";
      return "❌ SEM ENTRADA";
    }

    if (market.includes("cart") || market.includes("card")) {
      if (totalCards >= 2 || min >= 55) return "🟨 CARTÕES REAL";
      return "❌ SEM ENTRADA";
    }

    if (confidence >= 70 && (jogoStatsReal(item) || jogoEventosReal(item))) return "✅ SINAL REAL";
    return "📊 MONITORANDO REAL";
  }


  function mercadoPeso(item) {
    const market = String(item?.market || item?.mercado || "").toLowerCase();
    const conf = Number(item?.confidence || item?.confianca || 0);
    const pressure = Number(item?.pressure || item?.pressao || 0);
    const gols = totalGols(item || {});
    let peso = conf + pressure * 0.4;

    if (market.includes("mais") || market.includes("gol")) peso += 18;
    if (market.includes("over") || market.includes("0.5") || market.includes("0,5")) peso += 14;
    if (market.includes("1.5") || market.includes("1,5")) peso += 12;
    if (market.includes("2.5") || market.includes("2,5")) peso += 10;
    if (market.includes("btts") || market.includes("ambas")) peso += 9;
    if (market.includes("canto") || market.includes("corner")) peso += 7;
    if (market.includes("cart") || market.includes("card")) peso += 5;

    if ((market.includes("0.5") || market.includes("0,5")) && gols >= 1) peso -= 100;
    if ((market.includes("1.5") || market.includes("1,5")) && gols >= 2) peso -= 100;
    if ((market.includes("2.5") || market.includes("2,5")) && gols >= 3) peso -= 100;
    if ((market.includes("3.5") || market.includes("3,5")) && gols >= 4) peso -= 100;

    return peso;
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
    return sinalReal(item) && (Number(item.confidence || item.confianca || 0) >= 70 || String(item.alert || "").includes("REAL"));
  }

  function normalizarEventoTimeline(event = {}, times, homeColor, awayColor) {
    const minute = Math.max(1, Math.min(90, toNumber(event.minute ?? event.elapsed ?? event.time?.elapsed, 1)));
    const sideRaw = String(event.side || event.teamSide || "").toLowerCase();
    const teamName = normalizar(event.teamName || event.team?.name || "");
    let team = "home";

    if (sideRaw.includes("away") || sideRaw.includes("fora")) team = "away";
    if (sideRaw.includes("home") || sideRaw.includes("casa")) team = "home";
    if (!sideRaw && teamName) {
      if (teamName === normalizar(times.fora)) team = "away";
      if (teamName === normalizar(times.casa)) team = "home";
    }

    const text = `${event.icon || ""} ${event.type || ""} ${event.detail || ""} ${event.category || ""}`.toLowerCase();
    const icon =
      event.icon ||
      (text.includes("goal") || text.includes("gol") ? "⚽" :
        text.includes("red") || text.includes("vermelho") ? "🟥" :
          text.includes("card") || text.includes("yellow") || text.includes("cart") ? "🟨" :
            text.includes("corner") || text.includes("canto") ? "🚩" : "");

    const level = icon === "⚽" || icon === "🟥" ? 3 : icon === "🟨" || icon === "🚩" ? 2 : 1;

    return {
      m: minute,
      team,
      level,
      icon,
      color: team === "home" ? homeColor : awayColor,
      real: true
    };
  }

  function timelineEvents(item, index, homeColor, awayColor) {
    if (!jogoAoVivoReal(item)) return [];

    const current = Math.min(90, Math.max(1, minuto(item) || 1));
    const stats = statsDoJogo(item);
    const times = timesDoJogo(item);
    const eventosReais = Array.isArray(item.matchEvents) ? item.matchEvents : [];

    const eventMap = new Map();

    eventosReais
      .map((ev) => normalizarEventoTimeline(ev, times, homeColor, awayColor))
      .filter((ev) => ev.m <= current)
      .forEach((ev) => {
        const key = `${ev.m}-${ev.team}-${ev.icon || "event"}`;
        eventMap.set(key, ev);
      });

    const homePower =
      stats.home.ataques * 0.8 +
      stats.home.perigosos * 1.8 +
      stats.home.finalizacoes * 4.5 +
      stats.home.noGol * 8 +
      stats.home.cantos * 3 +
      stats.home.posse * 0.3;

    const awayPower =
      stats.away.ataques * 0.8 +
      stats.away.perigosos * 1.8 +
      stats.away.finalizacoes * 4.5 +
      stats.away.noGol * 8 +
      stats.away.cantos * 3 +
      stats.away.posse * 0.3;

    const totalPower = Math.max(1, homePower + awayPower);
    const homeShare = homePower / totalPower;
    const awayShare = awayPower / totalPower;

    const scoreNums = String(item.score || "0-0").match(/\\d+/g) || [0, 0];
    const homeGoals = Number(scoreNums[0] || 0);
    const awayGoals = Number(scoreNums[1] || 0);

    const goalsBias = Math.max(-0.18, Math.min(0.18, (homeGoals - awayGoals) * 0.055));
    const homeDominance = Math.max(0.12, Math.min(0.88, homeShare + goalsBias));
    const awayDominance = 1 - homeDominance;

    const eventsByMinute = new Map();
    Array.from(eventMap.values()).forEach((ev) => {
      if (!eventsByMinute.has(ev.m)) eventsByMinute.set(ev.m, []);
      eventsByMinute.get(ev.m).push(ev);
    });

    const pressure = [];
    let homeMomentum = homeDominance;
    let awayMomentum = awayDominance;

    for (let minute = 1; minute <= current; minute += 1) {
      const phase =
        Math.sin((minute + index * 3) / 5.2) * 0.18 +
        Math.sin((minute + stats.home.perigosos + 3) / 11) * 0.12 -
        Math.cos((minute + stats.away.perigosos + 5) / 9) * 0.10;

      const matchSwing = Math.sin((minute / Math.max(1, current)) * Math.PI * 2 + index) * 0.08;
      let homeMinute = homeDominance + phase + matchSwing;
      let awayMinute = awayDominance - phase - matchSwing;

      const minuteEvents = eventsByMinute.get(minute) || [];

      minuteEvents.forEach((ev) => {
        const boost = ev.icon === "⚽" ? 0.42 : ev.icon === "🚩" ? 0.24 : ev.icon === "🟨" ? 0.12 : 0.18;
        if (ev.team === "home") homeMinute += boost;
        if (ev.team === "away") awayMinute += boost;
      });

      const windowStart = Math.max(1, minute - 5);
      const recentEvents = Array.from(eventsByMinute.entries())
        .filter(([m]) => m >= windowStart && m <= minute)
        .flatMap(([, arr]) => arr);

      recentEvents.forEach((ev) => {
        const boost = ev.icon === "⚽" ? 0.10 : ev.icon === "🚩" ? 0.07 : 0.04;
        if (ev.team === "home") homeMinute += boost;
        if (ev.team === "away") awayMinute += boost;
      });

      homeMinute = Math.max(0.03, homeMinute);
      awayMinute = Math.max(0.03, awayMinute);

      const totalMinute = homeMinute + awayMinute;
      homeMomentum = homeMomentum * 0.72 + (homeMinute / totalMinute) * 0.28;
      awayMomentum = awayMomentum * 0.72 + (awayMinute / totalMinute) * 0.28;

      const homeRaw = homeMomentum * (0.52 + Math.abs(phase) * 0.75);
      const awayRaw = awayMomentum * (0.52 + Math.abs(phase) * 0.75);

      const homeLevel = Math.max(4, Math.min(34, Math.round(homeRaw * 42)));
      const awayLevel = Math.max(4, Math.min(34, Math.round(awayRaw * 42)));

      const eventWithIcon = minuteEvents.find((ev) => ev.icon);
      const eventIcon = eventWithIcon?.icon || "";
      const eventTeam = eventWithIcon?.team || "";

      pressure.push({
        m: minute,
        homeLevel,
        awayLevel,
        homeColor,
        awayColor,
        eventIcon,
        eventTeam,
        events: minuteEvents
      });
    }

    return pressure;
  }


  function sinalPreLiveVip(item) {
    const type = String(item.type || item.tipo || "").toLowerCase();
    const status = String(item.status || item.estado || "").toUpperCase();
    const isPrelive = type.includes("pre") || status.includes("PRE");
    const conf = Number(item.confidence || item.confianca || 0);
    const pressure = Number(item.pressure || item.pressao || 0);
    const mercado = String(item.market || item.mercado || "").trim();

    return (
      isPrelive &&
      jogoFonteReal(item) &&
      mercado !== "" &&
      conf >= 60 &&
      pressure >= 30
    );
  }

  function sinalAceito(item) {
    return sinalReal(item) || sinalPreLiveVip(item);
  }


  function statsScore(item) {
    const s = statsDoJogo(item);
    return (
      s.home.ataques + s.away.ataques +
      s.home.perigosos + s.away.perigosos +
      s.home.finalizacoes + s.away.finalizacoes +
      s.home.noGol + s.away.noGol +
      s.home.cantos + s.away.cantos +
      s.home.posse + s.away.posse +
      (s.real ? 1000 : 0)
    );
  }

  function chaveJogo(item) {
    return String(
      item.fixtureId ||
      item.gameId ||
      item.fixture?.id ||
      item.id ||
      tituloJogo(item)
    );
  }

  function juntarSinaisDoMesmoJogo(lista = []) {
    const mapa = new Map();

    lista.forEach((item) => {
      const key = chaveJogo(item);
      const atual = mapa.get(key);

      if (!atual) {
        mapa.set(key, {
          ...item,
          mercadosAtivos: [item],
        });
        return;
      }

      const mercadosAtivos = [...(atual.mercadosAtivos || []), item]
        .filter(Boolean)
        .sort((a, b) => scoreSinalForte(b) - scoreSinalForte(a));

      const melhorMercado =
        mercadosAtivos.find((m) => !mercadoCumprido(m)) ||
        mercadosAtivos[0] ||
        item;

      const melhorBase =
        statsScore(item) > statsScore(atual)
          ? item
          : atual;

      mapa.set(key, {
        ...atual,
        ...melhorBase,
        ...melhorMercado,
        mercadosAtivos,
        melhorMercado,
        market: melhorMercado.market || melhorMercado.mercado || atual.market,
        category: melhorMercado.category || melhorMercado.categoria || atual.category,
        confidence: Math.max(...mercadosAtivos.map((m) => Number(m.confidence || m.confianca || 0))),
        pressure: Math.max(...mercadosAtivos.map((m) => Number(m.pressure || m.pressao || 0))),
      });
    });

    return Array.from(mapa.values());
  }

  const sinaisFiltrados = useMemo(() => {
    const filtrados = signals
      .filter(sinalAceito)
      .filter((item) => {
        const texto = `${item.match} ${item.league} ${item.market}`.toLowerCase();
        if (!texto.includes(busca.toLowerCase())) return false;
        const cat = categoriaMercado(item);
        if (filtro === "TODOS") return jogoAoVivoReal(item);
        if (filtro === "LIVE") return jogoAoVivoReal(item);
        if (filtro === "ALERTA") return mercadoStatus(item).includes("🔥") || mercadoStatus(item).includes("🚨");
        if (filtro === "OVER05") return cat === "OVER 0,5";
        if (filtro === "OVER15") return cat === "OVER 1,5";
        if (filtro === "OVER25") return cat === "OVER 2,5";
        if (filtro === "OVER35") return cat === "OVER 3,5";
        if (filtro === "CARTÕES") return cat.includes("CARTÕES");
        if (filtro === "CANTOS") return cat.includes("CANTOS");
        if (filtro === "BTTS") return cat === "BTTS";
        if (filtro === "TOP IA") return (item.confidence || 70) >= 82;
        if (filtro === "VIP") return isVip(item) || sinalPreLiveVip(item);
        if (filtro === "PRELIVEVIP") return sinalPreLiveVip(item);
        return true;
      })
      .sort((a, b) => (b.confidence || 70) + (b.pressure || 70) - ((a.confidence || 70) + (a.pressure || 70)));

    return juntarSinaisDoMesmoJogo(filtrados).sort((a, b) => mercadoPeso(b) - mercadoPeso(a));
  }, [signals, busca, filtro]);

  const liveCount = signals.filter((s) => jogoAoVivoReal(s)).length;
  const preliveVipCount = signals.filter((s) => typeof sinalPreLiveVip === 'function' && sinalPreLiveVip(s)).length;
  const alertCount = signals.filter((s) => sinalReal(s) && (mercadoStatus(s).includes("🔥") || mercadoStatus(s).includes("🚨") || mercadoStatus(s).includes("✅"))).length;

  return (
    <div className="page">
      <style>{css}</style>

      <header className="topBar">
        <div>
          <h1>MekineBet AO VIVO <span className="liveDot"></span></h1>
          <div className="subTitle">🟢 Scanner live • estatísticas reais • pressão • mercados</div>
        </div>
        <div className="statusWrap">
          <span className="pill">🟢 Live: {liveCount}</span>
          <span className="pill">🚨 Alertas: {alertCount}</span>
          <span className="pill">👑 VIP</span>
          <span className="pill">🔒 Pré-live: {typeof preliveVipCount !== 'undefined' ? preliveVipCount : 0}</span>
          <span className="pill">🕘 {lastUpdate || "carregando..."}</span>
        </div>
      </header>

      {liveCount === 0 && (
        <div className="notice">📊 Nenhum jogo ao vivo real disponível agora. O painel continua monitorando automaticamente.</div>
      )}

      <div className="filters">
        {[
          ["TODOS", "▣ TODOS"], ["LIVE", "◉ LIVE"], ["ALERTA", "⚠️ ALERTA"], ["OVER05", "⌁ OVER 0,5"],
          ["OVER15", "⌁ OVER 1,5"], ["OVER25", "⌁ OVER 2,5"], ["OVER35", "⌁ OVER 3,5"],
          ["CARTÕES", "🟨 CARTÕES"], ["CANTOS", "🚩 CANTOS"], ["BTTS", "👥 BTTS"],
          ["TOP IA", "🧠 TOP IA"], ["VIP", "👑 VIP"], ["PRELIVEVIP", "🔒 PRÉ-LIVE VIP"]
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
            const melhorSinal = melhorSinalDoItem(item);
            const status = mercadoStatus(item);
            const cat = categoriaMercado(item);
            const vip = isVip(item);
            const liveReal = item.type === "live";
            const times = timesDoJogo(item);
            const { homeColor, awayColor } = coresDoJogo(times.casa, times.fora);
            const currentMinute = Math.min(90, Math.max(1, minuto(item) || 1));
            const miniEstado = estadoMiniCampo(item, stats, homeColor, awayColor);
            const events = timelineEvents(item, index, homeColor, awayColor);
            const timelineLeft = (m) => `calc(46px + ${(Math.max(0, Math.min(90, m)) / 90) * 100}% - ${((Math.max(0, Math.min(90, m)) / 90) * 51).toFixed(2)}px)`;

            return (
              <section key={item.fixtureId || item.gameId || item.id || index} className={`card ${scoreSinalForte(melhorSinal) >= 90 ? "strongSignalCard" : ""}`}>
                <div className="matchHero">
                  <div className="teamSide">
                    <img className="heroLogo" src={logoCasa(item)} alt={times.casa} onError={(e) => (e.currentTarget.src = fallbackLogo(times.casa))} />
                    <small style={{ color: homeColor }}>{nomeCurto(times.casa)}</small>
                  </div>
                  <div className="heroCenter">
                    <h2><span style={{ color: homeColor }}>{nomeCurto(times.casa)}</span> <em>vs</em> <span style={{ color: awayColor }}>{nomeCurto(times.fora)}</span></h2>
                    <p>{nomePtBr(item.league || "Liga")}</p>
                    <b>{item.score || "0-0"}</b>
                    <strong>{currentMinute}'</strong>
                  </div>
                  <div className="teamSide right">
                    <img className="heroLogo" src={logoFora(item)} alt={times.fora} onError={(e) => (e.currentTarget.src = fallbackLogo(times.fora))} />
                    <small style={{ color: awayColor }}>{nomeCurto(times.fora)}</small>
                  </div>
                </div>

                <div className="badges">
                  <span className="base">{liveReal ? "AO VIVO" : "PRÉ-LIVE VIP"}</span>
                  {vip && <span className="vip">VIP</span>}
                  <span className="market">{cat}</span>
                </div>
{Array.isArray(item.mercadosAtivos) && item.mercadosAtivos.length > 1 && (
                  <div className="activeMarkets">
                    {item.mercadosAtivos.slice(0, 4).map((m, idx) => (
                      <span key={idx}>
                        <b>{categoriaMercado(m)}</b>
                        <em>{Number(m.confidence || m.confianca || 0)}%</em>
                      </span>
                    ))}
                  </div>
                )}

                <div className={`betStats proStats ${stats.estimated ? "statsEstimated" : ""}`} style={{ "--home": homeColor, "--away": awayColor }}>
                  {stats.estimated && (
                    <div className="statsInlineNotice">📊 Estatísticas automáticas até a API enviar dados oficiais</div>
                  )}
                  <div className="statsTopGrid">
                    <div className="metricPair">
                      <small>ATAQUES</small>
                      <div className="metricNumbers">
                        <b style={{ color: homeColor }}>{stats.home.ataques}</b>
                        <span
                          className="metricVs"
                          style={{
                            "--circle-bg": `conic-gradient(${homeColor} 0 ${pctStat(stats.home.ataques, stats.away.ataques).home}%, ${awayColor} ${pctStat(stats.home.ataques, stats.away.ataques).home}% 100%)`
                          }}
                        ></span>
                        <b style={{ color: awayColor }}>{stats.away.ataques}</b>
                      </div>
                      <div className="dualMiniBar">
                        <i style={{ width: `${pctStat(stats.home.ataques, stats.away.ataques).home}%`, background: homeColor }}></i>
                        <em style={{ width: `${pctStat(stats.home.ataques, stats.away.ataques).away}%`, background: awayColor }}></em>
                      </div>
                    </div>

                    <div className="metricPair">
                      <small>ATAQUES PERIGOSOS</small>
                      <div className="metricNumbers">
                        <b style={{ color: homeColor }}>{stats.home.perigosos}</b>
                        <span
                          className="metricVs danger"
                          style={{
                            "--circle-bg": `conic-gradient(${homeColor} 0 ${pctStat(stats.home.perigosos, stats.away.perigosos).home}%, ${awayColor} ${pctStat(stats.home.perigosos, stats.away.perigosos).home}% 100%)`
                          }}
                        ></span>
                        <b style={{ color: awayColor }}>{stats.away.perigosos}</b>
                      </div>
                      <div className="dualMiniBar">
                        <i style={{ width: `${pctStat(stats.home.perigosos, stats.away.perigosos).home}%`, background: homeColor }}></i>
                        <em style={{ width: `${pctStat(stats.home.perigosos, stats.away.perigosos).away}%`, background: awayColor }}></em>
                      </div>
                    </div>

                    <div className="metricPair posseMetric">
                      <small>% POSSE</small>
                      <div className="metricNumbers">
                        <b style={{ color: homeColor }}>{stats.home.posse}%</b>
                        <span
                          className="metricVs ball"
                          style={{
                            "--circle-bg": `conic-gradient(${homeColor} 0 ${pctStat(stats.home.posse, stats.away.posse).home}%, ${awayColor} ${pctStat(stats.home.posse, stats.away.posse).home}% 100%)`
                          }}
                        ></span>
                        <b style={{ color: awayColor }}>{stats.away.posse}%</b>
                      </div>
                      <div className="dualMiniBar">
                        <i style={{ width: `${pctStat(stats.home.posse, stats.away.posse).home}%`, background: homeColor }}></i>
                        <em style={{ width: `${pctStat(stats.home.posse, stats.away.posse).away}%`, background: awayColor }}></em>
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

                    <div className="shotBox shotBoxPro bet365LinesBox">
                      <StatLineBet365
                        label="FINALIZAÇÕES"
                        home={stats.home.finalizacoes}
                        away={stats.away.finalizacoes}
                        homeColor={homeColor}
                        awayColor={awayColor}
                      />
                      <StatLineBet365
                        label="CHUTES NO GOL"
                        home={stats.home.noGol}
                        away={stats.away.noGol}
                        homeColor={homeColor}
                        awayColor={awayColor}
                      />
                    </div>

                    <div className="sideCounters sideAway">
                      <strong style={{ color: awayColor }}>{sigla(times.fora)}</strong>
                      <span>🚩 <b>{stats.away.cantos}</b></span>
                      <span>🟨 <b>{stats.away.cartoes}</b></span>
                      <span>🟥 <b>0</b></span>
                    </div>
                  </div>
                </div>
<div className="miniMap">
                  <div className={`livePulse ${miniEstado.intensity}`}>
                    <b style={{ color: miniEstado.color }}>●</b>
                    <span>{miniEstado.label}</span>
                  </div>
                  <div className="field3d liveField">
                    <div className="grass"></div><div className="shade"></div><div className="midLine"></div><div className="centerCircle"></div><div className="boxLeft"></div><div className="boxRight"></div><div className="goalLeft"></div><div className="goalRight"></div>
                    <div className="attackZone" style={{
                      left: miniEstado.attackingHome ? "52%" : "6%",
                      right: miniEstado.attackingHome ? "6%" : "52%",
                      background: `linear-gradient(90deg, transparent, ${miniEstado.color}44)`
                    }}></div>
                    <div className="ballTrail" style={{
                      left: `${Math.max(6, miniEstado.x - 12)}%`,
                      top: `${miniEstado.y}%`,
                      background: `linear-gradient(90deg, transparent, ${miniEstado.color})`
                    }}></div>
                    <div className={`liveBall ${miniEstado.intensity}`} style={{ left: `${miniEstado.x}%`, top: `${miniEstado.y}%`, background: miniEstado.color }}></div>
                    <div className="playerDot h1" style={{ background: homeColor }}></div>
                    <div className="playerDot h2" style={{ background: homeColor }}></div>
                    <div className="playerDot h3" style={{ background: homeColor }}></div>
                    <div className="playerDot a1" style={{ background: awayColor }}></div>
                    <div className="playerDot a2" style={{ background: awayColor }}></div>
                    <div className="playerDot a3" style={{ background: awayColor }}></div>
                  </div>
                  <div className="mapStats compact">
                    <span>Posse {stats.home.posse}% x {stats.away.posse}%</span>
                    <span>Final. {stats.home.finalizacoes} x {stats.away.finalizacoes}</span>
                    <span>Atq. {stats.home.ataques} x {stats.away.ataques}</span>
                  </div>
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
                          className="flowSpike home"
                          style={{
                            left: timelineLeft(ev.m),
                            height: `${ev.homeLevel}px`,
                            background: ev.homeColor,
                            boxShadow: `0 0 ${ev.homeLevel > 24 ? 10 : 4}px ${ev.homeColor}`
                          }}
                        />
                        <span
                          className="flowSpike away"
                          style={{
                            left: timelineLeft(ev.m),
                            height: `${ev.awayLevel}px`,
                            background: ev.awayColor,
                            boxShadow: `0 0 ${ev.awayLevel > 24 ? 10 : 4}px ${ev.awayColor}`
                          }}
                        />
                        {ev.eventIcon && (
                          <span className={`flowIcon ${ev.eventTeam || "home"}`} style={{ left: timelineLeft(ev.m) }}>
                            {ev.eventIcon}
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flowLegend">
                    <span><i className="leve"></i>Ataque leve</span><span><i className="perigoso"></i>Ataque perigoso</span><span><i className="clara"></i>Chance clara</span><span>⚽ Gol</span><span>🟨 Cartão</span><span>🚩 Escanteio</span>
                  </div>
                </div>

                <div className="marketLine">
                  <div><b>{melhorSinal.market || item.market}</b><span>Status: {status}</span><strong>Odd: {melhorSinal.odd || item.odd || "—"}</strong></div>
                  <div><b>IA {melhorSinal.confidence || item.confidence || 70}%</b><span className="bar"><i style={{ width: `${melhorSinal.confidence || item.confidence || 70}%` }}></i></span><small>Pressão {melhorSinal.pressure || item.pressure || 70}%</small></div>
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
  background:inherit;
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
.metricVs{}
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
.metricNumbers{grid-template-columns:1fr 20px 1fr!important;min-height:22px!important}.metricNumbers b{font-size:14px!important}.metricVs{width:20px!important;height:20px!important;background:inherit!important}.metricVs:before{inset:5px!important;background:#07141a!important}.metricVs:after{left:6.5px!important;top:3.2px!important;font-size:9px!important;color:#e5e7eb!important}.metricVs.danger:after{left:6px!important}.metricVs.ball:after{left:7px!important;top:4px!important;font-size:7px!important}.dualMiniBar{height:3px!important;margin-top:1px!important;gap:0!important;background:#0b1117!important}
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


/* ===== AGRUPAMENTO E STATS ESTILO BET365 ===== */
.activeMarkets{
  display:grid!important;
  grid-template-columns:repeat(4,minmax(0,1fr))!important;
  gap:4px!important;
  margin:3px 0 5px!important;
}
.activeMarkets span{
  display:flex!important;
  justify-content:space-between!important;
  align-items:center!important;
  gap:4px!important;
  border:1px solid rgba(250,204,21,.35)!important;
  background:linear-gradient(180deg,rgba(250,204,21,.10),rgba(0,0,0,.18))!important;
  border-radius:6px!important;
  padding:4px 6px!important;
  min-width:0!important;
}
.activeMarkets b{
  font-size:8px!important;
  color:#fff!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
.activeMarkets em{
  font-style:normal!important;
  font-size:9px!important;
  font-weight:900!important;
  color:#22ff88!important;
}
.bet365LinesBox{
  display:grid!important;
  grid-template-columns:1fr!important;
  gap:6px!important;
  padding:5px 6px!important;
}
.bet365StatLine{
  display:grid!important;
  grid-template-columns:34px 1fr 34px!important;
  align-items:center!important;
  gap:6px!important;
  width:100%!important;
}
.bet365StatLine>b{
  font-size:13px!important;
  text-align:center!important;
  font-weight:900!important;
}
.bet365LineCenter{
  min-width:0!important;
}
.bet365LineCenter small{
  display:block!important;
  font-size:6.8px!important;
  line-height:1!important;
  text-align:center!important;
  color:#e5e7eb!important;
  font-weight:900!important;
  margin-bottom:3px!important;
}
.bet365DualLine{
  height:5px!important;
  display:flex!important;
  overflow:hidden!important;
  border-radius:999px!important;
  background:#0b1117!important;
  border:1px solid rgba(255,255,255,.08)!important;
}
.bet365DualLine i,
.bet365DualLine em{
  display:block!important;
  height:100%!important;
  min-width:2px!important;
}
.bet365DualLine i{border-radius:999px 0 0 999px!important}
.bet365DualLine em{border-radius:0 999px 999px 0!important}
@media(max-width:700px){
  .activeMarkets{grid-template-columns:repeat(2,1fr)!important}
}


/* ===== AJUSTE REAL DAS LINHAS DE ESTATÍSTICAS ===== */
.bet365DualLine{
  height:6px!important;
  display:flex!important;
  align-items:stretch!important;
  overflow:hidden!important;
  border-radius:999px!important;
  background:#0b1117!important;
  border:1px solid rgba(255,255,255,.10)!important;
}
.bet365DualLine i,
.bet365DualLine em{
  display:block!important;
  height:100%!important;
  min-width:0!important;
  transition:width .25s ease, opacity .25s ease!important;
}
.bet365DualLine i.better,
.bet365DualLine em.better{
  filter:saturate(1.25) brightness(1.15)!important;
}
.bet365StatLine{
  grid-template-columns:36px 1fr 36px!important;
}
.bet365LineCenter small{
  letter-spacing:.2px!important;
}
.shotBoxPro{
  min-height:48px!important;
}


/* ===== TOP STATS EM LINHAS PROPORCIONAIS ===== */
.bet365TopStats{
  display:grid!important;
  grid-template-columns:1fr!important;
  gap:5px!important;
  padding:4px!important;
}
.bet365TopStats .bet365StatLine{
  grid-template-columns:38px 1fr 38px!important;
  background:rgba(0,0,0,.16)!important;
  border:1px solid rgba(255,255,255,.07)!important;
  border-radius:6px!important;
  padding:3px 5px!important;
}
.bet365TopStats .bet365LineCenter small{
  font-size:6.7px!important;
}
.proStats{
  min-height:128px!important;
}


/* ===== AJUSTE FINAL PEDIDO ===== */
.marketLine{
  border:1px solid rgba(250,204,21,.75)!important;
  background:linear-gradient(180deg,rgba(250,204,21,.16),rgba(0,0,0,.32))!important;
  box-shadow:0 0 16px rgba(250,204,21,.20)!important;
}
.marketLine div:first-child b{
  font-size:15px!important;
  color:#fff!important;
  text-transform:uppercase!important;
}
.marketLine div:first-child span{
  font-size:12px!important;
  color:#fff!important;
  font-weight:900!important;
}
.marketLine div:first-child strong{
  color:#facc15!important;
  font-size:16px!important;
}
.marketLine div:last-child b{
  color:#22ff88!important;
  font-size:13px!important;
}
.bar i{
  background:linear-gradient(90deg,#22c55e,#facc15)!important;
}
.metricPair{
  min-height:44px!important;
}
.dualMiniBar{
  height:5px!important;
  display:flex!important;
  gap:0!important;
  background:#0b1117!important;
  border:1px solid rgba(255,255,255,.08)!important;
}
.dualMiniBar i,
.dualMiniBar em{
  display:block!important;
  height:100%!important;
  min-width:0!important;
}
.dualMiniBar i{border-radius:999px 0 0 999px!important}
.dualMiniBar em{border-radius:0 999px 999px 0!important}


/* ===== CÍRCULOS PROPORCIONAIS ÀS ESTATÍSTICAS ===== */
.metricVs{
  background:var(--circle-bg)!important;
}
.metricVs:before{
  content:""!important;
  position:absolute!important;
  inset:5px!important;
  border-radius:50%!important;
  background:#07141a!important;
}
.metricVs:after{
  z-index:2!important;
}


/* ===== STATS REAIS: SEM INVENTAR DADOS ===== */
.statsMissingNotice{
  margin:4px 0 5px!important;
  border:1px solid rgba(250,204,21,.55)!important;
  background:rgba(250,204,21,.10)!important;
  color:#facc15!important;
  font-weight:900!important;
  font-size:10px!important;
  border-radius:6px!important;
  padding:5px 7px!important;
  text-align:center!important;
}
.noRealStats{
  opacity:.78!important;
  filter:saturate(.75)!important;
}
.noRealStats .metricNumbers b,
.noRealStats .bet365StatLine>b{
  color:#9ca3af!important;
}
.noRealStats .dualMiniBar i,
.noRealStats .dualMiniBar em,
.noRealStats .bet365DualLine i,
.noRealStats .bet365DualLine em{
  width:0!important;
  min-width:0!important;
}


/* ===== CRONOLOGIA ESTILO SOFASCORE ===== */
.flowCard{
  background:linear-gradient(180deg,#07151b,#050b0f)!important;
  border:1px solid rgba(255,255,255,.12)!important;
}
.flowWrap{
  background:
    linear-gradient(180deg,rgba(34,197,94,.08),transparent 49%,rgba(255,255,255,.10) 50%,transparent 51%,rgba(99,102,241,.08)),
    repeating-linear-gradient(90deg,rgba(255,255,255,.08) 0 1px,transparent 1px calc((100% - 51px)/90))!important;
}
.flowSpike{
  width:3px!important;
  border-radius:2px 2px 0 0!important;
  opacity:.95!important;
  transition:height .25s ease!important;
}
.flowSpike.home{bottom:50%!important;top:auto!important;margin-bottom:1px!important}
.flowSpike.away{top:50%!important;bottom:auto!important;margin-top:1px!important;border-radius:0 0 2px 2px!important}
.flowIcon{filter:drop-shadow(0 0 5px rgba(255,255,255,.85))!important;z-index:9!important}
.flowIcon.home{bottom:calc(50% + 34px)!important}
.flowIcon.away{top:calc(50% + 34px)!important}
.middleLine{height:2px!important;background:rgba(255,255,255,.82)!important;box-shadow:0 0 6px rgba(255,255,255,.22)!important}
.nowLine{width:2px!important;background:#ef4444!important;box-shadow:0 0 8px #ef4444!important}
.flowLegend{border-top:1px solid rgba(255,255,255,.06)!important;padding-top:4px!important}

`;
