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

const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 25000);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 12000);
const MAX_GAMES = Number(process.env.MAX_LIVE_GAMES || 9);
const MAX_PRELIVE_24H = Number(process.env.MAX_PRELIVE_24H || 18);

let cache = { timestamp: 0, payload: null };

const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v || 0)));

const toNumber = (v, fallback = 0) => {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(String(v).replace("%", "").replace(",", ".").replace(/[^0-9.-]/g, ""));
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
  return ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(String(short).toUpperCase());
}

function isNotStarted(short = "") {
  return ["NS", "TBD"].includes(String(short).toUpperCase());
}

function fixtureTimeMs(row = {}) {
  const date = row?.fixture?.date;
  const ms = date ? new Date(date).getTime() : 0;
  return Number.isFinite(ms) ? ms : 0;
}

function isWithinNext24h(row = {}) {
  const ms = fixtureTimeMs(row);
  if (!ms) return false;
  const now = Date.now();
  return ms >= now && ms <= now + 24 * 60 * 60 * 1000;
}

function dedupeFixtures(list = []) {
  const map = new Map();
  list.filter(Boolean).forEach((row) => {
    const id = row?.fixture?.id || `${row?.teams?.home?.name}-${row?.teams?.away?.name}-${row?.fixture?.date}`;
    if (!map.has(id)) map.set(id, row);
  });
  return [...map.values()];
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

function getStat(row, names = [], fallback = 0) {
  const list = Array.isArray(row?.statistics) ? row.statistics : [];
  for (const name of names) {
    const found = list.find((s) => String(s?.type || "").toLowerCase().includes(String(name).toLowerCase()));
    if (found && found.value !== null && found.value !== undefined) return toNumber(found.value, fallback);
  }
  return fallback;
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
    amarelos: 1,
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
    amarelos: 1,
    vermelhos: 0,
    faltas: 7 + i
  };

  return { home, away, realStats: false };
}

function extractRealStats(realStats = [], teams = {}, index = 0, type = "prelive") {
  const homeTeamId = Number(teams?.home?.id);
  const awayTeamId = Number(teams?.away?.id);

  const homeRow = realStats.find((s) => Number(s?.team?.id) === homeTeamId) || realStats[0];
  const awayRow = realStats.find((s) => Number(s?.team?.id) === awayTeamId) || realStats[1];

  if (!homeRow || !awayRow) return fakeStats(index, type);

  const homeYellow = getStat(homeRow, ["Yellow Cards"], 0);
  const homeRed = getStat(homeRow, ["Red Cards"], 0);
  const awayYellow = getStat(awayRow, ["Yellow Cards"], 0);
  const awayRed = getStat(awayRow, ["Red Cards"], 0);

  const home = {
    posse: getStat(homeRow, ["Ball Possession"], 50),
    finalizacoes: getStat(homeRow, ["Total Shots"], 0),
    noGol: getStat(homeRow, ["Shots on Goal"], 0),
    ataques: getStat(homeRow, ["Attacks"], 0),
    perigosos: getStat(homeRow, ["Dangerous Attacks"], 0),
    cantos: getStat(homeRow, ["Corner Kicks"], 0),
    amarelos: homeYellow,
    vermelhos: homeRed,
    cartoes: homeYellow + homeRed,
    faltas: getStat(homeRow, ["Fouls"], 0)
  };

  const away = {
    posse: getStat(awayRow, ["Ball Possession"], 50),
    finalizacoes: getStat(awayRow, ["Total Shots"], 0),
    noGol: getStat(awayRow, ["Shots on Goal"], 0),
    ataques: getStat(awayRow, ["Attacks"], 0),
    perigosos: getStat(awayRow, ["Dangerous Attacks"], 0),
    cantos: getStat(awayRow, ["Corner Kicks"], 0),
    amarelos: awayYellow,
    vermelhos: awayRed,
    cartoes: awayYellow + awayRed,
    faltas: getStat(awayRow, ["Fouls"], 0)
  };

  const useful = home.finalizacoes || away.finalizacoes || home.ataques || away.ataques || home.perigosos || away.perigosos || home.cantos || away.cantos;
  if (!useful) return fakeStats(index, type);

  if (!home.posse && !away.posse) {
    home.posse = 50;
    away.posse = 50;
  }

  return { home, away, realStats: true };
}

