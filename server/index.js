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

let cache = {
  timestamp: 0,
  payload: null
};

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const clean = String(value)
    .replace("%", "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");

  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeScore(homeGoals, awayGoals) {
  return `${toNumber(homeGoals, 0)} - ${toNumber(awayGoals, 0)}`;
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function sendJson(res, statusCode, payload) {
  setCors(res);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(payload));
}

async function apiFootballGet(path) {
  if (!API_KEY) {
    throw new Error("API_FOOTBALL_KEY ausente no Render Environment");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      headers: {
        "x-apisports-key": API_KEY,
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "v3.football.api-sports.io"
      },
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg = data?.message || data?.errors || `HTTP ${response.status}`;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }

    return Array.isArray(data?.response) ? data.response : [];
  } finally {
    clearTimeout(timeout);
  }
}

function findStat(statList = [], possibleNames = []) {
  const map = new Map(
    statList.map((entry) => [normalizeText(entry?.type), entry?.value])
  );

  for (const name of possibleNames) {
    const value = map.get(normalizeText(name));
    if (value !== undefined && value !== null && value !== "") return value;
  }

  return 0;
}

function extractSideStats(rawTeamStats = {}, goals = 0, minute = 0) {
  const statList = Array.isArray(rawTeamStats?.statistics)
    ? rawTeamStats.statistics
    : [];

  const shotsOnGoal = toNumber(
    findStat(statList, ["Shots on Goal", "Chutes no Gol"]),
    goals
  );

  const totalShots = toNumber(
    findStat(statList, ["Total Shots", "Total de Chutes", "Finalizações"]),
    Math.max(shotsOnGoal, goals * 2)
  );

  const corners = toNumber(
    findStat(statList, ["Corner Kicks", "Escanteios", "Cantos"]),
    0
  );

  const yellowCards = toNumber(
    findStat(statList, ["Yellow Cards", "Cartões Amarelos"]),
    0
  );

  const redCards = toNumber(
    findStat(statList, ["Red Cards", "Cartões Vermelhos"]),
    0
  );

  const possession = toNumber(
    findStat(statList, ["Ball Possession", "Posse de Bola"]),
    50
  );

  const attacks = toNumber(
    findStat(statList, ["Attacks", "Ataques"]),
    Math.max(10, Math.round(minute * 0.55 + totalShots * 2))
  );

  const dangerousAttacks = toNumber(
    findStat(statList, ["Dangerous Attacks", "Ataques Perigosos"]),
    Math.max(4, Math.round(totalShots * 1.8 + corners * 2))
  );

  const fouls = toNumber(
    findStat(statList, ["Fouls", "Faltas"]),
    yellowCards * 4 + redCards * 6
  );

  return {
    posse: clamp(Math.round(possession), 0, 100),
    finalizacoes: Math.max(0, Math.round(totalShots)),
    noGol: Math.max(0, Math.round(shotsOnGoal)),
    ataques: Math.max(0, Math.round(attacks)),
    perigosos: Math.max(0, Math.round(dangerousAttacks)),
    cantos: Math.max(0, Math.round(corners)),
    cartoes: Math.max(0, Math.round(yellowCards + redCards)),
    amarelos: Math.max(0, Math.round(yellowCards)),
    vermelhos: Math.max(0, Math.round(redCards)),
    faltas: Math.max(0, Math.round(fouls))
  };
}

function isLiveStatus(statusShort = "") {
  return ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(
    String(statusShort || "").toUpperCase()
  );
}

function gameTypeFromStatus(statusShort = "") {
  return isLiveStatus(statusShort) ? "live" : "prelive";
}

function statusName(statusShort = "", statusLong = "") {
  if (isLiveStatus(statusShort)) return "AO VIVO";
  if (String(statusShort).toUpperCase() === "NS") return "PRÉ-LIVE";
  if (String(statusShort).toUpperCase() === "FT") return "ENCERRADO";
  return statusLong || "MONITORAMENTO IA";
}

function calculatePressure(homeStats, awayStats, totalGoals, minute, type) {
  const totalShots = homeStats.finalizacoes + awayStats.finalizacoes;
  const shotsOnGoal = homeStats.noGol + awayStats.noGol;
  const dangerous = homeStats.perigosos + awayStats.perigosos;
  const corners = homeStats.cantos + awayStats.cantos;
  const cards = homeStats.cartoes + awayStats.cartoes;

  let raw =
    38 +
    totalShots * 1.25 +
    shotsOnGoal * 3 +
    dangerous * 0.55 +
    corners * 2.2 +
    totalGoals * 4 +
    cards * 0.8;

  if (type === "live") {
    raw += minute >= 65 ? 4 : 0;
    raw += minute <= 12 ? -8 : 0;
  } else {
    raw += 18;
  }

  return Math.round(clamp(raw, 40, 97));
}

