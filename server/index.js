import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

const ENV = {
  APISPORTS_KEY:
    process.env.APISPORTS_KEY ||
    process.env.API_FOOTBALL_KEY ||
    process.env.APIFOOTBALL_KEY ||
    process.env.API_SPORTS_KEY ||
    "",
  ODDS_API_KEY:
    process.env.ODDS_API_KEY ||
    process.env.THE_ODDS_API_KEY ||
    process.env.ODDS_KEY ||
    "",
  FOOTBALL_DATA_TOKEN:
    process.env.FOOTBALL_DATA_TOKEN ||
    process.env.FOOTBALL_DATA_KEY ||
    process.env.FOOTBALLDATA_KEY ||
    "",
  OPENFOOTBALL_ENABLED:
    process.env.OPENFOOTBALL_ENABLED === "true" ||
    process.env.OPENFOOTBALL_ENABLED === "1",
  STATSBOMB_ENABLED:
    process.env.STATSBOMB_ENABLED === "true" ||
    process.env.STATSBOMB_ENABLED === "1"
};

app.get("/", (req, res) => {
  res.send("MekineBet Backend Online - Motor IA Real Multi-Sinais ativo");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    engine: "mekinebet-ia-real-multisinais",
    apiSports: !!ENV.APISPORTS_KEY,
    oddsApi: !!ENV.ODDS_API_KEY,
    footballData: !!ENV.FOOTBALL_DATA_TOKEN,
    openFootball: ENV.OPENFOOTBALL_ENABLED,
    statsBomb: ENV.STATSBOMB_ENABLED,
    updatedAt: new Date().toISOString()
  });
});

function gerarLinksCasas(home, away) {
  const busca = encodeURIComponent(`${home} ${away}`);
  return {
    novibet: `https://www.novibet.com/br/apostas-esportivas#search/${busca}`,
    betano: `https://br.betano.com/search?q=${busca}`,
    bet365: "https://www.bet365.bet.br"
  };
}

