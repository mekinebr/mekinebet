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
    }
  ];

}

app.get("/api/signals", async (req, res) => {

  try {

    let sinais = [];

    // =========================
    // API FOOTBALL
    // =========================

    if (process.env.APIFOOTBALL_TOKEN) {

      const hoje = new Date().toISOString().split("T")[0];

      const url =
        `https://apiv3.apifootball.com/?action=get_events` +
        `&from=${hoje}` +
        `&to=${hoje}` +
        `&APIkey=${process.env.APIFOOTBALL_TOKEN}`;

      const response = await fetch(url);

      const jogos = await response.json();

      if (Array.isArray(jogos)) {

        jogos.forEach((jogo, index) => {

          const home = jogo.match_hometeam;
          const away = jogo.match_awayteam;

          const score =
            `${jogo.match_hometeam_score || 0} - ${jogo.match_awayteam_score || 0}`;

          sinais.push({
            id: `real-${index}`,
            league: jogo.league_name,
            match: `${home} vs ${away}`,
            home,
            away,
            score,
            market: "Over 2.5 FT",
            odd: 1.70,
            minute: parseInt(jogo.match_time || 0),
            type: "live",
            category: "over25",
            favorito: home,
            status: "AO VIVO",
            confidence: 82,
            fallback: false,
            ...gerarLinksCasas(home, away)
          });

        });

      }

    }

    // =========================
    // FALLBACK
    // =========================

    if (sinais.length === 0) {

      sinais = criarFallback();

    }

    res.json({
      success: true,
      mode: sinais[0]?.fallback
        ? "fallback-monitoring"
        : "real-live",
      totalGames: sinais.length,
      totalOddsGames: sinais.length,
      liveGames: sinais.length,
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
