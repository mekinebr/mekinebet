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
  const home = jogo.match_hometeam_name || jogo.match_hometeam || "Mandante";
  const away = jogo.match_awayteam_name || jogo.match_awayteam || "Visitante";

  const homeGoals = Number(jogo.match_hometeam_score || 0);
  const awayGoals = Number(jogo.match_awayteam_score || 0);
  const totalGoals = homeGoals + awayGoals;

  const minuto = Number(String(jogo.match_status || "").replace(/[^0-9]/g, "")) || 0;

  let market = "Over 1.5 FT";
  let category = "over15";
  let odd = 1.45;

  if (totalGoals >= 1) {
    market = "Over 2.5 FT";
    category = "over25";
    odd = 1.85;
  }

  if (homeGoals > 0 && awayGoals > 0) {
    market = "BTTS / Ambas Marcam";
    category = "btts";
    odd = 1.72;
  }

  return {
    id: `real-${jogo.match_id || index}`,
    league: jogo.league_name || jogo.country_name || "Futebol",
    match: `${home} vs ${away}`,
    home,
    away,
    score: `${homeGoals} - ${awayGoals}`,
    market,
    odd,
    minute: minuto || jogo.match_status || "LIVE",
    type: "live",
    category,
    favorito: homeGoals >= awayGoals ? home : away,
    status: "AO VIVO",
    confidence: 82,
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
      const data = await response.json();

      if (Array.isArray(data)) {
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