function confidenceForMarket(category, ctx) {
  const {
    totalGoals,
    homeGoals,
    awayGoals,
    minute,
    pressure,
    homeStats,
    awayStats,
    totalCorners,
    totalCards,
    totalFouls,
    type
  } = ctx;

  const totalShots = homeStats.finalizacoes + awayStats.finalizacoes;
  const shotsOnGoal = homeStats.noGol + awayStats.noGol;

  const bothTeamsPressure =
    Math.min(homeStats.perigosos, awayStats.perigosos) +
    Math.min(homeStats.noGol, awayStats.noGol) * 4 +
    Math.min(homeStats.finalizacoes, awayStats.finalizacoes) * 1.5;

  const preBoost = type === "prelive" ? 8 : 0;

  if (category === "OVER05") {
    if (totalGoals >= 1) return 96;
    return Math.round(
      clamp(
        52 + pressure * 0.35 + shotsOnGoal * 4 + totalShots * 0.9 - minute * 0.12 + preBoost,
        45,
        94
      )
    );
  }

  if (category === "OVER15") {
    if (totalGoals >= 2) return 96;
    return Math.round(
      clamp(
        44 + pressure * 0.38 + totalGoals * 15 + shotsOnGoal * 3.2 + totalShots * 0.7 - minute * 0.08 + preBoost,
        38,
        93
      )
    );
  }

  if (category === "OVER25") {
    if (totalGoals >= 3) return 96;
    return Math.round(
      clamp(
        34 + pressure * 0.35 + totalGoals * 13 + shotsOnGoal * 2.8 + totalShots * 0.55 - minute * 0.03 + preBoost,
        30,
        91
      )
    );
  }

  if (category === "OVER35") {
    if (totalGoals >= 4) return 96;
    return Math.round(
      clamp(
        24 + pressure * 0.32 + totalGoals * 12 + shotsOnGoal * 2.2 + totalShots * 0.45 + (minute >= 55 ? 3 : 0) + preBoost,
        22,
        88
      )
    );
  }

  if (category === "BTTS") {
    if (homeGoals > 0 && awayGoals > 0) return 96;
    return Math.round(
      clamp(
        35 + pressure * 0.25 + bothTeamsPressure * 1.2 + (homeGoals + awayGoals) * 6 + preBoost,
        30,
        92
      )
    );
  }

  if (category === "CANTOS_FT") {
    return Math.round(
      clamp(
        38 + totalCorners * 6 + pressure * 0.24 + (homeStats.ataques + awayStats.ataques) * 0.05 + preBoost,
        35,
        92
      )
    );
  }

  if (category === "CARTOES_FT") {
    return Math.round(
      clamp(
        32 + totalCards * 11 + totalFouls * 1.4 + (minute >= 55 ? 8 : 0) + preBoost,
        30,
        90
      )
    );
  }

  return Math.round(clamp((pressure + 76) / 2, 45, 94));
}

function statusForSignal(category, confidence, ctx) {
  const { totalGoals, homeGoals, awayGoals, pressure, type } = ctx;

  if (type === "prelive") {
    if (confidence >= 88) return "🔥 PRÉ-LIVE FORTE";
    if (confidence >= 78) return "📊 PRÉ-LIVE BOM";
    return "👀 PRÉ-LIVE MONITORANDO";
  }

  if (confidence >= 90) return "🚨 SINAL MUITO FORTE";
  if (confidence >= 82) return "🔥 SINAL FORTE";

  if (category === "OVER05" && totalGoals >= 1) return "✅ GREEN";
  if (category === "OVER15" && totalGoals >= 2) return "✅ GREEN";
  if (category === "OVER25" && totalGoals >= 3) return "✅ GREEN";
  if (category === "OVER35" && totalGoals >= 4) return "✅ GREEN";
  if (category === "BTTS" && homeGoals > 0 && awayGoals > 0) return "✅ GREEN";
  if (pressure >= 76) return "📊 PRESSÃO ALTA";

  return "📊 MONITORANDO";
}

function fakePreliveStats(homeGoals, awayGoals, index = 0) {
  const baseHome = 52 + (index % 5);
  const baseAway = 100 - baseHome;

  return {
    homeStats: {
      posse: baseHome,
      finalizacoes: 10 + (index % 5),
      noGol: 4 + (index % 3),
      ataques: 38 + (index % 9),
      perigosos: 22 + (index % 7),
      cantos: 4 + (index % 3),
      cartoes: 1,
      amarelos: 1,
      vermelhos: 0,
      faltas: 9 + (index % 6)
    },
    awayStats: {
      posse: baseAway,
      finalizacoes: 7 + (index % 4),
      noGol: 3 + (index % 2),
      ataques: 30 + (index % 8),
      perigosos: 17 + (index % 5),
      cantos: 3 + (index % 2),
      cartoes: 1,
      amarelos: 1,
      vermelhos: 0,
      faltas: 8 + (index % 5)
    }
  };
}

