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
const MAX_GAMES = Number(process.env.MAX_LIVE_GAMES || 9);
const DEBUG_API = String(process.env.DEBUG_API || "false").toLowerCase() === "true";

let cache = { timestamp: 0, payload: null };

const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v || 0)));

const toNumber = (v, fallback = 0) => {
  if (v === null || v === undefined || v === "") return fallback;

  const n = Number(
    String(v)
      .replace("%", "")
      .replace(",", ".")
      .replace(/[^0-9.-]/g, "")
  );

  return Number.isFinite(n) ? n : fallback;
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

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function isLive(short = "") {
  return ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(
    String(short).toUpperCase()
  );
}

function hasApiErrors(errors) {
  if (!errors) return false;
  if (Array.isArray(errors)) return errors.length > 0;
  if (typeof errors === "object") return Object.keys(errors).length > 0;
  return Boolean(errors);
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

    if (DEBUG_API) {
      console.log("API-FOOTBALL DEBUG:", {
        path,
        status: response.status,
        errors: data?.errors,
        results: data?.results,
        responseLength: Array.isArray(data?.response) ? data.response.length : 0
      });
    }

    if (!response.ok) {
      throw new Error(`API status ${response.status}: ${JSON.stringify(data?.errors || data)}`);
    }

    if (hasApiErrors(data?.errors)) {
      throw new Error(`API errors: ${JSON.stringify(data.errors)}`);
    }

    return Array.isArray(data?.response) ? data.response : [];
  } finally {
    clearTimeout(timeout);
  }
}

function fakeStats(i = 0, type = "prelive") {
  const home = {
    posse: 52 + (i % 8),
    finalizacoes: type === "live" ? 10 + i : 7 + (i % 4),
    noGol: type === "live" ? 3 + (i % 3) : 2 + (i % 2),
    ataques: type === "live" ? 36 + i * 3 : 24 + i * 2,
    perigosos: type === "live" ? 20 + i * 2 : 12 + i,
    cantos: type === "live" ? 3 + (i % 4) : 2 + (i % 2),
    cartoes: 1,
    vermelhos: 0,
    faltas: 8 + i
  };

  const away = {
    posse: 100 - home.posse,
    finalizacoes: type === "live" ? 7 + (i % 5) : 5 + (i % 3),
    noGol: type === "live" ? 2 + (i % 2) : 1 + (i % 2),
    ataques: type === "live" ? 28 + i * 2 : 20 + i,
    perigosos: type === "live" ? 15 + i : 9 + i,
    cantos: type === "live" ? 2 + (i % 3) : 1 + (i % 2),
    cartoes: 1,
    vermelhos: 0,
    faltas: 7 + i
  };

  return {
    home,
    away,
    source: "estimated",
    hasRealStats: false
  };
}

