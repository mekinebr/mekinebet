import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.PORT || 10000);
const API_BASE = "https://v3.football.api-sports.io";

const uniqueText = (arr = []) => Array.from(new Set(arr.map((v) => String(v || "").trim()).filter(Boolean)));

const API_KEYS = uniqueText([
  ...(process.env.API_FOOTBALL_KEYS || "").split(","),
  process.env.API_FOOTBALL_KEY,
  process.env.APISPORTS_KEY,
  process.env.API_SPORTS_KEY,
  process.env.RAPIDAPI_KEY
]);

const API_KEY = API_KEYS[0] || "";

const ODDS_API_KEYS = uniqueText([
  ...(process.env.ODDS_API_KEYS || "").split(","),
  process.env.ODDS_API_KEY,
  process.env.ODDS_API_KEY_2
]);

const SPORTMONKS_TOKEN = String(process.env.SPORTMONKS_TOKEN || "").trim();

const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 30000);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 12000);
const MAX_GAMES = Number(process.env.MAX_LIVE_GAMES || 9);
const MAX_PRELIVE_GAMES = Number(process.env.MAX_PRELIVE_GAMES || 18);
const PRELIVE_HOURS = Number(process.env.PRELIVE_HOURS || 24);
const PRELIVE_FALLBACK_HOURS = Number(process.env.PRELIVE_FALLBACK_HOURS || 168);
const DEBUG_API = String(process.env.DEBUG_API || "false").toLowerCase() === "true";
const ODDS_ENABLED = String(process.env.ODDS_ENABLED || "true").toLowerCase() !== "false";
const ODDS_BOOKMAKER = String(process.env.ODDS_BOOKMAKER || "").trim();
const THIRD_PARTY_CACHE_TTL_MS = Number(process.env.THIRD_PARTY_CACHE_TTL_MS || 300000);
const THE_ODDS_REGIONS = String(process.env.THE_ODDS_REGIONS || "eu,uk,us").trim();
const THE_ODDS_MARKETS = String(process.env.THE_ODDS_MARKETS || "h2h,totals,spreads").trim();
const THE_ODDS_SPORT_KEYS = uniqueText(
  (process.env.ODDS_SPORT_KEYS ||
    "soccer_epl,soccer_usa_mls,soccer_brazil_campeonato,soccer_spain_la_liga,soccer_italy_serie_a,soccer_germany_bundesliga,soccer_france_ligue_one,soccer_netherlands_eredivisie,soccer_portugal_primeira_liga,soccer_conmebol_copa_libertadores,soccer_uefa_champs_league,soccer_uefa_europa_league")
    .split(",")
);

let cache = { timestamp: 0, payload: null };
let thirdPartyCache = { timestamp: 0, data: null };
let providerDiagnostics = { apiFootball: [], sportmonks: [], theOdds: [] };

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

function oddsApiIso(date = new Date()) {
  // The Odds API exige YYYY-MM-DDTHH:MM:SSZ, sem milissegundos.
  // Exemplo aceito: 2020-11-24T16:05:00Z
  return new Date(date).toISOString().replace(/\.\d{3}Z$/, "Z");
}

function isLive(short = "") {
  return ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(
    String(short).toUpperCase()
  );
}

function isFinished(short = "") {
  return [
    "FT",
    "AET",
    "PEN",
    "CANC",
    "PST",
    "SUSP",
    "ABD",
    "AWD",
    "WO"
  ].includes(String(short).toUpperCase());
}

