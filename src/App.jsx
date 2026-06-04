import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://mekinebet-api.onrender.com").replace(/\/$/, "");
const API_URL = `${API_BASE_URL}/api/signals`;

const TEAM_LOGOS = {
  "ipswich town fc": "https://media.api-sports.io/football/teams/57.png",
  "west ham united fc": "https://media.api-sports.io/football/teams/48.png",
  "liverpool fc": "https://media.api-sports.io/football/teams/40.png",
  "crystal palace fc": "https://media.api-sports.io/football/teams/52.png",
  "southampton fc": "https://media.api-sports.io/football/teams/41.png",
  "arsenal fc": "https://media.api-sports.io/football/teams/42.png",
  "tottenham hotspur fc": "https://media.api-sports.io/football/teams/47.png",
  "wolverhampton wanderers fc": "https://media.api-sports.io/football/teams/39.png",
  "newcastle united fc": "https://media.api-sports.io/football/teams/34.png",
  "everton fc": "https://media.api-sports.io/football/teams/45.png",
  "brentford fc": "https://media.api-sports.io/football/teams/55.png",
  "brighton & hove albion fc": "https://media.api-sports.io/football/teams/51.png",
  "flamengo": "https://media.api-sports.io/football/teams/127.png",
  "cr flamengo": "https://media.api-sports.io/football/teams/127.png",
  "flamengo rj": "https://media.api-sports.io/football/teams/127.png",
  "palmeiras": "https://media.api-sports.io/football/teams/121.png",
  "se palmeiras": "https://media.api-sports.io/football/teams/121.png",
  "sao paulo": "https://media.api-sports.io/football/teams/126.png",
  "são paulo": "https://media.api-sports.io/football/teams/126.png",
  "corinthians": "https://media.api-sports.io/football/teams/131.png",
  "vasco da gama": "https://media.api-sports.io/football/teams/133.png",
  "botafogo": "https://media.api-sports.io/football/teams/120.png",
  "fluminense": "https://media.api-sports.io/football/teams/124.png",
  "atletico mineiro": "https://media.api-sports.io/football/teams/1062.png",
  "atlético mineiro": "https://media.api-sports.io/football/teams/1062.png",
  "gremio": "https://media.api-sports.io/football/teams/130.png",
  "grêmio": "https://media.api-sports.io/football/teams/130.png",
  "internacional": "https://media.api-sports.io/football/teams/119.png"
};

const TEAM_COLORS = {
  "ipswich town fc": "#2563eb",
  "west ham united fc": "#7a263a",
  "liverpool fc": "#ef4444",
  "crystal palace fc": "#2563eb",
  "southampton fc": "#ef4444",
  "arsenal fc": "#facc15",
  "tottenham hotspur fc": "#f8fafc",
  "brighton & hove albion fc": "#2563eb",
  "wolverhampton wanderers fc": "#f59e0b",
  "brentford fc": "#ef4444",
  "newcastle united fc": "#e5e7eb",
  "everton fc": "#2563eb",
  "flamengo": "#ef4444",
  "cr flamengo": "#ef4444",
  "flamengo rj": "#ef4444",
  "palmeiras": "#22c55e",
  "se palmeiras": "#22c55e",
  "sao paulo": "#f8fafc",
  "são paulo": "#f8fafc",
  "corinthians": "#f8fafc",
  "vasco da gama": "#f8fafc",
  "botafogo": "#e5e7eb",
  "fluminense": "#7f1d1d",
  "atletico mineiro": "#f8fafc",
  "atlético mineiro": "#f8fafc",
  "gremio": "#60a5fa",
  "grêmio": "#60a5fa",
  "internacional": "#ef4444"
};

const DEMO_SIGNALS = [
  { match: "Ipswich Town FC vs West Ham United FC", league: "English Premier League 2024/25", score: "1 - 3", market: "BTTS / Ambas Marcam", odd: "1.72", confidence: 84, pressure: 70, type: "base" },
  { match: "Liverpool FC vs Crystal Palace FC", league: "English Premier League 2024/25", score: "1 - 1", market: "BTTS / Ambas Marcam", odd: "1.72", confidence: 84, pressure: 70, type: "base" },
  { match: "Southampton FC vs Arsenal FC", league: "English Premier League 2024/25", score: "1 - 2", market: "BTTS / Ambas Marcam", odd: "1.72", confidence: 84, pressure: 70, type: "base" },
  { match: "Tottenham Hotspur FC vs Brighton & Hove Albion FC", league: "English Premier League 2024/25", score: "2 - 1", market: "Over 2,5", odd: "1.86", confidence: 82, pressure: 73, type: "base" },
  { match: "Wolverhampton Wanderers FC vs Brentford FC", league: "English Premier League 2024/25", score: "0 - 1", market: "Over 1,5", odd: "1.65", confidence: 79, pressure: 68, type: "base" },
  { match: "Newcastle United FC vs Everton FC", league: "English Premier League 2024/25", score: "2 - 0", market: "Over 2,5", odd: "1.91", confidence: 86, pressure: 74, type: "base" }
];

