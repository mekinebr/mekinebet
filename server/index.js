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

function normalizar(txt) {
  return String(txt || "").toLowerCase().trim();
}

function acharOdd(home, away, oddsList) {
  const h = normalizar(home);
  const a = normalizar(away);

  const jogo = oddsList.find((o) => {
    const oh = normalizar(o.home_team);
    const oa = normalizar(o.away_team);

    return (
      oh.includes(h) ||
      h.includes(oh) ||
      oa.includes(a) ||
      a.includes(oa)
    );
  });

  if (!jogo || !jogo.bookmakers?.length) return null;

  const mercado = jogo.bookmakers[0]?.markets?.[0];
  const odd = mercado?.outcomes?.[0]?.price;

  return odd || null;
}

function criarSinaisDoJogo(jogo, oddsList) {
  const home = jogo.match_hometeam_name || "Mandante";
  const away = jogo.match_awayteam_name || "Visitante";

  const homeGoals = Number(jogo.match_hometeam_score || 0);
  const awayGoals = Number(jogo.match_awayteam_score || 0);
  const totalGoals = homeGoals + awayGoals;

  const statusRaw = String(jogo.match_status || "");
  const minuto = Number(statusRaw.replace(/[^0-9]/g, "")) || 0;

  const isLive =
    statusRaw &&
    !["Not Started", "Finished", "FT", "Postponed"].includes(statusRaw);

  if (!isLive) return [];

  const oddReal = acharOdd(home, away, oddsList);

  const favorito =
    homeGoals > awayGoals ? home :
    awayGoals > homeGoals ? away :
    home;

  const base = {
    league: jogo.league_name || jogo.country_name || "Futebol",
    match: `${home} vs ${away}`,
    home,
    away,
    score: `${homeGoals} - ${awayGoals}`,
    minute: minuto || statusRaw,
    type: "live",
    status: "AO VIVO",
    favorito,
    ...gerarLinksCasas(home, away)
  };

  const sinais = [];

  if (totalGoals <= 1 && minuto >= 15) {
    sinais.push({
      ...base,
      id: `${jogo.match_id}-over15`,
      market: "Over 1.5 FT",
      category: "over15",
      odd: oddReal || 1.45,
      confidence: 82
    });
  }

  if (totalGoals >= 1 && minuto >= 35 && minuto <= 80) {
    sinais.push({
      ...base,
      id: `${jogo.match_id}-over25`,
      market: "Over 2.5 FT",
      category: "over25",
      odd: oddReal || 1.85,
      confidence: 78
    });
  }

  if (totalGoals >= 2 && minuto >= 50) {
    sinais.push({
      ...base,
      id: `${jogo.match_id}-over35`,
      market: "Over 3.5 FT",
      category: "over35",
      odd: oddReal || 2.1,
      confidence: 72
    });
  }

  if (homeGoals > 0 && awayGoals > 0) {
    sinais.push({
      ...base,
      id: `${jogo.match_id}-btts`,
      market: "BTTS / Ambas Marcam",
      category: "btts",
      odd: oddReal || 1.72,
      confidence: 80
    });
  }

  if (Math.abs(homeGoals - awayGoals) <= 1 && minuto >= 60) {
    sinais.push({
      ...base,
      id: `${jogo.match_id}-cantos`,
      market: "Over 8.5 Cantos",
      category: "cantos",
      odd: oddReal || 1.9,
      confidence: 76
    });
  }

  if (homeGoals !== awayGoals) {
    sinais.push({
      ...base,
      id: `${jogo.match_id}-favorito`,
      market: `Favorito Forte: ${favorito}`,
      category: "favorito",
      odd: oddReal || 1.55,
      confidence: 84
    });
  }

  if (minuto >= 70 && homeGoals === awayGoals) {
    sinais.push({
      ...base,
      id: `${jogo.match_id}-zebra`,
      market: "Zebra / Gol tardio",
      category: "zebra",
      odd: oddReal || 2.3,
      confidence: 70
    });
  }

  return sinais;
}

app.get("/api/signals", async (req, res) => {
  try {
    const hoje = new Date().toISOString().slice(0, 10);

    let jogos = [];
    let oddsList = [];

    if (process.env.APIFOOTBALL_TOKEN) {
      const apiUrl = `https://apiv3.apifootball.com/?action=get_events&from=${hoje}&to=${hoje}&APIkey=${process.env.APIFOOTBALL_TOKEN}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (Array.isArray(data)) jogos = data;
    }

    if (process.env.ODDS_API_KEY) {
      const oddsUrl = `https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=eu,uk&markets=h2h,totals&oddsFormat=decimal`;
      const response = await fetch(oddsUrl);
      const data = await response.json();

      if (Array.isArray(data)) oddsList = data;
    }

    const sinais = jogos.flatMap((jogo) =>
      criarSinaisDoJogo(jogo, oddsList)
    );

    res.json({
      success: true,
      totalGames: jogos.length,
      totalOddsGames: oddsList.length,
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