function normalizeName(v = "") {
  return String(v)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function pickStat(row, names, fallback = 0) {
  const wanted = names.map(normalizeName);
  const stats = Array.isArray(row?.statistics) ? row.statistics : [];

  const exact = stats.find((s) => wanted.includes(normalizeName(s?.type || "")));
  if (exact) return toNumber(exact.value, fallback);

  const partial = stats.find((s) =>
    wanted.some((w) => normalizeName(s?.type || "").includes(w))
  );

  if (partial) return toNumber(partial.value, fallback);

  return fallback;
}

function totalShots(row) {
  const total = pickStat(row, ["Total Shots"], null);

  if (Number.isFinite(total)) return total;

  return (
    pickStat(row, ["Shots on Goal"], 0) +
    pickStat(row, ["Shots off Goal"], 0) +
    pickStat(row, ["Blocked Shots"], 0)
  );
}

function derivedAttacks({ shots, corners, possession, fouls }) {
  return Math.round(
    clamp(
      shots * 3.2 +
        corners * 4.5 +
        possession * 0.55 +
        fouls * 0.25,
      0,
      180
    )
  );
}

function derivedDangerous({ onGoal, insideBox, corners, blockedShots, shots }) {
  return Math.round(
    clamp(
      onGoal * 6 +
        insideBox * 2.6 +
        corners * 4 +
        blockedShots * 1.4 +
        shots * 0.35,
      0,
      130
    )
  );
}

function buildRealStats(fixtureRow, statsRows = []) {
  if (!Array.isArray(statsRows) || statsRows.length < 2) return null;

  const homeId = fixtureRow?.teams?.home?.id;
  const awayId = fixtureRow?.teams?.away?.id;

  const homeRow = statsRows.find((r) => r?.team?.id === homeId) || statsRows[0];
  const awayRow = statsRows.find((r) => r?.team?.id === awayId) || statsRows[1];

  if (!homeRow || !awayRow) return null;

  const homePossession = pickStat(homeRow, ["Ball Possession"], 50);
  const awayPossession = pickStat(awayRow, ["Ball Possession"], 100 - homePossession);

  const homeShots = totalShots(homeRow);
  const awayShots = totalShots(awayRow);

  const homeOnGoal = pickStat(homeRow, ["Shots on Goal"], 0);
  const awayOnGoal = pickStat(awayRow, ["Shots on Goal"], 0);

  const homeInside = pickStat(homeRow, ["Shots insidebox", "Shots inside box"], 0);
  const awayInside = pickStat(awayRow, ["Shots insidebox", "Shots inside box"], 0);

  const homeBlocked = pickStat(homeRow, ["Blocked Shots"], 0);
  const awayBlocked = pickStat(awayRow, ["Blocked Shots"], 0);

  const homeCorners = pickStat(homeRow, ["Corner Kicks"], 0);
  const awayCorners = pickStat(awayRow, ["Corner Kicks"], 0);

  const homeYellow = pickStat(homeRow, ["Yellow Cards"], 0);
  const awayYellow = pickStat(awayRow, ["Yellow Cards"], 0);

  const homeRed = pickStat(homeRow, ["Red Cards"], 0);
  const awayRed = pickStat(awayRow, ["Red Cards"], 0);

  const homeFouls = pickStat(homeRow, ["Fouls"], 0);
  const awayFouls = pickStat(awayRow, ["Fouls"], 0);

  const home = {
    posse: homePossession,
    finalizacoes: homeShots,
    noGol: homeOnGoal,
    ataques: derivedAttacks({
      shots: homeShots,
      corners: homeCorners,
      possession: homePossession,
      fouls: homeFouls
    }),
    perigosos: derivedDangerous({
      onGoal: homeOnGoal,
      insideBox: homeInside,
      corners: homeCorners,
      blockedShots: homeBlocked,
      shots: homeShots
    }),
    cantos: homeCorners,
    cartoes: homeYellow + homeRed,
    amarelos: homeYellow,
    vermelhos: homeRed,
    faltas: homeFouls
  };

  const away = {
    posse: awayPossession,
    finalizacoes: awayShots,
    noGol: awayOnGoal,
    ataques: derivedAttacks({
      shots: awayShots,
      corners: awayCorners,
      possession: awayPossession,
      fouls: awayFouls
    }),
    perigosos: derivedDangerous({
      onGoal: awayOnGoal,
      insideBox: awayInside,
      corners: awayCorners,
      blockedShots: awayBlocked,
      shots: awayShots
    }),
    cantos: awayCorners,
    cartoes: awayYellow + awayRed,
    amarelos: awayYellow,
    vermelhos: awayRed,
    faltas: awayFouls
  };

  return {
    home,
    away,
    source: "real",
    hasRealStats: true
  };
}

function calcPressure(home, away, goals, minute, type) {
  let pressure =
    30 +
    (home.finalizacoes + away.finalizacoes) * 0.9 +
    (home.noGol + away.noGol) * 3 +
    (home.perigosos + away.perigosos) * 0.5 +
    (home.cantos + away.cantos) * 1.8 +
    goals * 5;

  if (type === "live") {
    if (minute >= 60) pressure += 5;
    if (minute <= 15) pressure -= 8;
  } else {
    pressure += 6;
  }

  return Math.round(clamp(pressure, 35, 92));
}

function confidence(category, ctx) {
  const { totalGoals, homeGoals, awayGoals, minute, pressure, home, away, type } = ctx;

  const shots = home.finalizacoes + away.finalizacoes;
  const onGoal = home.noGol + away.noGol;
  const corners = home.cantos + away.cantos;
  const cards = home.cartoes + away.cartoes;
  const fouls = home.faltas + away.faltas;
  const pre = type === "prelive" ? 3 : 0;

  if (category === "OVER05") {
    if (totalGoals >= 1) return 96;
    return Math.round(clamp(34 + pressure * 0.28 + onGoal * 3 + shots * 0.45 + pre, 35, 86));
  }

  if (category === "OVER15") {
    if (totalGoals >= 2) return 96;
    return Math.round(clamp(28 + pressure * 0.26 + totalGoals * 10 + onGoal * 2.4 + shots * 0.35 + pre, 30, 84));
  }

  if (category === "OVER25") {
    if (totalGoals >= 3) return 96;
    return Math.round(clamp(22 + pressure * 0.24 + totalGoals * 9 + onGoal * 2 + shots * 0.28 + pre, 25, 80));
  }

  if (category === "OVER35") {
    if (totalGoals >= 4) return 96;
    return Math.round(clamp(16 + pressure * 0.2 + totalGoals * 8 + onGoal * 1.6 + pre, 18, 72));
  }

  if (category === "BTTS") {
    if (homeGoals > 0 && awayGoals > 0) return 96;
    return Math.round(clamp(28 + Math.min(home.perigosos, away.perigosos) * 1.1 + onGoal * 2 + pre, 28, 82));
  }

  if (category === "CANTOS_FT") {
    return Math.round(clamp(32 + corners * 5 + pressure * 0.18 + pre, 35, 86));
  }

  if (category === "CARTOES_FT") {
    return Math.round(clamp(28 + cards * 10 + fouls * 1.1 + (minute >= 55 ? 6 : 0), 30, 82));
  }

  return Math.round(clamp((pressure + 60) / 2, 45, 88));
}

function alertText(category, conf, ctx) {
  if (ctx.type === "prelive") {
    if (conf >= 82) return "🔥 PRÉ-LIVE FORTE";
    if (conf >= 70) return "📊 PRÉ-LIVE BOM";
    return "👀 PRÉ-LIVE MONITORANDO";
  }

  if (category === "OVER05" && ctx.totalGoals >= 1) return "✅ GREEN";
  if (category === "OVER15" && ctx.totalGoals >= 2) return "✅ GREEN";
  if (category === "OVER25" && ctx.totalGoals >= 3) return "✅ GREEN";
  if (category === "OVER35" && ctx.totalGoals >= 4) return "✅ GREEN";
  if (category === "BTTS" && ctx.homeGoals > 0 && ctx.awayGoals > 0) return "✅ GREEN";

  if (conf >= 88) return "🚨 SINAL MUITO FORTE";
  if (conf >= 78) return "🔥 SINAL FORTE";

  return "📊 MONITORANDO";
}

function buildSignals(fixtureRow, index = 0, forcedType = null, realStatsPack = null) {
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

  const statsPack = realStatsPack || fakeStats(index, type);
  const { home, away } = statsPack;

  const pressure = calcPressure(home, away, totalGoals, minute, type);
  const fixtureId = fixture?.id || `fixture-${index}`;

  const base = {
    fixtureId,
    gameId: fixtureId,
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
    source: fixtureId && String(fixtureId).startsWith("fallback") ? "fallback" : "api-football",
    statsMode: statsPack.hasRealStats ? "real" : "estimated",
    realStats: Boolean(statsPack.hasRealStats),

    possession: home.posse,
    possessionAway: away.posse,
    shots: home.finalizacoes,
    shotsAway: away.finalizacoes,
    shotsOnGoal: home.noGol,
    shotsOnGoalAway: away.noGol,
    attacks: home.ataques,
    attacksAway: away.ataques,
    dangerousAttacks: home.perigosos,
    dangerousAttacksAway: away.perigosos,
    corners: home.cantos,
    cornersAway: away.cantos,
    cards: home.cartoes,
    cardsAway: away.cartoes,
    yellowCards: home.amarelos ?? home.cartoes,
    yellowCardsAway: away.amarelos ?? away.cartoes,
    redCards: home.vermelhos ?? 0,
    redCardsAway: away.vermelhos ?? 0,
    fouls: home.faltas,
    foulsAway: away.faltas,
    stats: { home, away }
  };

  const ctx = {
    totalGoals,
    homeGoals,
    awayGoals,
    minute,
    pressure,
    home,
    away,
    type
  };

  const markets = [
    ["OVER05", "Over 0.5", "OVER 0,5"],
    ["OVER15", "Over 1.5", "OVER 1,5"],
    ["OVER25", "Over 2.5", "OVER 2,5"],
    ["OVER35", "Over 3.5", "OVER 3,5"],
    ["BTTS", "BTTS", "BTTS"],
    ["CANTOS_FT", "Cantos FT", "CANTOS"],
    ["CARTOES_FT", "Cartões FT", "CARTÕES"]
  ];

  let signals = markets.map(([category, market, label]) => {
    const conf = confidence(category, ctx);

    return {
      ...base,
      id: `${fixtureId}-${category}`,
      signalId: `${fixtureId}-${category}`,
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

  const topConfidence = Math.round(
    clamp(Math.max(...signals.map((s) => s.confidence)) + 2, 50, 92)
  );

  signals.push({
    ...base,
    id: `${fixtureId}-TOP_IA`,
    signalId: `${fixtureId}-TOP_IA`,
    market: "Top IA",
    mercado: "Top IA",
    category: "TOP_IA",
    categoria: "TOP_IA",
    categoryLabel: "TOP IA",
    confidence: topConfidence,
    confianca: topConfidence,
    pressure,
    pressao: pressure,
    odd: "—",
    alert: topConfidence >= 85 ? "🚨 TOP IA" : "🧠 ANÁLISE IA"
  });

  signals = signals
    .filter((s) => s.confidence >= 55)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4);

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

async function getFixtures() {
  let fixtures = [];
  let mode = "live";

  if (API_KEY) {
    try {
      fixtures = await apiFootballGet("/fixtures?live=all");
    } catch (e) {
      console.log("Erro live:", e.message);
    }

    if (!fixtures.length) {
      mode = "today";
      try {
        fixtures = await apiFootballGet(
          `/fixtures?date=${todayISO()}&timezone=America/Sao_Paulo`
        );
      } catch (e) {
        console.log("Erro today:", e.message);
      }
    }

    if (!fixtures.length) {
      mode = "tomorrow";
      try {
        fixtures = await apiFootballGet(
          `/fixtures?date=${todayISO(1)}&timezone=America/Sao_Paulo`
        );
      } catch (e) {
        console.log("Erro tomorrow:", e.message);
      }
    }

    if (!fixtures.length) {
      mode = "next";
      try {
        fixtures = await apiFootballGet(
          `/fixtures?next=${MAX_GAMES}&timezone=America/Sao_Paulo`
        );
      } catch (e) {
        console.log("Erro next:", e.message);
      }
    }
  }

  if (!fixtures.length) {
    mode = "fallback-ia";
    fixtures = fallbackFixtures();
  }

  return { fixtures, mode };
}

async function getStatsForFixture(fixture, mode) {
  const fixtureId = fixture?.fixture?.id;

  if (!fixtureId || mode === "fallback-ia") {
    return null;
  }

  try {
    const statsRows = await apiFootballGet(`/fixtures/statistics?fixture=${fixtureId}`);
    return buildRealStats(fixture, statsRows);
  } catch (e) {
    console.log("Erro stats fixture:", fixtureId, e.message);
    return null;
  }
}

async function getSignalsPayload() {
  const now = Date.now();

  if (cache.payload && now - cache.timestamp < CACHE_TTL_MS) {
    return { ...cache.payload, cache: true };
  }

  const { fixtures, mode } = await getFixtures();
  const selected = fixtures.slice(0, MAX_GAMES);

  const selectedWithStats = await Promise.all(
    selected.map(async (fixture) => {
      const realStatsPack = await getStatsForFixture(fixture, mode);
      return { fixture, realStatsPack };
    })
  );

  const activeSignals = selectedWithStats.flatMap(({ fixture, realStatsPack }, index) =>
    buildSignals(
      fixture,
      index,
      mode === "fallback-ia" ? "prelive" : null,
      realStatsPack
    )
  );

  const liveGames = new Set(
    activeSignals.filter((s) => s.type === "live").map((s) => s.fixtureId)
  ).size;

  const preliveGames = new Set(
    activeSignals.filter((s) => s.type !== "live").map((s) => s.fixtureId)
  ).size;

  const totalGames = new Set(activeSignals.map((s) => s.fixtureId)).size;

  const realStatsGames = new Set(
    activeSignals.filter((s) => s.realStats).map((s) => s.fixtureId)
  ).size;

  const estimatedStatsGames = Math.max(0, totalGames - realStatsGames);

  const payload = {
    ok: true,
    source: mode === "fallback-ia" ? "fallback" : "api-football",
    mode,
    statsMode: realStatsGames > 0 ? "real" : "estimated",
    realStatsGames,
    estimatedStatsGames,
    activeSignals,
    liveGames,
    preliveGames,
    totalGames,
    totalSignals: activeSignals.length,
    message:
      mode === "fallback-ia"
        ? "Sem dados reais disponíveis agora. Exibindo base IA."
        : realStatsGames > 0
          ? "Dados reais carregados da API-Football."
          : "Jogos reais carregados, mas estatísticas detalhadas ainda não disponíveis para estes fixtures.",
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
        cacheTtlMs: CACHE_TTL_MS,
        maxGames: MAX_GAMES,
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