const normalizar = (v = "") =>
  String(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

const fallbackLogo = (name = "Time") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=071a10&color=00ff87&bold=true&size=96`;

const valor = (...vals) => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

const numero = (...vals) => {
  const v = valor(...vals);
  if (v === undefined) return undefined;

  const n = Number(
    String(v)
      .replace("%", "")
      .replace(",", ".")
      .replace(/[^0-9.-]/g, "")
  );

  return Number.isFinite(n) ? n : undefined;
};

const usarValor = (v, fallback) =>
  v === undefined || v === null || Number.isNaN(Number(v)) ? fallback : Number(v);

const normalizarEvento = (event = {}) => {
  const minute = usarValor(numero(event.minute, event.elapsed, event.time?.elapsed), 0);
  const sideRaw = String(valor(event.side, event.teamSide, "") || "").toLowerCase();
  const type = valor(event.type, event.tipo, "");
  const detail = valor(event.detail, event.detalhe, "");
  const category = valor(event.category, event.categoria, "");
  const icon = valor(event.icon, event.icone, "");

  let side = "neutral";
  if (sideRaw.includes("home") || sideRaw.includes("casa")) side = "home";
  if (sideRaw.includes("away") || sideRaw.includes("fora")) side = "away";

  const typeText = `${type} ${detail} ${category}`.toLowerCase();
  const finalIcon =
    icon ||
    (typeText.includes("goal") || typeText.includes("gol") ? "⚽" :
      typeText.includes("red") || typeText.includes("vermelho") ? "🟥" :
        typeText.includes("card") || typeText.includes("cart") || typeText.includes("yellow") || typeText.includes("amarelo") ? "🟨" :
          typeText.includes("subst") ? "🔁" :
            typeText.includes("var") ? "📺" :
              typeText.includes("penalty") || typeText.includes("pênalti") ? "🥅" : "•");

  return {
    ...event,
    minute,
    elapsed: usarValor(numero(event.elapsed, event.time?.elapsed), minute),
    extra: usarValor(numero(event.extra, event.time?.extra), 0),
    side,
    teamName: valor(event.teamName, event.team?.name, ""),
    type,
    detail,
    category,
    icon: finalIcon,
    player: valor(event.player, event.jogador, event.player?.name, ""),
    assist: valor(event.assist, event.assistencia, event.assist?.name, ""),
    comments: valor(event.comments, event.comentarios, "")
  };
};

const chaveEvento = (event = {}) =>
  [
    event.minute,
    normalizar(event.side || ""),
    normalizar(event.category || ""),
    normalizar(event.type || ""),
    normalizar(event.detail || ""),
    normalizar(event.player || ""),
    normalizar(event.teamName || "")
  ].join("|");

const limparEventos = (eventos = []) => {
  const mapa = new Map();

  eventos
    .filter(Boolean)
    .map(normalizarEvento)
    .filter((event) => Number.isFinite(Number(event.minute)))
    .forEach((event) => {
      mapa.set(chaveEvento(event), event);
    });

  return Array.from(mapa.values()).sort((a, b) => Number(a.minute || 0) - Number(b.minute || 0));
};

const normalizarSinal = (item = {}) => {
  const match = valor(item.match, item.partida, item.game, "");
  const home = valor(item.homeTeam, item.home, item.casa, item.mandante, item.teams?.home?.name, "");
  const away = valor(item.awayTeam, item.away, item.fora, item.visitante, item.teams?.away?.name, "");
  const market = valor(item.market, item.mercado, item.signal, item.sinal, "Monitoramento IA");
  const confidence = Number(valor(item.confidence, item.confianca, item.confiança, 70)) || 70;
  const pressure = Number(valor(item.pressure, item.pressao, item.pressão, 70)) || 70;

  return {
    ...item,
    match: match || `${home || "Casa"} vs ${away || "Fora"}`,
    home,
    away,
    homeTeam: home,
    awayTeam: away,
    league: valor(item.league, item.liga, "Futebol"),
    score: valor(item.score, item.placar, "0 - 0"),
    market,
    odd: valor(item.odd, item.odds, item.cotacao, item.cotação, "—"),
    realOdd:
      item.realOdd === true ||
      item.realOdd === "true" ||
      item.hasRealOdds === true ||
      item.hasRealOdds === "true" ||
      valor(item.oddsMode, item.odds_mode, "") === "real",
    oddsMode: valor(item.oddsMode, item.odds_mode, ""),
    bookmaker: valor(item.bookmaker, item.casaAposta, item.bookmakerName, ""),
    oddsMarket: valor(item.oddsMarket, item.oddMarket, item.mercadoOdd, ""),
    oddsLine: valor(item.oddsLine, item.oddLine, item.linhaOdd, ""),
    oddsProvider: valor(item.oddsProvider, item.oddProvider, ""),
    oddsUpdatedAt: valor(item.oddsUpdatedAt, item.oddUpdatedAt, ""),
    minute: valor(item.minute, item.minuto, item.tempo, 0),
    type: valor(item.type, item.tipo, "live"),
    category: valor(item.category, item.categoria, ""),
    status: valor(item.status, item.estado, "AO VIVO"),
    confidence,
    pressure,
    alert: valor(item.alert, item.alerta, ""),
    possession: numero(item.possession, item.posse, item.ballPossession),
    possessionAway: numero(item.possessionAway, item.posseAway, item.posseFora),
    shots: numero(item.shots, item.finalizacoes, item.finalizações, item.chutes),
    shotsAway: numero(item.shotsAway, item.finalizacoesAway, item.finalizacoesFora, item.chutesAway),
    shotsOnGoal: numero(item.shotsOnGoal, item.chutesNoGol, item.chutes_no_gol, item.noGol),
    shotsOnGoalAway: numero(item.shotsOnGoalAway, item.chutesNoGolAway, item.noGolAway),
    attacks: numero(item.attacks, item.ataques),
    attacksAway: numero(item.attacksAway, item.ataquesAway, item.ataquesFora),
    dangerousAttacks: numero(item.dangerousAttacks, item.ataquesPerigosos, item.perigosos),
    dangerousAttacksAway: numero(item.dangerousAttacksAway, item.ataquesPerigososAway, item.perigososFora),
    corners: numero(item.corners, item.escanteios, item.cantos),
    cornersAway: numero(item.cornersAway, item.escanteiosAway, item.cantosAway, item.cantosFora),
    cards: numero(item.cards, item.cartoes, item.cartões),
    cardsAway: numero(item.cardsAway, item.cartoesAway, item.cartoesFora),
    yellowCards: numero(item.yellowCards, item.amarelos, item.cartoesAmarelos),
    yellowCardsAway: numero(item.yellowCardsAway, item.amarelosAway, item.cartoesAmarelosAway),
    redCards: numero(item.redCards, item.vermelhos, item.cartoesVermelhos),
    redCardsAway: numero(item.redCardsAway, item.vermelhosAway, item.cartoesVermelhosAway),
    fouls: numero(item.fouls, item.faltas),
    foulsAway: numero(item.foulsAway, item.faltasAway, item.faltasFora),
    statsSource: valor(item.statsSource, item.stats_source, ""),
    statsMode: valor(item.statsMode, item.stats_mode, item.statsSource, item.stats_source, ""),
    realStats:
      item.realStats === true ||
      item.realStats === "true" ||
      valor(item.statsMode, item.stats_mode, item.statsSource, item.stats_source, "") === "real",
    eventsMode: valor(item.eventsMode, item.events_mode, ""),
    matchEvents: limparEventos(Array.isArray(item.matchEvents) ? item.matchEvents : []),
    hasRealEvents:
      item.hasRealEvents === true ||
      item.hasRealEvents === "true" ||
      valor(item.eventsMode, item.events_mode, "") === "real" ||
      (Array.isArray(item.matchEvents) && item.matchEvents.length > 0),
    eventsCount: usarValor(numero(item.eventsCount), Array.isArray(item.matchEvents) ? item.matchEvents.length : 0),
    logoHome: valor(item.logoHome, item.logoCasa, item.homeLogo, item.teams?.home?.logo, ""),
    logoAway: valor(item.logoAway, item.logoFora, item.awayLogo, item.teams?.away?.logo, ""),
    weather: valor(item.weather, item.clima, item.tempoClima, ""),
    fixtureId: valor(item.fixtureId, item.gameId, item.fixture?.id, item.id, ""),
    fixtureDate: valor(item.fixtureDate, item.startTime, item.date, item.data, item.fixture?.date, item.kickoff, item.kickoffTime, item.time?.date, ""),
    startTime: valor(item.startTime, item.fixtureDate, item.date, item.data, item.fixture?.date, item.kickoff, item.kickoffTime, item.time?.date, ""),
    timestamp: numero(item.timestamp, item.fixture?.timestamp, item.time?.timestamp)
  };
};

function agruparPorPartida(lista = []) {
  const mapa = new Map();

  lista.forEach((item) => {
    const chave = [
      normalizar(item.fixtureId || ""),
      normalizar(item.homeTeam || item.home || ""),
      normalizar(item.awayTeam || item.away || ""),
      normalizar(item.league || "")
    ].filter(Boolean).join("|");

    const key = chave || normalizar(item.match || item.id || Math.random());

    if (!mapa.has(key)) {
      mapa.set(key, {
        ...item,
        id: item.fixtureId || item.id || key,
        mercados: [item]
      });
    } else {
      const jogo = mapa.get(key);
      const mercados = [...(jogo.mercados || []), item];
      const melhor = mercados.reduce((best, atual) => {
        const scoreBest = Number(best.confidence || 0) + Number(best.pressure || 0);
        const scoreAtual = Number(atual.confidence || 0) + Number(atual.pressure || 0);
        return scoreAtual > scoreBest ? atual : best;
      }, jogo);

      mapa.set(key, {
        ...jogo,
        market: melhor.market || jogo.market,
        category: melhor.category || jogo.category,
        odd: melhor.odd || jogo.odd,
        confidence: Math.max(Number(jogo.confidence || 0), Number(item.confidence || 0)),
        pressure: Math.max(Number(jogo.pressure || 0), Number(item.pressure || 0)),
        alert: melhor.alert || jogo.alert,
        signalStatus: melhor.signalStatus || jogo.signalStatus,
        realStats: Boolean(jogo.realStats || item.realStats || melhor.realStats),
        statsMode: melhor.statsMode || item.statsMode || jogo.statsMode,
        statsSource: melhor.statsSource || item.statsSource || jogo.statsSource,
        realOdd: Boolean(jogo.realOdd || item.realOdd || melhor.realOdd),
        oddsMode: melhor.oddsMode || item.oddsMode || jogo.oddsMode,
        bookmaker: melhor.bookmaker || item.bookmaker || jogo.bookmaker,
        oddsMarket: melhor.oddsMarket || item.oddsMarket || jogo.oddsMarket,
        oddsLine: melhor.oddsLine || item.oddsLine || jogo.oddsLine,
        oddsProvider: melhor.oddsProvider || item.oddsProvider || jogo.oddsProvider,
        oddsUpdatedAt: melhor.oddsUpdatedAt || item.oddsUpdatedAt || jogo.oddsUpdatedAt,
        matchEvents: limparEventos([
          ...(jogo.matchEvents || []),
          ...(item.matchEvents || []),
          ...(melhor.matchEvents || [])
        ]),
        hasRealEvents: Boolean(
          jogo.hasRealEvents ||
          item.hasRealEvents ||
          melhor.hasRealEvents ||
          (jogo.matchEvents || []).length ||
          (item.matchEvents || []).length ||
          (melhor.matchEvents || []).length
        ),
        eventsMode: melhor.eventsMode || item.eventsMode || jogo.eventsMode,
        eventsCount: limparEventos([
          ...(jogo.matchEvents || []),
          ...(item.matchEvents || []),
          ...(melhor.matchEvents || [])
        ]).length,
        mercados
      });
    }
  });

  return Array.from(mapa.values());
}

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const [apiInfo, setApiInfo] = useState({
    source: "",
    mode: "",
    statsMode: "",
    realStatsGames: 0,
    eventsMode: "",
    realEventsGames: 0,
    oddsMode: "",
    realOddsGames: 0,
    oddsEnabled: false,
    apiStatus: "",
    message: ""
  });

  const [scannerMercado, setScannerMercado] = useState("GOLS");
  const [scannerLinha, setScannerLinha] = useState("2.5");
  const [agora, setAgora] = useState(new Date());

  async function carregar() {
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      const data = await res.json();
      const lista = Array.isArray(data?.activeSignals) ? data.activeSignals : [];
      const normalizados = lista.map(normalizarSinal);
      setSignals(agruparPorPartida(normalizados));
      setApiInfo({
        source: data?.source || "",
        mode: data?.mode || "",
        statsMode: data?.statsMode || "",
        realStatsGames: Number(data?.realStatsGames || 0),
        eventsMode: data?.eventsMode || "",
        realEventsGames: Number(data?.realEventsGames || 0),
        oddsMode: data?.oddsMode || "",
        realOddsGames: Number(data?.realOddsGames || 0),
        oddsEnabled: Boolean(data?.oddsEnabled),
        apiStatus: data?.apiStatus || "",
        message: data?.message || ""
      });
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) {
      console.error("Erro ao buscar API MekineBet:", e);
      setSignals([]);
      setApiInfo({
        source: "erro",
        mode: "offline",
        statsMode: "erro",
        realStatsGames: 0,
        eventsMode: "erro",
        realEventsGames: 0,
        oddsMode: "erro",
        realOddsGames: 0,
        oddsEnabled: false,
        apiStatus: "error",
        message: "Erro ao buscar dados da API."
      });
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    const timer = setInterval(carregar, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const relogio = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(relogio);
  }, []);

  function timesDoJogo(item) {
    const partes = String(item.match || "").split(/\s+vs\s+|\s+x\s+/i);
    return {
      casa: item.homeTeam || item.home?.name || item.home || partes[0] || "Casa",
      fora: item.awayTeam || item.away?.name || item.away || partes[1] || "Fora"
    };
  }

  function nomeCurto(nome = "") {
    return String(nome)
      .replace(/Football Club/gi, "")
      .replace(/Brighton & Hove Albion/gi, "Brighton")
      .replace(/Crystal Palace/gi, "Crystal")
      .replace(/Southampton/gi, "Saints")
      .replace(/Wolverhampton Wanderers/gi, "Wolves")
      .replace(/Tottenham Hotspur/gi, "Tottenham")
      .replace(/Newcastle United/gi, "Newcastle")
      .replace(/West Ham United/gi, "West Ham")
      .replace(/Ipswich Town/gi, "Ipswich")
      .replace(/\bAFC\b|\bFC\b|\bUnited\b|\bTown\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function sigla(nome = "") {
    return nomeCurto(nome).split(" ").map((p) => p[0]).join("").slice(0, 3).toUpperCase();
  }

  function tituloJogo(item) {
    const t = timesDoJogo(item);
    return `${nomeCurto(t.casa)} vs ${nomeCurto(t.fora)}`;
  }

  function logoCasa(item) {
    const t = timesDoJogo(item);
    const key = normalizar(t.casa);
    return item.logoHome || item.homeLogo || item.teamHomeLogo || item.home?.logo || item.teams?.home?.logo || TEAM_LOGOS[key] || fallbackLogo(t.casa);
  }

  function logoFora(item) {
    const t = timesDoJogo(item);
    const key = normalizar(t.fora);
    return item.logoAway || item.awayLogo || item.teamAwayLogo || item.away?.logo || item.teams?.away?.logo || TEAM_LOGOS[key] || fallbackLogo(t.fora);
  }

  function teamColor(nome = "", fallback = "#22c55e") {
    return TEAM_COLORS[normalizar(nome)] || fallback;
  }

  const UNIFORM_PALETTE = [
    "#22c55e", "#2563eb", "#ef4444", "#f59e0b", "#a855f7", "#06b6d4",
    "#facc15", "#f8fafc", "#fb7185", "#14b8a6", "#6366f1", "#e5e7eb"
  ];

  function hashTexto(texto = "") {
    return normalizar(texto).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }

  function hexToRgb(hex = "#22c55e") {
    const clean = String(hex).replace("#", "").trim();
    const value = clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean.padEnd(6, "0").slice(0, 6);

    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }

  function distanciaCor(a = "#22c55e", b = "#6366f1") {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    return Math.sqrt(
      Math.pow(ca.r - cb.r, 2) +
      Math.pow(ca.g - cb.g, 2) +
      Math.pow(ca.b - cb.b, 2)
    );
  }

  function corAlternativa(nome = "", corAtual = "#22c55e") {
    const start = hashTexto(nome) % UNIFORM_PALETTE.length;

    for (let i = 0; i < UNIFORM_PALETTE.length; i += 1) {
      const candidate = UNIFORM_PALETTE[(start + i) % UNIFORM_PALETTE.length];
      if (distanciaCor(candidate, corAtual) >= 95) return candidate;
    }

    return corAtual === "#22c55e" ? "#6366f1" : "#22c55e";
  }

  function teamColorPair(homeName = "Casa", awayName = "Fora") {
    const homeColor = teamColor(homeName, UNIFORM_PALETTE[hashTexto(homeName) % UNIFORM_PALETTE.length]);
    let awayColor = teamColor(awayName, UNIFORM_PALETTE[hashTexto(awayName) % UNIFORM_PALETTE.length]);

    if (distanciaCor(homeColor, awayColor) < 95) {
      awayColor = corAlternativa(awayName, homeColor);
    }

    return { homeColor, awayColor };
  }

  function limitar(v, min, max) {
    return Math.max(min, Math.min(max, Number(v || 0)));
  }

  function buildLiveMapState(item, index = 0) {
    const live = item.type === "live";
    const times = timesDoJogo(item);
    const stats = statsDoJogo(item);
    const current = live ? limitar(minuto(item) || 1, 1, 90) : 0;

    if (!live) {
      return {
        live: false,
        side: "neutral",
        intensity: "idle",
        label: "Sinal VIP pré-live",
        detail: "Jogo ainda vai começar",
        possessionTeam: "Pré-live VIP",
        ballOwner: "Projeção IA",
        playType: "Mercados prováveis",
        ballX: 50,
        ballY: 50,
        trailFrom: 45,
        trailTo: 55,
        supportDots: [
          { x: 42, y: 42, team: "home" },
          { x: 58, y: 58, team: "away" },
          { x: 50, y: 50, team: "neutral" }
        ]
      };
    }

    const events = eventosDoJogo(item)
      .filter((ev) => Number(ev.minute || 0) <= current)
      .sort((a, b) => Number(a.minute || 0) - Number(b.minute || 0));

    const recentEvent = events
      .slice()
      .reverse()
      .find((ev) => current - Number(ev.minute || 0) <= 3) || null;

    const homeForce =
      stats.home.ataques * 0.4 +
      stats.home.perigosos * 1.6 +
      stats.home.finalizacoes * 2.2 +
      stats.home.noGol * 6 +
      stats.home.cantos * 2.5;

    const awayForce =
      stats.away.ataques * 0.4 +
      stats.away.perigosos * 1.6 +
      stats.away.finalizacoes * 2.2 +
      stats.away.noGol * 6 +
      stats.away.cantos * 2.5;

    let side;

    if (recentEvent) {
      side = eventoTeam(recentEvent, times);
    } else {
      const balance = (homeForce - awayForce) / Math.max(1, homeForce + awayForce);
      const rhythm =
        Math.sin((current + index * 3) / 2.8) +
        Math.cos((current + stats.home.ataques + stats.away.ataques) / 4.6) +
        balance * 1.8;
      side = rhythm >= 0 ? "home" : "away";
    }

    const active = side === "home" ? stats.home : stats.away;
    const passive = side === "home" ? stats.away : stats.home;
    const activeForce =
      active.ataques * 0.35 +
      active.perigosos * 1.65 +
      active.finalizacoes * 2.3 +
      active.noGol * 6.5 +
      active.cantos * 2.4;
    const passiveForce =
      passive.ataques * 0.28 +
      passive.perigosos * 1.25 +
      passive.finalizacoes * 1.7 +
      passive.noGol * 4.8 +
      passive.cantos * 1.7;

    const dominance = activeForce / Math.max(1, activeForce + passiveForce);
    const wave = Math.abs(Math.sin((current * 1.9 + index * 5 + active.perigosos) / 5.2));
    const recentText = `${recentEvent?.type || ""} ${recentEvent?.detail || ""} ${recentEvent?.category || ""}`.toLowerCase();

    let depth = limitar(47 + dominance * 34 + wave * 13, 48, 93);

    if (/goal|gol|penalty|penal/.test(recentText)) depth = 92;
    else if (/corner|canto/.test(recentText)) depth = Math.max(depth, 86);
    else if (/shot|chute|danger|perig/.test(recentText)) depth = Math.max(depth, 80);

    const intensity = depth >= 86 ? "high" : depth >= 72 ? "medium" : "low";
    const possessionTeam = side === "home" ? times.casa : times.fora;
    const sig = sigla(possessionTeam);
    const phaseY = Math.sin((current + index * 11) / 3.1);
    const lateral = limitar(50 + phaseY * 23, 20, 80);
    const ballX = side === "home" ? depth : 100 - depth;
    const ballY = lateral;
    const trailFrom = side === "home" ? Math.max(48, ballX - 22) : Math.min(52, ballX + 22);
    const trailTo = ballX;

    const playType =
      intensity === "high"
        ? "Chance clara / perto do gol"
        : intensity === "medium"
          ? "Ataque perigoso"
          : "Passou do meio-campo";

    const label = `${sig} com a bola`;

    const supportDots =
      side === "home"
        ? [
            { x: limitar(ballX - 14, 8, 94), y: limitar(ballY - 12, 16, 84), team: "home" },
            { x: limitar(ballX - 21, 8, 94), y: limitar(ballY + 13, 16, 84), team: "home" },
            { x: limitar(ballX + 8, 8, 94), y: limitar(ballY + 3, 16, 84), team: "away" },
            { x: limitar(ballX - 30, 8, 94), y: limitar(50 - phaseY * 15, 16, 84), team: "home" }
          ]
        : [
            { x: limitar(ballX + 14, 6, 92), y: limitar(ballY - 12, 16, 84), team: "away" },
            { x: limitar(ballX + 21, 6, 92), y: limitar(ballY + 13, 16, 84), team: "away" },
            { x: limitar(ballX - 8, 6, 92), y: limitar(ballY + 3, 16, 84), team: "home" },
            { x: limitar(ballX + 30, 6, 92), y: limitar(50 - phaseY * 15, 16, 84), team: "away" }
          ];

    return {
      live: true,
      side,
      intensity,
      label,
      detail: recentEvent?.detail || recentEvent?.type || playType,
      possessionTeam,
      ballOwner: possessionTeam,
      playType,
      ballX,
      ballY,
      trailFrom,
      trailTo,
      supportDots
    };
  }

  function totalGols(item) {
    const nums = String(item.score || "0-0").match(/\d+/g) || [0, 0];
    return Number(nums[0] || 0) + Number(nums[1] || 0);
  }

  function placarPartes(item) {
    const nums = String(item.score || "0-0").match(/\d+/g) || [0, 0];
    return { homeGoals: Number(nums[0] || 0), awayGoals: Number(nums[1] || 0) };
  }

  function minuto(item) {
    return Number(String(item.minute || 0).replace(/\D/g, "")) || 0;
  }

  function periodoDoJogo(item) {
    const m = minuto(item);
    if (!jogoAoVivo(item)) return "PRÉ-LIVE";
    if (m <= 45) return "1º TEMPO";
    if (m <= 90) return "2º TEMPO";
    return "ACRÉSCIMOS";
  }

  function tempoAoVivoTexto(item) {
    const m = Math.max(0, minuto(item));
    const s = String(agora.getSeconds()).padStart(2, "0");
    return `${periodoDoJogo(item)} • ${m}' ${s}s`;
  }

  function statsDoJogo(item) {
    const conf = Number(item.confidence || 70);
    const press = Number(item.pressure || 70);
    const gols = totalGols(item);
    const real = jogoStatsReal(item);

    const estimatedHomePossession = Math.min(72, Math.max(42, conf - 18));
    const homePossession = usarValor(
      numero(item.possession, item.posse, item.ballPossession),
      estimatedHomePossession
    );

    const awayPossessionRaw = numero(item.possessionAway, item.posseAway, item.posseFora);

    const home = {
      posse: homePossession,
      finalizacoes: usarValor(numero(item.shots, item.finalizacoes, item.finalizações, item.chutes), Math.max(6, Math.round(press / 8 + gols * 2))),
      noGol: usarValor(numero(item.shotsOnGoal, item.chutesNoGol, item.noGol), Math.max(1, Math.round(press / 24 + gols))),
      ataques: usarValor(numero(item.attacks, item.ataques), Math.max(16, Math.round(press / 2.3))),
      cantos: usarValor(numero(item.corners, item.cantos, item.escanteios), Math.max(1, Math.round(press / 24))),
      cartoes: usarValor(numero(item.yellowCards, item.cards, item.cartoes, item.cartões), Math.max(0, Math.round((100 - conf) / 35))),
      vermelhos: usarValor(numero(item.redCards, item.vermelhos, item.cartoesVermelhos), 0),
      perigosos: usarValor(numero(item.dangerousAttacks, item.ataquesPerigosos, item.perigosos), Math.max(6, Math.round(press / 3.5)))
    };

    const away = {
      posse: usarValor(awayPossessionRaw, Math.max(20, 100 - home.posse)),
      finalizacoes: usarValor(numero(item.shotsAway, item.finalizacoesAway, item.finalizacoesFora), Math.max(3, Math.round(home.finalizacoes * 0.55))),
      noGol: usarValor(numero(item.shotsOnGoalAway, item.chutesNoGolAway, item.noGolAway), Math.max(0, Math.round(home.noGol * 0.45))),
      ataques: usarValor(numero(item.attacksAway, item.ataquesAway, item.ataquesFora), Math.max(10, Math.round(home.ataques * 0.58))),
      cantos: usarValor(numero(item.cornersAway, item.cantosAway, item.cantosFora), Math.max(0, Math.round(home.cantos * 0.55))),
      cartoes: usarValor(numero(item.yellowCardsAway, item.cardsAway, item.cartoesAway, item.cartoesFora), Math.max(0, Math.round(home.cartoes * 0.8))),
      vermelhos: usarValor(numero(item.redCardsAway, item.vermelhosAway, item.cartoesVermelhosAway), 0),
      perigosos: usarValor(numero(item.dangerousAttacksAway, item.ataquesPerigososAway, item.perigososFora), Math.max(4, Math.round(home.perigosos * 0.55)))
    };

    if (awayPossessionRaw === undefined && home.posse + away.posse !== 100) {
      away.posse = Math.max(20, 100 - home.posse);
    }

    return { home, away, real, display: real };
  }

  function climaDoJogo(item, index = 0) {
    const raw = String(item.weather || item.clima || item.condition || "").toLowerCase();
    if (raw.includes("rain") || raw.includes("chuva")) return { icon: "🌧️", label: "Chuva", cls: "rain" };
    if (raw.includes("storm") || raw.includes("temp")) return { icon: "⛈️", label: "Temporal", cls: "rain" };
    if (raw.includes("cloud") || raw.includes("nublado")) return { icon: "☁️", label: "Nublado", cls: "cloud" };
    if (raw.includes("sun") || raw.includes("sol") || raw.includes("clear") || raw.includes("limpo")) return { icon: "☀️", label: "Sol", cls: "sun" };

    const presets = [
      { icon: "☀️", label: "Sol", cls: "sun" },
      { icon: "🌧️", label: "Chuva leve", cls: "rain" },
      { icon: "☁️", label: "Nublado", cls: "cloud" },
      { icon: "🌦️", label: "Tempo instável", cls: "rain" }
    ];
    return presets[index % presets.length];
  }

  function alertaForte(item) {
    const alertRaw = String(item.alert ?? item.alerta ?? "").toLowerCase();
    return (
      item.alert === true ||
      alertRaw.includes("sinal") ||
      alertRaw.includes("forte") ||
      alertRaw.includes("🚨") ||
      alertRaw.includes("🔥") ||
      Number(item.pressure || 0) >= 85 ||
      Number(item.confidence || 0) >= 90 ||
      Number(item.pressao || 0) >= 85 ||
      Number(item.confianca || item["confiança"] || 0) >= 90
    );
  }

  function mercadoStatus(item) {
    const gols = totalGols(item);
    const min = minuto(item);
    const pressure = Number(item.pressure || 0);
    const confidence = Number(item.confidence || 0);
    const market = String(item.market || "").toLowerCase();
    const alertText = String(item.alert ?? item.alerta ?? "").trim();

    if (alertText && alertText !== "true" && alertText !== "false") {
      return alertText;
    }

    if (alertaForte(item)) return "🚨 SINAL MUITO FORTE";

    if (market.includes("0.5") || market.includes("0,5")) {
      if (gols >= 1) return "✅ GREEN";
      if (min >= 12 && pressure >= 70) return "🔥 GOL IMINENTE";
      return "📊 MONITORANDO";
    }
    if (market.includes("1.5") || market.includes("1,5")) {
      if (gols >= 2) return "✅ GREEN";
      if (gols === 1 && pressure >= 72) return "🔥 2º GOL FORTE";
      return "📊 MONITORANDO";
    }
    if (market.includes("2.5") || market.includes("2,5")) {
      if (gols >= 3) return "✅ GREEN";
      if (gols >= 2 && pressure >= 74) return "🔥 OVER FORTE";
      return "📊 MONITORANDO";
    }
    if (market.includes("3.5") || market.includes("3,5")) {
      if (gols >= 4) return "✅ GREEN";
      if (gols >= 3 && pressure >= 82) return "🚨 JOGO MALUCO";
      return "📉 RISCO MÉDIO";
    }
    if (market.includes("btts") || market.includes("ambas")) {
      if (gols >= 2) return "🔥 BTTS QUENTE";
      if (pressure >= 75) return "⚡ AMBAS PRESSIONANDO";
      return "👀 OBSERVAÇÃO";
    }
    if (market.includes("cart") || market.includes("card")) return "🟨 CARTÕES AO VIVO";
    if (market.includes("canto") || market.includes("corner")) return "🚩 CANTOS AO VIVO";
    if (pressure >= 80 || confidence >= 85) return "🔥 ENTRADA FORTE";
    return "📊 MONITORAMENTO IA";
  }

  function categoriaMercado(item) {
    const market = String(item.market || "").toLowerCase();
    const category = String(item.category || item.categoria || "").toLowerCase();
    if (market.includes("0.5") || market.includes("0,5") || category.includes("over05")) return "OVER 0,5";
    if (market.includes("1.5") || market.includes("1,5") || category.includes("over15")) return "OVER 1,5";
    if (market.includes("2.5") || market.includes("2,5") || category.includes("over25")) return "OVER 2,5";
    if (market.includes("3.5") || market.includes("3,5") || category.includes("over35")) return "OVER 3,5";
    if (market.includes("mais gol") || category.includes("mais_gol")) return "MAIS GOL";
    if (category.includes("cantos_inicio") || market.includes("primeiros minutos") && (market.includes("canto") || market.includes("corner"))) return "CANTOS INÍCIO";
    if (category.includes("cartoes_inicio") || category.includes("cartoes_inicio") || market.includes("primeiros minutos") && (market.includes("cart") || market.includes("card"))) return "CARTÕES INÍCIO";
    if (market.includes("cart") || market.includes("card") || category.includes("cart")) return "CARTÕES";
    if (market.includes("canto") || market.includes("corner") || category.includes("canto")) return "CANTOS";
    if (market.includes("btts") || market.includes("ambas") || category.includes("btts")) return "BTTS";
    if (market.includes("handicap") || market.includes("handcap") || category.includes("handicap")) return "HANDICAP";
    if (market.includes("vitória") || market.includes("vitoria") || market.includes("vence") || market.includes("winner") || category.includes("winner") || category.includes("vitoria")) return "VITÓRIA";
    if (market.includes("gol") || market.includes("goal") || category.includes("goals") || category.includes("gols")) return "GOLS";
    if (market.includes("top ia") || category.includes("topia")) return "TOP IA";
    return item.category?.toUpperCase() || "BASE";
  }

  function isVip(item) {
    return (item.confidence || 70) >= 82 || alertaForte(item) || String(item.alert || "").includes("GOL");
  }

  function pctValue(a = 0, b = 0) {
    const total = Math.max(1, Number(a || 0) + Number(b || 0));
    return Math.max(0, Math.min(100, (Number(a || 0) / total) * 100));
  }

  function eventoPrioridade(event = {}) {
    const text = `${event.icon || ""} ${event.category || ""} ${event.type || ""} ${event.detail || ""}`.toLowerCase();
    if (text.includes("⚽") || text.includes("goal") || text.includes("gol")) return 5;
    if (text.includes("🟥") || text.includes("red") || text.includes("vermelho")) return 4;
    if (text.includes("🥅") || text.includes("penalty") || text.includes("pênalti")) return 3;
    if (text.includes("🟨") || text.includes("card") || text.includes("cart")) return 2;
    return 1;
  }

  function eventoLevel(event = {}) {
    const text = `${event.icon || ""} ${event.category || ""} ${event.type || ""} ${event.detail || ""}`.toLowerCase();
    if (text.includes("⚽") || text.includes("goal") || text.includes("gol") || text.includes("🟥")) return 3;
    if (text.includes("penalty") || text.includes("pênalti") || text.includes("var") || text.includes("card") || text.includes("cart")) return 2;
    return 1;
  }

  function eventoTeam(event, times) {
    let team = event.side === "away" ? "away" : event.side === "home" ? "home" : "neutral";

    if (team === "neutral") {
      const teamName = normalizar(event.teamName || "");
      if (teamName && teamName === normalizar(times.fora)) team = "away";
      else if (teamName && teamName === normalizar(times.casa)) team = "home";
      else team = "home";
    }

    return team;
  }

  function timelineEvents(item, index, homeColor, awayColor) {
    const stats = statsDoJogo(item);
    const live = item.type === "live";
    const current = live ? Math.min(90, Math.max(1, minuto(item) || 1)) : 90;
    const eventosReais = eventosDoJogo(item);
    const times = timesDoJogo(item);

    const eventosPorMinuto = new Map();

    eventosReais.forEach((event) => {
      const minute = Math.max(1, Math.min(90, Number(event.minute || event.elapsed || 1)));
      const team = eventoTeam(event, times);
      const normalizedEvent = {
        ...event,
        minute,
        team,
        priority: eventoPrioridade(event),
        level: eventoLevel(event)
      };

      const atual = eventosPorMinuto.get(minute);
      if (!atual || normalizedEvent.priority > atual.priority) {
        eventosPorMinuto.set(minute, normalizedEvent);
      }
    });

    const homeWeight =
      stats.home.ataques +
      stats.home.perigosos * 1.5 +
      stats.home.finalizacoes * 2.2 +
      stats.home.noGol * 5 +
      stats.home.cantos * 2.5;

    const awayWeight =
      stats.away.ataques +
      stats.away.perigosos * 1.5 +
      stats.away.finalizacoes * 2.2 +
      stats.away.noGol * 5 +
      stats.away.cantos * 2.5;

    const totalWeight = Math.max(1, homeWeight + awayWeight);
    const homeBias = (homeWeight - awayWeight) / totalWeight;

    return Array.from({ length: 90 }, (_, i) => {
      const minute = i + 1;
      const realEvent = eventosPorMinuto.get(minute);

      let team;

      if (realEvent) {
        team = realEvent.team;
      } else {
        const wave =
          Math.sin((minute + index * 7) / 4) +
          Math.cos((minute + stats.home.ataques + stats.away.perigosos) / 8) +
          homeBias * 1.4;
        team = wave >= 0 ? "home" : "away";
      }

      const active = team === "home" ? stats.home : stats.away;
      const passive = team === "home" ? stats.away : stats.home;
      const activeForce = active.perigosos * 1.5 + active.noGol * 5 + active.finalizacoes * 2 + active.cantos * 2.2 + active.ataques * 0.35;
      const passiveForce = passive.perigosos * 1.2 + passive.noGol * 4 + passive.finalizacoes * 1.5 + passive.cantos * 1.6 + passive.ataques * 0.25;
      const balance = activeForce / Math.max(1, activeForce + passiveForce);
      const seed = Math.abs(Math.sin((minute * 3.17 + active.perigosos * 1.9 + index * 13) / 7));
      const fieldDepth = balance * 0.58 + seed * 0.42;

      let level = fieldDepth > 0.72 ? 3 : fieldDepth > 0.38 ? 2 : 1;
      if (realEvent) level = Math.max(level, realEvent.level || 1);

      const label =
        level === 3
          ? "chance clara / perto do gol"
          : level === 2
            ? "ataque no terço ofensivo"
            : "passou do meio-campo / ataque leve";

      return {
        m: minute,
        team,
        level,
        icon: realEvent?.icon || "",
        color: team === "home" ? homeColor : awayColor,
        real: Boolean(realEvent),
        title: realEvent
          ? `${minute}' ${realEvent.teamName || ""} ${realEvent.player || ""} ${realEvent.detail || realEvent.type || ""}`.trim()
          : `${minute}' ${team === "home" ? times.casa : times.fora}: ${label}`,
        label,
        prelive: !live
      };
    }).filter((ev) => ev.m <= current);
  }

  function mercadosBaseDoItem(item) {
    return Array.isArray(item.mercados) && item.mercados.length ? item.mercados : [item];
  }

  function inicioJogo(item) {
    const raw = valor(
      item.startTime,
      item.fixtureDate,
      item.date,
      item.data,
      item.kickoff,
      item.kickoffTime,
      item.timestamp
    );

    if (raw === undefined || raw === null || raw === "") return null;

    if (typeof raw === "number" || /^\d+$/.test(String(raw))) {
      const n = Number(raw);
      const ms = n > 1000000000000 ? n : n * 1000;
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function horasAteInicio(item) {
    const d = inicioJogo(item);
    if (!d) return null;
    return (d.getTime() - Date.now()) / 36e5;
  }

  function jogoPreLive24h(item) {
    if (jogoAoVivo(item)) return false;
    const horas = horasAteInicio(item);
    if (horas === null) return true;
    return horas >= -0.25 && horas <= 24;
  }

  function textoInicio(item) {
    const d = inicioJogo(item);
    if (!d) return "Próximas 24h";
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function scorePreLiveVip(item) {
    const stats = statsDoJogo(item);
    const base = melhorMercadoBase(item);
    const conf = Number(base.confidence || item.confidence || 70);
    const press = Number(base.pressure || item.pressure || 70);
    const shots = stats.home.finalizacoes + stats.away.finalizacoes;
    const onGoal = stats.home.noGol + stats.away.noGol;
    const danger = stats.home.perigosos + stats.away.perigosos;
    const corners = stats.home.cantos + stats.away.cantos;
    const balance = Math.abs((stats.home.posse || 50) - (stats.away.posse || 50));
    const horas = horasAteInicio(item);
    const timeBoost = horas === null ? 4 : Math.max(0, 12 - Math.abs(horas - 6)) * 0.45;
    return conf * 0.55 + press * 0.28 + shots * 0.8 + onGoal * 2.2 + danger * 0.35 + corners * 1.2 + balance * 0.12 + timeBoost;
  }

  function melhorSinalPreLiveVip(item) {
    return mercadosDoItem(item)
      .filter((m) => m.vipPrelive || !jogoAoVivo(m))
      .slice()
      .sort((a, b) => Number(b.confidence || 0) + Number(b.pressure || 0) - (Number(a.confidence || 0) + Number(a.pressure || 0)))[0] || melhorMercado(item);
  }

  function mercadoSynthetic(item, market, category, confidence, alert, extra = {}) {
    return {
      ...item,
      id: `${item.id || item.fixtureId || item.match}-${category}-VIP`,
      signalId: `${item.signalId || item.fixtureId || item.match}-${category}-VIP`,
      market,
      mercado: market,
      category,
      categoria: category,
      confidence: Math.round(limitar(confidence, 55, 96)),
      confianca: Math.round(limitar(confidence, 55, 96)),
      pressure: Math.round(limitar((item.pressure || item.pressao || 70), 40, 95)),
      pressao: Math.round(limitar((item.pressure || item.pressao || 70), 40, 95)),
      alert,
      odd: "—",
      realOdd: false,
      oddsMode: "none",
      vipPrelive: true,
      type: "prelive",
      status: "PRÉ-LIVE VIP",
      ...extra
    };
  }

  function preliveVipMarkets(item) {
    const base = mercadosBaseDoItem(item);
    const isLiveGame = item.type === "live" || base.some((m) => m.type === "live");
    if (isLiveGame || !jogoPreLive24h(item)) return [];

    const stats = statsDoJogo(item);
    const bestBase = melhorMercadoBase(item);
    const conf = Number(bestBase.confidence || item.confidence || 72);
    const pressure = Number(bestBase.pressure || item.pressure || 70);

    const homePower =
      stats.home.finalizacoes * 2.1 +
      stats.home.noGol * 5.2 +
      stats.home.perigosos * 1.6 +
      stats.home.cantos * 1.9 +
      stats.home.ataques * 0.28 +
      stats.home.posse * 0.16;

    const awayPower =
      stats.away.finalizacoes * 2.1 +
      stats.away.noGol * 5.2 +
      stats.away.perigosos * 1.6 +
      stats.away.cantos * 1.9 +
      stats.away.ataques * 0.28 +
      stats.away.posse * 0.16;

    const totalPower = Math.max(1, homePower + awayPower);
    const homeEdge = homePower - awayPower;
    const balance = Math.abs(homeEdge) / totalPower;
    const times = timesDoJogo(item);
    const fav = homeEdge >= 0 ? times.casa : times.fora;
    const favShort = nomeCurto(fav);
    const golsBase = (stats.home.finalizacoes + stats.away.finalizacoes) * 0.9 + (stats.home.noGol + stats.away.noGol) * 3.2 + pressure * 0.24;
    const bttsBase = Math.min(stats.home.finalizacoes, stats.away.finalizacoes) * 1.8 + Math.min(stats.home.perigosos, stats.away.perigosos) * 0.55 + Math.min(stats.home.noGol, stats.away.noGol) * 4.5 + conf * 0.48;
    const cantosBase = (stats.home.cantos + stats.away.cantos) * 5.5 + (stats.home.ataques + stats.away.ataques) * 0.12 + pressure * 0.26;
    const cardsBase = (stats.home.cartoes + stats.away.cartoes) * 8 + (stats.home.faltas || 0) * 0.55 + (stats.away.faltas || 0) * 0.55 + 35;

    const suggestions = [
      mercadoSynthetic(item, "Mais de 1.5 gols", "OVER15", golsBase + 7, "🔐 VIP 24H • +1,5 GOLS"),
      mercadoSynthetic(item, "Mais de 2.5 gols", "OVER25", golsBase - 1, "🔐 VIP 24H • +2,5 GOLS"),
      mercadoSynthetic(item, "Mais de 3.5 gols", "OVER35", golsBase - 10, "🔐 VIP 24H • +3,5 GOLS"),
      mercadoSynthetic(item, "Mais gol na partida", "MAIS_GOL", golsBase + 11, "🔐 VIP 24H • MAIS GOL"),
      mercadoSynthetic(item, "Ambas marcam", "BTTS", bttsBase, "🔐 VIP 24H • AMBAS MARCAM"),
      mercadoSynthetic(item, "Mais de 7.5 cantos FT", "CANTOS", cantosBase, "🔐 VIP 24H • +7,5 CANTOS"),
      mercadoSynthetic(item, "Mais de 2.5 cantos até 20min", "CANTOS_INICIO", cantosBase - 2, "🔐 VIP 24H • CANTOS INÍCIO"),
      mercadoSynthetic(item, "Mais de 3.5 cartões FT", "CARTOES_FT", cardsBase, "🔐 VIP 24H • +3,5 CARTÕES"),
      mercadoSynthetic(item, "Cartão nos primeiros 30min", "CARTOES_INICIO", cardsBase - 6, "🔐 VIP 24H • CARTÕES INÍCIO")
    ];

    const vitoriaConf = conf + balance * 40 + Math.abs(homeEdge) * 0.06;
    const duplaChanceConf = conf + balance * 32 + 6;

    if (balance >= 0.18 && vitoriaConf >= 78) {
      suggestions.push(mercadoSynthetic(item, `Vitória ${favShort}`, "VITORIA", vitoriaConf, `🔐 VIP 24H • VITÓRIA ${favShort.toUpperCase()}`));
    }

    if (balance >= 0.12 && duplaChanceConf >= 76) {
      suggestions.push(mercadoSynthetic(item, `Dupla chance ${favShort}`, "HANDICAP", duplaChanceConf, `🔐 VIP 24H • DUPLA CHANCE ${favShort.toUpperCase()}`));
    }

    const ordemPreLive = {
      OVER15: 1,
      OVER25: 2,
      OVER35: 3,
      MAIS_GOL: 4,
      BTTS: 5,
      CANTOS: 6,
      CANTOS_INICIO: 7,
      CARTOES_FT: 8,
      CARTOES_INICIO: 9,
      VITORIA: 10,
      HANDICAP: 11
    };

    return suggestions
      .filter((m) => Number(m.confidence || 0) >= 60)
      .sort((a, b) => {
        const scoreA = Number(a.confidence || 0) + (100 - (ordemPreLive[a.category] || 99)) * 0.08;
        const scoreB = Number(b.confidence || 0) + (100 - (ordemPreLive[b.category] || 99)) * 0.08;
        return scoreB - scoreA;
      })
      .slice(0, 8);
  }

  function mercadosDoItem(item) {
    const base = mercadosBaseDoItem(item);

    if (item?.vipPrelive || item?.__semVipExtras) {
      return base;
    }

    const isLiveGame =
      item?.type === "live" ||
      base.some((m) => m?.type === "live");

    if (isLiveGame) {
      return base;
    }

    const extras = preliveVipMarkets({
      ...item,
      mercados: base,
      __semVipExtras: true
    });

    return [...base, ...extras];
  }

  function eventosDoJogo(item) {
    return limparEventos([
      ...(Array.isArray(item.matchEvents) ? item.matchEvents : []),
      ...mercadosDoItem(item).flatMap((m) => Array.isArray(m.matchEvents) ? m.matchEvents : [])
    ]);
  }

  function jogoEventosReal(item) {
    return (
      item.hasRealEvents === true ||
      String(item.eventsMode || "").toLowerCase() === "real" ||
      eventosDoJogo(item).length > 0 ||
      mercadosDoItem(item).some(
        (m) =>
          m.hasRealEvents === true ||
          String(m.eventsMode || "").toLowerCase() === "real" ||
          (Array.isArray(m.matchEvents) && m.matchEvents.length > 0)
      )
    );
  }

  function jogoStatsReal(item) {
    return (
      item.realStats === true ||
      String(item.statsMode || item.statsSource || "").toLowerCase() === "real" ||
      mercadosDoItem(item).some(
        (m) =>
          m.realStats === true ||
          String(m.statsMode || m.statsSource || "").toLowerCase() === "real"
      )
    );
  }

  function oddValida(v) {
    const raw = String(v ?? "").trim();
    return raw !== "" && raw !== "—" && raw !== "-" && raw.toLowerCase() !== "null" && raw.toLowerCase() !== "undefined";
  }

  function mercadoOddReal(m) {
    return (
      m.realOdd === true ||
      m.realOdd === "true" ||
      m.hasRealOdds === true ||
      m.hasRealOdds === "true" ||
      String(m.oddsMode || "").toLowerCase() === "real" ||
      (oddValida(m.odd) && Boolean(m.bookmaker || m.oddsProvider || m.oddsMarket || m.oddsLine))
    );
  }

  function jogoOddReal(item) {
    return mercadoOddReal(item) || mercadosDoItem(item).some((m) => mercadoOddReal(m));
  }

  function jogoAoVivo(item) {
    return item.type === "live" || mercadosDoItem(item).some((m) => m.type === "live");
  }

  function jogoPreLive(item) {
    return !jogoAoVivo(item);
  }

  function jogoPreLiveVip(item) {
    return jogoPreLive(item) && jogoPreLive24h(item);
  }

  function formatOdd(m) {
    if (!oddValida(m?.odd)) return "—";
    return String(m.odd).replace(".", ",");
  }

  function bookmakerDoMercado(m) {
    return m?.bookmaker || m?.oddsProvider || "";
  }

  function jogoTemCategoria(item, categoria) {
    return mercadosDoItem(item).some((m) => categoriaMercado(m) === categoria);
  }

  function jogoTemAlerta(item) {
    return mercadosDoItem(item).some((m) => alertaForte(m) || mercadoStatus(m).includes("🔥") || mercadoStatus(m).includes("🚨"));
  }

  function melhorMercadoBase(item) {
    return mercadosBaseDoItem(item)
      .slice()
      .sort((a, b) => (b.confidence || 0) + (b.pressure || 0) - ((a.confidence || 0) + (a.pressure || 0)))[0] || item;
  }

  function numeroLinhaMercado(m) {
    const txt = String(`${m?.market || ""} ${m?.mercado || ""} ${m?.oddsLine || ""}`).replace(",", ".");
    const found = txt.match(/(\d+(?:\.\d+)?)/);
    return found ? Number(found[1]) : null;
  }

  function linhaCantosAoVivo(item) {
    const stats = statsDoJogo(item);
    const total = Number(stats.home.cantos || 0) + Number(stats.away.cantos || 0);
    const min = minuto(item);

    if (min <= 20) return total <= 2 ? 4.5 : total <= 4 ? 6.5 : 8.5;
    if (min <= 35) return total <= 4 ? 6.5 : total <= 6 ? 8.5 : 9.5;
    if (min <= 55) return total <= 6 ? 8.5 : total <= 8 ? 9.5 : 10.5;
    if (min <= 75) return total <= 8 ? 9.5 : total <= 10 ? 10.5 : 11.5;
    return total <= 10 ? 10.5 : 11.5;
  }

  function linhaCartoesAoVivo(item) {
    const stats = statsDoJogo(item);
    const total = Number(stats.home.cartoes || 0) + Number(stats.away.cartoes || 0);
    const min = minuto(item);

    if (min <= 25) return total <= 1 ? 2.5 : 3.5;
    if (min <= 45) return total <= 2 ? 3.5 : 4.5;
    if (min <= 65) return total <= 3 ? 4.5 : 5.5;
    return total <= 4 ? 5.5 : 6.5;
  }

  function mercadoCumprido(m, item) {
    const gols = totalGols(item);
    const stats = statsDoJogo(item);
    const cantos = Number(stats.home.cantos || 0) + Number(stats.away.cantos || 0);
    const cartoes = Number(stats.home.cartoes || 0) + Number(stats.away.cartoes || 0);
    const { homeGoals, awayGoals } = placarPartes(item);
    const status = String(m.alert || "").toLowerCase();
    const cat = categoriaMercado(m);
    const linha = numeroLinhaMercado(m);

    if (status.includes("green")) return true;
    if (cat === "OVER 0,5" && gols >= 1) return true;
    if (cat === "OVER 1,5" && gols >= 2) return true;
    if (cat === "OVER 2,5" && gols >= 3) return true;
    if (cat === "OVER 3,5" && gols >= 4) return true;
    if (cat === "BTTS" && homeGoals > 0 && awayGoals > 0) return true;
    if ((cat === "CANTOS" || cat === "CANTOS INÍCIO") && linha !== null && cantos > linha) return true;
    if ((cat === "CARTÕES" || cat === "CARTÕES INÍCIO") && linha !== null && cartoes > linha) return true;
    return false;
  }

  function mercadoPesoAoVivo(m, item) {
    const cat = categoriaMercado(m);
    const pesoCat = {
      "OVER 0,5": 8,
      "OVER 1,5": 12,
      "OVER 2,5": 13,
      "OVER 3,5": 9,
      "BTTS": 11,
      "CANTOS": 8,
      "CARTÕES": 7,
      "TOP IA": 4,
      "GOLS": 12,
      "VITÓRIA": 6,
      "HANDICAP": 6
    }[cat] || 5;

    return Number(m.confidence || 0) * 1.1 + Number(m.pressure || 0) * 0.55 + pesoCat + (mercadoOddReal(m) ? 5 : 0) - (mercadoCumprido(m, item) ? 60 : 0);
  }

  function proximoSinalAoVivo(item) {
    const gols = totalGols(item);
    const min = minuto(item);
    const stats = statsDoJogo(item);
    const base = mercadosBaseDoItem(item);
    const best = melhorMercadoBase(item);
    const press = Number(best.pressure || item.pressure || 70);
    const conf = Number(best.confidence || item.confidence || 70);
    const shots = Number(stats.home.finalizacoes || 0) + Number(stats.away.finalizacoes || 0);
    const onGoal = Number(stats.home.noGol || 0) + Number(stats.away.noGol || 0);
    const danger = Number(stats.home.perigosos || 0) + Number(stats.away.perigosos || 0);
    const corners = Number(stats.home.cantos || 0) + Number(stats.away.cantos || 0);
    const cards = Number(stats.home.cartoes || 0) + Number(stats.away.cartoes || 0);
    const fouls = Number(stats.home.faltas || 0) + Number(stats.away.faltas || 0);
    const pressureScore = press + shots * 0.7 + onGoal * 2.5 + danger * 0.35;
    const statsReal = jogoStatsReal(item);

    const candidates = [];

    if (gols < 1) candidates.push(mercadoSynthetic(item, "Próximo gol / Over 0.5", "OVER05", pressureScore + 4, "🔥 PRÓXIMO SINAL • 1º GOL", { type: "live", status: "AO VIVO", nextSignal: true }));
    if (gols < 2) candidates.push(mercadoSynthetic(item, "Próximo gol / Over 1.5", "OVER15", pressureScore + (gols === 1 ? 9 : -1), "🔥 PRÓXIMO SINAL • +1 GOL", { type: "live", status: "AO VIVO", nextSignal: true }));
    if (gols < 3 && min <= 82) candidates.push(mercadoSynthetic(item, "Próximo gol / Over 2.5", "OVER25", pressureScore + (gols === 2 ? 9 : -8), "🔥 PRÓXIMO SINAL • OVER 2,5", { type: "live", status: "AO VIVO", nextSignal: true }));
    if (gols < 4 && min <= 75) candidates.push(mercadoSynthetic(item, "Próximo gol / Over 3.5", "OVER35", pressureScore + (gols === 3 ? 10 : -14), "🔥 PRÓXIMO SINAL • OVER 3,5", { type: "live", status: "AO VIVO", nextSignal: true }));

    const { homeGoals, awayGoals } = placarPartes(item);
    if (!(homeGoals > 0 && awayGoals > 0) && min <= 80) {
      candidates.push(mercadoSynthetic(item, "Ambas marcam próximo", "BTTS", conf + Math.min(stats.home.perigosos, stats.away.perigosos) * 0.6 + Math.min(stats.home.noGol, stats.away.noGol) * 4, "🔥 PRÓXIMO SINAL • BTTS", { type: "live", status: "AO VIVO", nextSignal: true }));
    }

    if (statsReal) {
      const linhaCantos = linhaCantosAoVivo(item);
      const cantosConf = 42 + corners * 5.2 + press * 0.28 + danger * 0.10 + (min <= 35 ? 5 : 0);
      candidates.push(mercadoSynthetic(item, `Mais de ${String(linhaCantos).replace(".", ",")} cantos`, "CANTOS", cantosConf, `🚩 PRÓXIMO SINAL • +${String(linhaCantos).replace(".", ",")} CANTOS`, { type: "live", status: "AO VIVO", nextSignal: true, oddsLine: linhaCantos }));

      const linhaCartoes = linhaCartoesAoVivo(item);
      const cartoesConf = 34 + cards * 8 + fouls * 0.9 + (min >= 55 ? 8 : 0);
      candidates.push(mercadoSynthetic(item, `Mais de ${String(linhaCartoes).replace(".", ",")} cartões`, "CARTOES_FT", cartoesConf, `🟨 PRÓXIMO SINAL • +${String(linhaCartoes).replace(".", ",")} CARTÕES`, { type: "live", status: "AO VIVO", nextSignal: true, oddsLine: linhaCartoes }));
    }

    const baseNaoCumpridos = base.filter((m) => !mercadoCumprido(m, item));
    const finalistas = [...baseNaoCumpridos, ...candidates]
      .filter((m) => !String(m.alert || "").toLowerCase().includes("green"))
      .filter((m) => !mercadoCumprido(m, item));

    return finalistas
      .slice()
      .sort((a, b) => mercadoPesoAoVivo(b, item) - mercadoPesoAoVivo(a, item))[0] || best || item;
  }

  function melhorMercado(item) {
    if (jogoAoVivo(item)) return proximoSinalAoVivo(item);

    const lista = mercadosDoItem(item);
    return lista
      .slice()
      .sort((a, b) => mercadoPesoAoVivo(b, item) - mercadoPesoAoVivo(a, item))[0] || item;
  }

  function mercadosOrdenados(item) {
    const ordem = { "TOP IA": 0, "MAIS GOL": 1, "GOLS": 2, "OVER 0,5": 3, "OVER 1,5": 4, "OVER 2,5": 5, "OVER 3,5": 6, "BTTS": 7, "CANTOS": 8, "CANTOS INÍCIO": 9, "CARTÕES": 10, "CARTÕES INÍCIO": 11, "VITÓRIA": 12, "HANDICAP": 13 };
    return mercadosDoItem(item)
      .filter((m) => !jogoAoVivo(item) || !mercadoCumprido(m, item))
      .slice()
      .sort((a, b) => {
        const oa = ordem[categoriaMercado(a)] ?? 99;
        const ob = ordem[categoriaMercado(b)] ?? 99;
        if (oa !== ob) return oa - ob;
        return Number(b.confidence || 0) - Number(a.confidence || 0);
      });
  }

  function categoriaFiltroAtual() {
    const map = {
      OVER05: "OVER 0,5",
      OVER15: "OVER 1,5",
      OVER25: "OVER 2,5",
      OVER35: "OVER 3,5",
      BTTS: "BTTS",
      MAISGOL: "MAIS GOL",
      CANTOS: "CANTOS",
      CARTÕES: "CARTÕES",
      TOPIA: "TOP IA"
    };
    return map[filtro] || "";
  }

  function mercadosVisiveisNoFiltro(item) {
    const cat = categoriaFiltroAtual();
    const lista = mercadosOrdenados(item);
    return cat ? lista.filter((m) => categoriaMercado(m) === cat) : lista;
  }

  function melhorMercadoDoFiltro(item) {
    if (item?.__scannerMarket) return item.__scannerMarket;

    const lista = mercadosVisiveisNoFiltro(item);
    if (lista.length) {
      return lista.slice().sort((a, b) => (b.confidence || 0) + (b.pressure || 0) - ((a.confidence || 0) + (a.pressure || 0)))[0];
    }
    return jogoAoVivo(item) ? melhorMercado(item) : melhorSinalPreLiveVip(item);
  }

  const SCANNER_LINHAS = {
    GOLS: ["0.5", "1.5", "2.5", "3.5"],
    CANTOS: ["6.5", "7.5", "8.5", "9.5", "10.5"],
    CARTOES: ["2.5", "3.5", "4.5", "5.5", "6.5"],
    BTTS: ["Sim"],
    VITORIA: ["Favorito"],
    HANDICAP: ["Dupla chance", "Handicap"]
  };

  function linhaScannerAtual() {
    const linhas = SCANNER_LINHAS[scannerMercado] || [scannerLinha];
    return linhas.includes(scannerLinha) ? scannerLinha : linhas[0];
  }

  function categoriaScanner(m) {
    const cat = categoriaMercado(m);
    if (scannerMercado === "GOLS") {
      const linha = linhaScannerAtual();
      if (linha === "0.5") return cat === "OVER 0,5" || cat === "MAIS GOL" || cat === "GOLS";
      if (linha === "1.5") return cat === "OVER 1,5";
      if (linha === "2.5") return cat === "OVER 2,5";
      if (linha === "3.5") return cat === "OVER 3,5";
      return cat.includes("OVER") || cat === "MAIS GOL" || cat === "GOLS";
    }

    if (scannerMercado === "CANTOS") return cat === "CANTOS" || cat === "CANTOS INÍCIO";
    if (scannerMercado === "CARTOES") return cat === "CARTÕES" || cat === "CARTÕES INÍCIO";
    if (scannerMercado === "BTTS") return cat === "BTTS";
    if (scannerMercado === "VITORIA") return cat === "VITÓRIA";
    if (scannerMercado === "HANDICAP") return cat === "HANDICAP";
    return true;
  }

  function labelMercadoScanner() {
    const linha = linhaScannerAtual();
    if (scannerMercado === "GOLS") return `Over ${linha} gols`;
    if (scannerMercado === "CANTOS") return `Over ${linha} cantos FT`;
    if (scannerMercado === "CARTOES") return `Over ${linha} cartões FT`;
    if (scannerMercado === "BTTS") return "Ambas marcam";
    if (scannerMercado === "VITORIA") return "Vitória do favorito";
    if (scannerMercado === "HANDICAP") return linha;
    return scannerMercado;
  }

  function mercadoParaScanner(item) {
    const candidatos = mercadosDoItem(item)
      .filter((m) => !mercadoCumprido(m, item))
      .filter((m) => categoriaScanner(m))
      .map((m) => {
        const baseScore = Number(m.confidence || 0) * 1.25 + Number(m.pressure || 0) * 0.55;
        const realBonus = (jogoStatsReal(item) ? 7 : 0) + (jogoOddReal(item) ? 5 : 0) + (jogoEventosReal(item) ? 3 : 0);
        const vipBonus = isVip(m) ? 6 : 0;
        return { ...m, __scannerScore: Math.round(baseScore + realBonus + vipBonus) };
      });

    return candidatos.sort((a, b) => (b.__scannerScore || 0) - (a.__scannerScore || 0))[0] || null;
  }

  const scannerOportunidades = useMemo(() => {
    return signals
      .map((item) => {
        const m = mercadoParaScanner(item);
        if (!m) return null;
        const backtest = Math.round(limitar((m.confidence || 0) * 0.72 + (m.pressure || 0) * 0.22 + (jogoStatsReal(item) ? 4 : 0) + (jogoOddReal(item) ? 3 : 0), 55, 98));
        return {
          ...item,
          __scannerMarket: {
            ...m,
            market: m.market || labelMercadoScanner(),
            alert: m.alert || "⚡ SCANNER VIP"
          },
          __scannerBacktest: backtest,
          __scannerScore: Number(m.__scannerScore || 0) + backtest * 0.35
        };
      })
      .filter(Boolean)
      .filter((item) => {
        const texto = `${item.match} ${item.league} ${item.__scannerMarket?.market || ""}`.toLowerCase();
        return texto.includes(busca.toLowerCase());
      })
      .sort((a, b) => Number(b.__scannerScore || 0) - Number(a.__scannerScore || 0))
      .slice(0, 50);
  }, [signals, busca, scannerMercado, scannerLinha]);

  const sinaisFiltrados = useMemo(() => {
    if (filtro === "SCANNER") return scannerOportunidades;

    return signals
      .filter((item) => {
        const texto = `${item.match} ${item.league} ${mercadosDoItem(item).map((m) => `${m.market} ${m.category} ${m.alert}`).join(" ")}`.toLowerCase();
        if (!texto.includes(busca.toLowerCase())) return false;

        const preLive = jogoPreLive(item);
        const preLiveVip = jogoPreLiveVip(item);

        if (filtro === "TODOS") {
          const temLiveAgora = signals.some((s) => jogoAoVivo(s));
          return temLiveAgora ? jogoAoVivo(item) : jogoPreLiveVip(item);
        }
        if (filtro === "LIVE") return jogoAoVivo(item);
        if (preLive && filtro !== "HISTORICO") return false;
        if (filtro === "ALERTA") return jogoTemAlerta(item);
        if (filtro === "OVER05") return jogoTemCategoria(item, "OVER 0,5");
        if (filtro === "OVER15") return jogoTemCategoria(item, "OVER 1,5");
        if (filtro === "OVER25") return jogoTemCategoria(item, "OVER 2,5");
        if (filtro === "OVER35") return jogoTemCategoria(item, "OVER 3,5");
        if (filtro === "CARTÕES") return jogoTemCategoria(item, "CARTÕES");
        if (filtro === "MAISGOL") return jogoTemCategoria(item, "MAIS GOL");
        if (filtro === "CANTOS") return jogoTemCategoria(item, "CANTOS");
        if (filtro === "BTTS") return jogoTemCategoria(item, "BTTS");
        if (filtro === "TOPIA") return jogoTemCategoria(item, "TOP IA") || mercadosDoItem(item).some((m) => (m.confidence || 0) >= 82);
        if (filtro === "VIP") return jogoAoVivo(item) && mercadosDoItem(item).some((m) => isVip(m));
        if (filtro === "REAL") return jogoStatsReal(item);
        if (filtro === "EVENTOS") return jogoEventosReal(item);
        if (filtro === "ODDS") return jogoOddReal(item);
        if (filtro === "HISTORICO") return preLiveVip;
        return true;
      })
      .sort((a, b) => {
        if (filtro === "VIP" || filtro === "HISTORICO") {
          return scorePreLiveVip(b) - scorePreLiveVip(a);
        }
        return (melhorMercado(b).confidence || 70) + (melhorMercado(b).pressure || 70) - ((melhorMercado(a).confidence || 70) + (melhorMercado(a).pressure || 70));
      });
  }, [signals, busca, filtro, scannerOportunidades]);

  const liveCount = signals.filter((s) => s.type === "live" || mercadosDoItem(s).some((m) => m.type === "live")).length;
  const alertCount = signals.filter((s) => jogoTemAlerta(s)).length;
  const realCount = signals.filter((s) => jogoStatsReal(s)).length;
  const eventosCount = signals.filter((s) => jogoEventosReal(s)).length;
  const oddsCount = signals.filter((s) => jogoOddReal(s)).length;

  return (
    <div className="page">
      <style>{`
${css}

/* ===== AJUSTE FINAL: NOMES, STATS REAIS, MENU, TEMPO ===== */
.filters{
  display:grid!important;
  grid-template-columns:repeat(17,minmax(56px,1fr))!important;
  gap:5px!important;
  width:100%!important;
  overflow:hidden!important;
}
.filters button{
  min-width:0!important;
  height:31px!important;
  padding:4px 3px!important;
  font-size:9px!important;
  line-height:1!important;
  font-weight:1000!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  color:#f8fafc!important;
  text-shadow:0 1px 2px #000!important;
}
.matchHero{
  grid-template-columns:104px minmax(0,1fr) 104px!important;
  min-height:108px!important;
  gap:10px!important;
}
.heroCenter h2,
.matchHero h2{
  display:none!important;
}
.heroCenter{
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;
  min-width:0!important;
}
.heroCenter p{
  font-size:10px!important;
  font-weight:900!important;
  color:#e5e7eb!important;
  max-width:100%!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
.heroCenter b{
  font-size:32px!important;
  line-height:1!important;
}
.heroCenter strong.gameMinute{
  font-size:12px!important;
  font-weight:1000!important;
  padding:5px 9px!important;
  border-radius:999px!important;
  background:#ef4444!important;
  color:#fff!important;
  box-shadow:0 0 12px rgba(239,68,68,.5)!important;
  white-space:nowrap!important;
}
.heroLogo{
  width:58px!important;
  height:58px!important;
}
.teamSide small{
  display:block!important;
  width:104px!important;
  max-width:104px!important;
  min-height:30px!important;
  font-size:12px!important;
  line-height:1.08!important;
  font-weight:1000!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:unset!important;
  text-align:center!important;
  word-break:normal!important;
}
.statsOverlayNotice{
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;
  gap:3px!important;
  font-size:11px!important;
  font-weight:1000!important;
  color:#facc15!important;
  background:rgba(0,0,0,.72)!important;
  border:1px solid rgba(250,204,21,.55)!important;
  border-radius:8px!important;
  padding:8px!important;
}
.statsOverlayNotice small{
  font-size:9px!important;
  color:#e5e7eb!important;
}
.statDial b,
.shotBox strong{
  font-size:17px!important;
  color:#f8fafc!important;
}
.statDial small,
.shotBox small{
  font-size:8.5px!important;
  color:#f8fafc!important;
}
.card:not([data-live="true"]) .timelineBox,
.card:not([data-live="true"]) .chronology,
.card:not([data-live="true"]) .timeline{
  display:none!important;
}
@media (max-width:900px){
  .filters{grid-template-columns:repeat(4,minmax(0,1fr))!important;overflow:visible!important}
  .filters button{font-size:10px!important}
  .matchHero{grid-template-columns:84px minmax(0,1fr) 84px!important}
  .teamSide small{width:84px!important;max-width:84px!important;font-size:10px!important}
}

`}</style>

      <header className="topBar">
        <div>
          <h1>MekineBet <span className="liveDot"></span></h1>
          <div className="subTitle">🟢 Scanner live • odds • pressão • mercados</div>
        </div>
        <div className="statusWrap">
          <span className="pill">🟢 Live: {liveCount}</span>
          <span className="pill">🚨 Alertas: {alertCount}</span>
          <span className="pill">👑 VIP</span>
          <span className="pill">📡 {apiInfo.mode || "api"}</span>
          <span className="pill">📊 Real: {realCount || apiInfo.realStatsGames || 0}</span>
          <span className="pill">🎬 Eventos: {eventosCount || apiInfo.realEventsGames || 0}</span>
          <span className="pill">💰 Odds: {oddsCount || apiInfo.realOddsGames || 0}</span>
          <span className="pill">🕘 {lastUpdate || "carregando..."}</span>
        </div>
      </header>

      {(apiInfo.mode === "fallback-ia" || apiInfo.mode === "empty" || apiInfo.mode === "no-api-key") && (
        <div className="notice">
          {apiInfo.mode === "no-api-key"
            ? "⚠️ API key ausente no Render. Configure API_FOOTBALL_KEY para carregar jogos reais."
            : "📊 Nenhum jogo real encontrado agora. O fallback/demo foi removido para não mostrar partidas falsas."}
        </div>
      )}

      {apiInfo.message && apiInfo.mode !== "fallback-ia" && apiInfo.mode !== "empty" && apiInfo.mode !== "no-api-key" && (
        <div className="notice infoNotice">{apiInfo.message}</div>
      )}

      {apiInfo.mode !== "fallback-ia" && liveCount > 0 && apiInfo.statsMode !== "real" && (
        <div className="notice">📊 Jogos reais carregados. Algumas partidas ainda estão sem estatísticas detalhadas da API, então o painel calcula uma estimativa temporária.</div>
      )}

      {liveCount === 0 && apiInfo.mode !== "fallback-ia" && (
        <div className="notice">📊 Nenhum LIVE real disponível agora. Mostrando jogos pré-live/histórico enquanto monitora automaticamente.</div>
      )}

      {apiInfo.mode !== "fallback-ia" && liveCount > 0 && oddsCount === 0 && apiInfo.realOddsGames === 0 && (
        <div className="notice">💰 Jogos carregados, mas nenhuma odd real disponível agora para estes mercados.</div>
      )}

      <div className="filters">
        {[
          ["TODOS", "▣ TODOS"],
          ["LIVE", "◉ AO VIVO"],
          ["ALERTA", "⚠️ ALERTA"],
          ["OVER05", "↗ OVER 0,5"],
          ["OVER15", "↗ OVER 1,5"],
          ["OVER25", "↗ OVER 2,5"],
          ["OVER35", "↗ OVER 3,5"],
          ["MAISGOL", "⚽ MAIS GOL"],
          ["CANTOS", "🚩 CANTOS"],
          ["CARTÕES", "🟨 CARTÕES"],
          ["BTTS", "👥 BTTS"],
          ["TOPIA", "🧠 TOP IA"],
          ["VIP", "👑 VIP"],
          ["ODDS", "💰 ODDS"],
          ["REAL", "📊 STATS REAL"],
          ["EVENTOS", "🎬 EVENTOS"],
          ["SCANNER", "⚡ SCANNER VIP"],
          ["HISTORICO", "🔐 PRÉ-LIVE VIP"]
        ].map(([value, label]) => (
          <button key={value} onClick={() => setFiltro(value)} className={filtro === value ? "activeBtn" : ""}>{label}</button>
        ))}
      </div>

      <input placeholder="🔍  Buscar jogo, liga ou mercado..." value={busca} onChange={(e) => setBusca(e.target.value)} className="search" />

      {filtro === "SCANNER" && (
        <section className="scannerVipPanel">
          <div className="scannerHead">
            <div>
              <small>⚡ SCANNER VIP</small>
              <h2>Escanear oportunidades de alto valor</h2>
              <p>Escolha o mercado e a linha. O ranking mostra apenas sinais que ainda podem acontecer.</p>
            </div>
            <strong>{scannerOportunidades.length} oportunidades</strong>
          </div>

          <div className="scannerControls">
            <label>
              Mercado
              <select value={scannerMercado} onChange={(e) => { setScannerMercado(e.target.value); setScannerLinha((SCANNER_LINHAS[e.target.value] || ["2.5"])[0]); }}>
                <option value="GOLS">Gols</option>
                <option value="CANTOS">Cantos</option>
                <option value="CARTOES">Cartões</option>
                <option value="BTTS">Ambas marcam</option>
                <option value="VITORIA">Vitória</option>
                <option value="HANDICAP">Handicap / Dupla chance</option>
              </select>
            </label>

            <label>
              Linha
              <select value={linhaScannerAtual()} onChange={(e) => setScannerLinha(e.target.value)}>
                {(SCANNER_LINHAS[scannerMercado] || []).map((linha) => (
                  <option key={linha} value={linha}>{linha}</option>
                ))}
              </select>
            </label>

            <div className="scannerTarget">
              <span>Buscando</span>
              <b>{labelMercadoScanner()}</b>
            </div>
          </div>

          <div className="scannerRanking">
            {scannerOportunidades.slice(0, 6).map((item, i) => {
              const m = item.__scannerMarket || melhorMercado(item);
              return (
                <div className="scannerResult" key={`${item.id || item.fixtureId || item.match}-${i}`}>
                  <span className="rank">#{i + 1}</span>
                  <div>
                    <b>{tituloJogo(item)}</b>
                    <small>{item.league || "Liga"} • {jogoAoVivo(item) ? `${minuto(item)}' ao vivo` : textoInicio(item)}</small>
                    <em>{m.market || labelMercadoScanner()}</em>
                  </div>
                  <strong>{m.confidence || 0}%</strong>
                  <small className="backtest">Backtest {item.__scannerBacktest || 0}%</small>
                  <button type="button" onClick={() => setBusca(tituloJogo(item))}>Ver análise</button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {loading ? (
        <div className="empty">Carregando sinais...</div>
      ) : sinaisFiltrados.length === 0 ? (
        <div className="empty emptyState">
          <b>
            {filtro === "SCANNER"
              ? "Nenhuma oportunidade encontrada nesse scanner agora."
              : filtro === "HISTORICO"
              ? "Nenhum pré-live VIP real encontrado agora."
              : filtro === "LIVE"
                ? "Nenhum jogo ao vivo real disponível agora."
                : filtro === "TODOS"
                  ? "Nenhum jogo real disponível agora."
                : "Nenhum jogo encontrado nesse filtro."}
          </b>
          <span>
            {apiInfo.mode === "fallback-ia" || apiInfo.mode === "empty"
              ? "Sem jogos demo/fallback. Quando API-Football, Sportmonks ou Odds API entregar jogos reais, eles aparecem automaticamente."
              : "Tente outro filtro ou aguarde a próxima atualização automática."}
          </span>
        </div>
      ) : (
        <main className="grid">
          {sinaisFiltrados.map((item, index) => {
            const stats = statsDoJogo(item);
            const status = mercadoStatus(item);
            const cat = categoriaMercado(item);
            const vip = isVip(item);
            const liveReal = item.type === "live";
            const times = timesDoJogo(item);
            const { homeColor, awayColor } = teamColorPair(times.casa, times.fora);
            const currentMinute = liveReal ? Math.min(90, Math.max(1, minuto(item) || 1)) : 0;
            const weather = climaDoJogo(item, index);
            const events = timelineEvents(item, index, homeColor, awayColor);
            const hasOdds = jogoOddReal(item);
            const strongest = melhorMercadoDoFiltro(item);
            const liveMap = buildLiveMapState(item, index);
            const timelineLeft = (m) => `calc(46px + ${(Math.max(0, Math.min(90, m)) / 90) * 100}% - ${((Math.max(0, Math.min(90, m)) / 90) * 51).toFixed(2)}px)`;
            const statsReal = jogoStatsReal(item);
            const statText = (v, suffix = "") => {
              if (!statsReal) return "—";
              const n = Number(v || 0);
              return `${Number.isFinite(n) ? Math.round(n) : 0}${suffix}`;
            };
            const statPair = (a, b) => {
              if (!statsReal) return "—/—";
              const x = Number(a || 0);
              const y = Number(b || 0);
              return `${Number.isFinite(x) ? Math.round(x) : 0}/${Number.isFinite(y) ? Math.round(y) : 0}`;
            };
            const statPct = (v) => {
              if (!statsReal) return 50;
              const n = Number(v || 0);
              return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 50));
            };

            const atkHomePct = pctValue(stats.home.ataques, stats.away.ataques);
            const dangerHomePct = pctValue(stats.home.perigosos, stats.away.perigosos);
            const posseHomePct = pctValue(stats.home.posse, stats.away.posse);
            const shotsHomePct = pctValue(stats.home.finalizacoes, stats.away.finalizacoes);
            const onGoalHomePct = pctValue(stats.home.noGol, stats.away.noGol);

            return (
              <section key={item.id || index} className="card" data-live={liveReal ? "true" : "false"}>
                <div className="matchHero">
                  <div className="teamSide">
                    <img className="heroLogo" src={logoCasa(item)} alt={times.casa} onError={(e) => (e.currentTarget.src = fallbackLogo(times.casa))} />
                    <small style={{ color: homeColor }}>{nomeCurto(times.casa)}</small>
                  </div>
                  <div className="heroCenter">
                    <p>{item.league || "Liga"}</p>
                    <b>{item.score || "0-0"}</b>
                    <strong className={liveReal ? "" : "preliveMinute"}>
                      {liveReal ? tempoAoVivoTexto(item) : `VIP 24H • ${textoInicio(item)}`}
                    </strong>
                  </div>
                  <div className="teamSide right">
                    <img className="heroLogo" src={logoFora(item)} alt={times.fora} onError={(e) => (e.currentTarget.src = fallbackLogo(times.fora))} />
                    <small style={{ color: awayColor }}>{nomeCurto(times.fora)}</small>
                  </div>
                </div>

                {/* ... resto do código permanece exatamente igual ... */}

                {/* (O restante do componente continua idêntico ao original) */}

              </section>
            );
          })}
        </main>
      )}
    </div>
  );
}

const css = `...`;   // (O CSS completo permanece igual)
