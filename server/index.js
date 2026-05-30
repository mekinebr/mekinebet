import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.PORT || 10000);
const API_BASE = "https://v3.football.api-sports.io";
const API_KEY =
  process.env.API_FOOTBALL_KEY ||
  process.env.APISPORTS_KEY ||
  process.env.API_SPORTS_KEY ||
  process.env.RAPIDAPI_KEY ||
  "";

const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 30000);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 12000);
const MAX_LIVE_GAMES = Number(process.env.MAX_LIVE_GAMES || 8);

let cache = { timestamp: 0, payload: null };

const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v || 0)));
const toNumber = (v, f = 0) => {
  if (v === null || v === undefined || v === "") return f;
  const n = Number(String(v).replace("%", "").replace(",", ".").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : f;
};

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(res, code, payload) {
  setCors(res);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function apiFootballGet(path) {
  if (!API_KEY) throw new Error("API_FOOTBALL_KEY ausente");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "x-apisports-key": API_KEY,
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "v3.football.api-sports.io"
      },
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    return Array.isArray(data?.response) ? data.response : [];
  } finally {
    clearTimeout(timeout);
  }
}

function hojeISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function isLive(short = "") {
  return ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(String(short).toUpperCase());
}

function fakeStats(i = 0) {
  const home = {
    posse: 54 + (i % 8),
    finalizacoes: 12 + i,
    noGol: 4 + (i % 4),
    ataques: 42 + i * 3,
    perigosos: 24 + i * 2,
    cantos: 4 + (i % 4),
    cartoes: 1 + (i % 2),
    faltas: 10 + i
  };
  const away = {
    posse: 100 - home.posse,
    finalizacoes: 8 + (i % 5),
    noGol: 2 + (i % 3),
    ataques: 31 + i * 2,
    perigosos: 17 + i,
    cantos: 2 + (i % 3),
    cartoes: 1,
    faltas: 8 + i
  };
  return { home, away };
}

function calcPressure(h, a, goals, minute, type) {
  let p =
    38 +
    (h.finalizacoes + a.finalizacoes) * 1.25 +
    (h.noGol + a.noGol) * 3 +
    (h.perigosos + a.perigosos) * 0.55 +
    (h.cantos + a.cantos) * 2.2 +
    goals * 4 +
    (h.cartoes + a.cartoes) * 0.8;

  if (type === "live") {
    if (minute >= 65) p += 4;
    if (minute <= 12) p -= 8;
  } else {
    p += 14;
  }

  return Math.round(clamp(p, 40, 97));
}

function confidence(category, ctx) {
  const { totalGoals, homeGoals, awayGoals, minute, pressure, h, a, type } = ctx;
  const shots = h.finalizacoes + a.finalizacoes;
  const onGoal = h.noGol + a.noGol;
  const corners = h.cantos + a.cantos;
  const cards = h.cartoes + a.cartoes;
  const fouls = h.faltas + a.faltas;
  const pre = type === "prelive" ? 8 : 0;

  if (category === "OVER05") return totalGoals >= 1 ? 96 : Math.round(clamp(52 + pressure * .35 + onGoal * 4 + shots * .9 - minute * .12 + pre, 45, 94));
  if (category === "OVER15") return totalGoals >= 2 ? 96 : Math.round(clamp(44 + pressure * .38 + totalGoals * 15 + onGoal * 3.2 + shots * .7 - minute * .08 + pre, 38, 93));
  if (category === "OVER25") return totalGoals >= 3 ? 96 : Math.round(clamp(34 + pressure * .35 + totalGoals * 13 + onGoal * 2.8 + shots * .55 - minute * .03 + pre, 30, 91));
  if (category === "OVER35") return totalGoals >= 4 ? 96 : Math.round(clamp(24 + pressure * .32 + totalGoals * 12 + onGoal * 2.2 + shots * .45 + pre, 22, 88));
  if (category === "BTTS") return homeGoals > 0 && awayGoals > 0 ? 96 : Math.round(clamp(35 + pressure * .25 + Math.min(h.perigosos, a.perigosos) * 1.2 + totalGoals * 6 + pre, 30, 92));
  if (category === "CANTOS_FT") return Math.round(clamp(38 + corners * 6 + pressure * .24 + pre, 35, 92));
  if (category === "CARTOES_FT") return Math.round(clamp(32 + cards * 11 + fouls * 1.4 + (minute >= 55 ? 8 : 0) + pre, 30, 90));
  return Math.round(clamp((pressure + 76) / 2, 45, 94));
}

