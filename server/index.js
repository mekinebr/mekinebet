import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("MekineBet Backend Online");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    apiSports: !!process.env.APISPORTS_KEY,
    oddsApi: !!process.env.ODDS_API_KEY,
    footballData: !!process.env.FOOTBALL_DATA_TOKEN,
    openFootball: process.env.OPENFOOTBALL_ENABLED === "true",
    statsBomb: process.env.STATSBOMB_ENABLED === "true",
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

function criarFallback() {
  return [
    {
      id: "fallback-1",
      source: "fallback",
      league: "Monitoramento IA",
      match: "Flamengo vs Palmeiras",
      home: "Flamengo",
      away: "Palmeiras",
      score: "1 - 1",
      market: "Over 2.5 FT",
      odd: 1.85,
      minute: 67,
      type: "live",
      category: "over25",
      favorito: "Flamengo",
      status: "AO VIVO",
      confidence: 82,
      fallback: true,
      ...gerarLinksCasas("Flamengo", "Palmeiras")
    }
  ];
}

function criarSinalBase({
  id,
  source,
  league,
  home,
  away,
  homeGoals = 0,
  awayGoals = 0,
  status = "AO VIVO",
  minute = 0,
  type = "live"
}) {
  const totalGoals = Number(homeGoals) + Number(awayGoals);

  let market = "Over 1.5 FT";
  let category = "over15";
  let odd = 1.45;
  let confidence = 78;

  if (totalGoals >= 1) {
    market = "Over 2.5 FT";
    category = "over25";
    odd = 1.85;
    confidence = 82;
  }

  if (totalGoals >= 2) {
    market = "Over 3.5 FT";
    category = "over35";
    odd = 2.1;
    confidence = 76;
  }

  if (Number(homeGoals) > 0 && Number(awayGoals) > 0) {
    market = "BTTS / Ambas Marcam";
    category = "btts";
    odd = 1.72;
    confidence = 84;
  }

  return {
    id,
    source,
    league: league || "Futebol",
    match: `${home} vs ${away}`,
    home,
    away,
    score: `${homeGoals} - ${awayGoals}`,
    market,
    odd,
    minute,
    type,
    category,
    favorito: Number(homeGoals) >= Number(awayGoals) ? home : away,
    status,
    confidence,
    fallback: false,
    ...gerarLinksCasas(home, away)
  };
}

async function buscarApiSportsLive() {
  if (!process.env.APISPORTS_KEY) return [];

  try {
    const response = await fetch(
      "https://v3.football.api-sports.io/fixtures?live=all",
      {
        headers: {
          "x-apisports-key": process.env.APISPORTS_KEY
        }
      }
    );

    const data = await response.json();

    if (!Array.isArray(data.response)) return [];

    return data.response.map((jogo, index) => {
      const home = jogo.teams?.home?.name || "Mandante";
      const away = jogo.teams?.away?.name || "Visitante";

      const homeGoals = jogo.goals?.home ?? 0;
      const awayGoals = jogo.goals?.away ?? 0;

      const minuto = jogo.fixture?.status?.elapsed || "LIVE";

      return criarSinalBase({
        id: `apisports-${jogo.fixture?.id || index}`,
        source: "api-sports-live",
        league: jogo.league?.name || "API-SPORTS",
        home,
        away,
        homeGoals,
        awayGoals,
        status: "AO VIVO",
        minute: minuto,
        type: "live"
      });
    });
  } catch (error) {
    console.log("ERRO API-SPORTS:", error.message);
    return [];
  }
}

async function buscarFootballData() {
  if (!process.env.FOOTBALL_DATA_TOKEN) return [];

  try {
    const hoje = new Date().toISOString().slice(0, 10);

    const response = await fetch(
      `https://api.football-data.org/v4/matches?dateFrom=${hoje}&dateTo=${hoje}`,
      {
        headers: {
          "X-Auth-Token": process.env.FOOTBALL_DATA_TOKEN
        }
      }
    );

    const data = await response.json();

    if (!Array.isArray(data.matches)) return [];

    return data.matches.slice(0, 15).map((jogo, index) => {
      const home = jogo.homeTeam?.name || "Mandante";
      const away = jogo.awayTeam?.name || "Visitante";

      const homeGoals = jogo.score?.fullTime?.home ?? 0;
      const awayGoals = jogo.score?.fullTime?.away ?? 0;

      const isLive = ["LIVE", "IN_PLAY", "PAUSED"].includes(jogo.status);

      return criarSinalBase({
        id: `football-data-${jogo.id || index}`,
        source: "football-data",
        league: jogo.competition?.name || "Football Data",
        home,
        away,
        homeGoals,
        awayGoals,
        status: isLive ? "AO VIVO" : "PRÉ-LIVE",
        minute: isLive ? "LIVE" : 0,
        type: isLive ? "live" : "prelive"
      });
    });
  } catch {
    return [];
  }
}

async function buscarOpenFootball() {
  if (process.env.OPENFOOTBALL_ENABLED !== "true") return [];

  try {
    const url =
      "https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/en.1.json";

    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data.matches)) return [];

    return data.matches.slice(-8).map((jogo, index) => {
      const home = jogo.team1 || "Mandante";
      const away = jogo.team2 || "Visitante";

      const homeGoals = jogo.score?.ft?.[0] ?? 0;
      const awayGoals = jogo.score?.ft?.[1] ?? 0;

      return criarSinalBase({
        id: `openfootball-${index}`,
        source: "openfootball",
        league: data.name || "OpenFootball",
        home,
        away,
        homeGoals,
        awayGoals,
        status: "BASE HISTÓRICA",
        minute: 0,
        type: "prelive"
      });
    });
  } catch {
    return [];
  }
}

async function buscarStatsBomb() {
  if (process.env.STATSBOMB_ENABLED !== "true") return [];

  try {
    const url =
      "https://raw.githubusercontent.com/statsbomb/open-data/master/data/competitions.json";

    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) return [];

    return data.slice(0, 5).map((item, index) => {
      const home = item.competition_name || "StatsBomb";
      const away = item.country_name || "Open Data";

      return criarSinalBase({
        id: `statsbomb-${index}`,
        source: "statsbomb",
        league: "StatsBomb Open Data",
        home,
        away,
        homeGoals: 0,
        awayGoals: 0,
        status: "BASE ESTATÍSTICA",
        minute: 0,
        type: "prelive"
      });
    });
  } catch {
    return [];
  }
}

app.get("/api/signals", async (req, res) => {
  try {
    const [apiSports, footballData, openFootball, statsBomb] =
      await Promise.all([
        buscarApiSportsLive(),
        buscarFootballData(),
        buscarOpenFootball(),
        buscarStatsBomb()
      ]);

    let sinais = [
      ...apiSports,
      ...footballData,
      ...openFootball,
      ...statsBomb
    ];

    if (sinais.length === 0) {
      sinais = criarFallback();
    }

    res.json({
      success: true,
      mode: sinais[0]?.fallback ? "fallback-monitoring" : "multi-source",
      totalGames: sinais.length,
      liveGames: sinais.filter((s) => s.type === "live").length,
      preliveGames: sinais.filter((s) => s.type === "prelive").length,
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
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