function fixtureStartDate(row = {}) {
  const timestamp = Number(row?.fixture?.timestamp || 0);
  if (timestamp > 0) return new Date(timestamp * 1000);

  const raw = row?.fixture?.date || row?.fixture?.timezone || "";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isFutureFixture(row = {}) {
  const short = String(row?.fixture?.status?.short || "").toUpperCase();
  if (isLive(short) || isFinished(short)) return false;

  const d = fixtureStartDate(row);
  if (!d) return ["NS", "TBD"].includes(short);

  return d.getTime() >= Date.now() - 15 * 60 * 1000;
}

function isWithinNextHours(row = {}, hours = PRELIVE_HOURS) {
  const d = fixtureStartDate(row);
  if (!d) return true;

  const diffHours = (d.getTime() - Date.now()) / 36e5;
  return diffHours >= -0.25 && diffHours <= hours;
}

function fixtureKey(row = {}) {
  return String(row?.fixture?.id || `${row?.teams?.home?.name || ""}-${row?.teams?.away?.name || ""}-${row?.fixture?.date || ""}`);
}

function uniqueFixtures(rows = []) {
  const map = new Map();
  rows.filter(Boolean).forEach((row) => {
    const key = fixtureKey(row);
    if (key && !map.has(key)) map.set(key, row);
  });
  return Array.from(map.values());
}


function leaguePriority(row = {}) {
  const league = normalizeName(`${row?.league?.name || ""} ${row?.league?.country || ""}`);

  const elite = [
    "world cup", "euro championship", "copa america", "uefa champions league", "libertadores",
    "premier league", "la liga", "serie a italy", "bundesliga", "ligue 1", "eredivisie",
    "primeira liga", "brasileirao", "brasileiro serie a", "argentina primera", "mls",
    "championship england", "serie b brazil", "sudamericana", "uefa europa", "uefa conference"
  ];

  const good = [
    "primera division", "division 1", "liga mx", "super lig", "j league", "k league",
    "a-league", "sweden allsvenskan", "norway eliteserien", "denmark superliga",
    "belgium", "austria", "switzerland", "scotland", "chile", "colombia", "peru", "ecuador", "uruguay"
  ];

  if (elite.some((x) => league.includes(normalizeName(x)))) return 100;
  if (good.some((x) => league.includes(normalizeName(x)))) return 70;
  if (league.includes("u20") || league.includes("u19") || league.includes("reserve") || league.includes("youth")) return 20;
  if (league.includes("women") || league.includes("w league")) return 35;
  return 45;
}

function fixtureSortScore(row = {}, kind = "live") {
  const priority = leaguePriority(row);
  const elapsed = toNumber(row?.fixture?.status?.elapsed, 0);
  const start = fixtureStartDate(row)?.getTime() || Date.now();
  const hoursToStart = Math.abs((start - Date.now()) / 36e5);
  const score = priority * 1000 + (kind === "live" ? Math.min(elapsed, 90) * 2 : Math.max(0, 24 - hoursToStart) * 8);
  return score;
}

function liveScope(minute = 0) {
  const m = Number(minute || 0);
  if (m > 0 && m <= 45) return "HT";
  return "FT";
}

function goalsNeededFor(category = "") {
  const cat = String(category || "").toUpperCase();
  if (cat === "OVER05") return 1;
  if (cat === "OVER15") return 2;
  if (cat === "OVER25") return 3;
  if (cat === "OVER35") return 4;
  return null;
}

function applyLiveDecay(raw, category, ctx) {
  if (ctx.type !== "live") return Math.round(clamp(raw, 30, 92));

  const target = goalsNeededFor(category);
  if (!target) return Math.round(clamp(raw, 25, 90));

  const needed = Math.max(0, target - ctx.totalGoals);
  if (needed <= 0) return 96;

  const minute = Number(ctx.minute || 0);
  const remaining = Math.max(0, 95 - minute);

  let maxCap = 92;
  if (needed >= 1 && minute >= 75) maxCap = Math.min(maxCap, 74);
  if (needed >= 1 && minute >= 85) maxCap = Math.min(maxCap, 62);
  if (needed >= 2 && minute >= 55) maxCap = Math.min(maxCap, 68);
  if (needed >= 2 && minute >= 70) maxCap = Math.min(maxCap, 52);
  if (needed >= 2 && minute >= 80) maxCap = Math.min(maxCap, 38);
  if (needed >= 3 && minute >= 45) maxCap = Math.min(maxCap, 55);
  if (needed >= 3 && minute >= 65) maxCap = Math.min(maxCap, 36);
  if (needed >= 3 && minute >= 75) maxCap = Math.min(maxCap, 24);

  if (target >= 3 && ctx.totalGoals === 0 && minute >= 60) maxCap = Math.min(maxCap, 42);
  if (target >= 3 && ctx.totalGoals === 0 && minute >= 75) maxCap = Math.min(maxCap, 26);
  if (target >= 4 && ctx.totalGoals <= 1 && minute >= 60) maxCap = Math.min(maxCap, 34);

  const timePenalty = Math.max(0, minute - 12) * needed * (target >= 3 ? 0.55 : 0.38);
  const pressureRescue = Math.min(10, (ctx.pressure || 0) / 12);
  const adjusted = raw - timePenalty + pressureRescue + Math.min(8, remaining / 10);

  return Math.round(clamp(adjusted, 5, maxCap));
}

function marketScopeLabel(category, market, ctx) {
  if (ctx.type !== "live") return market;

  const cat = String(category || "").toUpperCase();
  const scope = liveScope(ctx.minute);

  if (["OVER05", "OVER15", "OVER25", "OVER35"].includes(cat)) {
    return `${market} ${scope}`;
  }

  if (cat === "BTTS") return `BTTS ${scope}`;
  if (cat === "CANTOS_FT") return scope === "HT" ? "Cantos HT" : "Cantos FT";
  if (cat === "CARTOES_FT") return scope === "HT" ? "Cartões HT" : "Cartões FT";

  return market;
}

function hasApiErrors(errors) {
  if (!errors) return false;
  if (Array.isArray(errors)) return errors.length > 0;
  if (typeof errors === "object") return Object.keys(errors).length > 0;
  return Boolean(errors);
}

async function apiFootballGet(path) {
  if (!API_KEYS.length) throw new Error("API_FOOTBALL_KEY ausente");

  let lastError = null;

  for (const key of API_KEYS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE}${path}`, {
        headers: {
          "x-apisports-key": key,
          "x-rapidapi-key": key,
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

      if (!response.ok || hasApiErrors(data?.errors)) {
        lastError = new Error(`API-Football key falhou: status ${response.status} ${JSON.stringify(data?.errors || data)}`);
        providerDiagnostics.apiFootball.push({ path, ok: false, status: response.status, errors: data?.errors || data });
        continue;
      }

      providerDiagnostics.apiFootball.push({ path, ok: true, count: Array.isArray(data?.response) ? data.response.length : 0 });
      return Array.isArray(data?.response) ? data.response : [];
    } catch (e) {
      lastError = e;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("Falha em todas as chaves API-Football");
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

function eventIcon(type = "", detail = "") {
  const t = normalizeName(type);
  const d = normalizeName(detail);

  if (t.includes("goal")) return "⚽";
  if (t.includes("card") && d.includes("red")) return "🟥";
  if (t.includes("card")) return "🟨";
  if (t.includes("subst")) return "🔁";
  if (t.includes("var")) return "📺";
  if (t.includes("penalty")) return "🥅";

  return "•";
}

function eventCategory(type = "", detail = "") {
  const t = normalizeName(type);
  const d = normalizeName(detail);

  if (t.includes("goal")) return "GOAL";
  if (t.includes("card") && d.includes("red")) return "RED_CARD";
  if (t.includes("card")) return "YELLOW_CARD";
  if (t.includes("subst")) return "SUBSTITUTION";
  if (t.includes("var")) return "VAR";
  if (t.includes("penalty")) return "PENALTY";

  return "EVENT";
}

function normalizeEvent(event = {}, fixtureRow = {}) {
  const elapsed = toNumber(event?.time?.elapsed, 0);
  const extra = toNumber(event?.time?.extra, 0);
  const minute = Math.max(0, elapsed + extra);

  const homeId = fixtureRow?.teams?.home?.id;
  const awayId = fixtureRow?.teams?.away?.id;
  const teamId = event?.team?.id;

  const side =
    teamId && homeId && teamId === homeId
      ? "home"
      : teamId && awayId && teamId === awayId
        ? "away"
        : "neutral";

  const type = String(event?.type || "");
  const detail = String(event?.detail || "");
  const comments = String(event?.comments || "");

  return {
    minute,
    elapsed,
    extra,
    teamId: teamId || null,
    teamName: event?.team?.name || "",
    side,
    type,
    detail,
    comments,
    category: eventCategory(type, detail),
    icon: eventIcon(type, detail),
    player: event?.player?.name || "",
    assist: event?.assist?.name || "",
    raw: {
      time: event?.time || null,
      team: event?.team || null,
      player: event?.player || null,
      assist: event?.assist || null
    }
  };
}

function buildRealEvents(fixtureRow, eventsRows = []) {
  if (!Array.isArray(eventsRows) || !eventsRows.length) {
    return {
      matchEvents: [],
      hasRealEvents: false,
      eventsMode: "none"
    };
  }

  const matchEvents = eventsRows
    .map((event) => normalizeEvent(event, fixtureRow))
    .filter((event) => event.minute >= 0)
    .sort((a, b) => a.minute - b.minute);

  return {
    matchEvents,
    hasRealEvents: matchEvents.length > 0,
    eventsMode: matchEvents.length > 0 ? "real" : "none"
  };
}

function formatOdd(v) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n) || n <= 1) return "";
  return n.toFixed(2).replace(/\.00$/, "");
}

function numberFromText(v = "") {
  const match = String(v).replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function emptyOddsPack() {
  return {
    hasRealOdds: false,
    oddsMode: "none",
    bookmaker: "",
    oddsUpdatedAt: "",
    entries: [],
    byCategory: {}
  };
}

function pushOddsEntriesFromBookmakers(entries, bookmakers = [], source = "api-football", updatedAt = "") {
  if (!Array.isArray(bookmakers)) return;

  bookmakers.forEach((bookmaker) => {
    const bookmakerName = bookmaker?.name || "";
    const bookmakerId = bookmaker?.id || null;
    const bets = Array.isArray(bookmaker?.bets) ? bookmaker.bets : [];

    bets.forEach((bet) => {
      const betName = bet?.name || "";
      const betId = bet?.id || null;
      const values = Array.isArray(bet?.values) ? bet.values : [];

      values.forEach((value) => {
        const odd = formatOdd(value?.odd);
        if (!odd) return;

        entries.push({
          source,
          updatedAt,
          bookmaker: bookmakerName,
          bookmakerId,
          bet: betName,
          betId,
          value: value?.value || "",
          odd,
          suspended: Boolean(value?.suspended),
          line: numberFromText(value?.value || ""),
          raw: value
        });
      });
    });
  });
}

function flattenOddsResponse(rows = [], source = "api-football") {
  const entries = [];

  if (!Array.isArray(rows)) return entries;

  rows.forEach((row) => {
    const updatedAt = row?.update || row?.updated || row?.fixture?.date || "";
    pushOddsEntriesFromBookmakers(entries, row?.bookmakers, source, updatedAt);

    if (Array.isArray(row?.odds)) {
      row.odds.forEach((oddRow) => {
        pushOddsEntriesFromBookmakers(entries, oddRow?.bookmakers, source, oddRow?.update || updatedAt);
      });
    }
  });

  return entries;
}

function bookmakerScore(entry = {}) {
  const name = normalizeName(entry.bookmaker || "");
  const preferred = normalizeName(ODDS_BOOKMAKER || "");

  if (preferred && name.includes(preferred)) return 1000;
  if (name.includes("bet365")) return 900;
  if (name.includes("betano")) return 850;
  if (name.includes("pinnacle")) return 820;
  if (name.includes("1xbet")) return 780;
  if (name.includes("betfair")) return 760;
  return 500;
}

function pickBestOdd(candidates = [], targetLine = null) {
  if (!candidates.length) return null;

  const sorted = candidates
    .filter((entry) => !entry.suspended)
    .slice()
    .sort((a, b) => {
      const aLine = Number.isFinite(a.line) ? a.line : targetLine;
      const bLine = Number.isFinite(b.line) ? b.line : targetLine;
      const aDistance = targetLine === null || targetLine === undefined ? 0 : Math.abs(Number(aLine || 0) - targetLine);
      const bDistance = targetLine === null || targetLine === undefined ? 0 : Math.abs(Number(bLine || 0) - targetLine);
      const aScore = bookmakerScore(a) - aDistance * 40;
      const bScore = bookmakerScore(b) - bDistance * 40;
      return bScore - aScore;
    });

  const best = sorted[0] || candidates[0];
  if (!best) return null;

  return {
    odd: best.odd,
    bookmaker: best.bookmaker || "",
    market: best.bet || "",
    line: best.value || "",
    oddsUpdatedAt: best.updatedAt || "",
    oddsProvider: best.source || "api-football"
  };
}

function findOddForCategory(entries = [], category = "") {
  const cat = String(category || "").toUpperCase();

  if (!entries.length) return null;

  const goalOverMarket = (entry) => {
    const bet = normalizeName(entry.bet || "");
    const value = normalizeName(entry.value || "");

    return (
      value.includes("over") &&
      (
        bet.includes("goals over") ||
        bet.includes("over under") ||
        bet.includes("goals") ||
        bet.includes("total goals") ||
        bet.includes("match goals")
      )
    );
  };

  if (cat === "OVER05") {
    return pickBestOdd(
      entries.filter((entry) => goalOverMarket(entry) && Math.abs(Number(entry.line || 0) - 0.5) < 0.05),
      0.5
    );
  }

  if (cat === "OVER15") {
    return pickBestOdd(
      entries.filter((entry) => goalOverMarket(entry) && Math.abs(Number(entry.line || 0) - 1.5) < 0.05),
      1.5
    );
  }

  if (cat === "OVER25") {
    return pickBestOdd(
      entries.filter((entry) => goalOverMarket(entry) && Math.abs(Number(entry.line || 0) - 2.5) < 0.05),
      2.5
    );
  }

  if (cat === "OVER35") {
    return pickBestOdd(
      entries.filter((entry) => goalOverMarket(entry) && Math.abs(Number(entry.line || 0) - 3.5) < 0.05),
      3.5
    );
  }

  if (cat === "BTTS") {
    return pickBestOdd(
      entries.filter((entry) => {
        const bet = normalizeName(entry.bet || "");
        const value = normalizeName(entry.value || "");
        return (
          (bet.includes("both teams") || bet.includes("btts") || bet.includes("teams score")) &&
          (value === "yes" || value.includes("yes") || value.includes("sim"))
        );
      }),
      null
    );
  }

  if (cat === "CANTOS_FT") {
    return pickBestOdd(
      entries.filter((entry) => {
        const bet = normalizeName(entry.bet || "");
        const value = normalizeName(entry.value || "");
        return (
          (bet.includes("corner") || bet.includes("corners") || bet.includes("escanteio") || bet.includes("cantos")) &&
          value.includes("over")
        );
      }),
      8.5
    );
  }

  if (cat === "CARTOES_FT") {
    return pickBestOdd(
      entries.filter((entry) => {
        const bet = normalizeName(entry.bet || "");
        const value = normalizeName(entry.value || "");
        return (
          (bet.includes("card") || bet.includes("booking") || bet.includes("cartao") || bet.includes("cartoes")) &&
          value.includes("over")
        );
      }),
      3.5
    );
  }

  if (cat === "MAIS_GOL") {
    return pickBestOdd(
      entries.filter((entry) => {
        const bet = normalizeName(entry.bet || "");
        const value = normalizeName(entry.value || "");
        return value.includes("over") && (bet.includes("goals") || bet.includes("total") || bet.includes("over under"));
      }),
      0.5
    );
  }

  if (cat === "VITORIA") {
    return pickBestOdd(
      entries.filter((entry) => {
        const bet = normalizeName(entry.bet || "");
        return bet.includes("match winner") || bet === "h2h" || bet.includes("full time result") || bet.includes("winner");
      }),
      null
    );
  }

  if (cat === "HANDICAP") {
    return pickBestOdd(
      entries.filter((entry) => {
        const bet = normalizeName(entry.bet || "");
        return bet.includes("spread") || bet.includes("handicap") || bet.includes("asian handicap");
      }),
      null
    );
  }

  return null;
}

function buildOddsPack(preOddsRows = [], liveOddsRows = []) {
  const preEntries = flattenOddsResponse(preOddsRows, "api-football-pre");
  const liveEntries = flattenOddsResponse(liveOddsRows, "api-football-live");

  const entries = [...liveEntries, ...preEntries];

  if (!entries.length) return emptyOddsPack();

  const byCategory = {};
  [
    "OVER05",
    "OVER15",
    "OVER25",
    "OVER35",
    "BTTS",
    "CANTOS_FT",
    "CARTOES_FT"
  ].forEach((category) => {
    const oddInfo = findOddForCategory(entries, category);
    if (oddInfo?.odd) byCategory[category] = oddInfo;
  });

  const firstRealOdd = Object.values(byCategory)[0] || null;

  return {
    hasRealOdds: Boolean(firstRealOdd),
    oddsMode: firstRealOdd ? "real" : "none",
    bookmaker: firstRealOdd?.bookmaker || "",
    oddsUpdatedAt: firstRealOdd?.oddsUpdatedAt || "",
    entries,
    byCategory
  };
}


function buildOddsPackFromEntries(entries = []) {
  const cleanEntries = Array.isArray(entries) ? entries.filter((entry) => entry?.odd) : [];

  if (!cleanEntries.length) return emptyOddsPack();

  const byCategory = {};
  [
    "OVER05",
    "OVER15",
    "OVER25",
    "OVER35",
    "BTTS",
    "MAIS_GOL",
    "CANTOS_FT",
    "CARTOES_FT",
    "VITORIA",
    "HANDICAP"
  ].forEach((category) => {
    const oddInfo = findOddForCategory(cleanEntries, category);
    if (oddInfo?.odd) byCategory[category] = oddInfo;
  });

  const firstRealOdd = Object.values(byCategory)[0] || null;

  return {
    hasRealOdds: Boolean(firstRealOdd),
    oddsMode: firstRealOdd ? "real" : "none",
    bookmaker: firstRealOdd?.bookmaker || "",
    oddsUpdatedAt: firstRealOdd?.oddsUpdatedAt || "",
    entries: cleanEntries,
    byCategory
  };
}

function getOddInfo(oddsPack = null, category = "") {
  if (!oddsPack?.byCategory) return null;
  return oddsPack.byCategory[category] || null;
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
  const dangerous = home.perigosos + away.perigosos;
  const corners = home.cantos + away.cantos;
  const cards = home.cartoes + away.cartoes;
  const fouls = home.faltas + away.faltas;
  const pre = type === "prelive" ? 6 : 0;

  if (category === "OVER05") {
    if (totalGoals >= 1) return 96;
    const raw = 34 + pressure * 0.28 + onGoal * 3 + shots * 0.45 + dangerous * 0.12 + pre;
    return applyLiveDecay(raw, category, ctx);
  }

  if (category === "OVER15") {
    if (totalGoals >= 2) return 96;
    const raw = 28 + pressure * 0.26 + totalGoals * 9 + onGoal * 2.5 + shots * 0.38 + dangerous * 0.10 + pre;
    return applyLiveDecay(raw, category, ctx);
  }

  if (category === "OVER25") {
    if (totalGoals >= 3) return 96;
    const raw = 22 + pressure * 0.23 + totalGoals * 8 + onGoal * 1.9 + shots * 0.30 + dangerous * 0.08 + pre;
    return applyLiveDecay(raw, category, ctx);
  }

  if (category === "OVER35") {
    if (totalGoals >= 4) return 96;
    const raw = 16 + pressure * 0.19 + totalGoals * 7 + onGoal * 1.45 + shots * 0.22 + dangerous * 0.05 + pre;
    return applyLiveDecay(raw, category, ctx);
  }

  if (category === "BTTS") {
    if (homeGoals > 0 && awayGoals > 0) return 96;

    let raw =
      28 +
      Math.min(home.perigosos, away.perigosos) * 1.1 +
      Math.min(home.finalizacoes, away.finalizacoes) * 0.9 +
      Math.min(home.noGol, away.noGol) * 4 +
      onGoal * 0.7 +
      pre;

    if (type === "live") {
      if (minute >= 70 && (homeGoals === 0 || awayGoals === 0)) raw -= 14;
      if (minute >= 82 && (homeGoals === 0 || awayGoals === 0)) raw -= 22;
    }

    return Math.round(clamp(raw, 20, type === "live" && minute >= 82 ? 58 : 82));
  }

  if (category === "MAIS_GOL") {
    const raw = 35 + pressure * 0.33 + onGoal * 2.5 + shots * 0.35 + dangerous * 0.16 + pre;
    return Math.round(clamp(type === "live" && minute >= 82 ? raw - 12 : raw, 35, type === "live" && minute >= 88 ? 68 : 88));
  }

  if (category === "CANTOS_FT") {
    return Math.round(clamp(32 + corners * 5 + pressure * 0.18 + dangerous * 0.08 + pre, 35, 86));
  }

  if (category === "CARTOES_FT") {
    return Math.round(clamp(28 + cards * 10 + fouls * 1.1 + (minute >= 55 ? 6 : 0) + pre, 30, 82));
  }

  if (category === "VITORIA" || category === "HANDICAP") {
    const homePower =
      home.finalizacoes * 2 +
      home.noGol * 5 +
      home.perigosos * 1.4 +
      home.cantos * 1.5 +
      home.ataques * 0.25 +
      home.posse * 0.12;
    const awayPower =
      away.finalizacoes * 2 +
      away.noGol * 5 +
      away.perigosos * 1.4 +
      away.cantos * 1.5 +
      away.ataques * 0.25 +
      away.posse * 0.12;

    const edge = Math.abs(homePower - awayPower) / Math.max(1, homePower + awayPower);
    const raw = 52 + edge * 70 + pre + (category === "HANDICAP" ? 4 : 0);
    return Math.round(clamp(raw, 52, category === "HANDICAP" ? 86 : 82));
  }

  return Math.round(clamp((pressure + 60) / 2, 45, 88));
}

function alertText(category, conf, ctx) {
  if (ctx.type === "prelive") {
    if (conf >= 84) return "🔐 VIP PRÉ-LIVE • FORTE";
    if (conf >= 72) return "🔐 VIP PRÉ-LIVE • BOM";
    return "🔐 VIP PRÉ-LIVE • OBSERVAR";
  }

  const scope = liveScope(ctx.minute);
  const target = goalsNeededFor(category);
  const needed = target ? Math.max(0, target - ctx.totalGoals) : null;

  if (category === "OVER05" && ctx.totalGoals >= 1) return "✅ GREEN";
  if (category === "OVER15" && ctx.totalGoals >= 2) return "✅ GREEN";
  if (category === "OVER25" && ctx.totalGoals >= 3) return "✅ GREEN";
  if (category === "OVER35" && ctx.totalGoals >= 4) return "✅ GREEN";
  if (category === "BTTS" && ctx.homeGoals > 0 && ctx.awayGoals > 0) return "✅ GREEN";

  if (target && conf < 45) return `⏳ ${scope} PERDEU FORÇA`;
  if (target && needed >= 2 && ctx.minute >= 70) return `⚠️ ${scope} SÓ COM PRESSÃO FORTE`;

  if (conf >= 88) return `🚨 ${scope} SINAL MUITO FORTE`;
  if (conf >= 78) return `🔥 ${scope} SINAL FORTE`;
  if (category === "CANTOS_FT") return `🚩 ${scope} CANTOS`;
  if (category === "CARTOES_FT") return `🟨 ${scope} CARTÕES`;

  return `📊 ${scope} MONITORANDO`;
}

function buildSignals(
  fixtureRow,
  index = 0,
  forcedType = null,
  realStatsPack = null,
  eventsPack = null,
  oddsPack = null
) {
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

  const safeEventsPack = eventsPack || {
    matchEvents: [],
    hasRealEvents: false,
    eventsMode: "none"
  };

  const safeOddsPack = oddsPack || emptyOddsPack();

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
    fixtureDate: fixture?.date || "",
    startTime: fixture?.date || "",
    timestamp: fixture?.timestamp || null,
    minute,
    status: type === "live" ? "AO VIVO" : "PRÉ-LIVE",
    type,
    source: fixtureRow?._externalSource || "api-football",
    statsMode: statsPack.hasRealStats ? "real" : "estimated",
    realStats: Boolean(statsPack.hasRealStats),

    eventsMode: safeEventsPack.eventsMode || "none",
    hasRealEvents: Boolean(safeEventsPack.hasRealEvents),
    matchEvents: safeEventsPack.matchEvents || [],
    eventsCount: Array.isArray(safeEventsPack.matchEvents) ? safeEventsPack.matchEvents.length : 0,

    oddsMode: safeOddsPack.oddsMode || "none",
    hasRealOdds: Boolean(safeOddsPack.hasRealOdds),
    bookmaker: safeOddsPack.bookmaker || "",
    oddsUpdatedAt: safeOddsPack.oddsUpdatedAt || "",

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

  const liveMarkets = [
    ["OVER05", "Over 0.5", "OVER 0,5"],
    ["OVER15", "Over 1.5", "OVER 1,5"],
    ["OVER25", "Over 2.5", "OVER 2,5"],
    ["OVER35", "Over 3.5", "OVER 3,5"],
    ["BTTS", "BTTS", "BTTS"],
    ["MAIS_GOL", "Mais gol", "MAIS GOL"],
    ["CANTOS_FT", "Cantos", "CANTOS"],
    ["CARTOES_FT", "Cartões", "CARTÕES"]
  ];

  const preliveMarkets = [
    ["OVER15", "Over 1.5", "OVER 1,5"],
    ["OVER25", "Over 2.5", "OVER 2,5"],
    ["OVER35", "Over 3.5", "OVER 3,5"],
    ["BTTS", "Ambas marcam", "AMBAS"],
    ["MAIS_GOL", "Mais gol na partida", "MAIS GOL"],
    ["CANTOS_FT", "Cantos FT", "CANTOS"],
    ["CARTOES_FT", "Cartões FT", "CARTÕES"],
    ["VITORIA", "Vitória provável", "VITÓRIA"],
    ["HANDICAP", "Handicap / Dupla chance", "HANDICAP"]
  ];

  const markets = type === "prelive" ? preliveMarkets : liveMarkets;

  let signals = markets.map(([category, market, label]) => {
    const conf = confidence(category, ctx);
    const oddInfo = getOddInfo(safeOddsPack, category);
    const displayMarket = marketScopeLabel(category, market, ctx);

    return {
      ...base,
      id: `${fixtureId}-${category}`,
      signalId: `${fixtureId}-${category}`,
      market: displayMarket,
      mercado: displayMarket,
      rawMarket: market,
      category,
      categoria: category,
      categoryLabel: label,
      signalScope: type === "live" ? liveScope(minute) : "PRELIVE",
      confidence: conf,
      confianca: conf,
      pressure,
      pressao: pressure,
      odd: oddInfo?.odd || "—",
      realOdd: Boolean(oddInfo?.odd),
      bookmaker: oddInfo?.bookmaker || base.bookmaker || "",
      oddsMarket: oddInfo?.market || "",
      oddsLine: oddInfo?.line || "",
      oddsProvider: oddInfo?.oddsProvider || "",
      oddsUpdatedAt: oddInfo?.oddsUpdatedAt || base.oddsUpdatedAt || "",
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
    realOdd: false,
    bookmaker: base.bookmaker || "",
    oddsMarket: "",
    oddsLine: "",
    oddsProvider: "",
    oddsUpdatedAt: base.oddsUpdatedAt || "",
    alert: topConfidence >= 85 ? "🚨 TOP IA" : "🧠 ANÁLISE IA"
  });

  signals = signals
    .filter((s) => s.confidence >= (type === "prelive" ? 58 : 55))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, type === "prelive" ? 9 : 4);

  return signals;
}


function relationData(row = {}, key = "") {
  const value = row?.[key];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

async function fetchJsonWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeSportmonksStatus(row = {}) {
  const raw = String(
    row?.state?.short_name ||
    row?.state?.developer_name ||
    row?.state?.name ||
    row?.status ||
    ""
  ).toUpperCase();

  if (raw.includes("1ST") || raw.includes("FIRST") || raw === "1H" || raw.includes("INPLAY")) return "1H";
  if (raw.includes("2ND") || raw.includes("SECOND") || raw === "2H") return "2H";
  if (raw.includes("HALF") || raw === "HT") return "HT";
  if (raw.includes("FULL") || raw === "FT" || raw.includes("FINISHED")) return "FT";
  if (raw.includes("NOT_STARTED") || raw.includes("NS") || raw.includes("UPCOMING")) return "NS";
  return raw || "NS";
}

function sportmonksMinute(row = {}) {
  const direct = toNumber(row?.minute ?? row?.time?.minute ?? row?.periods?.current?.minute, null);
  if (Number.isFinite(direct)) return direct;

  const start = row?.starting_at_timestamp ? Number(row.starting_at_timestamp) * 1000 : new Date(row?.starting_at || "").getTime();
  if (!Number.isFinite(start)) return 0;

  const elapsed = Math.floor((Date.now() - start) / 60000);
  return clamp(elapsed, 0, 120);
}

function sportmonksTeams(row = {}) {
  const participants = relationData(row, "participants");
  const home = participants.find((p) => normalizeName(p?.meta?.location || p?.location || p?.pivot?.location || "") === "home") || participants[0] || {};
  const away = participants.find((p) => normalizeName(p?.meta?.location || p?.location || p?.pivot?.location || "") === "away") || participants[1] || {};

  const split = String(row?.name || "").split(/\s+vs\s+|\s+-\s+/i);

  return {
    home: {
      id: home?.id || row?.localteam_id || "home",
      name: home?.name || split[0] || "Casa",
      logo: home?.image_path || home?.logo_path || ""
    },
    away: {
      id: away?.id || row?.visitorteam_id || "away",
      name: away?.name || split[1] || "Fora",
      logo: away?.image_path || away?.logo_path || ""
    }
  };
}

function sportmonksScore(row = {}, teams = {}) {
  const scores = relationData(row, "scores");
  let home = 0;
  let away = 0;

  scores.forEach((scoreRow) => {
    const description = normalizeName(scoreRow?.description || scoreRow?.type?.name || scoreRow?.score?.description || "");
    const isCurrent = !description || description.includes("current") || description.includes("2nd") || description.includes("1st") || description.includes("score");
    if (!isCurrent) return;

    const participantId = scoreRow?.participant_id || scoreRow?.team_id;
    const goals = toNumber(scoreRow?.score?.goals ?? scoreRow?.score?.participant ?? scoreRow?.goals ?? scoreRow?.value, null);
    if (!Number.isFinite(goals)) return;

    if (String(participantId) === String(teams.home.id)) home = Math.max(home, goals);
    if (String(participantId) === String(teams.away.id)) away = Math.max(away, goals);
  });

  return { home, away };
}

function sportmonksStatsPack(row = {}, teams = {}) {
  const rawStats = relationData(row, "statistics");
  if (!rawStats.length) return null;

  const rows = [
    { team: { id: teams.home.id }, statistics: [] },
    { team: { id: teams.away.id }, statistics: [] }
  ];

  rawStats.forEach((stat) => {
    const participantId = stat?.participant_id || stat?.team_id;
    const typeName = stat?.type?.name || stat?.type?.code || stat?.name || stat?.type || "";
    const value = stat?.data?.value ?? stat?.value ?? stat?.data ?? 0;
    const target = String(participantId) === String(teams.away.id) ? rows[1] : rows[0];
    if (typeName) target.statistics.push({ type: typeName, value });
  });

  if (!rows[0].statistics.length && !rows[1].statistics.length) return null;
  return buildRealStats({ teams }, rows);
}

function sportmonksEventsPack(row = {}, teams = {}) {
  const rawEvents = relationData(row, "events");
  if (!rawEvents.length) return { matchEvents: [], hasRealEvents: false, eventsMode: "none" };

  const fixtureRow = { teams };
  const converted = rawEvents.map((event) => {
    const participantId = event?.participant_id || event?.team_id;
    return {
      time: { elapsed: toNumber(event?.minute ?? event?.extra_minute ?? event?.time?.minute, 0), extra: 0 },
      team: {
        id: participantId,
        name: String(participantId) === String(teams.away.id) ? teams.away.name : teams.home.name
      },
      type: event?.type?.name || event?.type || event?.event_type || "Event",
      detail: event?.result || event?.info || event?.addition || event?.type?.name || "",
      comments: event?.info || "",
      player: { name: event?.player_name || event?.player?.name || event?.player?.display_name || "" },
      assist: { name: event?.related_player_name || event?.assist?.name || "" }
    };
  });

  return buildRealEvents(fixtureRow, converted);
}

function transformSportmonksFixture(row = {}) {
  const teams = sportmonksTeams(row);
  const score = sportmonksScore(row, teams);
  const short = normalizeSportmonksStatus(row);
  const startRaw = row?.starting_at || row?.starting_at_timestamp || "";
  const startDate = row?.starting_at_timestamp ? new Date(Number(row.starting_at_timestamp) * 1000) : new Date(startRaw);
  const timestamp = Number(row?.starting_at_timestamp || (Number.isNaN(startDate.getTime()) ? 0 : Math.floor(startDate.getTime() / 1000)));
  const status = { short, elapsed: isLive(short) ? sportmonksMinute(row) : 0 };

  const fixtureRow = {
    fixture: {
      id: `sportmonks-${row?.id || `${teams.home.name}-${teams.away.name}-${timestamp}`}`,
      date: Number.isFinite(startDate.getTime()) ? startDate.toISOString() : "",
      timestamp,
      status
    },
    league: {
      name: row?.league?.name || row?.league?.data?.name || row?.league_name || "Sportmonks Football",
      country: row?.league?.country?.name || row?.league?.data?.country?.name || ""
    },
    teams,
    goals: score,
    _externalSource: "sportmonks"
  };

  fixtureRow._externalStatsPack = sportmonksStatsPack(row, teams);
  fixtureRow._externalEventsPack = sportmonksEventsPack(row, teams);
  return fixtureRow;
}

async function sportmonksGet(path, params = {}) {
  if (!SPORTMONKS_TOKEN) return [];

  const url = new URL(`https://api.sportmonks.com/v3/football${path}`);
  // Sportmonks aceita token por query em vários exemplos e também via Authorization.
  // Usar os dois deixa o backend mais tolerante aos formatos da conta.
  url.searchParams.set("api_token", SPORTMONKS_TOKEN);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });

  const data = await fetchJsonWithTimeout(url.toString(), {
    headers: {
      Accept: "application/json",
      Authorization: SPORTMONKS_TOKEN
    }
  });

  const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  return rows;
}

