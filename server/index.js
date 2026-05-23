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
    backend: true,
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
    bet365: `https://www.bet365.bet.br`
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
    },
    {
      id: "fallback-2",
      league: "Monitoramento IA",
      match: "Manchester City vs Arsenal",
      home: "Manchester City",
      away: "Arsenal",
      score: "1 - 1",
      market: "BTTS / Ambas Marcam",
      odd: 1.72,
      minute: 54,
      type: "live",
      category: "btts",
      favorito: "Manchester City",
      status: "AO VIVO",
      confidence: 80,
      fallback: true,
      ...gerarLinksCasas("Manchester City", "Arsenal")
    },
    {
      id: "fallback-3",
      league: "Pré-live IA",
      match: "Liverpool vs Chelsea",
      home: "Liverpool",
      away: "Chelsea",
      score: "vs",
      market: "Over 1.5 Pré-live",
      odd: 1.40,
      minute: 0,
      type: "prelive",
      category: "over15",
      favorito: "Liverpool",
      status: "PRÉ-LIVE",
      confidence: 75,
      fallback: true,
      ...gerarLinksCasas("Liverpool", "Chelsea")
    }
  ];
}

app.get("/api/signals", async (req, res) => {
  try {
    const sinais = criarFallback();

    res.json({
      success: true,
      mode: "fallback-monitoring",
      totalGames: 0,
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