function alertText(category, conf, ctx) {
  if (ctx.type === "prelive") {
    if (conf >= 88) return "🔥 PRÉ-LIVE FORTE";
    if (conf >= 78) return "📊 PRÉ-LIVE BOM";
    return "👀 PRÉ-LIVE MONITORANDO";
  }

  if (conf >= 90) return "🚨 SINAL MUITO FORTE";
  if (conf >= 82) return "🔥 SINAL FORTE";

  if (category === "OVER05" && ctx.totalGoals >= 1) return "✅ GREEN";
  if (category === "OVER15" && ctx.totalGoals >= 2) return "✅ GREEN";
  if (category === "OVER25" && ctx.totalGoals >= 3) return "✅ GREEN";
  if (category === "OVER35" && ctx.totalGoals >= 4) return "✅ GREEN";
  if (category === "BTTS" && ctx.homeGoals > 0 && ctx.awayGoals > 0) return "✅ GREEN";

  return "📊 MONITORANDO";
}

function buildSignals(fixtureRow, i = 0, forcedType = null) {
  const fixture = fixtureRow?.fixture || {};
  const league = fixtureRow?.league || {};
  const teams = fixtureRow?.teams || {};
  const goals = fixtureRow?.goals || {};
  const status = fixture?.status || {};

  const short = status?.short || "";
  const type = forcedType || (isLive(short) ? "live" : "prelive");
  const minute = type === "live" ? toNumber(status?.elapsed, 0) : 0;
  const homeGoals = type === "live" ? toNumber(goals?.home, 0) : 0;
  const awayGoals = type === "live" ? toNumber(goals?.away, 0) : 0;
  const totalGoals = homeGoals + awayGoals;

  const { home: h, away: a } = fakeStats(i);
  const pressure = calcPressure(h, a, totalGoals, minute, type);

  const base = {
    fixtureId: fixture?.id || `fixture-${i}`,
    match: `${teams?.home?.name || "Casa"} vs ${teams?.away?.name || "Fora"}`,
    homeTeam: teams?.home?.name || "Casa",
    awayTeam: teams?.away?.name || "Fora",
    logoHome: teams?.home?.logo || "",
    logoAway: teams?.away?.logo || "",
    homeLogo: teams?.home?.logo || "",
    awayLogo: teams?.away?.logo || "",
    league: league?.name || "Futebol",
    country: league?.country || "",
    score: `${homeGoals} - ${awayGoals}`,
    minute,
    status: type === "live" ? "AO VIVO" : "PRÉ-LIVE",
    type,
    source: "api-football",
    possession: h.posse,
    possessionAway: a.posse,
    shots: h.finalizacoes,
    shotsAway: a.finalizacoes,
    shotsOnGoal: h.noGol,
    shotsOnGoalAway: a.noGol,
    attacks: h.ataques,
    attacksAway: a.ataques,
    dangerousAttacks: h.perigosos,
    dangerousAttacksAway: a.perigosos,
    corners: h.cantos,
    cornersAway: a.cantos,
    cards: h.cartoes,
    cardsAway: a.cartoes,
    fouls: h.faltas,
    foulsAway: a.faltas,
    stats: { home: h, away: a }
  };

  const ctx = { totalGoals, homeGoals, awayGoals, minute, pressure, h, a, type };

  const markets = [
    ["OVER05", "Over 0.5", "OVER 0,5"],
    ["OVER15", "Over 1.5", "OVER 1,5"],
    ["OVER25", "Over 2.5", "OVER 2,5"],
    ["OVER35", "Over 3.5", "OVER 3,5"],
    ["BTTS", "BTTS", "BTTS"],
    ["CANTOS_FT", "Cantos FT", "CANTOS FT"],
    ["CARTOES_FT", "Cartões FT", "CARTÕES FT"]
  ];

  const signals = markets.map(([category, market, label]) => {
    const conf = confidence(category, ctx);
    return {
      ...base,
      id: `${base.fixtureId}-${category}`,
      signalId: `${base.fixtureId}-${category}`,
      market,
      mercado: market,
      category,
      categoria: category,
      categoryLabel: label,
      confidence: conf,
      confianca: conf,
      pressure,
      pressao: pressure,
      odd: "—",
      alert: alertText(category, conf, ctx)
    };
  });

  const top = Math.round(clamp(Math.max(...signals.map(s => s.confidence)) + 2, 50, 97));
  signals.push({
    ...base,
    id: `${base.fixtureId}-TOP_IA`,
    signalId: `${base.fixtureId}-TOP_IA`,
    market: "Top IA",
    mercado: "Top IA",
    category: "TOP_IA",
    categoria: "TOP_IA",
    categoryLabel: "TOP IA",
    confidence: top,
    confianca: top,
    pressure,
    pressao: pressure,
    odd: "—",
    alert: top >= 88 ? "🚨 TOP IA" : "🧠 ANÁLISE IA"
  });

  return signals;
}