async function safeSportmonks(path, params = {}, label = path) {
  try {
    const rows = await sportmonksGet(path, params);
    providerDiagnostics.sportmonks.push({ label, ok: true, count: rows.length });
    return rows;
  } catch (e) {
    providerDiagnostics.sportmonks.push({ label, ok: false, error: e.message });
    console.log("Erro Sportmonks:", label, e.message);
    return [];
  }
}

async function getSportmonksFixtures() {
  if (!SPORTMONKS_TOKEN) return { live: [], prelive: [] };

  const includeCore = "scores;participants;events;league;state";
  const includeLight = "scores;participants;league;state";

  const futureDate = todayISO(Math.max(1, Math.ceil(PRELIVE_FALLBACK_HOURS / 24)));

  const [liveInplay, liveAll, fixturesRange, fixturesToday, fixturesTomorrow] = await Promise.all([
    safeSportmonks("/livescores/inplay", { include: includeCore }, "livescores/inplay"),
    safeSportmonks("/livescores/latest", { include: includeCore }, "livescores/latest"),
    safeSportmonks(`/fixtures/between/${todayISO(0)}/${futureDate}`, { include: includeLight }, `fixtures/between/${PRELIVE_FALLBACK_HOURS}h`),
    safeSportmonks(`/fixtures/date/${todayISO(0)}`, { include: includeLight }, "fixtures/date/today"),
    safeSportmonks(`/fixtures/date/${todayISO(1)}`, { include: includeLight }, "fixtures/date/tomorrow")
  ]);

  const live = uniqueFixtures([...liveInplay, ...liveAll, ...fixturesToday].map(transformSportmonksFixture))
    .filter((row) => isLive(row?.fixture?.status?.short || ""));

  const prelive = uniqueFixtures([...fixturesRange, ...fixturesToday, ...fixturesTomorrow].map(transformSportmonksFixture))
    .filter((row) => isFutureFixture(row) && isWithinNextHours(row, PRELIVE_FALLBACK_HOURS));

  return { live, prelive };
}

