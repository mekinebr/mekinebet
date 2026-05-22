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
    apiFootball: true,
    sportmonks: true,
    oddsApi: true
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
