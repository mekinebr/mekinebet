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
    apiFootball: !!process.env.APIFOOTBALL_TOKEN
  });
});

function criarSinalDoJogo(jogo) {
  const home = jogo.match_hometeam_name || "Mandante";
  const away = jogo.match_awayteam_name || "Visitante";

  const homeGoals = Number(jogo.match_hometeam_score || 0);
  const awayGoals = Number(jogo.match_awayteam_score || 0);
  const totalGoals = homeGoals + awayGoals;

  const minuto = jogo.match_status || "AO VIVO";

  let market = "Over 1.5 FT";
  let category = "over15";

  if (totalGoals >= 1 && totalGoals < 3) {
    market = "Over 2.5 FT";
    category = "over25";
  }

  if (homeGoals === awayGoals && totalGoals >= 2) {
    market = "BTTS";
    category = "btts";
  }

  if (homeGoals > awayGoals) {
    market = "Favorito Forte";
    category = "favorito";
  }

  return {
    id: jogo.match_id || `${home}-${away}`,
    league: jogo.league_name || jogo.country_name || "Futebol",
    match: `${home} vs ${away}`,
    market,
    odd: Number((1.45 + Math.random() * 0.8).toFixed(2)),
    minute: minuto,
    type: "live",
    category,
    favorito: homeGoals >= awayGoals ? home : away,
    status: "AO VIVO",
    score: `${homeGoals} - ${awayGoals}`
  };
}

app.get("/api/signals", async (req, res) => {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    let jogos = [];

    if (process.env.APIFOOTBALL_TOKEN) {
      const url =
        `https://apiv3.apifootball.com/?action=get_events&from=${hoje}&to=${hoje}&APIkey=${process.env.APIFOOTBALL_TOKEN}`;

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        jogos = data;
      }
    }

    const jogosAoVivo = jogos.filter((jogo) => {
      const status = String(jogo.match_status || "").toLowerCase();

      return (
        status &&
        status !== "not started" &&
        status !== "finished" &&
        status !== "ft" &&
        status !== "postponed"
      );
    });

    const sinais = jogosAoVivo.slice(0, 20).map(criarSinalDoJogo);

    if (sinais.length === 0) {
      sinais.push(
        {
          id: 1,
          league: "Brasil Série A",
          match: "Flamengo vs Palmeiras",
          market: "Over 2.5 FT",
          odd: 1.85,
          minute: 67,
          type: "live",
          category: "over25",
          favorito: "Flamengo",
          status: "AO VIVO",
          score: "1 - 1"
        },
        {
          id: 2,
          league: "Premier League",
          match: "Manchester City vs Arsenal",
          market: "BTTS",
          odd: 1.72,
          minute: 54,
          type: "live",
          category: "btts",
          favorito: "Manchester City",
          status: "AO VIVO",
          score: "1 - 1"
        }
      );
    }

    res.json({
      success: true,
      liveGames: jogosAoVivo.length || sinais.length,
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