function theOddsEventToEntries(event = {}) {
  const entries = [];
  const updatedAt = event?.commence_time || new Date().toISOString();

  (event?.bookmakers || []).forEach((bookmaker) => {
    const bookmakerName = bookmaker?.title || bookmaker?.key || "The Odds API";

    (bookmaker?.markets || []).forEach((market) => {
      const marketKey = market?.key || "";
      const marketName = marketKey === "h2h" ? "Match Winner" : marketKey === "spreads" ? "Handicap" : marketKey === "totals" ? "Goals Over/Under" : marketKey.toUpperCase();

      (market?.outcomes || []).forEach((outcome) => {
        const odd = formatOdd(outcome?.price);
        if (!odd) return;

        const point = Number(outcome?.point);
        const label = Number.isFinite(point) ? `${outcome?.name || ""} ${point}`.trim() : outcome?.name || "";

        entries.push({
          source: "the-odds-api",
          updatedAt: market?.last_update || updatedAt,
          bookmaker: bookmakerName,
          bookmakerId: bookmaker?.key || null,
          bet: marketName,
          betId: marketKey,
          value: label,
          odd,
          suspended: false,
          line: Number.isFinite(point) ? point : numberFromText(label),
          raw: outcome
        });
      });
    });
  });

  return entries;
}

