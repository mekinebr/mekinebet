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
    sportmonks: !!process.env.SPORTMONKS_TOKEN,
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

function criarSinalReal(jogo, index) {
  const home =
    jogo.match_hometeam_name ||
    jogo.match_hometeam ||
    jogo.home_team ||
    jogo.nome_do_time_casa ||
    "Mandante";

  const away =
    jogo.match_awayteam_name ||
    jogo.match_awayteam ||
    jogo.away_team ||
    jogo.nome_do_time_fora ||
    "Visitante";

  const homeGoals = Number(
    jogo.match_hometeam_score ||
    jogo.pontuacao_do_time_casa ||
    jogo.home_scorer ||
    0
  );

  const awayGoals = Number(
    jogo.match_awayteam_score ||
    jogo.pontuacao_do_time_fora ||
    jogo.away_scorer ||
    0
  );

  const totalGoals = homeGoals + awayGoals;

  const statusRaw =
    jogo.match_status ||
    jogo.status_da_partida ||
    jogo.status ||
    "LIVE";

  const minuto =
    Number(String(statusRaw).replace(/[^0-9]/g, "")) || 0;

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

  if (homeGoals > 0 && awayGoals > 0) {
    market = "BTTS / Ambas Marcam";
    category = "btts";
    odd = 1.72;
    confidence = 84;
  }

  if (minuto >= 60 && Math.abs(homeGoals - awayGoals) <= 1) {
    market = "Over 8.5 Cantos";
    category = "cantos";
    odd = 1.9;
    confidence = 76;
  }

  return {
    id: `real-${jogo.match_id || jogo.id_da_partida || index}`,
    league:
      jogo.league_name ||
      jogo.nome_da_liga ||
      jogo.country_name ||
      "Futebol",
    match: `${home} vs ${away}`,
    home,
    away,
    score: `${homeGoals} - ${awayGoals}`,
    market,
    odd,
    minute: minuto || statusRaw || "LIVE",
    type: "live",
    category,
    favorito: homeGoals >= awayGoals ? home : away,
    status: "AO VIVO",
    confidence,
    fallback: false,
    ...gerarLinksCasas(home, away)
  };
}

app.get("/api/signals", async (req, res) => {
  try {
    let sinais = [];
    let apiFootballRaw = [];

    if (process.env.APIFOOTBALL_TOKEN) {
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

      if (Array.isArray(data) && data.length > 0) {
        apiFootballRaw = data;
        sinais = data.map(criarSinalReal);
      }
    }

    if (sinais.length === 0) {
      sinais = criarFallback();
    }

    res.json({
      success: true,
      mode: sinais[0]?.fallback ? "fallback-monitoring" : "real-live",
      totalGames: apiFootballRaw.length,
      totalOddsGames: 0,
      liveGames: sinais.filter((s) => s.type === "live").length,
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
