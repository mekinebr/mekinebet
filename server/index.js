import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.PORT || 10000);
const API_BASE = "https://v3.football.api-sports.io";

const API_KEYS = [
  process.env.API_FOOTBALL_KEY,
  process.env.APISPORTS_KEY,
  process.env.API_SPORTS_KEY,
  process.env.RAPIDAPI_KEY,
].filter(Boolean);

const API_KEY = API_KEYS[0] || "";
const CACHE_TTL_MS = 30000;
const REQUEST_TIMEOUT_MS = 12000;
const MAX_LIVE_GAMES = 18;
const MAX_PRELIVE_GAMES = 30;
const PRELIVE_HOURS = 24;
const TIMEZONE = "America/Sao_Paulo";

let cache = { timestamp: 0, payload: null };

const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v || 0)));

const toNumber = (v, fb = 0) => {
  if (v === null || v === undefined || v === "") return fb;
  const n = Number(String(v).replace("%", "").replace(",", ".").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : fb;
};

function normalize(v = "") {
  return String(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

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

function isFinished(short = "") {
  return ["FT", "AET", "PEN", "CANC", "PST", "SUSP", "ABD", "AWD", "WO"].includes(String(short).toUpperCase());
}

function fixtureStartDate(row = {}) {
  const ts = Number(row?.fixture?.timestamp || 0);
  if (ts > 0) return new Date(ts * 1000);
  const d = new Date(row?.fixture?.date || "");
  return Number.isNaN(d.getTime()) ? null : d;
}

function isFutureFixture(row = {}) {
  const short = String(row?.fixture?.status?.short || "").toUpperCase();
  if (isLive(short) || isFinished(short)) return false;
  const d = fixtureStartDate(row);
  if (!d) return ["NS", "TBD"].includes(short);
  return d.getTime() >= Date.now() - 15 * 60 * 1000;
}

function isWithin24h(row = {}) {
  const d = fixtureStartDate(row);
  if (!d) return true;
  const hours = (d.getTime() - Date.now()) / 36e5;
  return hours >= -0.25 && hours <= PRELIVE_HOURS;
}

function fixtureKey(row = {}) {
  return String(row?.fixture?.id || `${row?.teams?.home?.name}-${row?.teams?.away?.name}-${row?.fixture?.date}`);
}

function uniqueFixtures(rows = []) {
  const map = new Map();
  rows.filter(Boolean).forEach((row) => {
    const key = fixtureKey(row);
    if (key && !map.has(key)) map.set(key, row);
  });
  return Array.from(map.values());
}

function supportedFixture(row = {}) {
  const text = normalize([
    row?.league?.name,
    row?.league?.country,
    row?.teams?.home?.name,
    row?.teams?.away?.name,
  ].filter(Boolean).join(" "));

  const blocked = [
    "women", "woman", "feminino", "femenino", "feminina",
    "u17", "u18", "u19", "u20", "u21", "u23",
    "youth", "junior", "juniors", "reserve", "reserves",
    "development", "amateur", "virtual", "simulation", "cyber", "esoccer",
  ];

  return !blocked.some((term) => text.includes(term));
}

function leaguePriority(row = {}) {
  const text = normalize(`${row?.league?.name || ""} ${row?.league?.country || ""}`);
  const elite = [
    "world cup", "euro", "copa america", "champions league", "libertadores",
    "sudamericana", "premier league", "la liga", "serie a", "bundesliga",
    "ligue 1", "eredivisie", "primeira liga", "brasileirao",
    "brasileiro serie a", "argentina primera", "mls",
  ];
  if (elite.some((x) => text.includes(normalize(x)))) return 100;
  return 50;
}

function fixtureSortScore(row = {}, type = "live") {
  const p = leaguePriority(row);
  const elapsed = toNumber(row?.fixture?.status?.elapsed, 0);
  const start = fixtureStartDate(row)?.getTime() || Date.now();
  const hours = Math.abs((start - Date.now()) / 36e5);
  return p * 1000 + (type === "live" ? elapsed * 2 : Math.max(0, 24 - hours) * 8);
}

async function apiFootballGet(path) {
  if (!API_KEYS.length) throw new Error("API_FOOTBALL_KEY ausente no Render");

  let lastError = null;

  for (const key of API_KEYS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE}${path}`, {
        headers: {
          "x-apisports-key": key,
          "x-rapidapi-key": key,
          "x-rapidapi-host": "v3.football.api-sports.io",
        },
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      const hasErrors = data?.errors && typeof data.errors === "object" && Object.keys(data.errors).length;

      if (!response.ok || hasErrors) {
        lastError = new Error(`API erro ${response.status}`);
        continue;
      }

      return Array.isArray(data?.response) ? data.response : [];
    } catch (e) {
      lastError = e;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("Falha API-Football");
}

function pickStat(row, names, fb = 0) {
  const wanted = names.map(normalize);
  const stats = Array.isArray(row?.statistics) ? row.statistics : [];
  const exact = stats.find((s) => wanted.includes(normalize(s?.type || "")));
  if (exact) return toNumber(exact.value, fb);
  const partial = stats.find((s) => wanted.some((w) => normalize(s?.type || "").includes(w)));
  return partial ? toNumber(partial.value, fb) : fb;
}

function totalShots(row) {
  const total = pickStat(row, ["Total Shots"], null);
  if (Number.isFinite(total)) return total;
  return pickStat(row, ["Shots on Goal"], 0) + pickStat(row, ["Shots off Goal"], 0) + pickStat(row, ["Blocked Shots"], 0);
}

function buildRealStats(fixtureRow, statsRows = []) {
  if (!Array.isArray(statsRows) || statsRows.length < 2) return null;

  const homeId = fixtureRow?.teams?.home?.id;
  const awayId = fixtureRow?.teams?.away?.id;

  const homeRow = statsRows.find((r) => String(r?.team?.id) === String(homeId)) || statsRows[0];
  const awayRow = statsRows.find((r) => String(r?.team?.id) === String(awayId)) || statsRows[1];

  const hp = pickStat(homeRow, ["Ball Possession"], 50);
  const ap = pickStat(awayRow, ["Ball Possession"], 100 - hp);

  const hs = totalShots(homeRow);
  const as = totalShots(awayRow);
  const hg = pickStat(homeRow, ["Shots on Goal"], 0);
  const ag = pickStat(awayRow, ["Shots on Goal"], 0);
  const hc = pickStat(homeRow, ["Corner Kicks"], 0);
  const ac = pickStat(awayRow, ["Corner Kicks"], 0);
  const hy = pickStat(homeRow, ["Yellow Cards"], 0);
  const ay = pickStat(awayRow, ["Yellow Cards"], 0);
  const hr = pickStat(homeRow, ["Red Cards"], 0);
  const ar = pickStat(awayRow, ["Red Cards"], 0);
  const hf = pickStat(homeRow, ["Fouls"], 0);
  const af = pickStat(awayRow, ["Fouls"], 0);

  const home = {
    posse: hp,
    finalizacoes: hs,
    noGol: hg,
    ataques: Math.round(clamp(hs * 3.2 + hc * 4.5 + hp * 0.55 + hf * 0.25, 0, 180)),
    perigosos: Math.round(clamp(hg * 6 + hc * 4 + hs * 0.8, 0, 130)),
    cantos: hc,
    cartoes: hy + hr,
    amarelos: hy,
    vermelhos: hr,
    faltas: hf,
  };

  const away = {
    posse: ap,
    finalizacoes: as,
    noGol: ag,
    ataques: Math.round(clamp(as * 3.2 + ac * 4.5 + ap * 0.55 + af * 0.25, 0, 180)),
    perigosos: Math.round(clamp(ag * 6 + ac * 4 + as * 0.8, 0, 130)),
    cantos: ac,
    cartoes: ay + ar,
    amarelos: ay,
    vermelhos: ar,
    faltas: af,
  };

  return { home, away, hasRealStats: true, source: "real" };
}

function fakeStats(i = 0, type = "prelive") {
  const home = {
    posse: 52 + (i % 8),
    finalizacoes: type === "live" ? 7 + i : 6 + (i % 5),
    noGol: type === "live" ? 2 + (i % 3) : 1 + (i % 2),
    ataques: type === "live" ? 28 + i * 2 : 20 + i,
    perigosos: type === "live" ? 14 + i : 9 + i,
    cantos: type === "live" ? 2 + (i % 4) : 1 + (i % 2),
    cartoes: 1,
    amarelos: 1,
    vermelhos: 0,
    faltas: 7 + i,
  };

  const away = {
    posse: 100 - home.posse,
    finalizacoes: Math.max(3, Math.round(home.finalizacoes * 0.7)),
    noGol: Math.max(0, Math.round(home.noGol * 0.7)),
    ataques: Math.max(10, Math.round(home.ataques * 0.75)),
    perigosos: Math.max(5, Math.round(home.perigosos * 0.75)),
    cantos: Math.max(0, Math.round(home.cantos * 0.7)),
    cartoes: 1,
    amarelos: 1,
    vermelhos: 0,
    faltas: 7 + i,
  };

  return { home, away, hasRealStats: false, source: "estimated" };
}

function buildEvents(fixtureRow, rows = []) {
  const homeId = fixtureRow?.teams?.home?.id;
  const awayId = fixtureRow?.teams?.away?.id;

  const matchEvents = Array.isArray(rows) ? rows.map((ev) => {
    const elapsed = toNumber(ev?.time?.elapsed, 0);
    const extra = toNumber(ev?.time?.extra, 0);
    const teamId = ev?.team?.id;
    const side = String(teamId) === String(homeId) ? "home" : String(teamId) === String(awayId) ? "away" : "neutral";
    const text = normalize(`${ev?.type || ""} ${ev?.detail || ""}`);
    const icon = text.includes("goal") ? "⚽" : text.includes("red") ? "🟥" : text.includes("card") ? "🟨" : text.includes("subst") ? "🔁" : "•";

    return {
      minute: elapsed + extra,
      elapsed,
      extra,
      teamId,
      teamName: ev?.team?.name || "",
      side,
      type: ev?.type || "",
      detail: ev?.detail || "",
      comments: ev?.comments || "",
      icon,
      player: ev?.player?.name || "",
      assist: ev?.assist?.name || "",
    };
  }).sort((a, b) => a.minute - b.minute) : [];

  return {
    matchEvents,
    hasRealEvents: matchEvents.length > 0,
    eventsMode: matchEvents.length ? "real" : "none",
  };
}

function calcPressure(home, away, goals, minute, type) {
  let pressure =
    28 +
    (home.finalizacoes + away.finalizacoes) * 0.9 +
    (home.noGol + away.noGol) * 3 +
    (home.perigosos + away.perigosos) * 0.5 +
    (home.cantos + away.cantos) * 1.9 +
    goals * 5;

  if (type === "live") {
    if (minute >= 60) pressure += 5;
    if (minute <= 15) pressure -= 8;
  } else {
    pressure += 8;
  }

  return Math.round(clamp(pressure, 30, 95));
}

function goalsNeeded(category = "") {
  if (category === "OVER05") return 1;
  if (category === "OVER15") return 2;
  if (category === "OVER25") return 3;
  if (category === "OVER35") return 4;
  return null;
}

function liveDecay(raw, category, ctx) {
  if (ctx.type !== "live") return Math.round(clamp(raw, 35, 94));

  const target = goalsNeeded(category);
  if (!target) return Math.round(clamp(raw, 25, 92));

  const needed = Math.max(0, target - ctx.totalGoals);
  if (needed <= 0) return 0;

  const minute = ctx.minute;
  let cap = 92;

  if (needed >= 1 && minute >= 75) cap = Math.min(cap, 74);
  if (needed >= 1 && minute >= 85) cap = Math.min(cap, 62);
  if (needed >= 2 && minute >= 55) cap = Math.min(cap, 68);
  if (needed >= 2 && minute >= 70) cap = Math.min(cap, 52);
  if (needed >= 2 && minute >= 80) cap = Math.min(cap, 38);
  if (needed >= 3 && minute >= 45) cap = Math.min(cap, 55);
  if (needed >= 3 && minute >= 65) cap = Math.min(cap, 36);

  const penalty = Math.max(0, minute - 12) * needed * (target >= 3 ? 0.55 : 0.38);
  return Math.round(clamp(raw - penalty + Math.min(10, ctx.pressure / 12), 0, cap));
}

function lineCorners(ctx) {
  const total = ctx.home.cantos + ctx.away.cantos;
  const m = ctx.minute;

  if (ctx.type !== "live") return total <= 4 ? 7.5 : total <= 6 ? 8.5 : 9.5;
  if (m <= 20) return total <= 2 ? 4.5 : total <= 4 ? 6.5 : 8.5;
  if (m <= 35) return total <= 4 ? 6.5 : total <= 6 ? 8.5 : 9.5;
  if (m <= 55) return total <= 6 ? 8.5 : total <= 8 ? 9.5 : 10.5;
  if (m <= 75) return total <= 8 ? 9.5 : total <= 10 ? 10.5 : 11.5;
  return total <= 10 ? 10.5 : 11.5;
}

function lineCards(ctx) {
  const total = ctx.home.cartoes + ctx.away.cartoes;
  const m = ctx.minute;

  if (ctx.type !== "live") return total <= 2 ? 3.5 : 4.5;
  if (m <= 25) return total <= 1 ? 2.5 : 3.5;
  if (m <= 45) return total <= 2 ? 3.5 : 4.5;
  if (m <= 65) return total <= 3 ? 4.5 : 5.5;
  return total <= 4 ? 5.5 : 6.5;
}

function confidence(category, ctx) {
  const { totalGoals, homeGoals, awayGoals, minute, pressure, home, away, type } = ctx;

  const shots = home.finalizacoes + away.finalizacoes;
  const onGoal = home.noGol + away.noGol;
  const dangerous = home.perigosos + away.perigosos;
  const corners = home.cantos + away.cantos;
  const cards = home.cartoes + away.cartoes;
  const fouls = home.faltas + away.faltas;
  const pre = type === "prelive" ? 7 : 0;

  if (category === "OVER05") {
    if (totalGoals >= 1) return 0;
    return liveDecay(34 + pressure * 0.28 + onGoal * 3 + shots * 0.45 + dangerous * 0.12 + pre, category, ctx);
  }

  if (category === "OVER15") {
    if (totalGoals >= 2) return 0;
    return liveDecay(28 + pressure * 0.26 + totalGoals * 9 + onGoal * 2.5 + shots * 0.38 + dangerous * 0.1 + pre, category, ctx);
  }

  if (category === "OVER25") {
    if (totalGoals >= 3) return 0;
    return liveDecay(22 + pressure * 0.23 + totalGoals * 8 + onGoal * 1.9 + shots * 0.3 + dangerous * 0.08 + pre, category, ctx);
  }

  if (category === "OVER35") {
    if (totalGoals >= 4) return 0;
    return liveDecay(16 + pressure * 0.19 + totalGoals * 7 + onGoal * 1.45 + shots * 0.22 + dangerous * 0.05 + pre, category, ctx);
  }

  if (category === "BTTS") {
    if (homeGoals > 0 && awayGoals > 0) return 0;

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

    return Math.round(clamp(raw, 0, type === "live" && minute >= 82 ? 58 : 84));
  }

  if (category === "MAIS_GOL") {
    const raw = 35 + pressure * 0.33 + onGoal * 2.5 + shots * 0.35 + dangerous * 0.16 + pre;
    return Math.round(clamp(type === "live" && minute >= 82 ? raw - 12 : raw, 35, type === "live" && minute >= 88 ? 68 : 90));
  }

  if (category === "CANTOS_FT") {
    const line = lineCorners(ctx);
    if (corners > line) return 0;
    return Math.round(clamp(32 + corners * 5 + pressure * 0.18 + dangerous * 0.08 + pre, 35, 88));
  }

  if (category === "CARTOES_FT") {
    const line = lineCards(ctx);
    if (cards > line) return 0;
    return Math.round(clamp(28 + cards * 10 + fouls * 1.1 + (minute >= 55 ? 6 : 0) + pre, 30, 86));
  }

  if (category === "VITORIA" || category === "HANDICAP") {
    if (type === "live") return 0;

    const homePower = home.finalizacoes * 2 + home.noGol * 5 + home.perigosos * 1.4 + home.cantos * 1.5 + home.ataques * 0.25 + home.posse * 0.12;
    const awayPower = away.finalizacoes * 2 + away.noGol * 5 + away.perigosos * 1.4 + away.cantos * 1.5 + away.ataques * 0.25 + away.posse * 0.12;
    const edge = Math.abs(homePower - awayPower) / Math.max(1, homePower + awayPower);

    return Math.round(clamp(52 + edge * 70 + pre + (category === "HANDICAP" ? 4 : 0), 52, category === "HANDICAP" ? 88 : 84));
  }

  return Math.round(clamp((pressure + 60) / 2, 45, 88));
}

function marketLabel(category, ctx) {
  const scope = ctx.type === "live" && ctx.minute > 0 && ctx.minute <= 45 ? "HT" : "FT";

  if (category === "OVER05") return ctx.type === "live" ? `Mais 1 gol / Over 0.5 ${scope}` : "Mais de 0.5 gol";
  if (category === "OVER15") return ctx.type === "live" ? `Próximo gol / Over 1.5 ${scope}` : "Mais de 1.5 gols";
  if (category === "OVER25") return ctx.type === "live" ? `Próximo gol / Over 2.5 ${scope}` : "Mais de 2.5 gols";
  if (category === "OVER35") return ctx.type === "live" ? `Próximo gol / Over 3.5 ${scope}` : "Mais de 3.5 gols";
  if (category === "BTTS") return ctx.type === "live" ? `Ambas marcam próximo ${scope}` : "Ambas marcam";
  if (category === "MAIS_GOL") return ctx.type === "live" ? `Mais gol até o fim ${scope}` : "Mais gol na partida";
  if (category === "CANTOS_FT") return `Mais de ${String(lineCorners(ctx)).replace(".", ",")} cantos ${scope}`;
  if (category === "CARTOES_FT") return `Mais de ${String(lineCards(ctx)).replace(".", ",")} cartões ${scope}`;
  if (category === "VITORIA") return "Vitória provável";
  if (category === "HANDICAP") return "Handicap / Dupla chance";
  return "Top IA";
}

function alertText(category, conf, ctx, market) {
  if (conf <= 0) return "";

  if (ctx.type === "prelive") {
    if (conf >= 84) return "🔐 VIP PRÉ-LIVE • FORTE";
    if (conf >= 72) return "🔐 VIP PRÉ-LIVE • BOM";
    return "🔐 VIP PRÉ-LIVE • OBSERVAR";
  }

  const scope = ctx.minute > 0 && ctx.minute <= 45 ? "HT" : "FT";

  if (conf >= 88) return `🚨 ${scope} SINAL MUITO FORTE`;
  if (conf >= 78) return `🔥 ${scope} SINAL FORTE`;
  if (category === "CANTOS_FT") return `🚩 ${scope} ${market}`;
  if (category === "CARTOES_FT") return `🟨 ${scope} ${market}`;
  return `📊 ${scope} MONITORANDO`;
}

function buildSignals(fixtureRow, index = 0, forcedType = null, statsPack = null, eventsPack = null) {
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

  const realStats = statsPack || fakeStats(index, type);
  const { home, away } = realStats;

  const safeEvents = eventsPack || { matchEvents: [], hasRealEvents: false, eventsMode: "none" };
  const pressure = calcPressure(home, away, totalGoals, minute, type);

  const ctx = { totalGoals, homeGoals, awayGoals, minute, pressure, home, away, type };
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
    source: "api-football",
    statsMode: realStats.hasRealStats ? "real" : "estimated",
    realStats: Boolean(realStats.hasRealStats),
    eventsMode: safeEvents.eventsMode || "none",
    hasRealEvents: Boolean(safeEvents.hasRealEvents),
    matchEvents: safeEvents.matchEvents || [],
    eventsCount: safeEvents.matchEvents?.length || 0,
    oddsMode: "none",
    hasRealOdds: false,
    realOdd: false,
    odd: "—",
    bookmaker: "",
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
    stats: { home, away },
  };

  const liveMarkets = ["MAIS_GOL", "OVER05", "OVER15", "OVER25", "OVER35", "BTTS", "CANTOS_FT", "CARTOES_FT"];
  const preliveMarkets = ["OVER15", "OVER25", "OVER35", "BTTS", "MAIS_GOL", "CANTOS_FT", "CARTOES_FT", "VITORIA", "HANDICAP"];
  const categories = type === "live" ? liveMarkets : preliveMarkets;

  const signals = categories.map((category) => {
    const market = marketLabel(category, ctx);
    const conf = confidence(category, ctx);

    return {
      ...base,
      id: `${fixtureId}-${category}`,
      signalId: `${fixtureId}-${category}`,
      market,
      mercado: market,
      rawMarket: market,
      category,
      categoria: category,
      categoryLabel: category,
      signalScope: type === "live" ? (minute > 0 && minute <= 45 ? "HT" : "FT") : "PRELIVE",
      confidence: conf,
      confianca: conf,
      pressure,
      pressao: pressure,
      alert: alertText(category, conf, ctx, market),
      backtest: Math.round(clamp(conf - 2 + leaguePriority(fixtureRow) / 20, 50, 97)),
    };
  }).filter((s) => {
    if (s.confidence <= 0) return false;
    return s.type === "live" ? s.confidence >= 45 : s.confidence >= 55;
  }).sort((a, b) => b.confidence - a.confidence);

  if (!signals.length && type === "live") {
    return [{
      ...base,
      id: `${fixtureId}-MAIS_GOL-FALLBACK`,
      signalId: `${fixtureId}-MAIS_GOL-FALLBACK`,
      market: "Mais gol até o fim",
      mercado: "Mais gol até o fim",
      category: "MAIS_GOL",
      categoria: "MAIS_GOL",
      categoryLabel: "MAIS GOL",
      confidence: Math.round(clamp(pressure, 45, 78)),
      confianca: Math.round(clamp(pressure, 45, 78)),
      pressure,
      pressao: pressure,
      alert: "📊 MONITORANDO",
      backtest: Math.round(clamp(pressure - 3, 45, 80)),
    }];
  }

  return signals.slice(0, type === "prelive" ? 9 : 5);
}

async function fetchLiveFixtures() {
  try {
    const rows = await apiFootballGet("/fixtures?live=all");
    return rows
      .filter(supportedFixture)
      .filter((row) => isLive(row?.fixture?.status?.short))
      .sort((a, b) => fixtureSortScore(b, "live") - fixtureSortScore(a, "live"))
      .slice(0, MAX_LIVE_GAMES);
  } catch (e) {
    console.log("Erro live:", e.message);
    return [];
  }
}

async function fetchPreliveFixtures() {
  const rows = [];

  for (let i = 0; i <= 1; i += 1) {
    try {
      const daily = await apiFootballGet(`/fixtures?date=${todayISO(i)}&timezone=${encodeURIComponent(TIMEZONE)}`);
      rows.push(...daily);
    } catch (e) {
      console.log(`Erro prelive dia ${i}:`, e.message);
    }
  }

  if (!rows.length) {
    try {
      rows.push(...await apiFootballGet(`/fixtures?next=${MAX_PRELIVE_GAMES}&timezone=${encodeURIComponent(TIMEZONE)}`));
    } catch (e) {
      console.log("Erro prelive next:", e.message);
    }
  }

  return uniqueFixtures(rows)
    .filter(supportedFixture)
    .filter(isFutureFixture)
    .filter(isWithin24h)
    .sort((a, b) => fixtureSortScore(b, "prelive") - fixtureSortScore(a, "prelive"))
    .slice(0, MAX_PRELIVE_GAMES);
}

async function buildFixtureSignals(fixture, index, forcedType = null) {
  const fixtureId = fixture?.fixture?.id;
  const short = fixture?.fixture?.status?.short || "";
  const type = forcedType || (isLive(short) ? "live" : "prelive");

  let statsPack = null;
  let eventsPack = null;

  if (fixtureId && type === "live") {
    try {
      const statsRows = await apiFootballGet(`/fixtures/statistics?fixture=${fixtureId}`);
      statsPack = buildRealStats(fixture, statsRows);
    } catch (e) {
      console.log(`Sem stats reais ${fixtureId}:`, e.message);
    }

    try {
      const eventRows = await apiFootballGet(`/fixtures/events?fixture=${fixtureId}`);
      eventsPack = buildEvents(fixture, eventRows);
    } catch (e) {
      console.log(`Sem eventos reais ${fixtureId}:`, e.message);
    }
  }

  return buildSignals(fixture, index, type, statsPack, eventsPack);
}

function buildScannerOpportunities(activeSignals = []) {
  const map = new Map();

  activeSignals.forEach((s) => {
    const key = `${s.fixtureId}-${s.category}-${s.market}`;
    if (!map.has(key)) {
      map.set(key, {
        ...s,
        scannerRankScore:
          Number(s.confidence || 0) * 1.25 +
          Number(s.pressure || 0) * 0.55 +
          (s.realStats ? 8 : 0) +
          (s.type === "prelive" ? 4 : 0) +
          leaguePriority({
            league: { name: s.league, country: s.country },
            teams: { home: { name: s.homeTeam }, away: { name: s.awayTeam } },
          }) / 10,
      });
    }
  });

  return Array.from(map.values())
    .filter((s) => Number(s.confidence || 0) >= 55)
    .sort((a, b) => b.scannerRankScore - a.scannerRankScore)
    .slice(0, 50)
    .map((s, index) => ({
      ...s,
      rank: index + 1,
      backtest: s.backtest || Math.round(clamp(Number(s.confidence || 0) - 2, 50, 97)),
    }));
}

async function getSignalsPayload() {
  const now = Date.now();

  if (cache.payload && now - cache.timestamp < CACHE_TTL_MS) {
    return { ...cache.payload, cache: true };
  }

  const [liveFixtures, preliveFixtures] = await Promise.all([
    fetchLiveFixtures(),
    fetchPreliveFixtures(),
  ]);

  const fixtures = uniqueFixtures([...liveFixtures, ...preliveFixtures]);
  const activeSignals = [];

  for (let i = 0; i < fixtures.length; i += 1) {
    const fixture = fixtures[i];
    const short = fixture?.fixture?.status?.short || "";
    const type = isLive(short) ? "live" : "prelive";
    const signals = await buildFixtureSignals(fixture, i, type);
    activeSignals.push(...signals);
  }

  const liveGames = new Set(activeSignals.filter((s) => s.type === "live").map((s) => s.fixtureId)).size;
  const preliveGames = new Set(activeSignals.filter((s) => s.type !== "live").map((s) => s.fixtureId)).size;
  const realStatsGames = new Set(activeSignals.filter((s) => s.realStats).map((s) => s.fixtureId)).size;
  const realEventsGames = new Set(activeSignals.filter((s) => s.hasRealEvents).map((s) => s.fixtureId)).size;

  const payload = {
    ok: true,
    source: API_KEY ? "api-football" : "sem-api-key",
    mode: liveGames ? "live+prelive24h" : "prelive24h",
    apiStatus: API_KEY ? "online" : "missing-key",
    message: activeSignals.length
      ? "Sinais carregados."
      : "Nenhum sinal forte encontrado agora. Verifique jogos ao vivo/pré-live e limite da API.",
    activeSignals,
    scannerOpportunities: buildScannerOpportunities(activeSignals),
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
    updatedAt: new Date().toISOString(),
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
    if (requestUrl.pathname === "/" || requestUrl.pathname === "/health" || requestUrl.pathname === "/api/health") {
      sendJson(res, 200, {
        ok: true,
        service: "mekinebet-api",
        routes: ["/api/signals", "/api/scanner", "/health", "/api/health"],
        hasApiKey: Boolean(API_KEY),
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    if (requestUrl.pathname === "/api/signals") {
      sendJson(res, 200, await getSignalsPayload());
      return;
    }

    if (requestUrl.pathname === "/api/scanner") {
      const payload = await getSignalsPayload();
      sendJson(res, 200, {
        ok: true,
        scannerOpportunities: payload.scannerOpportunities || [],
        total: payload.scannerOpportunities?.length || 0,
        updatedAt: payload.updatedAt,
      });
      return;
    }

    sendJson(res, 404, {
      ok: false,
      error: "Rota não encontrada",
      routes: ["/api/signals", "/api/scanner", "/health", "/api/health"],
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: "Erro ao gerar sinais",
      details: error.message,
      activeSignals: [],
      scannerOpportunities: [],
      updatedAt: new Date().toISOString(),
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`MekineBet API rodando na porta ${PORT}`);
});