function transformTheOddsFixture(event = {}, sportTitle = "The Odds API") {
  const start = new Date(event?.commence_time || "");
  const timestamp = Number.isNaN(start.getTime()) ? 0 : Math.floor(start.getTime() / 1000);
  const home = event?.home_team || "Casa";
  const away = event?.away_team || "Fora";

  return {
    fixture: {
      id: `oddsapi-${event?.id || `${home}-${away}-${timestamp}`}`,
      date: Number.isNaN(start.getTime()) ? "" : start.toISOString(),
      timestamp,
      status: { short: "NS", elapsed: 0 }
    },
    league: { name: sportTitle || event?.sport_title || "The Odds API Soccer", country: "Odds" },
    teams: {
      home: { id: `oddsapi-home-${event?.id}`, name: home, logo: "" },
      away: { id: `oddsapi-away-${event?.id}`, name: away, logo: "" }
    },
    goals: { home: 0, away: 0 },
    _externalSource: "the-odds-api",
    _externalOddsPack: buildOddsPackFromEntries(theOddsEventToEntries(event))
  };
}

async function theOddsApiGet(path, params = {}, preferredKeyIndex = 0) {
  if (!ODDS_API_KEYS.length) return [];

  let lastError = null;
  const orderedKeys = [...ODDS_API_KEYS.slice(preferredKeyIndex), ...ODDS_API_KEYS.slice(0, preferredKeyIndex)];

  for (const apiKey of orderedKeys) {
    const url = new URL(`https://api.the-odds-api.com/v4${path}`);
    url.searchParams.set("apiKey", apiKey);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });

    try {
      const data = await fetchJsonWithTimeout(url.toString());
      const rows = Array.isArray(data) ? data : [];
      providerDiagnostics.theOdds.push({ path, ok: true, count: rows.length, key: `${String(apiKey).slice(0, 4)}...` });
      return rows;
    } catch (e) {
      lastError = e;
      providerDiagnostics.theOdds.push({ path, ok: false, error: e.message, key: `${String(apiKey).slice(0, 4)}...` });
      console.log("Erro The Odds API:", path, e.message);
    }
  }

  if (DEBUG_API && lastError) console.log("Todas as chaves The Odds API falharam:", lastError.message);
  return [];
}

