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
    res.json({
      success: true,
      liveGames: 12,
      activeSignals: [
        {
          id: 1,
          league: "Brasil Série A",
          match: "Flamengo vs Palmeiras",
          market: "Over 2.5",
          odd: 1.85,
          minute: 67,
          status: "AO VIVO"
        },
        {
          id: 2,
          league: "Premier League",
          match: "City vs Arsenal",
          market: "BTTS",
          odd: 1.72,
          minute: 54,
          status: "AO VIVO"
        }
      ]
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