function numero(v, padrao = 0) {
  if (typeof v === "string") {
    const limpo = v.replace("%", "").replace(",", ".").trim();
    const n = Number(limpo);
    return Number.isFinite(n) ? n : padrao;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : padrao;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function calcularPressao(jogo) {
  const minute = numero(jogo.minute, 0);
  const homeGoals = numero(jogo.homeGoals, 0);
  const awayGoals = numero(jogo.awayGoals, 0);
  const totalGoals = homeGoals + awayGoals;

  const attacks = numero(jogo.attacks, 35);
  const dangerousAttacks = numero(jogo.dangerousAttacks, 23);
  const shots = numero(jogo.shots, 12);
  const shotsOnGoal = numero(jogo.shotsOnGoal, 4);
  const corners = numero(jogo.corners, 4);
  const possession = numero(jogo.possession, 55);

  let pressure = 38;
  pressure += clamp(dangerousAttacks * 0.75, 0, 28);
  pressure += clamp(shots * 0.75, 0, 14);
  pressure += clamp(shotsOnGoal * 2.1, 0, 18);
  pressure += clamp(corners * 1.1, 0, 8);
  pressure += clamp((possession - 50) * 0.22, -4, 6);

  if (minute >= 15) pressure += 3;
  if (minute >= 30) pressure += 4;
  if (minute >= 60) pressure += 6;
  if (minute >= 75) pressure += 5;

  if (totalGoals === 0 && minute >= 18) pressure += 5;
  if (totalGoals >= 1 && minute >= 50) pressure += 4;
  if (Math.abs(homeGoals - awayGoals) <= 1 && minute >= 60) pressure += 5;

  return clamp(Math.round(pressure), 35, 97);
}

function oddsPorMercado(category, confidence) {
  const base = {
    over05: 1.28,
    over15: 1.48,
    over25: 1.82,
    over35: 2.25,
    btts: 1.72,
    cantos: 1.78,
    cartoes: 1.75,
    topia: 1.60
  };
  const odd = base[category] || 1.70;
  if (confidence >= 92) return Number(Math.max(1.25, odd - 0.08).toFixed(2));
  if (confidence >= 85) return Number(odd.toFixed(2));
  return Number((odd + 0.12).toFixed(2));
}

function criarSinalMercado(jogo, mercado) {
  const totalGoals = numero(jogo.homeGoals, 0) + numero(jogo.awayGoals, 0);
  const pressure = calcularPressao(jogo);
  const minute = numero(jogo.minute, 0);

  let confidence = 65;
  let alert = "📊 MONITORAMENTO IA";
  let signalStatus = "MONITORANDO";

  if (mercado.category === "over05") {
    confidence = clamp(pressure + (totalGoals === 0 ? 5 : 12), 60, 96);
    alert = totalGoals >= 1 ? "✅ OVER 0.5 GREEN" : confidence >= 85 ? "🔥 OVER 0.5 FORTE" : "👀 OVER 0.5 EM OBSERVAÇÃO";
    signalStatus = totalGoals >= 1 ? "GREEN" : confidence >= 85 ? "FORTE" : "MONITORANDO";
  }

  if (mercado.category === "over15") {
    confidence = clamp(pressure + (totalGoals >= 1 ? 7 : -4), 55, 95);
    alert = totalGoals >= 2 ? "✅ OVER 1.5 GREEN" : confidence >= 84 ? "🔥 OVER 1.5 FORTE" : "📊 OVER 1.5 MONITORANDO";
    signalStatus = totalGoals >= 2 ? "GREEN" : confidence >= 84 ? "FORTE" : "MONITORANDO";
  }

  if (mercado.category === "over25") {
    confidence = clamp(pressure + (totalGoals >= 2 ? 4 : -8) + (minute >= 50 ? 4 : 0), 48, 94);
    alert = totalGoals >= 3 ? "✅ OVER 2.5 GREEN" : confidence >= 82 ? "🚨 OVER 2.5 QUENTE" : "📊 OVER 2.5 MONITORANDO";
    signalStatus = totalGoals >= 3 ? "GREEN" : confidence >= 82 ? "QUENTE" : "MONITORANDO";
  }

  if (mercado.category === "over35") {
    confidence = clamp(pressure + (totalGoals >= 3 ? 2 : -14) + (minute >= 60 ? 4 : 0), 42, 91);
    alert = totalGoals >= 4 ? "✅ OVER 3.5 GREEN" : confidence >= 80 ? "⚡ OVER 3.5 POSSÍVEL" : "📉 OVER 3.5 RISCO MÉDIO";
    signalStatus = totalGoals >= 4 ? "GREEN" : confidence >= 80 ? "POSSÍVEL" : "RISCO";
  }

  if (mercado.category === "btts") {
    const bothScored = numero(jogo.homeGoals, 0) > 0 && numero(jogo.awayGoals, 0) > 0;
    confidence = clamp(pressure + (bothScored ? 12 : totalGoals >= 1 ? 1 : -6), 50, 95);
    alert = bothScored ? "✅ BTTS GREEN" : confidence >= 82 ? "🔥 BTTS QUENTE" : "👀 BTTS EM OBSERVAÇÃO";
    signalStatus = bothScored ? "GREEN" : confidence >= 82 ? "QUENTE" : "OBSERVAÇÃO";
  }

  if (mercado.category === "cantos") {
    confidence = clamp(pressure + (numero(jogo.corners, 0) >= 6 ? 7 : 0), 55, 96);
    alert = confidence >= 86 ? "🚩 CANTOS FT FORTE" : "🚩 CANTOS AO VIVO";
    signalStatus = confidence >= 86 ? "FORTE" : "AO VIVO";
  }

  if (mercado.category === "cartoes") {
    confidence = clamp(pressure - 7 + (numero(jogo.cards, 0) >= 3 ? 10 : 0) + (minute >= 35 ? 4 : 0), 45, 92);
    alert = confidence >= 82 ? "🟨 CARTÕES FT FORTE" : "🟨 CARTÕES AO VIVO";
    signalStatus = confidence >= 82 ? "FORTE" : "AO VIVO";
  }

  if (mercado.category === "topia") {
    confidence = clamp(Math.round((pressure + numero(jogo.dangerousAttacks, 0) + numero(jogo.shotsOnGoal, 0) * 4) / 1.7), 70, 97);
    alert = confidence >= 90 ? "🚨 TOP IA SINAL MUITO FORTE" : "🧠 TOP IA";
    signalStatus = confidence >= 90 ? "MUITO FORTE" : "TOP IA";
  }

  return {
    ...jogo,
    id: `${jogo.id}-${mercado.category}`,
    market: mercado.market,
    category: mercado.category,
    odd: oddsPorMercado(mercado.category, confidence),
    confidence,
    pressure,
    alert,
    signalStatus,
    isStrong: confidence >= 85 || pressure >= 88 || alert.includes("🚨") || alert.includes("🔥"),
    ...gerarLinksCasas(jogo.home, jogo.away)
  };
}

function gerarMultisinais(jogo) {
  const totalGoals = numero(jogo.homeGoals, 0) + numero(jogo.awayGoals, 0);
  const minute = numero(jogo.minute, 0);
  const pressure = calcularPressao(jogo);

  const mercados = [
    { market: "Over 0.5 FT", category: "over05" },
    { market: "Over 1.5 FT", category: "over15" },
    { market: "Over 2.5 FT", category: "over25" },
    { market: "BTTS / Ambas Marcam", category: "btts" },
    { market: "Cantos FT", category: "cantos" },
    { market: "Cartões FT", category: "cartoes" }
  ];

  if (totalGoals >= 2 || pressure >= 78 || minute >= 60) {
    mercados.push({ market: "Over 3.5 FT", category: "over35" });
  }

  if (pressure >= 82 || numero(jogo.dangerousAttacks, 0) >= 35 || numero(jogo.shotsOnGoal, 0) >= 6) {
    mercados.push({ market: "TOP IA / Melhor Entrada", category: "topia" });
  }

  return mercados
    .map((m) => criarSinalMercado(jogo, m))
    .filter((s) => {
      if (s.category === "cartoes") return s.cards >= 1 || s.minute >= 25 || s.confidence >= 72;
      if (s.category === "cantos") return s.corners >= 3 || s.pressure >= 68;
      if (s.category === "over35") return s.confidence >= 58;
      return s.confidence >= 58;
    });
}

function criarJogoBase({
  id,
  source,
  league,
  home,
  away,
  homeGoals = 0,
  awayGoals = 0,
  status = "AO VIVO",
  minute = 0,
  type = "live",
  logoHome = "",
  logoAway = "",
  leagueLogo = "",
  country = "",
  fixtureId = "",
  attacks = 35,
  dangerousAttacks = 23,
  shots = 14,
  shotsOnGoal = 5,
  corners = 4,
  cards = 1,
  possession = 55,
  weather = "",
  fallback = false
}) {
  return {
    id,
    source,
    league: league || "Futebol",
    match: `${home} vs ${away}`,
    home,
    away,
    homeTeam: home,
    awayTeam: away,
    score: `${homeGoals} - ${awayGoals}`,
    homeGoals,
    awayGoals,
    minute,
    type,
    favorito: Number(homeGoals) >= Number(awayGoals) ? home : away,
    status,
    attacks,
    dangerousAttacks,
    shots,
    shotsOnGoal,
    corners,
    cards,
    possession,
    logoHome,
    logoAway,
    leagueLogo,
    country,
    fixtureId,
    weather,
    fallback,
    ...gerarLinksCasas(home, away)
  };
}

function criarFallback() {
  const jogo = criarJogoBase({
    id: "fallback-1",
    source: "fallback",
    league: "Monitoramento IA",
    home: "Flamengo",
    away: "Palmeiras",
    homeGoals: 1,
    awayGoals: 1,
    minute: 67,
    type: "live",
    status: "AO VIVO",
    attacks: 64,
    dangerousAttacks: 42,
    shots: 17,
    shotsOnGoal: 7,
    corners: 6,
    cards: 2,
    possession: 58,
    weather: "nublado",
    logoHome: "https://media.api-sports.io/football/teams/127.png",
    logoAway: "https://media.api-sports.io/football/teams/121.png",
    fallback: true
  });

  return gerarMultisinais(jogo).map((s) => ({ ...s, fallback: true }));
}

function extrairStat(teamStats = [], nomes = [], fallback = 0) {
  const found = teamStats.find((s) => {
    const tipo = String(s.type || "").toLowerCase();
    return nomes.some((nome) => tipo.includes(nome.toLowerCase()));
  });
  if (!found) return fallback;
  return numero(found.value, fallback);
}

async function buscarApiSportsLive() {
  if (!ENV.APISPORTS_KEY) return [];

  try {
    const response = await fetch("https://v3.football.api-sports.io/fixtures?live=all", {
      headers: { "x-apisports-key": ENV.APISPORTS_KEY }
    });

    const data = await response.json();
    if (!Array.isArray(data.response)) return [];

    const jogos = await Promise.all(
      data.response.map(async (jogo, index) => {
        const fixtureId = jogo.fixture?.id;
        const home = jogo.teams?.home?.name || "Mandante";
        const away = jogo.teams?.away?.name || "Visitante";
        const homeGoals = jogo.goals?.home ?? 0;
        const awayGoals = jogo.goals?.away ?? 0;
        const minute = jogo.fixture?.status?.elapsed || 0;

        let stats = {
          attacks: 35,
          dangerousAttacks: 23,
          shots: 14,
          shotsOnGoal: 5,
          corners: 4,
          cards: 1,
          possession: 55
        };

        try {
          if (fixtureId) {
            const statsRes = await fetch(
              `https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixtureId}`,
              { headers: { "x-apisports-key": ENV.APISPORTS_KEY } }
            );

            const statsData = await statsRes.json();

            if (Array.isArray(statsData.response) && statsData.response.length) {
              const homeStats = statsData.response[0]?.statistics || [];
              const awayStats = statsData.response[1]?.statistics || [];

              const homeAttacks = extrairStat(homeStats, ["Total Attacks"], 35);
              const awayAttacks = extrairStat(awayStats, ["Total Attacks"], 22);
              const homeDanger = extrairStat(homeStats, ["Dangerous Attacks"], 23);
              const awayDanger = extrairStat(awayStats, ["Dangerous Attacks"], 13);
              const homeShots = extrairStat(homeStats, ["Total Shots"], 14);
              const awayShots = extrairStat(awayStats, ["Total Shots"], 7);
              const homeOnGoal = extrairStat(homeStats, ["Shots on Goal"], 5);
              const awayOnGoal = extrairStat(awayStats, ["Shots on Goal"], 2);
              const homeCorners = extrairStat(homeStats, ["Corner Kicks"], 4);
              const awayCorners = extrairStat(awayStats, ["Corner Kicks"], 2);
              const homeCards = extrairStat(homeStats, ["Yellow Cards"], 1);
              const awayCards = extrairStat(awayStats, ["Yellow Cards"], 1);
              const homePossession = extrairStat(homeStats, ["Ball Possession"], 55);

              stats = {
                attacks: Math.max(homeAttacks, awayAttacks),
                dangerousAttacks: Math.max(homeDanger, awayDanger),
                shots: Math.max(homeShots, awayShots),
                shotsOnGoal: Math.max(homeOnGoal, awayOnGoal),
                corners: homeCorners + awayCorners,
                cards: homeCards + awayCards,
                possession: homePossession || 55
              };
            }
          }
        } catch (e) {
          console.log("Stats API erro:", e.message);
        }

        const base = criarJogoBase({
          id: `apisports-${fixtureId || index}`,
          source: "api-sports-live",
          league: jogo.league?.name || "API-SPORTS",
          home,
          away,
          homeGoals,
          awayGoals,
          status: "AO VIVO",
          minute,
          type: "live",
          fixtureId,
          country: jogo.league?.country || "",
          logoHome: jogo.teams?.home?.logo || "",
          logoAway: jogo.teams?.away?.logo || "",
          leagueLogo: jogo.league?.logo || "",
          ...stats
        });

        return gerarMultisinais(base);
      })
    );

    return jogos.flat();
  } catch (error) {
    console.log("ERRO API-SPORTS:", error.message);
    return [];
  }
}

async function buscarFootballData() {
  if (!ENV.FOOTBALL_DATA_TOKEN) return [];

  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const response = await fetch(
      `https://api.football-data.org/v4/matches?dateFrom=${hoje}&dateTo=${hoje}`,
      { headers: { "X-Auth-Token": ENV.FOOTBALL_DATA_TOKEN } }
    );

    const data = await response.json();
    if (!Array.isArray(data.matches)) return [];

    return data.matches.slice(0, 15).flatMap((jogo, index) => {
      const home = jogo.homeTeam?.name || "Mandante";
      const away = jogo.awayTeam?.name || "Visitante";
      const homeGoals = jogo.score?.fullTime?.home ?? 0;
      const awayGoals = jogo.score?.fullTime?.away ?? 0;
      const isLive = ["LIVE", "IN_PLAY", "PAUSED"].includes(jogo.status);

      const base = criarJogoBase({
        id: `football-data-${jogo.id || index}`,
        source: "football-data",
        league: jogo.competition?.name || "Football Data",
        home,
        away,
        homeGoals,
        awayGoals,
        status: isLive ? "AO VIVO" : "PRÉ-LIVE",
        minute: isLive ? 45 : 0,
        type: isLive ? "live" : "prelive",
        attacks: isLive ? 40 : 28,
        dangerousAttacks: isLive ? 25 : 14,
        shots: isLive ? 13 : 8,
        shotsOnGoal: isLive ? 5 : 3,
        corners: 4,
        cards: 1,
        possession: 55
      });

      return gerarMultisinais(base);
    });
  } catch (error) {
    console.log("ERRO FootballData:", error.message);
    return [];
  }
}

async function buscarOpenFootball() {
  if (!ENV.OPENFOOTBALL_ENABLED) return [];

  try {
    const url = "https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/en.1.json";
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data.matches)) return [];

    return data.matches.slice(-8).flatMap((jogo, index) => {
      const home = jogo.team1 || "Mandante";
      const away = jogo.team2 || "Visitante";
      const homeGoals = jogo.score?.ft?.[0] ?? 0;
      const awayGoals = jogo.score?.ft?.[1] ?? 0;

      const base = criarJogoBase({
        id: `openfootball-${index}`,
        source: "openfootball",
        league: data.name || "OpenFootball",
        home,
        away,
        homeGoals,
        awayGoals,
        status: "BASE HISTÓRICA",
        minute: 0,
        type: "prelive",
        attacks: 35,
        dangerousAttacks: 23,
        shots: 12,
        shotsOnGoal: 4,
        corners: 4,
        cards: 1,
        possession: 56
      });

      return gerarMultisinais(base);
    });
  } catch (error) {
    console.log("ERRO OpenFootball:", error.message);
    return [];
  }
}

