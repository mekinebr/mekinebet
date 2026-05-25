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

function gerarLinks(home, away) {
  const busca = encodeURIComponent(`${home} ${away}`);

  return {
    novibet: `https://www.novibet.com/br/apostas-esportivas#search/${busca}`,
    betano: `https://br.betano.com/search?q=${busca}`,
    bet365: `https://www.bet365.bet.br`
  };
}

function minuto(status) {
  return Number(String(status || "").replace(/[^0-9]/g, "")) || 0;
}

function aoVivo(status) {
  const s = String(status || "").toLowerCase();

  return (
    s &&
    ![
      "finished",
      "ft",
      "cancelled",
      "postponed",
      "not started"
    ].includes(s)
  );
}

function criarSinais(jogo, oddReal = null) {
  const home = jogo.home;
  const away = jogo.away;

  const hg = Number(jogo.homeGoals || 0);
  const ag = Number(jogo.awayGoals || 0);

  const total = hg + ag;

  const min = minuto(jogo.status);

  const favorito = hg >= ag ? home : away;

  const base = {
    league: jogo.league || "Futebol",
    match: `${home} vs ${away}`,
    home,
    away,
    score: `${hg} - ${ag}`,
    minute: min || jogo.status,
    type: "live",
    status: "AO VIVO",
    favorito,
    ...gerarLinks(home, away)
  };

  const sinais = [];

  if (total <= 1 && min >= 15) {
    sinais.push({
      ...base,
      id: `${jogo.id}-over15`,
      market: "Over 1.5 FT",
      category: "over15",
      odd: oddReal || 1.45,
      confidence: 82
    });
  }

  if (total >= 1 && min >= 35 && min <= 80) {
    sinais.push({
      ...base,
      id: `${jogo.id}-over25`,
      market: "Over 2.5 FT",
      category: "over25",
      odd: oddReal || 1.85,
      confidence: 79
    });
  }

  if (hg > 0 && ag > 0) {
    sinais.push({
      ...base,
      id: `${jogo.id}-btts`,
      market: "BTTS / Ambas Marcam",
      category: "btts",
      odd: oddReal || 1.72,
      confidence: 80
    });
  }

  if (min >= 60) {
    sinais.push({
      ...base,
      id: `${jogo.id}-cantos`,
      market: "Over 8.5 Cantos",
      category: "cantos",
      odd: oddReal || 1.90,
      confidence: 76
    });
  }

  if (hg !== ag) {
    sinais.push({
      ...base,
      id: `${jogo.id}-favorito`,
      market: `Favorito Forte: ${favorito}`,
      category: "favorito",
      odd: oddReal || 1.55,
      confidence: 85
    });
  }

  return sinais;
}

async function buscarApiFootball() {
  try {
    if (!process.env.APIFOOTBALL_TOKEN) return [];

    const hoje = new Date().toISOString().slice(0, 10);

    const url =
      `https://apiv3.apifootball.com/` +
      `?action=get_events` +
      `&from=${hoje}` +
      `&to=${hoje}` +
      `&APIkey=${process.env.APIFOOTBALL_TOKEN}`;

    const response = await fetch(url);

    const data = await response.json();

    if (!Array.isArray(data)) return [];

    return data
      .filter((j) => aoVivo(j.match_status))
      .map((j) => ({
        id: `apifootball-${j.match_id}`,
        league: j.league_name,
        home: j.match_hometeam_name,
        away: j.match_awayteam_name,
        homeGoals: j.match_hometeam_score,
        awayGoals: j.match_awayteam_score,
        status: j.match_status
      }));
  } catch {
    return [];
  }
}

async function buscarOdds() {
  try {
    if (!process.env.ODDS_API_KEY) return [];

    const url =
      `https://api.the-odds-api.com/v4/sports/soccer/odds/` +
      `?apiKey=${process.env.ODDS_API_KEY}` +
      `&regions=eu,uk` +
      `&markets=h2h,totals` +
      `&oddsFormat=decimal`;

    const response = await fetch(url);

    const data = await response.json();

    if (!Array.isArray(data)) return [];

    return data.map((j) => ({
      home: j.home_team,
      away: j.away_team,
      odd:
        j.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.price || null
    }));
  } catch {
    return [];
  }
}

async function buscarSportmonks() {
  try {
    if (!process.env.SPORTMONKS_TOKEN) return [];

    const url =
      `https://api.sportmonks.com/v3/football/fixtures` +
      `?api_token=${process.env.SPORTMONKS_TOKEN}` +
      `&include=participants;league` +
      `&filters=fixtureStates:LIVE`;

    const response = await fetch(url);

    const data = await response.json();

    if (!Array.isArray(data.data)) return [];

    return data.data.map((j) => {
      const home = j.participants?.find(
        (p) => p.meta?.location === "home"
      );

      const away = j.participants?.find(
        (p) => p.meta?.location === "away"
      );

      return {
        id: `sportmonks-${j.id}`,
        league: j.league?.name || "Sportmonks",
        home: home?.name || "Mandante",
        away: away?.name || "Visitante",
        homeGoals: 0,
        awayGoals: 0,
        status: "LIVE"
      };
    });
  } catch {
    return [];
  }
}

function buscarOdd(home, away, odds) {
  const h = String(home || "").toLowerCase();

  const a = String(away || "").toLowerCase();

  const achou = odds.find((o) => {
    const oh = String(o.home || "").toLowerCase();

    const oa = String(o.away || "").toLowerCase();

    return (
      oh.includes(h) ||
      h.includes(oh) ||
      oa.includes(a) ||
      a.includes(oa)
    );
  });

  return achou?.odd || null;
}

function fallback() {
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
      ...gerarLinks("Flamengo", "Palmeiras")
    }
  ];
}

app.get("/api/signals", async (req, res) => {
  try {
    const [apiFootball, sportmonks, odds] = await Promise.all([
      buscarApiFootball(),
      buscarSportmonks(),
      buscarOdds()
    ]);

    const jogos = [...apiFootball, ...sportmonks];

    let sinais = jogos.flatMap((jogo) => {
      const odd = buscarOdd(jogo.home, jogo.away, odds);

      return criarSinais(jogo, odd);
    });

    if (sinais.length === 0) {
      sinais = fallback();
    }

    res.json({
      success: true,
      mode: sinais[0]?.fallback
        ? "fallback-monitoring"
        : "real-live",
      totalGames: jogos.length,
      totalOddsGames: odds.length,
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