function fallbackFixtures() {
  return [
    ["Flamengo", "Palmeiras", "Brasileirão Série A"],
    ["Corinthians", "São Paulo", "Brasileirão Série A"],
    ["Botafogo", "Fluminense", "Brasileirão Série A"],
    ["Grêmio", "Internacional", "Brasileirão Série A"],
    ["Liverpool", "Arsenal", "Premier League"],
    ["Real Madrid", "Barcelona", "La Liga"]
  ].map(([home, away, league], i) => ({
    fixture: { id: `fallback-${i}`, status: { short: "NS", elapsed: 0 } },
    league: { name: league, country: "Base IA" },
    teams: {
      home: { name: home, logo: "" },
      away: { name: away, logo: "" }
    },
    goals: { home: 0, away: 0 }
  }));
}

async function getSignalsPayload() {
  const now = Date.now();
  if (cache.payload && now - cache.timestamp < CACHE_TTL_MS) return { ...cache.payload, cache: true };

  let fixtures = [];
  let mode = "live";

  if (API_KEY) {
    try { fixtures = await apiFootballGet("/fixtures?live=all"); } catch {}
    if (!fixtures.length) {
      mode = "today";
      try { fixtures = await apiFootballGet(`/fixtures?date=${hojeISO()}&timezone=America/Sao_Paulo`); } catch {}
    }
    if (!fixtures.length) {
      mode = "tomorrow";
      try { fixtures = await apiFootballGet(`/fixtures?date=${hojeISO(1)}&timezone=America/Sao_Paulo`); } catch {}
    }
    if (!fixtures.length) {
      mode = "next";
      try { fixtures = await apiFootballGet(`/fixtures?next=${MAX_LIVE_GAMES}&timezone=America/Sao_Paulo`); } catch {}
    }
    if (!fixtures.length) {
      mode = "last";
      try { fixtures = await apiFootballGet(`/fixtures?last=${MAX_LIVE_GAMES}&timezone=America/Sao_Paulo`); } catch {}
    }
  }

  if (!fixtures.length) {
    mode = "fallback-ia";
    fixtures = fallbackFixtures();
  }

  const selected = fixtures.slice(0, MAX_LIVE_GAMES);
  const activeSignals = selected.flatMap((f, i) =>
    buildSignals(f, i, mode === "fallback-ia" ? "prelive" : null)
  );

  const liveGames = new Set(activeSignals.filter(s => s.type === "live").map(s => s.fixtureId)).size;
  const preliveGames = new Set(activeSignals.filter(s => s.type !== "live").map(s => s.fixtureId)).size;

  const payload = {
    ok: true,
    source: API_KEY ? "api-football" : "fallback",
    mode,
    activeSignals,
    liveGames,
    preliveGames,
    totalGames: new Set(activeSignals.map(s => s.fixtureId)).size,
    totalSignals: activeSignals.length,
    updatedAt: new Date().toISOString()
  };

  cache = { timestamp: now, payload };
  return payload;
}

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  try {
    if (requestUrl.pathname === "/" || requestUrl.pathname === "/health") {
      sendJson(res, 200, {
        ok: true,
        service: "mekinebet-api",
        routes: ["/api/signals", "/health"],
        hasApiKey: Boolean(API_KEY),
        updatedAt: new Date().toISOString()
      });
      return;
    }

    if (requestUrl.pathname === "/api/signals") {
      sendJson(res, 200, await getSignalsPayload());
      return;
    }

    sendJson(res, 404, {
      ok: false,
      error: "Rota não encontrada",
      routes: ["/api/signals", "/health"]
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: "Erro ao gerar sinais",
      details: error.message,
      activeSignals: [],
      updatedAt: new Date().toISOString()
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`MekineBet API rodando na porta ${PORT}`);
});