async function getTheOddsSports() {
  if (!ODDS_API_KEYS.length || !ODDS_ENABLED) return [];

  const rows = await theOddsApiGet("/sports", { all: "true" }, 0);
  const soccer = rows
    .filter((sport) => String(sport?.key || "").startsWith("soccer_"))
    .filter((sport) => sport?.active !== false)
    .map((sport) => sport.key);

  const configured = THE_ODDS_SPORT_KEYS.filter((key) => String(key || "").startsWith("soccer_"));
  return uniqueText([...soccer, ...configured]);
}

async function getTheOddsRowsForSport(sportKey, preferredKeyIndex = 0) {
  const now = new Date();
  const future = new Date(Date.now() + PRELIVE_FALLBACK_HOURS * 36e5);

  const baseParams = {
    regions: THE_ODDS_REGIONS,
    oddsFormat: "decimal",
    dateFormat: "iso",
    commenceTimeFrom: oddsApiIso(now),
    commenceTimeTo: oddsApiIso(future)
  };

  // Evita estourar limite de requisições:
  // tenta primeiro a configuração principal; se não achar, tenta somente h2h.
  // Sem loop por várias regiões/mercados, porque a The Odds API bloqueia por frequência.
  const regionAttempts = uniqueText([THE_ODDS_REGIONS || "us"]);
  const marketAttempts = uniqueText([THE_ODDS_MARKETS || "h2h,totals,spreads", "h2h"]);

  for (const regions of regionAttempts) {
    for (const markets of marketAttempts) {
      const rows = await theOddsApiGet(`/sports/${sportKey}/odds`, {
        ...baseParams,
        regions,
        markets
      }, preferredKeyIndex);

      if (rows.length) return rows;

      // Se a requisição respondeu OK vazia, não fica batendo em variações infinitas.
      // Passa para a próxima liga para preservar quota.
      if (providerDiagnostics.theOdds.some((d) => d.path === `/sports/${sportKey}/odds` && d.ok === true)) {
        return [];
      }
    }
  }

  return [];
}