function normalizeEvents(events = [], teams = {}) {
  return events.map((event) => {
    const teamId = Number(event?.team?.id);
    const homeId = Number(teams?.home?.id);
    const awayId = Number(teams?.away?.id);
    const side = teamId === homeId ? "home" : teamId === awayId ? "away" : "neutral";
    const type = event?.type || "";
    const detail = event?.detail || "";
    const text = `${type} ${detail}`.toLowerCase();

    const icon =
      text.includes("goal") ? "⚽" :
      text.includes("red") ? "🟥" :
      text.includes("card") ? "🟨" :
      text.includes("subst") ? "🔁" :
      text.includes("var") ? "📺" : "•";

    return {
      minute: toNumber(event?.time?.elapsed, 0),
      elapsed: toNumber(event?.time?.elapsed, 0),
      extra: toNumber(event?.time?.extra, 0),
      side,
      teamName: event?.team?.name || "",
      type,
      detail,
      category: type,
      icon,
      player: event?.player?.name || "",
      assist: event?.assist?.name || "",
      comments: event?.comments || ""
    };
  }).filter((ev) => ev.minute > 0);
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

function totalCornersLine(home, away, minute, type) {
  const current = Number(home.cantos || 0) + Number(away.cantos || 0);
  if (type !== "live") return 7.5;
  if (minute <= 20) return current + 3.5;
  if (minute <= 45) return current + 2.5;
  if (minute <= 70) return current + 1.5;
  return current + 0.5;
}

function totalCardsLine(home, away, minute, type) {
  const current = Number(home.cartoes || 0) + Number(away.cartoes || 0);
  if (type !== "live") return 3.5;
  if (minute <= 30) return current + 2.5;
  if (minute <= 65) return current + 1.5;
  return current + 0.5;
}

function confidence(category, ctx) {
  const { totalGoals, homeGoals, awayGoals, minute, pressure, home, away, type } = ctx;
  const shots = home.finalizacoes + away.finalizacoes;
  const onGoal = home.noGol + away.noGol;
  const corners = home.cantos + away.cantos;
  const cards = home.cartoes + away.cartoes;
  const fouls = home.faltas + away.faltas;
  const pre = type === "prelive" ? 3 : 0;

  if (category === "MAIS_GOL") return Math.round(clamp(38 + pressure * 0.42 + onGoal * 3.2 + shots * 0.35 + pre, 40, 91));
  if (category === "OVER05") return totalGoals >= 1 ? 96 : Math.round(clamp(34 + pressure * 0.28 + onGoal * 3 + shots * 0.45 + pre, 35, 86));
  if (category === "OVER15") return totalGoals >= 2 ? 96 : Math.round(clamp(28 + pressure * 0.26 + totalGoals * 10 + onGoal * 2.4 + shots * 0.35 + pre, 30, 84));
  if (category === "OVER25") return totalGoals >= 3 ? 96 : Math.round(clamp(22 + pressure * 0.24 + totalGoals * 9 + onGoal * 2 + shots * 0.28 + pre, 25, 80));
  if (category === "OVER35") return totalGoals >= 4 ? 96 : Math.round(clamp(16 + pressure * 0.2 + totalGoals * 8 + onGoal * 1.6 + pre, 18, 72));
  if (category === "BTTS") return homeGoals > 0 && awayGoals > 0 ? 96 : Math.round(clamp(28 + Math.min(home.perigosos, away.perigosos) * 1.1 + onGoal * 2 + pre, 28, 82));
  if (category === "CANTOS_FT") return Math.round(clamp(32 + corners * 5 + pressure * 0.18 + pre, 35, 88));
  if (category === "CANTOS_INICIO") return Math.round(clamp(30 + corners * 5 + pressure * 0.15 + pre, 35, 84));
  if (category === "CARTOES_FT") return Math.round(clamp(28 + cards * 10 + fouls * 1.1 + (minute >= 55 ? 6 : 0), 30, 84));
  if (category === "CARTOES_INICIO") return Math.round(clamp(26 + cards * 8 + fouls * 0.85, 28, 78));
  if (category === "VITORIA") return Math.round(clamp(42 + Math.abs(home.perigosos - away.perigosos) * 1.2 + Math.abs(home.noGol - away.noGol) * 4, 45, 86));
  if (category === "HANDICAP") return Math.round(clamp(48 + Math.abs(home.perigosos - away.perigosos) + Math.abs(home.ataques - away.ataques) * 0.25, 50, 88));
  return Math.round(clamp((pressure + 60) / 2, 45, 88));
}

function alertText(category, conf, ctx, market = "") {
  if (ctx.type === "prelive") {
    if (conf >= 82) return `🔐 VIP 24H • ${market}`;
    if (conf >= 70) return `📊 VIP 24H • ${market}`;
    return `👀 VIP 24H • ${market}`;
  }
  if (category === "CANTOS_FT") return conf >= 78 ? `🚩 SINAL FORTE • ${market}` : `🚩 MONITORANDO • ${market}`;
  if (category === "CARTOES_FT") return conf >= 76 ? `🟨 SINAL FORTE • ${market}` : `🟨 MONITORANDO • ${market}`;
  if (category === "MAIS_GOL") return conf >= 78 ? "🔥 PRÓXIMO GOL / MAIS GOL" : "📊 MONITORANDO MAIS GOL";
  if (conf >= 88) return "🚨 SINAL MUITO FORTE";
  if (conf >= 78) return "🔥 SINAL FORTE";
  return "📊 MONITORANDO";
}

function mercadoCumprido(category, ctx) {
  if (category === "OVER05" && ctx.totalGoals >= 1) return true;
  if (category === "OVER15" && ctx.totalGoals >= 2) return true;
  if (category === "OVER25" && ctx.totalGoals >= 3) return true;
  if (category === "OVER35" && ctx.totalGoals >= 4) return true;
  if (category === "BTTS" && ctx.homeGoals > 0 && ctx.awayGoals > 0) return true;
  return false;
}

function buildSignals(fixtureRow, index = 0, forcedType = null, realStats = [], rawEvents = []) {
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
  const statsPack = type === "live" ? extractRealStats(realStats, teams, index, type) : fakeStats(index, type);
  const { home, away } = statsPack;
  const pressure = calcPressure(home, away, totalGoals, minute, type);
  const fixtureId = fixture?.id || `fixture-${index}`;
  const matchEvents = normalizeEvents(rawEvents, teams);
  const cLine = totalCornersLine(home, away, minute, type);
  const cardLine = totalCardsLine(home, away, minute, type);

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
    fixtureDate: fixture?.date || "",
    score: `${homeGoals} - ${awayGoals}`,
    minute,
    status: type === "live" ? "AO VIVO" : "PRÉ-LIVE VIP",
    type,
    source: "api-football",
    statsMode: statsPack.realStats ? "real" : "estimated",
    statsSource: statsPack.realStats ? "real" : "estimated",
    realStats: Boolean(statsPack.realStats),
    eventsMode: matchEvents.length ? "real" : "none",
    hasRealEvents: Boolean(matchEvents.length),
    eventsCount: matchEvents.length,
    matchEvents,
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
    yellowCards: home.amarelos,
    yellowCardsAway: away.amarelos,
    redCards: home.vermelhos,
    redCardsAway: away.vermelhos,
    fouls: home.faltas,
    foulsAway: away.faltas,
    stats: { home, away }
  };

  const ctx = { totalGoals, homeGoals, awayGoals, minute, pressure, home, away, type };
  const markets = type === "live"
    ? [
        ["MAIS_GOL", "Mais gol na partida", "MAIS GOL"],
        ["OVER05", "Over 0.5", "OVER 0,5"],
        ["OVER15", "Over 1.5", "OVER 1,5"],
        ["OVER25", "Over 2.5", "OVER 2,5"],
        ["BTTS", "BTTS", "BTTS"],
        ["CANTOS_FT", `Mais de ${String(cLine).replace(".", ",")} cantos FT`, "CANTOS"],
        ["CARTOES_FT", `Mais de ${String(cardLine).replace(".", ",")} cartões FT`, "CARTÕES"]
      ]
    : [
        ["OVER15", "Mais de 1.5 gols", "OVER 1,5"],
        ["OVER25", "Mais de 2.5 gols", "OVER 2,5"],
        ["OVER35", "Mais de 3.5 gols", "OVER 3,5"],
        ["MAIS_GOL", "Mais gol na partida", "MAIS GOL"],
        ["BTTS", "Ambas marcam", "BTTS"],
        ["CANTOS_FT", "Mais de 7.5 cantos FT", "CANTOS"],
        ["CANTOS_INICIO", "Mais de 2.5 cantos até 20min", "CANTOS INÍCIO"],
        ["CARTOES_FT", "Mais de 3.5 cartões FT", "CARTÕES"],
        ["CARTOES_INICIO", "Cartão nos primeiros 30min", "CARTÕES INÍCIO"]
      ];

  const homePower = home.finalizacoes * 2 + home.noGol * 5 + home.perigosos * 1.5 + home.ataques * 0.25 + home.posse * 0.12;
  const awayPower = away.finalizacoes * 2 + away.noGol * 5 + away.perigosos * 1.5 + away.ataques * 0.25 + away.posse * 0.12;
  const fav = homePower >= awayPower ? base.homeTeam : base.awayTeam;
  const balance = Math.abs(homePower - awayPower) / Math.max(1, homePower + awayPower);

  if (type === "prelive" && balance >= 0.16) markets.push(["HANDICAP", `Dupla chance ${fav}`, "HANDICAP"]);
  if (type === "prelive" && balance >= 0.22) markets.push(["VITORIA", `Vitória ${fav}`, "VITÓRIA"]);

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
      realOdd: false,
      oddsMode: "none",
      alert: alertText(category, conf, ctx, market),
      line: category === "CANTOS_FT" ? cLine : category === "CARTOES_FT" ? cardLine : undefined,
      vipPrelive: type === "prelive"
    };
  });

  if (type === "live") signals = signals.filter((s) => !mercadoCumprido(s.category, ctx));

  const topConfidence = Math.round(clamp(Math.max(...signals.map((s) => s.confidence), 60) + 2, 50, 93));
  signals.push({
    ...base,
    id: `${fixtureId}-TOP_IA`,
    signalId: `${fixtureId}-TOP_IA`,
    market: type === "live" ? "Próximo melhor sinal ao vivo" : "Melhor sinal VIP 24H",
    mercado: type === "live" ? "Próximo melhor sinal ao vivo" : "Melhor sinal VIP 24H",
    category: "TOP_IA",
    categoria: "TOP_IA",
    categoryLabel: "TOP IA",
    confidence: topConfidence,
    confianca: topConfidence,
    pressure,
    pressao: pressure,
    odd: "—",
    alert: type === "live" ? "🧠 TOP IA AO VIVO" : "🔐 TOP IA PRÉ-LIVE VIP",
    vipPrelive: type === "prelive"
  });

  return signals
    .filter((s) => Number(s.confidence || 0) >= (type === "live" ? 55 : 60))
    .sort((a, b) => Number(b.confidence || 0) + Number(b.pressure || 0) * 0.35 - (Number(a.confidence || 0) + Number(a.pressure || 0) * 0.35))
    .slice(0, type === "live" ? 5 : 8);
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
    fixture: { id: `fallback-${i}`, status: { short: "NS", elapsed: 0 }, date: new Date(Date.now() + (i + 1) * 3 * 60 * 60 * 1000).toISOString() },
    league: { name: league, country: "Base IA" },
    teams: { home: { name: home, logo: "" }, away: { name: away, logo: "" } },
    goals: { home: 0, away: 0 }
  }));
}

