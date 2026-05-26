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
    apiFootball: !!process.env.APIFOOTBALL_TOKEN,
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

async function buscarApiFootball() {
  if (!process.env.APIFOOTBALL_TOKEN) return [];

  const url =
    `https://apiv3.apifootball.com/?action=get_events` +
    `&match_live=1` +
    `&APIkey=${process.env.APIFOOTBALL_TOKEN}`;

  const response = await fetch(url);
  const texto = await response.text();

  let data = [];

  try {
    data = JSON.parse(texto);
  } catch {
    data = [];
  }

  if (!Array.isArray(data)) return [];

  return data.map((jogo, index) => {
    const home =
      jogo.match_hometeam_name ||
      jogo.nome_do_time_casa ||
      "Mandante";

    const away =
      jogo.match_awayteam_name ||
      jogo.nome_do_time_fora ||
      "Visitante";

    const homeGoals =
      jogo.match_hometeam_score ||
      jogo.pontuacao_do_time_casa ||
      jogo.home_scorer ||
      0;

    const awayGoals =
      jogo.match_awayteam_score ||
      jogo.pontuacao_do_time_fora ||
      jogo.away_scorer ||
      0;

    const statusRaw =
      jogo.match_status ||
      jogo.status_da_partida ||
      "LIVE";

    const minute =
      Number(String(statusRaw).replace(/[^0-9]/g, "")) || 0;

    return criarSinalBase({
      id: `apifootball-${jogo.match_id || index}`,
      source: "api-football",
      league: jogo.league_name || jogo.nome_da_liga || jogo.country_name,
      home,
      away,
      homeGoals,
      awayGoals,
      status: "AO VIVO",
      minute: minute || statusRaw,
      type: "live"
    });
  });
}

async function buscarFootballData() {
  if (!process.env.FOOTBALL_DATA_TOKEN) return [];

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
    const [apiFootball, footballData, openFootball, statsBomb] =
      await Promise.all([
        buscarApiFootball(),
        buscarFootballData(),
        buscarOpenFootball(),
        buscarStatsBomb()
      ]);

    let sinais = [
      ...apiFootball,
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
        apiFootball: apiFootball.length,
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