async function buscarStatsBomb() {
  if (!ENV.STATSBOMB_ENABLED) return [];

  try {
    const url = "https://raw.githubusercontent.com/statsbomb/open-data/master/data/competitions.json";
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) return [];

    return data.slice(0, 5).flatMap((item, index) => {
      const base = criarJogoBase({
        id: `statsbomb-${index}`,
        source: "statsbomb",
        league: "StatsBomb Open Data",
        home: item.competition_name || "StatsBomb",
        away: item.country_name || "Open Data",
        homeGoals: 0,
        awayGoals: 0,
        status: "BASE ESTATÍSTICA",
        minute: 0,
        type: "prelive",
        attacks: 30,
        dangerousAttacks: 16,
        shots: 9,
        shotsOnGoal: 3,
        corners: 3,
        cards: 1,
        possession: 54
      });

      return gerarMultisinais(base);
    });
  } catch (error) {
    console.log("ERRO StatsBomb:", error.message);
    return [];
  }
}

app.get("/api/signals", async (req, res) => {
  try {
    const [apiSports, footballData, openFootball, statsBomb] = await Promise.all([
      buscarApiSportsLive(),
      buscarFootballData(),
      buscarOpenFootball(),
      buscarStatsBomb()
    ]);

    let sinais = [...apiSports, ...footballData, ...openFootball, ...statsBomb];

    if (sinais.length === 0) {
      sinais = criarFallback();
    }

    sinais = sinais
      .sort((a, b) => (b.confidence + b.pressure) - (a.confidence + a.pressure))
      .slice(0, 80);

    const uniqueGames = new Set(sinais.map((s) => s.match)).size;

    res.json({
      success: true,
      mode: "mekinebet-ia-real-multisinais",
      totalGames: uniqueGames,
      totalSignals: sinais.length,
      liveGames: new Set(sinais.filter((s) => s.type === "live").map((s) => s.match)).size,
      preliveGames: new Set(sinais.filter((s) => s.type === "prelive").map((s) => s.match)).size,
      sources: {
        apiSports: apiSports.length,
        footballData: footballData.length,
        openFootball: openFootball.length,
        statsBomb: statsBomb.length
      },
      activeSignals: sinais,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mode: "error",
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor MekineBet IA real multi-sinais rodando na porta ${PORT}`);
});
