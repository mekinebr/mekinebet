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
    updatedAt: new Date().toISOString()
  });
});

function limparTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function gerarLinksCasas(home, away) {
  const busca = encodeURIComponent(`${home} ${away}`);
  return {
    novibet: `https://www.novibet.com/br/apostas-esportivas#search/${busca}`,
    betano: `https://br.betano.com/search?q=${busca}`,
    bet365: `https://www.bet365.bet.br`
  };
}

function detectarStatus(jogo) {
  const original = String(jogo.match_status || "").trim();
  const status = limparTexto(original);

  if (!original || status === "not started" || status === "ns") {
    return { type: "prelive", status: "PRÉ-LIVE", minute: 0 };
  }

  if (["finished", "ft", "cancelled", "postponed"].includes(status)) {
    return { type: "finished", status: "FINALIZADO", minute: 90 };
  }

  const minuto = Number(original.replace(/[^0-9]/g, "")) || 0;
  return { type: "live", status: "AO VIVO", minute: minuto || original };
}

function criarSinaisDoJogo(jogo) {
  const home = jogo.match_hometeam_name || "Mandante";
  const away = jogo.match_awayteam_name || "Visitante";

  const homeGoals = Number(jogo.match_hometeam_score || 0);
  const awayGoals = Number(jogo.match_awayteam_score || 0);
  const totalGoals = homeGoals + awayGoals;

  const info = detectarStatus(jogo);
  if (info.type === "finished") return [];

  const favorito =
    homeGoals > awayGoals ? home :
    awayGoals > homeGoals ? away :
    home;

  const base = {
    idBase: jogo.match_id || `${home}-${away}-${Date.now()}`,
    league: jogo.league_name || jogo.country_name || "Futebol",
    match: `${home} vs ${away}`,
    home,
    away,
    score: info.type === "live" ? `${homeGoals} - ${awayGoals}` : "vs",
    minute: info.minute,
    type: info.type,
    status: info.status,
    favorito,
    ...gerarLinksCasas(home, away)
  };

  const sinais = [];

  if (info.type === "live") {
    if (totalGoals <= 1 && Number(info.minute) >= 15) {
      sinais.push({ ...base, id: `${base.idBase}-over15`, market: "Over 1.5 FT", category: "over15", odd: 1.45, confidence: 82 });
    }

    if (totalGoals >= 1 && Number(info.minute) >= 35 && Number(info.minute) <= 80) {
      sinais.push({ ...base, id: `${base.idBase}-over25`, market: "Over 2.5 FT", category: "over25", odd: 1.85, confidence: 78 });
    }

    if (totalGoals >= 2 && Number(info.minute) >= 50) {
      sinais.push({ ...base, id: `${base.idBase}-over35`, market: "Over 3.5 FT", category: "over35", odd: 2.10, confidence: 72 });
    }

    if (homeGoals > 0 && awayGoals > 0) {
      sinais.push({ ...base, id: `${base.idBase}-btts`, market: "BTTS / Ambas Marcam", category: "btts", odd: 1.72, confidence: 80 });
    }

    if (Math.abs(homeGoals - awayGoals) <= 1 && Number(info.minute) >= 60) {
      sinais.push({ ...base, id: `${base.idBase}-cantos`, market: "Over 8.5 Cantos", category: "cantos", odd: 1.90, confidence: 76 });
    }

    if (homeGoals !== awayGoals) {
      sinais.push({ ...base, id: `${base.idBase}-favorito`, market: `Favorito Forte: ${favorito}`, category: "favorito", odd: 1.55, confidence: 84 });
    }

    if (Number(info.minute) >= 70 && homeGoals === awayGoals) {
      sinais.push({ ...base, id: `${base.idBase}-zebra`, market: "Zebra / Gol tardio", category: "zebra", odd: 2.30, confidence: 70 });
    }
  }

  if (info.type === "prelive") {
    sinais.push({ ...base, id: `${base.idBase}-pre-over15`, market: "Over 1.5 Pré-live", category: "over15", odd: 1.40, confidence: 75 });
    sinais.push({ ...base, id: `${base.idBase}-pre-1x`, market: `${favorito} ou Empate`, category: "1x", odd: 1.35, confidence: 77 });
  }

  return sinais;
}

app.get("/api/signals", async (req, res) => {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    let jogos = [];

    if (process.env.APIFOOTBALL_TOKEN) {
      const url = `https://apiv3.apifootball.com/?action=get_events&from=${hoje}&to=${hoje}&APIkey=${process.env.APIFOOTBALL_TOKEN}`;
      const response = await fetch(url);
      const data = await response.json();
      if (Array.isArray(data)) jogos = data;
    }

    const sinais = jogos.flatMap(criarSinaisDoJogo);

    res.json({
      success: true,
      totalGames: jogos.length,
      liveGames: sinais.filter((s) => s.type === "live").length,
      activeSignals: sinais,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
