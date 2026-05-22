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
    status: "online"
  });
});

app.get("/api/signals", async (req, res) => {
  try {
    const sinais = [
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
        status: "AO VIVO"
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
        status: "AO VIVO"
      },
      {
        id: 3,
        league: "La Liga",
        match: "Real Madrid vs Sevilla",
        market: "Favorito Forte",
        odd: 1.55,
        minute: 20,
        type: "live",
        category: "favorito",
        favorito: "Real Madrid",
        status: "AO VIVO"
      },
      {
        id: 4,
        league: "Champions League",
        match: "PSG vs Bayern",
        market: "Over 8.5 Cantos",
        odd: 1.95,
        minute: 72,
        type: "live",
        category: "cantos",
        favorito: "PSG",
        status: "AO VIVO"
      },
      {
        id: 5,
        league: "Pré-Live",
        match: "Liverpool vs Chelsea",
        market: "Over 1.5",
        odd: 1.40,
        minute: 0,
        type: "prelive",
        category: "over15",
        favorito: "Liverpool",
        status: "PRÉ-LIVE"
      }
    ];

    res.json({
      success: true,
      liveGames: sinais.filter(s => s.type === "live").length,
      activeSignals: sinais
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