async function getTheOddsFixtures() {
  if (!ODDS_API_KEYS.length || !ODDS_ENABLED) return [];

  const output = [];
  const maxSports = Number(process.env.ODDS_MAX_SPORTS || 12);
  const discoveredSports = await getTheOddsSports();
  const sportKeys = uniqueText([...THE_ODDS_SPORT_KEYS, ...discoveredSports])
    .filter((key) => String(key || "").startsWith("soccer_"))
    .slice(0, maxSports);

  for (let i = 0; i < sportKeys.length && output.length < MAX_PRELIVE_GAMES; i += 1) {
    const sportKey = sportKeys[i];

    try {
      const rows = await getTheOddsRowsForSport(sportKey, i % Math.max(1, ODDS_API_KEYS.length));

      rows.forEach((event) => {
        const fixture = transformTheOddsFixture(event, event?.sport_title || sportKey.replace(/^soccer_/, "Soccer "));
        if (isFutureFixture(fixture) && isWithinNextHours(fixture, PRELIVE_FALLBACK_HOURS)) output.push(fixture);
      });
    } catch (e) {
      providerDiagnostics.theOdds.push({ path: sportKey, ok: false, error: e.message });
      console.log("Erro odds sport:", sportKey, e.message);
    }
  }

  return uniqueFixtures(output);
}

async function getThirdPartyFixturesCached(force = false) {
  const now = Date.now();

  if (!force && thirdPartyCache.data && now - thirdPartyCache.timestamp < THIRD_PARTY_CACHE_TTL_MS) {
    providerDiagnostics.sportmonks.push({ label: "cache", ok: true, count: (thirdPartyCache.data.live || []).length + (thirdPartyCache.data.prelive || []).length });
    providerDiagnostics.theOdds.push({ path: "cache", ok: true, count: (thirdPartyCache.data.prelive || []).filter((f) => String(f?.fixture?.id || "").startsWith("oddsapi-")).length });
    return thirdPartyCache.data;
  }

  const [sportmonks, theOdds] = await Promise.all([
    getSportmonksFixtures(),
    getTheOddsFixtures()
  ]);

  const data = {
    live: uniqueFixtures([...(sportmonks.live || [])]),
    prelive: uniqueFixtures([...(sportmonks.prelive || []), ...(theOdds || [])])
  };

  providerDiagnostics.sportmonks.push({ label: "summary", ok: true, live: data.live.length, preliveFromSportmonks: (sportmonks.prelive || []).length });
  providerDiagnostics.theOdds.push({ path: "summary", ok: true, preliveFromTheOdds: (theOdds || []).length });

  thirdPartyCache = { timestamp: now, data };
  return data;
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
  let liveFixtures = [];
  let preliveFixtures = [];
  let mode = API_KEYS.length || SPORTMONKS_TOKEN || ODDS_API_KEYS.length ? "empty" : "no-api-key";

  if (API_KEYS.length) {
    const fetchByDate = async (offset) => {
      try {
        return await apiFootballGet(
          `/fixtures?date=${todayISO(offset)}&timezone=America/Sao_Paulo`
        );
      } catch (e) {
        console.log(`Erro fixtures date ${offset}:`, e.message);
        return [];
      }
    };

    let todayRows = [];
    let tomorrowRows = [];

    try {
      liveFixtures = await apiFootballGet("/fixtures?live=all");
    } catch (e) {
      console.log("Erro live API-Football:", e.message);
    }

    [todayRows, tomorrowRows] = await Promise.all([fetchByDate(0), fetchByDate(1)]);

    const liveFromDates = uniqueFixtures([...todayRows, ...tomorrowRows])
      .filter((row) => isLive(row?.fixture?.status?.short || ""));

    liveFixtures = uniqueFixtures([...liveFixtures, ...liveFromDates]);

    preliveFixtures = uniqueFixtures([...todayRows, ...tomorrowRows])
      .filter((row) => isFutureFixture(row) && isWithinNextHours(row, PRELIVE_FALLBACK_HOURS));

    if (!liveFixtures.length && !preliveFixtures.length) {
      try {
        const nextRows = await apiFootballGet(
          `/fixtures?next=${MAX_PRELIVE_GAMES}&timezone=America/Sao_Paulo`
        );
        preliveFixtures = uniqueFixtures(nextRows)
          .filter((row) => isFutureFixture(row) && isWithinNextHours(row, PRELIVE_FALLBACK_HOURS));
      } catch (e) {
        console.log("Erro next API-Football:", e.message);
      }
    }
  }

  // Fallback real, sem demo:
  // Sportmonks cobre livescores e fixtures; The Odds API cobre odds/pre-live.
  // Eles entram junto quando a API-Football estiver vazia, limitada ou sem quota.
  try {
    const thirdParty = await getThirdPartyFixturesCached();
    liveFixtures = uniqueFixtures([...liveFixtures, ...(thirdParty.live || [])]);
    preliveFixtures = uniqueFixtures([...preliveFixtures, ...(thirdParty.prelive || [])]);
  } catch (e) {
    console.log("Erro providers externos:", e.message);
  }

  liveFixtures = uniqueFixtures(liveFixtures)
    .filter((row) => isLive(row?.fixture?.status?.short || ""))
    .sort((a, b) => fixtureSortScore(b, "live") - fixtureSortScore(a, "live"))
    .slice(0, MAX_GAMES);

  preliveFixtures = uniqueFixtures(preliveFixtures)
    .filter((row) => !liveFixtures.some((live) => fixtureKey(live) === fixtureKey(row)))
    .filter((row) => isFutureFixture(row) && isWithinNextHours(row, PRELIVE_FALLBACK_HOURS))
    .sort((a, b) => fixtureSortScore(b, "prelive") - fixtureSortScore(a, "prelive"))
    .slice(0, MAX_PRELIVE_GAMES);

  const fixtures = uniqueFixtures([...liveFixtures, ...preliveFixtures]);

  if (liveFixtures.length && preliveFixtures.length) mode = "live+prelive24";
  else if (liveFixtures.length) mode = "live";
  else if (preliveFixtures.length) mode = "prelive24";
  else mode = API_KEYS.length || SPORTMONKS_TOKEN || ODDS_API_KEYS.length ? "empty" : "no-api-key";

  return { fixtures, mode };
}