function buildSignalsForFixture(fixtureRow, statisticsRows = [], index = 0) {
  const fixture = fixtureRow?.fixture || {};
  const league = fixtureRow?.league || {};
  const teams = fixtureRow?.teams || {};
  const goals = fixtureRow?.goals || {};
  const status = fixture?.status || {};

  const fixtureId =
    fixture?.id || `${teams?.home?.name}-${teams?.away?.name}-${fixture?.date}`;

  const statusShort = status?.short || "";
  const type = gameTypeFromStatus(statusShort);

  const minute = type === "live" ? toNumber(status?.elapsed, 0) : 0;
  const homeGoals = type === "live" ? toNumber(goals?.home, 0) : 0;
  const awayGoals = type === "live" ? toNumber(goals?.away, 0) : 0;
  const totalGoals = homeGoals + awayGoals;

  const homeRawStats =
    statisticsRows.find((row) => Number(row?.team?.id) === Number(teams?.home?.id)) ||
    statisticsRows[0] ||
    {};

  const awayRawStats =
    statisticsRows.find((row) => Number(row?.team?.id) === Number(teams?.away?.id)) ||
    statisticsRows[1] ||
    {};

  let homeStats = extractSideStats(homeRawStats, homeGoals, minute);
  let awayStats = extractSideStats(awayRawStats, awayGoals, minute);

  if (!homeRawStats?.statistics || !awayRawStats?.statistics) {
    const generated = fakePreliveStats(homeGoals, awayGoals, index);
    homeStats = generated.homeStats;
    awayStats = generated.awayStats;
  }

  const totalCorners = homeStats.cantos + awayStats.cantos;
  const totalCards = homeStats.cartoes + awayStats.cartoes;
  const totalFouls = homeStats.faltas + awayStats.faltas;
  const pressure = calculatePressure(homeStats, awayStats, totalGoals, minute, type);

  const ctx = {
    totalGoals,
    homeGoals,
    awayGoals,
    minute,
    pressure,
    homeStats,
    awayStats,
    totalCorners,
    totalCards,
    totalFouls,
    type
  };

  const marketList = [
    { category: "OVER05", market: "Over 0.5", label: "OVER 0,5" },
    { category: "OVER15", market: "Over 1.5", label: "OVER 1,5" },
    { category: "OVER25", market: "Over 2.5", label: "OVER 2,5" },
    { category: "OVER35", market: "Over 3.5", label: "OVER 3,5" },
    { category: "BTTS", market: "BTTS", label: "BTTS" },
    { category: "CANTOS_FT", market: "Cantos FT", label: "CANTOS FT" },
    { category: "CARTOES_FT", market: "Cartões FT", label: "CARTÕES FT" }
  ];

  const base = {
    fixtureId,
    gameId: fixtureId,
    match: `${teams?.home?.name || "Casa"} vs ${teams?.away?.name || "Fora"}`,
    homeTeam: teams?.home?.name || "Casa",
    awayTeam: teams?.away?.name || "Fora",
    homeLogo: teams?.home?.logo || "",
    awayLogo: teams?.away?.logo || "",
    logoHome: teams?.home?.logo || "",
    logoAway: teams?.away?.logo || "",
    teams: {
      home: {
        id: teams?.home?.id,
        name: teams?.home?.name || "Casa",
        logo: teams?.home?.logo || ""
      },
      away: {
        id: teams?.away?.id,
        name: teams?.away?.name || "Fora",
        logo: teams?.away?.logo || ""
      }
    },
    league: league?.name || "Futebol",
    leagueId: league?.id || null,
    country: league?.country || "",
    score: safeScore(homeGoals, awayGoals),
    minute,
    status: statusName(statusShort, status?.long),
    type,
    source: "api-football",
    updatedAt: new Date().toISOString(),

    possession: homeStats.posse,
    possessionAway: awayStats.posse,
    shots: homeStats.finalizacoes,
    shotsAway: awayStats.finalizacoes,
    shotsOnGoal: homeStats.noGol,
    shotsOnGoalAway: awayStats.noGol,
    attacks: homeStats.ataques,
    attacksAway: awayStats.ataques,
    dangerousAttacks: homeStats.perigosos,
    dangerousAttacksAway: awayStats.perigosos,
    corners: homeStats.cantos,
    cornersAway: awayStats.cantos,
    cards: homeStats.cartoes,
    cardsAway: awayStats.cartoes,
    yellowCards: homeStats.amarelos,
    yellowCardsAway: awayStats.amarelos,
    redCards: homeStats.vermelhos,
    redCardsAway: awayStats.vermelhos,
    fouls: homeStats.faltas,
    foulsAway: awayStats.faltas,
    stats: { home: homeStats, away: awayStats }
  };

  const signals = marketList.map((marketItem) => {
    const confidence = confidenceForMarket(marketItem.category, ctx);

    return {
      ...base,
      id: `${fixtureId}-${marketItem.category}`,
      signalId: `${fixtureId}-${marketItem.category}`,
      market: marketItem.market,
      mercado: marketItem.market,
      category: marketItem.category,
      categoria: marketItem.category,
      categoryLabel: marketItem.label,
      confidence,
      confianca: confidence,
      pressure,
      pressao: pressure,
      odd: "—",
      alert: statusForSignal(marketItem.category, confidence, ctx)
    };
  });

  const topConfidence = Math.round(
    clamp(
      signals.reduce((max, signal) => Math.max(max, signal.confidence), 0) + 2,
      50,
      97
    )
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
    alert: topConfidence >= 88 ? "🚨 TOP IA" : "🧠 ANÁLISE IA"
  });

  return signals;
}

