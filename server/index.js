import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("MekineBet Backend Online - Motor IA ativo");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    engine: "mekinebet-ia",
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

function numero(v, padrao = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : padrao;
}

function calcularIA(jogo) {
  const minuto = numero(jogo.minute, 0);
  const homeGoals = numero(jogo.homeGoals, 0);
  const awayGoals = numero(jogo.awayGoals, 0);
  const totalGoals = homeGoals + awayGoals;

  const attacks = numero(jogo.attacks, 35);
  const dangerousAttacks = numero(jogo.dangerousAttacks, 23);
  const shots = numero(jogo.shots, 14);
  const shotsOnGoal = numero(jogo.shotsOnGoal, 5);
  const corners = numero(jogo.corners, 4);
  const cards = numero(jogo.cards, 1);
  const possession = numero(jogo.possession, 55);

  let pressure = 50;

  pressure += Math.min(20, dangerousAttacks * 0.6);
  pressure += Math.min(14, shots * 0.7);
  pressure += Math.min(14, shotsOnGoal * 1.8);
  pressure += Math.min(8, corners * 1.2);

  if (minuto >= 15) pressure += 4;
  if (minuto >= 30) pressure += 5;
  if (minuto >= 60) pressure += 6;
  if (minuto >= 75) pressure += 7;

  if (totalGoals === 0 && minuto >= 20) pressure += 6;
  if (totalGoals >= 1 && minuto >= 55) pressure += 5;
  if (Math.abs(homeGoals - awayGoals) <= 1 && minuto >= 65) pressure += 7;

  pressure = Math.max(45, Math.min(96, Math.round(pressure)));

  let market = "Over 1.5 FT";
  let category = "over15";
  let odd = 1.45;
  let confidence = 72;
  let alert = "📊 MONITORAMENTO IA";

  if (totalGoals === 0 && minuto >= 12 && pressure >= 68) {
    market = "Over 0.5 FT";
    category = "over05";
    odd = 1.35;
    confidence = 78;
    alert = "🔥 OVER 0.5 FORTE";
  }

  if (totalGoals >= 1 && pressure >= 70) {
    market = "Over 1.5 FT";
    category = "over15";
    odd = 1.55;
    confidence = 80;
    alert = "🔥 OVER 1.5 FORTE";
  }

  if (totalGoals >= 1 && minuto >= 50 && pressure >= 74) {
    market = "Over 2.5 FT";
    category = "over25";
    odd = 1.85;
    confidence = 84;
    alert = "🚨 OVER 2.5 QUENTE";
  }

  if (totalGoals >= 2 && pressure >= 76) {
    market = "Over 3.5 FT";
    category = "over35";
    odd = 2.1;
    confidence = 79;
    alert = "⚡ OVER 3.5 POSSÍVEL";
  }

  if (homeGoals > 0 && awayGoals > 0) {
    market = "BTTS / Ambas Marcam";
    category = "btts";
    odd = 1.72;
    confidence = 86;
    alert = "🔥 BTTS QUENTE";
  }

  if (corners >= 6 && pressure >= 70) {
    market = "Cantos FT";
    category = "cantos";
    odd = 1.8;
    confidence = Math.max(confidence, 81);
    alert = "🚩 CANTOS AO VIVO";
  }

  if (cards >= 3 && minuto >= 35) {
    market = "Cartões FT";
    category = "cartoes";
    odd = 1.75;
    confidence = Math.max(confidence, 78);
    alert = "🟨 CARTÕES AO VIVO";
  }

  if (pressure >= 88) {
    confidence = Math.max(confidence, 90);
    alert = "🚨 SINAL MUITO FORTE";
  }

  confidence = Math.max(confidence, Math.min(95, pressure + 4));

  return {
    market,
    category,
    odd,
    confidence,
    pressure,
    alert,
    stats: {
      attacks,
      dangerousAttacks,
      shots,
      shotsOnGoal,
      corners,
      cards,
      possession
    }
  };
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
  weather = ""
}) {
  const ia = calcularIA({
    minute,
    homeGoals,
    awayGoals,
    attacks,
    dangerousAttacks,
    shots,
    shotsOnGoal,
    corners,
    cards,
    possession
  });

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
    market: ia.market,
    category: ia.category,
    odd: ia.odd,
    minute,
    type,
    favorito: Number(homeGoals) >= Number(awayGoals) ? home : away,
    status,
    confidence: ia.confidence,
    pressure: ia.pressure,
    alert: ia.alert,
    attacks: ia.stats.attacks,
    dangerousAttacks: ia.stats.dangerousAttacks,
    shots: ia.stats.shots,
    shotsOnGoal: ia.stats.shotsOnGoal,
    corners: ia.stats.corners,
    cards: ia.stats.cards,
    possession: ia.stats.possession,
    logoHome,
    logoAway,
    leagueLogo,
    country,
    fixtureId,
    weather,
    fallback: false,
    ...gerarLinksCasas(home, away)
  };
}

function criarFallback() {
  return [
    criarSinalBase({
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
      weather: "nublado"
    })
  ].map((s) => ({ ...s, fallback: true }));
}

async function buscarApiSportsLive() {
  if (!process.env.APISPORTS_KEY) return [];

  try {
    const response = await fetch("https://v3.football.api-sports.io/fixtures?live=all", {
      headers: {
        "x-apisports-key": process.env.APISPORTS_KEY
      }
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
              {
                headers: {
                  "x-apisports-key": process.env.APISPORTS_KEY
                }
              }
            );

            const statsData = await statsRes.json();

            if (Array.isArray(statsData.response) && statsData.response.length) {
              const homeStats = statsData.response[0]?.statistics || [];

              const getStat = (name, fallback) => {
                const item = homeStats.find((s) =>
                  String(s.type).toLowerCase().includes(name.toLowerCase())
                );
                if (!item) return fallback;
                const value = String(item.value ?? "").replace("%", "");
                return numero(value, fallback);
              };

              stats = {
                attacks: getStat("Total Attacks", 35),
                dangerousAttacks: getStat("Dangerous Attacks", 23),
                shots: getStat("Total Shots", 14),
                shotsOnGoal: getStat("Shots on Goal", 5),
                corners: getStat("Corner Kicks", 4),
                cards: getStat("Yellow Cards", 1),
                possession: getStat("Ball Possession", 55)
              };
            }
          }
        } catch (e) {
          console.log("Stats API erro:", e.message);
        }

        return criarSinalBase({
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
      })
    );

    return jogos;
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
    });
  } catch (error) {
    console.log("ERRO FootballData:", error.message);
    return [];
  }
}

async function buscarOpenFootball() {
  if (process.env.OPENFOOTBALL_ENABLED !== "true") return [];

  try {
    const url = "https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/en.1.json";
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
        type: "prelive",
        attacks: 35,
        dangerousAttacks: 23,
        shots: 12,
        shotsOnGoal: 4,
        corners: 4,
        cards: 1,
        possession: 56
      });
    });
  } catch (error) {
    console.log("ERRO OpenFootball:", error.message);
    return [];
  }
}

async function buscarStatsBomb() {
  if (process.env.STATSBOMB_ENABLED !== "true") return [];

  try {
    const url = "https://raw.githubusercontent.com/statsbomb/open-data/master/data/competitions.json";
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) return [];

    return data.slice(0, 5).map((item, index) => {
      return criarSinalBase({
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
      .slice(0, 60);

    res.json({
      success: true,
      mode: "mekinebet-ia",
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
      mode: "error",
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor MekineBet IA rodando na porta ${PORT}`);
});