async function getStatsForFixture(fixture, mode) {
  const fixtureId = fixture?.fixture?.id;

  if (fixture?._externalStatsPack) return fixture._externalStatsPack;

  if (!fixtureId || String(fixtureId).startsWith("sportmonks-") || String(fixtureId).startsWith("oddsapi-")) {
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

async function getEventsForFixture(fixture, mode) {
  const fixtureId = fixture?.fixture?.id;

  if (fixture?._externalEventsPack) return fixture._externalEventsPack;

  if (!fixtureId || String(fixtureId).startsWith("sportmonks-") || String(fixtureId).startsWith("oddsapi-")) {
    return {
      matchEvents: [],
      hasRealEvents: false,
      eventsMode: "none"
    };
  }

  try {
    const eventsRows = await apiFootballGet(`/fixtures/events?fixture=${fixtureId}`);
    return buildRealEvents(fixture, eventsRows);
  } catch (e) {
    console.log("Erro events fixture:", fixtureId, e.message);
    return {
      matchEvents: [],
      hasRealEvents: false,
      eventsMode: "none"
    };
  }
}

async function getOddsForFixture(fixture, mode) {
  const fixtureId = fixture?.fixture?.id;

  if (fixture?._externalOddsPack) return fixture._externalOddsPack;

  if (!ODDS_ENABLED || !fixtureId || String(fixtureId).startsWith("sportmonks-") || String(fixtureId).startsWith("oddsapi-")) {
    return emptyOddsPack();
  }

  let preOddsRows = [];
  let liveOddsRows = [];

  try {
    liveOddsRows = await apiFootballGet(`/odds/live?fixture=${fixtureId}`);
  } catch (e) {
    if (DEBUG_API) console.log("Erro live odds fixture:", fixtureId, e.message);
  }

  try {
    preOddsRows = await apiFootballGet(`/odds?fixture=${fixtureId}`);
  } catch (e) {
    if (DEBUG_API) console.log("Erro odds fixture:", fixtureId, e.message);
  }

  return buildOddsPack(preOddsRows, liveOddsRows);
}

async function getSignalsPayload() {
  const now = Date.now();
  providerDiagnostics = { apiFootball: [], sportmonks: [], theOdds: [] };

  if (cache.payload && now - cache.timestamp < CACHE_TTL_MS) {
    return { ...cache.payload, cache: true };
  }

  const { fixtures, mode } = await getFixtures();
  const selected = fixtures.slice(0, MAX_GAMES + MAX_PRELIVE_GAMES);

  const selectedWithData = await Promise.all(
    selected.map(async (fixture) => {
      const [realStatsPack, eventsPack, oddsPack] = await Promise.all([
        getStatsForFixture(fixture, mode),
        getEventsForFixture(fixture, mode),
        getOddsForFixture(fixture, mode)
      ]);

      return { fixture, realStatsPack, eventsPack, oddsPack };
    })
  );

  const activeSignals = selectedWithData.flatMap(
    ({ fixture, realStatsPack, eventsPack, oddsPack }, index) =>
      buildSignals(
        fixture,
        index,
        null,
        realStatsPack,
        eventsPack,
        oddsPack
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

  const realEventsGames = new Set(
    activeSignals.filter((s) => s.hasRealEvents).map((s) => s.fixtureId)
  ).size;

  const realOddsGames = new Set(
    activeSignals.filter((s) => s.hasRealOdds || s.realOdd).map((s) => s.fixtureId)
  ).size;

  const estimatedStatsGames = Math.max(0, totalGames - realStatsGames);
  const noEventsGames = Math.max(0, totalGames - realEventsGames);
  const noOddsGames = Math.max(0, totalGames - realOddsGames);

  const payload = {
    ok: true,
    source: fixtures.some((f) => f?._externalSource) ? "multi-api" : API_KEYS.length ? "api-football" : "no-api-key",
    providers: {
      apiFootballKeys: API_KEYS.length,
      sportmonks: Boolean(SPORTMONKS_TOKEN),
      theOddsApiKeys: ODDS_API_KEYS.length
    },
    mode,
    statsMode: realStatsGames > 0 ? "real" : "estimated",
    eventsMode: realEventsGames > 0 ? "real" : "none",
    oddsMode: realOddsGames > 0 ? "real" : "none",
    oddsEnabled: ODDS_ENABLED,
    oddsBookmakerPreference: ODDS_BOOKMAKER || "",
    realStatsGames,
    estimatedStatsGames,
    realEventsGames,
    noEventsGames,
    realOddsGames,
    noOddsGames,
    activeSignals,
    liveGames,
    preliveGames,
    totalGames,
    totalSignals: activeSignals.length,
    message:
      mode === "empty"
        ? "Nenhum jogo real encontrado agora. Sem fallback/demo."
        : mode === "no-api-key"
          ? "Nenhuma API configurada no Render. Configure API_FOOTBALL_KEY, SPORTMONKS_TOKEN ou ODDS_API_KEY."
          : realStatsGames > 0 || realEventsGames > 0 || realOddsGames > 0
            ? "Dados reais carregados dos provedores disponíveis."
            : "Jogos reais carregados, mas estatísticas/odds detalhadas ainda não disponíveis para estes fixtures.",
    diagnostics: providerDiagnostics,
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
        apiFootballKeys: API_KEYS.length,
        hasSportmonks: Boolean(SPORTMONKS_TOKEN),
        oddsApiKeys: ODDS_API_KEYS.length,
        cacheTtlMs: CACHE_TTL_MS,
        maxGames: MAX_GAMES,
        preliveHours: PRELIVE_HOURS,
        preliveFallbackHours: PRELIVE_FALLBACK_HOURS,
        oddsEnabled: ODDS_ENABLED,
        oddsBookmakerPreference: ODDS_BOOKMAKER || "",
        updatedAt: new Date().toISOString()
      });
      return;
    }

    if (requestUrl.pathname === "/api/signals") {
      sendJson(res, 200, await getSignalsPayload());
      return;
    }

    if (requestUrl.pathname === "/api/debug-providers") {
      providerDiagnostics = { apiFootball: [], sportmonks: [], theOdds: [] };
      thirdPartyCache = { timestamp: 0, data: null };
      cache = { timestamp: 0, payload: null };
      const result = await getFixtures();
      sendJson(res, 200, {
        ok: true,
        mode: result.mode,
        totalFixtures: result.fixtures.length,
        liveFixtures: result.fixtures.filter((f) => isLive(f?.fixture?.status?.short || "")).length,
        preliveFixtures: result.fixtures.filter((f) => !isLive(f?.fixture?.status?.short || "")).length,
        providers: {
          apiFootballKeys: API_KEYS.length,
          sportmonks: Boolean(SPORTMONKS_TOKEN),
          theOddsApiKeys: ODDS_API_KEYS.length
        },
        diagnostics: providerDiagnostics,
        sample: result.fixtures.slice(0, 5).map((f) => ({
          source: f?._externalSource || "api-football",
          id: f?.fixture?.id,
          status: f?.fixture?.status?.short,
          date: f?.fixture?.date,
          league: f?.league?.name,
          match: `${f?.teams?.home?.name || "Casa"} vs ${f?.teams?.away?.name || "Fora"}`
        })),
        updatedAt: new Date().toISOString()
      });
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