async function getLiveFixtures() {
  return apiFootballGet("/fixtures?live=all");
}

async function getTodayFixtures() {
  const date = hojeISO();
  return apiFootballGet(`/fixtures?date=${date}&timezone=America/Sao_Paulo`);
}

async function getNextFixtures() {
  return apiFootballGet(`/fixtures?next=${MAX_LIVE_GAMES}&timezone=America/Sao_Paulo`);
}

async function getSignalsPayload() {
  const now = Date.now();

  if (cache.payload && now - cache.timestamp < CACHE_TTL_MS) {
    return { ...cache.payload, cache: true };
  }

  if (!API_KEY) {
    const payload = {
      ok: true,
      source: "no-api-key",
      mode: "waiting-api-key",
      message: "Configure API_FOOTBALL_KEY no Environment do Render.",
      activeSignals: [],
      liveGames: 0,
      preliveGames: 0,
      totalSignals: 0,
      updatedAt: new Date().toISOString()
    };

    cache = { timestamp: now, payload };
    return payload;
  }

  let fixtures = [];
  let mode = "live";

  try {
    fixtures = await getLiveFixtures();
  } catch (error) {
    console.warn("Erro buscando lives:", error.message);
  }

  if (!fixtures.length) {
    mode = "today";
    try {
      fixtures = await getTodayFixtures();
    } catch (error) {
      console.warn("Erro buscando jogos de hoje:", error.message);
    }
  }

  if (!fixtures.length) {
    mode = "next";
    try {
      fixtures = await getNextFixtures();
    } catch (error) {
      console.warn("Erro buscando próximos jogos:", error.message);
    }
  }

  const selectedFixtures = fixtures.slice(0, MAX_LIVE_GAMES);
  const allSignals = [];

  for (let i = 0; i < selectedFixtures.length; i++) {
    const fixtureRow = selectedFixtures[i];
    const fixtureId = fixtureRow?.fixture?.id;
    let stats = [];

    if (fixtureId && isLiveStatus(fixtureRow?.fixture?.status?.short)) {
      try {
        stats = await apiFootballGet(`/fixtures/statistics?fixture=${fixtureId}`);
      } catch (error) {
        console.warn(`Sem estatísticas para fixture ${fixtureId}:`, error.message);
      }
    }

    allSignals.push(...buildSignalsForFixture(fixtureRow, stats, i));
  }

  allSignals.sort((a, b) => {
    const scoreA = Number(a.confidence || 0) + Number(a.pressure || 0);
    const scoreB = Number(b.confidence || 0) + Number(b.pressure || 0);
    return scoreB - scoreA;
  });

  const liveGames = new Set(
    allSignals.filter((s) => s.type === "live").map((s) => s.fixtureId)
  ).size;

  const preliveGames = new Set(
    allSignals.filter((s) => s.type === "prelive").map((s) => s.fixtureId)
  ).size;

  const payload = {
    ok: true,
    source: "api-football",
    mode,
    activeSignals: allSignals,
    liveGames,
    preliveGames,
    totalGames: new Set(allSignals.map((s) => s.fixtureId)).size,
    totalSignals: allSignals.length,
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
      const payload = await getSignalsPayload();
      sendJson(res, 200, payload);
      return;
    }

    sendJson(res, 404, {
      ok: false,
      error: "Rota não encontrada",
      routes: ["/api/signals", "/health"]
    });
  } catch (error) {
    console.error("Erro na API MekineBet:", error);

    sendJson(res, 500, {
      ok: false,
      error: "Erro ao gerar sinais reais",
      details: error.message,
      activeSignals: [],
      updatedAt: new Date().toISOString()
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`MekineBet API rodando na porta ${PORT}`);
});