async function getLiveFixtures() {
  try { return await apiFootballGet("/fixtures?live=all"); } catch (e) { console.log("Erro live:", e.message); return []; }
}

async function getPrelive24Fixtures() {
  const all = [];
  try { all.push(...await apiFootballGet(`/fixtures?date=${todayISO()}&timezone=America/Sao_Paulo`)); } catch (e) { console.log("Erro today:", e.message); }
  try { all.push(...await apiFootballGet(`/fixtures?date=${todayISO(1)}&timezone=America/Sao_Paulo`)); } catch (e) { console.log("Erro tomorrow:", e.message); }
  return dedupeFixtures(all)
    .filter((row) => isNotStarted(row?.fixture?.status?.short) && isWithinNext24h(row))
    .sort((a, b) => fixtureTimeMs(a) - fixtureTimeMs(b));
}

async function getSignalsPayload() {
  const now = Date.now();
  if (cache.payload && now - cache.timestamp < CACHE_TTL_MS) return { ...cache.payload, cache: true };

  let liveFixtures = [];
  let preliveFixtures = [];
  let mode = "mixed";

  if (API_KEY) {
    liveFixtures = await getLiveFixtures();
    preliveFixtures = await getPrelive24Fixtures();
  }

  if (!liveFixtures.length && !preliveFixtures.length) {
    mode = "fallback-ia";
    preliveFixtures = fallbackFixtures();
  }

  const activeSignals = [];
  let realStatsGames = 0;
  let realEventsGames = 0;

  const liveSelected = liveFixtures.slice(0, MAX_GAMES);
  for (let index = 0; index < liveSelected.length; index++) {
    const fixture = liveSelected[index];
    const fixtureId = fixture?.fixture?.id;
    let realStats = [];
    let events = [];

    if (fixtureId) {
      try { realStats = await apiFootballGet(`/fixtures/statistics?fixture=${fixtureId}`); } catch (e) { console.log(`Sem estatísticas reais ${fixtureId}:`, e.message); }
      try { events = await apiFootballGet(`/fixtures/events?fixture=${fixtureId}`); } catch (e) { console.log(`Sem eventos reais ${fixtureId}:`, e.message); }
    }

    const signals = buildSignals(fixture, index, "live", realStats, events);
    if (signals.some((s) => s.realStats)) realStatsGames += 1;
    if (signals.some((s) => s.hasRealEvents)) realEventsGames += 1;
    activeSignals.push(...signals);
  }

  const preliveSelected = preliveFixtures.slice(0, MAX_PRELIVE_24H);
  for (let index = 0; index < preliveSelected.length; index++) {
    activeSignals.push(...buildSignals(preliveSelected[index], index, "prelive", [], []));
  }

  const liveGames = new Set(activeSignals.filter((s) => s.type === "live").map((s) => s.fixtureId)).size;
  const preliveGames = new Set(activeSignals.filter((s) => s.type !== "live").map((s) => s.fixtureId)).size;

  const payload = {
    ok: true,
    source: API_KEY ? "api-football" : "fallback",
    mode,
    activeSignals,
    liveGames,
    preliveGames,
    totalGames: new Set(activeSignals.map((s) => s.fixtureId)).size,
    totalSignals: activeSignals.length,
    statsMode: realStatsGames ? "real" : "estimated",
    realStatsGames,
    eventsMode: realEventsGames ? "real" : "none",
    realEventsGames,
    oddsMode: "none",
    realOddsGames: 0,
    oddsEnabled: false,
    updatedAt: new Date().toISOString()
  };

  cache = { timestamp: now, payload };
  return payload;
}

const server = http.createServer(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  try {
    if (requestUrl.pathname === "/" || requestUrl.pathname === "/health") {
      sendJson(res, 200, { ok: true, service: "mekinebet-api", routes: ["/api/signals", "/health"], hasApiKey: Boolean(API_KEY), updatedAt: new Date().toISOString() });
      return;
    }
    if (requestUrl.pathname === "/api/signals") {
      sendJson(res, 200, await getSignalsPayload());
      return;
    }
    sendJson(res, 404, { ok: false, error: "Rota não encontrada", routes: ["/api/signals", "/health"] });
  } catch (error) {
    console.error("Erro MekineBet:", error);
    sendJson(res, 500, { ok: false, error: "Erro ao gerar sinais", details: error.message, activeSignals: [], updatedAt: new Date().toISOString() });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`MekineBet API rodando na porta ${PORT}`);
});
