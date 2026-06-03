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
  const [nowTick, setNowTick] = useState(Date.now());

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
    const timer = setInterval(carregar, 20000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
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

    // A API não entrega a cor exata do uniforme em campo.
    // Aqui usamos a cor base do time e impedimos cores iguais/parecidas no mesmo jogo.
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
      // Simula o estado vivo do campo com base no minuto, pressão e força ofensiva.
      // Assim a bola não fica presa no último evento antigo da API.
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

      // Todo minuto tem leitura: um time progride no campo por vez.
      // Level 1 = passou/meio-campo, 2 = ataque, 3 = muito perto do gol/chance clara.
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
    // Se a API não mandou data, mantém no VIP para não esconder jogos úteis.
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

    // Correção importante:
    // Os mercados VIP pré-live são criados de forma sintética.
    // Se a gente chamar preliveVipMarkets() dentro desses próprios mercados,
    // o React entra em loop infinito e estoura: Maximum call stack size exceeded.
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

    // Sinais de gols só entram se ainda NÃO bateram.
    if (gols < 1) candidates.push(mercadoSynthetic(item, "Próximo gol / Over 0.5", "OVER05", pressureScore + 4, "🔥 PRÓXIMO SINAL • 1º GOL", { type: "live", status: "AO VIVO", nextSignal: true }));
    if (gols < 2) candidates.push(mercadoSynthetic(item, "Próximo gol / Over 1.5", "OVER15", pressureScore + (gols === 1 ? 9 : -1), "🔥 PRÓXIMO SINAL • +1 GOL", { type: "live", status: "AO VIVO", nextSignal: true }));
    if (gols < 3 && min <= 82) candidates.push(mercadoSynthetic(item, "Próximo gol / Over 2.5", "OVER25", pressureScore + (gols === 2 ? 9 : -8), "🔥 PRÓXIMO SINAL • OVER 2,5", { type: "live", status: "AO VIVO", nextSignal: true }));
    if (gols < 4 && min <= 75) candidates.push(mercadoSynthetic(item, "Próximo gol / Over 3.5", "OVER35", pressureScore + (gols === 3 ? 10 : -14), "🔥 PRÓXIMO SINAL • OVER 3,5", { type: "live", status: "AO VIVO", nextSignal: true }));

    const { homeGoals, awayGoals } = placarPartes(item);
    if (!(homeGoals > 0 && awayGoals > 0) && min <= 80) {
      candidates.push(mercadoSynthetic(item, "Ambas marcam próximo", "BTTS", conf + Math.min(stats.home.perigosos, stats.away.perigosos) * 0.6 + Math.min(stats.home.noGol, stats.away.noGol) * 4, "🔥 PRÓXIMO SINAL • BTTS", { type: "live", status: "AO VIVO", nextSignal: true }));
    }

    // Cantos e cartões agora mostram a linha que ainda falta acontecer.
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

        // Pré-live são sinais de jogos que ainda vão acontecer.
        // Ficam reservados para VIP: não entram nos filtros públicos.
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
      <style>{css}</style>

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
              const n = Number(v || 0);
              return `${Number.isFinite(n) ? Math.round(n) : 0}${suffix}`;
            };
            const statPair = (a, b) => {
              const x = Number(a || 0);
              const y = Number(b || 0);
              return `${Number.isFinite(x) ? Math.round(x) : 0}/${Number.isFinite(y) ? Math.round(y) : 0}`;
            };
            const statPct = (v) => {
              const n = Number(v || 0);
              return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 50));
            };
            const currentSecond = new Date(nowTick).getSeconds();

            const atkHomePct = pctValue(stats.home.ataques, stats.away.ataques);
            const dangerHomePct = pctValue(stats.home.perigosos, stats.away.perigosos);
            const posseHomePct = pctValue(stats.home.posse, stats.away.posse);
            const shotsHomePct = pctValue(stats.home.finalizacoes, stats.away.finalizacoes);
            const onGoalHomePct = pctValue(stats.home.noGol, stats.away.noGol);

            return (
              <section key={item.id || index} className="card">
                <div className="matchHero">
                  <div className="teamSide">
                    <img className="heroLogo" src={logoCasa(item)} alt={times.casa} onError={(e) => (e.currentTarget.src = fallbackLogo(times.casa))} />
                    <small style={{ color: homeColor }}>{nomeCurto(times.casa)}</small>
                  </div>
                  <div className="heroCenter">
                    <h2><span style={{ color: homeColor }}>{nomeCurto(times.casa)}</span> <em>vs</em> <span style={{ color: awayColor }}>{nomeCurto(times.fora)}</span></h2>
                    <p>{item.league || "Liga"}</p>
                    <b>{item.score || "0-0"}</b>
                    <strong className={liveReal ? "gameMinute" : "preliveMinute"}>
                      {liveReal ? `${currentMinute}' ${String(currentSecond).padStart(2, "0")}s` : `VIP 24H • ${textoInicio(item)}`}
                    </strong>
                  </div>
                  <div className="teamSide right">
                    <img className="heroLogo" src={logoFora(item)} alt={times.fora} onError={(e) => (e.currentTarget.src = fallbackLogo(times.fora))} />
                    <small style={{ color: awayColor }}>{nomeCurto(times.fora)}</small>
                  </div>
                </div>

                <div className="badges">
                  <span className="base">{liveReal ? "AO VIVO" : "PRÉ-LIVE VIP"}</span>
                  <span className={jogoStatsReal(item) ? "realStatsBadge" : "estimatedStatsBadge"}>
                    {jogoStatsReal(item) ? "STATS REAL" : "ESTIMADO"}
                  </span>
                  <span className={jogoEventosReal(item) ? "realEventsBadge" : "noEventsBadge"}>
                    {jogoEventosReal(item) ? "EVENTOS REAL" : "SEM EVENTOS"}
                  </span>
                  <span className={hasOdds ? "realOddsBadge" : "noOddsBadge"}>
                    {hasOdds ? "ODD REAL" : "SEM ODD"}
                  </span>
                  {vip && <span className="vip">VIP</span>}
                  <div className="marketBadges">
                    {mercadosVisiveisNoFiltro(item).slice(0, 5).map((m, i) => (
                      <span key={i} className="market">{categoriaMercado(m)}</span>
                    ))}
                  </div>
                </div>

                <div className={`highlightSignal ${alertaForte(strongest) ? "strong" : ""}`}>
                  <div className="highlightSignalText">
                    <small>{liveReal ? "PRÓXIMO SINAL AO VIVO" : "MELHOR SINAL VIP PRÉ-LIVE 24H"}</small>
                    <b>{strongest.market || strongest.mercado || categoriaMercado(strongest)}</b>
                    <span>{strongest.alert || mercadoStatus(strongest)}</span>
                  </div>

                  <div className="highlightSignalMeta">
                    <strong>{strongest.confidence || 0}%</strong>
                    <em>
                      {mercadoOddReal(strongest)
                        ? `Odd ${formatOdd(strongest)} • ${bookmakerDoMercado(strongest) || "Real"}`
                        : "Sem odd"}
                    </em>
                  </div>
                </div>

                <div className={`betStats proStats ${statsReal ? "statsRealBox" : "statsEstimatedBox"}`} style={{ "--home": homeColor, "--away": awayColor }}>
                  <div className="statsTopGrid">
                    <div className="metricPair">
                      <small>ATAQUES</small>
                      <div className="metricNumbers">
                        <b style={{ color: homeColor }}>{statText(stats.home.ataques)}</b>
                        <span className="metricVs" style={{ "--pct": `${statPct(atkHomePct)}%` }}></span>
                        <b style={{ color: awayColor }}>{statText(stats.away.ataques)}</b>
                      </div>
                      <div className="dualMiniBar">
                        <i style={{ width: `${statPct(Math.min(100, (stats.home.ataques / Math.max(1, stats.home.ataques + stats.away.ataques)) * 100))}%`, background: homeColor }}></i>
                        <em style={{ width: `${statPct(Math.min(100, (stats.away.ataques / Math.max(1, stats.home.ataques + stats.away.ataques)) * 100))}%`, background: awayColor }}></em>
                      </div>
                    </div>

                    <div className="metricPair">
                      <small>ATAQUES PERIGOSOS</small>
                      <div className="metricNumbers">
                        <b style={{ color: homeColor }}>{statText(stats.home.perigosos)}</b>
                        <span className="metricVs danger" style={{ "--pct": `${statPct(dangerHomePct)}%` }}></span>
                        <b style={{ color: awayColor }}>{statText(stats.away.perigosos)}</b>
                      </div>
                      <div className="dualMiniBar">
                        <i style={{ width: `${statPct(Math.min(100, (stats.home.perigosos / Math.max(1, stats.home.perigosos + stats.away.perigosos)) * 100))}%`, background: homeColor }}></i>
                        <em style={{ width: `${statPct(Math.min(100, (stats.away.perigosos / Math.max(1, stats.home.perigosos + stats.away.perigosos)) * 100))}%`, background: awayColor }}></em>
                      </div>
                    </div>

                    <div className="metricPair posseMetric">
                      <small>% POSSE</small>
                      <div className="metricNumbers">
                        <b style={{ color: homeColor }}>{statText(stats.home.posse, "%")}</b>
                        <span className="metricVs ball" style={{ "--pct": `${statPct(posseHomePct)}%` }}></span>
                        <b style={{ color: awayColor }}>{statText(stats.away.posse, "%")}</b>
                      </div>
                      <div className="dualMiniBar">
                        <i style={{ width: `${statPct(stats.home.posse)}%`, background: homeColor }}></i>
                        <em style={{ width: `${statPct(stats.away.posse)}%`, background: awayColor }}></em>
                      </div>
                    </div>
                  </div>

                  <div className="statsMiddleRow">
                    <div className="sideCounters sideHome">
                      <strong style={{ color: homeColor }}>{sigla(times.casa)}</strong>
                      <span>🚩 <b>{statText(stats.home.cantos)}</b></span>
                      <span>🟨 <b>{statText(stats.home.cartoes)}</b></span>
                      <span>🟥 <b>{statText(stats.home.vermelhos)}</b></span>
                    </div>

                    <div className="shotBox shotBoxPro">
                      <small>FINALIZAÇÕES / CHUTES AO GOL</small>
                      <strong style={{ color: homeColor }}>{statPair(stats.home.finalizacoes, stats.home.noGol)}</strong>
                      <div className="shotBars shotSplitBars">
                        <div className="splitBar" title="Finalizações">
                          <i style={{ width: `${statPct(shotsHomePct)}%`, background: homeColor }}></i>
                          <em style={{ width: `${100 - statPct(shotsHomePct)}%`, background: awayColor }}></em>
                        </div>
                        <div className="splitBar" title="Chutes ao gol">
                          <i style={{ width: `${statPct(onGoalHomePct)}%`, background: homeColor }}></i>
                          <em style={{ width: `${100 - statPct(onGoalHomePct)}%`, background: awayColor }}></em>
                        </div>
                      </div>
                      <strong style={{ color: awayColor }}>{statPair(stats.away.finalizacoes, stats.away.noGol)}</strong>
                    </div>

                    <div className="sideCounters sideAway">
                      <strong style={{ color: awayColor }}>{sigla(times.fora)}</strong>
                      <span>🚩 <b>{statText(stats.away.cantos)}</b></span>
                      <span>🟨 <b>{statText(stats.away.cartoes)}</b></span>
                      <span>🟥 <b>{statText(stats.away.vermelhos)}</b></span>
                    </div>
                  </div>
                </div>

                <div className={`miniMap weather-${weather.cls}`}>
                  <div className={`livePulse ${liveMap.intensity} ${liveMap.side}`}>
                    <b>
                      {liveMap.live
                        ? `${sigla(liveMap.possessionTeam || (liveMap.side === "home" ? times.casa : times.fora))} COM A BOLA`
                        : "PRÉ-LIVE VIP"}
                    </b>
                    <span>{liveMap.playType || liveMap.label}</span>
                  </div>

                  <div className="weatherBadge">
                    <span>{weather.icon}</span>
                    <b>{weather.label}</b>
                  </div>

                  <div className="stadiumLights">
                    <i></i><i></i><i></i><i></i><i></i>
                  </div>

                  <div className="field3d liveField">
                    <div className="grass"></div>
                    <div className="shade"></div>
                    <div className="midLine"></div>
                    <div className="centerCircle"></div>
                    <div className="boxLeft"></div>
                    <div className="boxRight"></div>
                    <div className="goalLeft"></div>
                    <div className="goalRight"></div>

                    <div
                      className={`attackTrail ${liveMap.side}`}
                      style={{
                        left: `${Math.min(liveMap.trailFrom, liveMap.trailTo)}%`,
                        width: `${Math.max(2, Math.abs(liveMap.trailTo - liveMap.trailFrom))}%`,
                        top: `${liveMap.ballY}%`,
                        background:
                          liveMap.side === "away"
                            ? `linear-gradient(90deg, transparent, ${awayColor})`
                            : `linear-gradient(90deg, ${homeColor}, transparent)`
                      }}
                    ></div>

                    {liveMap.supportDots.map((dot, di) => (
                      <div
                        key={di}
                        className={`playerDot ${dot.team}`}
                        style={{
                          left: `${dot.x}%`,
                          top: `${dot.y}%`,
                          background: dot.team === "home" ? homeColor : awayColor
                        }}
                      ></div>
                    ))}

                    <div
                      className={`liveBall ${liveMap.side} ${liveMap.intensity}`}
                      style={{
                        left: `${liveMap.ballX}%`,
                        top: `${liveMap.ballY}%`
                      }}
                    >
                      <span
                        className="ballAura"
                        style={{
                          background: liveMap.side === "home" ? homeColor : awayColor
                        }}
                      ></span>
                    </div>

                    <div className="weatherLayer"></div>
                  </div>

                  <div className="mapStats compact">
                    <span>{liveMap.live ? `Bola: ${sigla(liveMap.possessionTeam)}` : "VIP pré-live"}</span>
                    <span>{liveMap.label}</span>
                    <span>{liveMap.live ? `${currentMinute}' ${String(currentSecond).padStart(2, "0")}s` : "Próximo jogo"}</span>
                  </div>
                </div>

                {liveReal && (
                <div className="flowCard">
                  <h3>
                    CRONOLOGIA DA PARTIDA
                    {jogoEventosReal(item) && <span className="flowRealTag">EVENTOS REAIS</span>}
                  </h3>
                  <div className="flowMinuteScale"><span>0'</span><span>15'</span><span>30'</span><span>45'</span><span>60'</span><span>75'</span><span>90'</span></div>
                  <div className="flowWrap">
                    <div className="teamMini homeMini"><span>{sigla(times.casa)}</span><img src={logoCasa(item)} alt="" /></div>
                    <div className="teamMini awayMini"><span>{sigla(times.fora)}</span><img src={logoFora(item)} alt="" /></div>
                    <div className="middleLine"></div>
                    {liveReal && <div className="nowLine" style={{ left: timelineLeft(currentMinute) }}><b>{currentMinute}'</b></div>}
                    {events.map((ev, i) => (
                      <React.Fragment key={i}>
                        <span
                          className={`flowSpike ${ev.team} level-${ev.level} ${ev.real ? "realMinute" : ""}`}
                          style={{
                            left: timelineLeft(ev.m),
                            height: `${ev.level === 3 ? 30 : ev.level === 2 ? 18 : 7}px`,
                            background: ev.color,
                            boxShadow: `0 0 8px ${ev.color}`
                          }}
                        />
                        {ev.icon && <span className={`flowIcon ${ev.team} ${ev.real ? "realEventIcon" : ""}`} title={ev.title || ""} style={{ left: timelineLeft(ev.m) }}>{ev.icon}</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flowLegend">
                    <span><i className="leve"></i>Ataque leve</span><span><i className="perigoso"></i>Ataque perigoso</span><span><i className="clara"></i>Chance clara</span><span>⚽ Gol</span><span>🟨 Cartão</span><span>🚩 Escanteio</span>
                  </div>
                </div>
                )}

                <div className="marketsPanel">
                  {mercadosVisiveisNoFiltro(item).map((m, i) => (
                    <div key={i} className={`signalChip ${alertaForte(m) ? "strong" : ""} ${mercadoOddReal(m) ? "oddRealChip" : ""}`}>
                      <b>{categoriaMercado(m)}</b>
                      <span>{m.alert || mercadoStatus(m)}</span>
                      <strong>{m.confidence || 70}%</strong>
                      <em className={mercadoOddReal(m) ? "oddRealText" : ""}>
                        {mercadoOddReal(m) ? `Odd ${formatOdd(m)} • ${bookmakerDoMercado(m) || "Real"}` : "Sem odd"}
                      </em>
                    </div>
                  ))}
                </div>

                <div className="bookies"><button>Betano</button><button>Novibet</button><button>Bet365</button><button>VIP</button></div>
              </section>
            );
          })}
        </main>
      )}
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
*{box-sizing:border-box}body{margin:0;background:#081016;font-family:'Inter',Arial,sans-serif}.page{min-height:100vh;background:radial-gradient(circle at top,#0b1d22,#05090c 60%);color:#fff;padding:10px;overflow-x:hidden}.topBar{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px}h1{color:#58f5a5;font-size:clamp(24px,3vw,40px);margin:0;font-weight:900;line-height:1}.liveDot{display:inline-block;width:14px;height:14px;background:#22c55e;border-radius:50%;box-shadow:0 0 18px #22c55e}.subTitle{font-size:12px;font-weight:800;color:#d1d5db;margin-top:4px}.statusWrap{display:flex;gap:10px;flex-wrap:wrap}.pill{background:#071014;border:1px solid #0f7a3e;border-radius:8px;padding:8px 16px;font-weight:900}.notice{background:#4a1c08;border:1px solid #ff7b00;padding:7px;border-radius:7px;margin-bottom:7px;font-weight:900;font-size:12px}.filters{display:grid;grid-template-columns:repeat(17,minmax(0,1fr));gap:7px;margin-bottom:7px}.filters button{background:#101820;color:#fff;border:1px solid rgba(255,255,255,.18);padding:8px 3px;border-radius:7px;cursor:pointer;font-weight:900;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.filters .activeBtn{background:#1ccc67;color:#001b0b}.search{width:100%;background:#111b21;border:1px solid #0f7a3e;color:#fff;padding:9px;border-radius:7px;margin-bottom:9px;font-size:13px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:start}.card{background:linear-gradient(180deg,#07141a,#06110d);border:1px solid rgba(0,214,111,.42);border-radius:12px;box-shadow:0 0 18px rgba(0,255,112,.06);overflow:hidden;padding:8px;min-height:610px}.matchHero{display:grid;grid-template-columns:72px 1fr 72px;align-items:center;text-align:center;min-height:86px;gap:8px}.teamSide{display:grid;gap:3px;justify-items:center}.teamSide.right{justify-items:center}.heroLogo{width:54px;height:54px;object-fit:contain;filter:drop-shadow(0 0 5px rgba(255,255,255,.22))}.teamSide small{font-weight:900;font-size:10px}.heroCenter h2{font-size:17px;margin:0;font-weight:900;line-height:1}.heroCenter h2 em{font-style:normal;color:#fff}.heroCenter p{font-size:10px;color:#d1d5db;margin:5px 0}.heroCenter b{display:block;font-size:30px;line-height:1}.heroCenter strong{color:#ef4444;font-size:13px}.badges{display:flex;justify-content:flex-end;gap:4px;margin-top:-15px;margin-bottom:5px}.badges span{border-radius:999px;padding:3px 8px;font-size:9px;font-weight:900}.base{background:#374151}.vip{background:#facc15;color:#000}.market{background:#0ea5e9}.betStats{position:relative;display:grid;grid-template-columns:1fr 1fr 1.25fr auto auto;gap:8px;align-items:end;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08);padding:10px 4px 8px;margin-bottom:7px}.statDial small,.shotBox small{display:block;color:#e5e7eb;font-size:8px;font-weight:900;text-align:center}.statDial div{display:flex;gap:8px;align-items:center;justify-content:center}.statDial b{font-size:16px}.statDial i{width:38px;height:38px;border-radius:50%;display:inline-block;position:relative;background:conic-gradient(var(--home) 0 62%, #d1d5db 62% 70%, var(--away) 70% 100%);box-shadow:0 0 10px rgba(255,255,255,.08)}.statDial i:before{content:'';position:absolute;inset:7px;background:#07141a;border-radius:50%}.statDial i:after{content:'▶';position:absolute;left:13px;top:9px;color:#d1d5db;font-size:12px}.shotBox{display:grid;grid-template-columns:auto 1fr auto;gap:5px;align-items:center}.shotBox small{grid-column:1/-1}.shotBox strong{font-size:17px}.shotBars{display:grid;gap:5px}.shotBars span,.shotBars em{height:4px;border-radius:999px;display:block}.shotBars em{opacity:.82}.miniCounters{display:grid;grid-template-columns:repeat(3,20px);gap:2px;justify-items:center;font-size:13px}.miniCounters b{display:block;text-align:center;color:#fff}.posseWide{grid-column:1/-1;display:grid;grid-template-columns:40px 1fr 40px;gap:8px;align-items:center;font-weight:900}.posseWide div{display:flex;height:4px;background:#1f2937;border-radius:999px;overflow:hidden}.posseWide i,.posseWide em{display:block;height:100%}.miniMap{position:relative;margin:0 auto 8px;max-width:380px}.eventBubble{position:absolute;z-index:3;left:50%;top:-3px;transform:translateX(-50%);background:#050505;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:5px 13px;display:flex;gap:8px;align-items:center;box-shadow:0 6px 18px rgba(0,0,0,.55)}.eventBubble span{background:#fff;border-radius:50%;width:24px;height:24px;display:grid;place-items:center}.eventBubble b{font-size:10px}.eventBubble small{display:block;font-size:9px;color:#7dd3fc}.field3d{position:relative;height:88px;margin:22px auto 0;border:1px solid rgba(0,255,112,.45);border-radius:14px;overflow:hidden;background:repeating-linear-gradient(90deg,#3d991f 0 28px,#2d841b 28px 56px);transform:perspective(260px) rotateX(28deg);box-shadow:inset 0 10px 18px rgba(255,255,255,.13),0 12px 20px rgba(0,0,0,.4)}.grass{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.2),transparent 30%),repeating-linear-gradient(90deg,rgba(255,255,255,.08) 0 1px,transparent 1px 16px)}.shade{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.12),transparent 45%)}.midLine{position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,.85)}.centerCircle{position:absolute;left:50%;top:50%;width:32px;height:32px;border:1px solid rgba(255,255,255,.9);border-radius:50%;transform:translate(-50%,-50%)}.boxLeft,.boxRight{position:absolute;top:26%;width:38px;height:48%;border:1px solid rgba(255,255,255,.8)}.boxLeft{left:0;border-left:0}.boxRight{right:0;border-right:0}.goalLeft,.goalRight{position:absolute;top:41%;width:5px;height:18%;background:#fff}.goalLeft{left:0}.goalRight{right:0}.dot{position:absolute;width:7px;height:7px;border-radius:50%;box-shadow:0 0 8px currentColor}.d1{left:35%;top:42%}.d2{left:45%;top:58%}.d3{left:56%;top:42%}.d4{left:68%;top:55%}.mapStats{display:grid;grid-template-columns:repeat(3,1fr);font-size:9px;text-align:center;font-weight:800;margin-top:2px}.flowCard{border:1px solid rgba(255,255,255,.13);border-radius:9px;background:linear-gradient(180deg,rgba(7,20,28,.92),rgba(5,12,15,.9));padding:7px;margin-top:5px}.flowCard h3{text-align:center;margin:0 0 4px;font-size:11px}.flowMinuteScale{display:grid;grid-template-columns:repeat(7,1fr);font-size:9px;font-weight:900;color:#e5e7eb;padding:0 22px 3px 46px}.flowWrap{position:relative;height:112px;padding-left:46px;border-radius:7px;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(0,0,0,.06));overflow:hidden}
.flowWrap:before{content:'';position:absolute;left:46px;right:5px;top:0;bottom:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.08) 0 1px,transparent 1px calc((100% - 51px)/90));pointer-events:none}.teamMini{position:absolute;left:0;width:42px;display:grid;justify-items:center;font-size:10px;font-weight:900}.teamMini img{width:28px;height:28px;object-fit:contain}.homeMini{top:10px}.awayMini{bottom:10px}.middleLine{position:absolute;left:45px;right:5px;top:50%;height:1px;background:rgba(255,255,255,.75)}.nowLine{position:absolute;top:0;bottom:0;width:2px;background:#ef4444;z-index:6}.nowLine b{position:absolute;top:-1px;left:50%;transform:translateX(-50%);background:#ef4444;color:#fff;border-radius:999px;padding:2px 5px;font-size:10px}.flowSpike{position:absolute;width:2px;border-radius:2px;left:0;z-index:4;opacity:.92}.flowSpike.home{bottom:50%;margin-bottom:1px}.flowSpike.away{top:50%;margin-top:1px}.flowIcon{position:absolute;z-index:7;transform:translateX(-45%);font-size:15px}.flowIcon.home{bottom:calc(50% + 34px)}.flowIcon.away{top:calc(50% + 34px)}.flowLegend{display:grid;grid-template-columns:repeat(6,auto);justify-content:space-between;gap:6px;font-size:9px;margin-top:6px;color:#e5e7eb}.flowLegend span{white-space:nowrap}.flowLegend i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:3px}.leve{background:#22c55e;opacity:.55}.perigoso{background:#22c55e}.clara{background:#84cc16}.marketLine{display:grid;grid-template-columns:1.4fr 1fr;gap:8px;border:1px solid #0f7a3e;border-radius:8px;padding:8px;margin-top:8px}.marketLine b{display:block}.marketLine span{font-size:11px}.marketLine strong{color:#facc15}.bar{display:block;height:7px;background:#1f2937;border-radius:999px;overflow:hidden;margin-top:4px}.bar i{display:block;height:100%;background:#22c55e}.bookies{display:flex;gap:8px;justify-content:space-between;margin-top:8px}.bookies button{border:0;border-radius:6px;padding:8px 14px;font-weight:900;color:#fff}.bookies button:nth-child(1){background:#22c55e}.bookies button:nth-child(2){background:#2563eb}.bookies button:nth-child(3){background:#f97316}.bookies button:nth-child(4){background:#facc15;color:#000}.empty{border:1px solid #0f7a3e;padding:18px;border-radius:10px}.footerBar{display:none}@media(max-width:1100px){.grid{grid-template-columns:1fr}.filters{grid-template-columns:repeat(3,1fr)}.betStats{grid-template-columns:1fr 1fr}.shotBox,.posseWide{grid-column:1/-1}.miniCounters{grid-template-columns:repeat(3,1fr)}.marketLine{grid-template-columns:1fr}.topBar{align-items:flex-start}.flowLegend{grid-template-columns:repeat(3,1fr)}}

/* ===== AJUSTE FINAL DE ALINHAMENTO PC ===== */
.grid{align-items:stretch!important}
.card{display:flex!important;flex-direction:column!important;min-height:640px!important;height:100%!important}
.matchHero{height:88px!important;min-height:88px!important}
.heroCenter h2{font-size:16px!important;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.heroCenter b{font-size:28px!important}
.badges{min-height:22px!important;align-items:center!important}
.betStats{grid-template-columns:1fr 1fr 1.25fr 64px 64px!important;min-height:96px!important;align-items:center!important}
.statDial{min-width:0!important}.statDial div{gap:6px!important}.statDial b{width:24px;text-align:center!important}.statDial i{width:34px!important;height:34px!important}.statDial i:after{left:11px!important;top:7px!important}
.shotBox{min-width:0!important}.shotBox strong{text-align:center;min-width:36px!important}.miniCounters{justify-content:center!important;align-self:center!important}.miniCounters span{display:grid;gap:1px;justify-items:center;font-size:12px!important}
.posseWide{margin-top:2px!important}.posseWide span:first-child{text-align:left}.posseWide span:last-child{text-align:right}
.miniMap{width:100%!important;max-width:none!important;padding:0 8px!important}.field3d{height:82px!important;margin-top:20px!important}.mapStats{padding:0 6px!important}
.flowCard{margin-top:8px!important;min-height:170px!important}.flowCard h3{height:16px!important;line-height:16px!important}.flowMinuteScale{padding-left:52px!important;padding-right:10px!important;align-items:center!important}.flowWrap{height:114px!important;padding-left:52px!important;padding-right:10px!important}.flowWrap:before{left:52px!important;right:10px!important}.middleLine{left:52px!important;right:10px!important}.teamMini{width:48px!important}.teamMini img{width:25px!important;height:25px!important}.flowSpike{width:2px!important;transform:translateX(-1px)!important}.flowIcon{font-size:13px!important;transform:translateX(-50%)!important}.nowLine{transform:translateX(-1px)!important}.flowLegend{min-height:18px!important;align-items:center!important;overflow:hidden!important}.flowLegend span{text-align:center!important;font-size:8px!important}
.marketLine{margin-top:auto!important;min-height:64px!important;align-items:center!important}.bookies{height:38px!important;align-items:center!important}.bookies button{min-width:80px!important}
@media(max-width:1100px){.card{min-height:auto!important}.matchHero{height:auto!important}.betStats{grid-template-columns:1fr 1fr!important}.flowLegend{grid-template-columns:repeat(3,1fr)!important}.bookies button{min-width:auto!important;flex:1}}


/* ===== AJUSTES SOLICITADOS: ESTATÍSTICA BET365 ALINHADA ===== */
.teamSide small{
  max-width:68px!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  line-height:1!important;
}
.heroCenter h2{
  font-size:15px!important;
  padding:0 4px!important;
}
.badges{
  margin-top:-13px!important;
  position:relative!important;
  z-index:5!important;
}

.proStats{
  display:grid!important;
  grid-template-columns:1fr!important;
  gap:6px!important;
  min-height:112px!important;
  padding:8px 6px!important;
  align-items:stretch!important;
}

.statsTopGrid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:7px;
  align-items:stretch;
}

.metricPair{
  min-width:0;
  background:rgba(255,255,255,.025);
  border-right:1px solid rgba(255,255,255,.10);
  padding:0 5px 3px;
}

.metricPair:last-child{border-right:0}

.metricPair small{
  display:block;
  text-align:center;
  color:#e5e7eb;
  font-size:7.4px;
  font-weight:900;
  line-height:1.1;
  height:18px;
  white-space:normal;
}

.metricNumbers{
  display:grid;
  grid-template-columns:1fr 26px 1fr;
  align-items:center;
  gap:2px;
  min-height:25px;
}

.metricNumbers b{
  text-align:center;
  font-size:16px;
  font-weight:900;
  line-height:1;
}

.metricVs{
  width:25px;
  height:25px;
  margin:auto;
  border-radius:50%;
  display:block;
  position:relative;
  background:conic-gradient(var(--home) 0 55%, rgba(226,232,240,.75) 55% 64%, var(--away) 64% 100%);
  box-shadow:0 0 7px rgba(255,255,255,.10);
}

.metricVs:before{
  content:"";
  position:absolute;
  inset:6px;
  border-radius:50%;
  background:#07141a;
}

.metricVs:after{
  content:"▶";
  position:absolute;
  left:8px;
  top:4px;
  color:#dbeafe;
  font-size:11px;
  z-index:2;
}

.metricVs.danger:after{content:"➤";left:7px}
.metricVs.ball:after{content:"●";left:9px;top:5px;font-size:9px;color:#fff}

.dualMiniBar{
  height:4px;
  display:flex;
  gap:2px;
  background:#111827;
  border-radius:999px;
  overflow:hidden;
  margin-top:2px;
}

.dualMiniBar i,
.dualMiniBar em{
  display:block;
  height:100%;
  opacity:.95;
}

.statsMiddleRow{
  display:grid;
  grid-template-columns:58px minmax(0,1fr) 58px;
  gap:7px;
  align-items:center;
}

.sideCounters{
  min-width:0;
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:2px;
  justify-items:center;
  align-items:center;
  font-size:10px;
  padding:3px;
  border-radius:7px;
  background:rgba(255,255,255,.025);
  border:1px solid rgba(255,255,255,.08);
}

.sideCounters strong{
  grid-column:1/-1;
  font-size:8px;
  font-weight:900;
  max-width:48px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.sideCounters span{
  display:grid;
  justify-items:center;
  gap:1px;
  line-height:1;
}

.sideCounters b{
  color:#fff;
  font-size:10px;
  line-height:1;
}

.shotBoxPro{
  display:grid!important;
  grid-template-columns:42px 1fr 42px!important;
  gap:5px!important;
  align-items:center!important;
  min-width:0!important;
  background:rgba(0,0,0,.14);
  border:1px solid rgba(255,255,255,.07);
  border-radius:7px;
  padding:5px 6px;
}

.shotBoxPro small{
  grid-column:1/-1!important;
  font-size:7.6px!important;
  text-align:center!important;
  color:#e5e7eb!important;
  font-weight:900!important;
  line-height:1!important;
}

.shotBoxPro strong{
  font-size:15px!important;
  text-align:center!important;
  min-width:0!important;
  white-space:nowrap!important;
}

.shotBoxPro .shotBars{
  display:grid!important;
  gap:4px!important;
  min-width:0!important;
}

.shotBoxPro .shotBars span,
.shotBoxPro .shotBars em{
  height:4px!important;
  border-radius:999px!important;
}

.posseWide{display:none!important}

@media(max-width:1100px){
  .statsTopGrid{grid-template-columns:1fr!important}
  .statsMiddleRow{grid-template-columns:1fr!important}
  .sideCounters{grid-template-columns:repeat(3,1fr)!important}
}



/* ===== AJUSTE EXTRA: LOGOS MENORES, STATS PROPORCIONAIS E SINAL VISÍVEL ===== */
.heroLogo{width:46px!important;height:46px!important}
.matchHero{grid-template-columns:62px 1fr 62px!important;min-height:78px!important;height:78px!important}
.teamSide small{font-size:9px!important;max-width:60px!important}
.heroCenter h2{font-size:14px!important}
.heroCenter b{font-size:27px!important}

.statsTopGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important}
.metricPair{border:1px solid rgba(255,255,255,.07)!important;border-radius:7px!important;background:rgba(0,0,0,.16)!important;padding:4px!important}
.metricVs{background:conic-gradient(var(--home) 0 50%, var(--away) 50% 100%)!important}
.metricVs:before{background:#07141a!important}
.dualMiniBar{height:5px!important;background:#101820!important;gap:0!important}
.dualMiniBar i{border-radius:999px 0 0 999px!important}
.dualMiniBar em{border-radius:0 999px 999px 0!important}

.shotBoxPro{grid-template-columns:40px 1fr 40px!important;padding:5px!important}
.shotBoxPro .shotBars{gap:5px!important}
.shotBoxPro .shotBars span,.shotBoxPro .shotBars em{height:5px!important;max-width:100%!important}
.shotBoxPro small:after{content:'  •  1ª linha: Finalizações / 2ª linha: No gol';font-size:6.8px;color:#9ca3af;font-weight:800}

.sideCounters{padding:4px 2px!important}
.sideCounters strong{font-size:7.5px!important}

.marketLine{border:1px solid rgba(250,204,21,.45)!important;background:linear-gradient(180deg,rgba(250,204,21,.09),rgba(0,0,0,.18))!important;box-shadow:0 0 12px rgba(250,204,21,.10)!important}
.marketLine div:first-child b{font-size:13px!important;color:#fff!important;text-transform:uppercase!important;text-align:center!important}
.marketLine div:first-child span{display:block!important;text-align:center!important;font-size:12px!important;color:#fff!important;font-weight:900!important}
.marketLine div:first-child strong{display:block!important;text-align:center!important;font-size:14px!important;color:#facc15!important}
.marketLine div:first-child{background:rgba(0,0,0,.22)!important;border-radius:7px!important;padding:5px!important;border:1px solid rgba(250,204,21,.25)!important}

@media(max-width:700px){
  .page{padding:6px!important}
  h1{font-size:25px!important}
  .statusWrap{gap:5px!important}.pill{padding:6px 8px!important;font-size:11px!important}
  .filters{grid-template-columns:repeat(3,1fr)!important;gap:5px!important}
  .filters button{font-size:9px!important;padding:7px 2px!important}
  .card{padding:7px!important}
  .matchHero{grid-template-columns:50px 1fr 50px!important;height:auto!important;min-height:70px!important}
  .heroLogo{width:40px!important;height:40px!important}
  .heroCenter h2{font-size:12px!important}
  .heroCenter b{font-size:24px!important}
  .badges{margin-top:0!important;justify-content:center!important}
  .proStats{padding:6px 5px!important}
  .statsTopGrid{grid-template-columns:1fr!important;gap:4px!important}
  .metricPair{display:grid!important;grid-template-columns:72px 1fr!important;gap:4px!important;align-items:center!important}
  .metricPair small{height:auto!important;text-align:left!important;font-size:7.8px!important}
  .metricNumbers{grid-template-columns:35px 24px 35px!important;justify-content:center!important}
  .dualMiniBar{grid-column:1/-1!important}
  .statsMiddleRow{grid-template-columns:1fr!important;gap:5px!important}
  .sideCounters{grid-template-columns:repeat(3,1fr)!important}
  .shotBoxPro{grid-template-columns:38px 1fr 38px!important}
  .miniMap{padding:0!important}.field3d{height:76px!important}
  .flowLegend{grid-template-columns:repeat(2,1fr)!important}
  .marketLine{grid-template-columns:1fr!important}
}

/* ===== PACOTE FINAL: PADRÃO BET365 COMPACTO / ALINHADO ===== */
:root{--mb-border:rgba(0,214,111,.34)}
.page{padding:7px!important;background:#111!important}
.topBar{padding:0 2px!important;margin-bottom:6px!important}
h1{font-size:clamp(25px,2.7vw,38px)!important;letter-spacing:-1px!important}
.subTitle{font-size:11px!important;font-weight:700!important}.pill{padding:7px 13px!important;border-radius:8px!important;font-size:13px!important}
.notice{font-size:11px!important;padding:6px 8px!important;margin-bottom:6px!important}
.filters{gap:5px!important;margin-bottom:6px!important;grid-template-columns:repeat(17,minmax(0,1fr))!important}
.filters button{height:31px!important;padding:5px 3px!important;border-radius:6px!important;font-size:9px!important;font-weight:800!important;letter-spacing:-.15px!important;text-transform:none!important}
.search{height:35px!important;padding:7px 10px!important;font-size:12px!important;margin-bottom:7px!important;border-radius:6px!important}
.grid{gap:8px!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;align-items:stretch!important}
.card{padding:6px!important;min-height:560px!important;border-radius:9px!important;background:linear-gradient(180deg,#071519,#06110d)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
.matchHero{grid-template-columns:52px minmax(0,1fr) 52px!important;height:70px!important;min-height:70px!important;gap:5px!important;position:relative!important;z-index:3!important}
.heroLogo{width:38px!important;height:38px!important;max-width:38px!important;max-height:38px!important;object-fit:contain!important;filter:drop-shadow(0 0 4px rgba(255,255,255,.18))!important}
.teamSide{min-width:0!important;overflow:hidden!important}.teamSide small{font-size:8px!important;line-height:1!important;max-width:48px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.heroCenter{min-width:0!important;overflow:hidden!important}.heroCenter h2{font-size:13px!important;line-height:1.02!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:100%!important}.heroCenter p{font-size:8.5px!important;margin:3px 0!important}.heroCenter b{font-size:26px!important}.heroCenter strong{font-size:11px!important}
.badges{margin-top:-8px!important;margin-bottom:3px!important;min-height:18px!important;gap:3px!important;position:relative!important;z-index:8!important;justify-content:flex-end!important}.badges span{font-size:8px!important;padding:2px 6px!important}

/* estatísticas compactas bet365 */
.proStats{min-height:86px!important;padding:5px 5px!important;gap:4px!important;margin-bottom:5px!important;border-top:1px solid rgba(255,255,255,.06)!important;border-bottom:1px solid rgba(255,255,255,.06)!important;background:rgba(0,0,0,.06)!important}
.statsTopGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:4px!important}
.metricPair{padding:3px 4px!important;border-radius:5px!important;background:rgba(255,255,255,.018)!important;border:1px solid rgba(255,255,255,.055)!important;min-height:44px!important}
.metricPair small{font-size:6.8px!important;height:12px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#fff!important;font-weight:800!important}
.metricNumbers{grid-template-columns:1fr 20px 1fr!important;min-height:22px!important}.metricNumbers b{font-size:14px!important}.metricVs{width:20px!important;height:20px!important;background:conic-gradient(var(--home) 0 50%, var(--away) 50% 100%)!important}.metricVs:before{inset:5px!important;background:#07141a!important}.metricVs:after{left:6.5px!important;top:3.2px!important;font-size:9px!important;color:#e5e7eb!important}.metricVs.danger:after{left:6px!important}.metricVs.ball:after{left:7px!important;top:4px!important;font-size:7px!important}.dualMiniBar{height:3px!important;margin-top:1px!important;gap:0!important;background:#0b1117!important}
.statsMiddleRow{grid-template-columns:45px minmax(0,1fr) 45px!important;gap:5px!important}.sideCounters{font-size:8px!important;padding:2px!important;border-radius:5px!important}.sideCounters strong{font-size:6.8px!important;max-width:38px!important}.sideCounters b{font-size:8px!important}.sideCounters span{font-size:9px!important}
.shotBoxPro{grid-template-columns:34px minmax(0,1fr) 34px!important;padding:4px 5px!important;border-radius:5px!important;gap:4px!important}.shotBoxPro small{font-size:6.8px!important;line-height:1!important}.shotBoxPro small:after{content:''!important}.shotBoxPro strong{font-size:13px!important}.shotBoxPro .shotBars{gap:3px!important}.shotBoxPro .shotBars span,.shotBoxPro .shotBars em{height:4px!important;border-radius:999px!important}

/* mini campo compacto sem sinal no meio */
.eventBubble{display:none!important}.miniMap{width:100%!important;max-width:none!important;margin:0 auto 5px!important;padding:0 4px!important}.field3d{height:72px!important;margin:5px auto 0!important;border-radius:12px!important;transform:perspective(245px) rotateX(25deg)!important}.mapStats{font-size:8px!important;margin-top:1px!important}.dot{width:6px!important;height:6px!important}

/* cronologia menor, mais limpa e alinhada */
.flowCard{margin-top:5px!important;min-height:132px!important;padding:5px!important;border-radius:7px!important}.flowCard h3{font-size:9.5px!important;height:13px!important;line-height:13px!important;margin-bottom:2px!important}.flowMinuteScale{font-size:7.5px!important;padding:0 8px 2px 42px!important}.flowWrap{height:82px!important;padding-left:42px!important;padding-right:8px!important;border-radius:6px!important}.flowWrap:before{left:42px!important;right:8px!important}.middleLine{left:42px!important;right:8px!important}.teamMini{width:38px!important;font-size:7px!important}.teamMini img{width:18px!important;height:18px!important}.homeMini{top:7px!important}.awayMini{bottom:7px!important}.flowSpike{width:1.6px!important;transform:translateX(-.8px)!important}.flowSpike.home{margin-bottom:1px!important}.flowSpike.away{margin-top:1px!important}.flowIcon{font-size:10px!important}.flowIcon.home{bottom:calc(50% + 24px)!important}.flowIcon.away{top:calc(50% + 24px)!important}.nowLine{width:1.6px!important}.nowLine b{font-size:8px!important;padding:1px 4px!important}.flowLegend{font-size:7px!important;gap:3px!important;min-height:14px!important;margin-top:4px!important}.flowLegend i{width:6px!important;height:6px!important}

/* sinal principal mais visível porém compacto */
.marketLine{margin-top:auto!important;min-height:54px!important;padding:6px!important;grid-template-columns:1.25fr 1fr!important;border-radius:7px!important}.marketLine div:first-child{padding:4px!important}.marketLine div:first-child b{font-size:12px!important}.marketLine div:first-child span{font-size:10px!important}.marketLine div:first-child strong{font-size:13px!important}.marketLine b{font-size:11px!important}.marketLine small{font-size:9px!important}.bar{height:5px!important}.bookies{height:32px!important;margin-top:5px!important;gap:6px!important}.bookies button{padding:6px 10px!important;min-width:68px!important;border-radius:5px!important;font-size:11px!important}

/* celular organizado */
@media(max-width:1100px){
  .grid{grid-template-columns:1fr!important;gap:8px!important}.card{min-height:auto!important}.filters{grid-template-columns:repeat(4,1fr)!important}.filters button{font-size:8.5px!important}.topBar{flex-direction:column!important;align-items:flex-start!important}.statusWrap{gap:5px!important}.pill{font-size:11px!important;padding:6px 8px!important}
  .matchHero{grid-template-columns:46px minmax(0,1fr) 46px!important;height:66px!important;min-height:66px!important}.heroLogo{width:34px!important;height:34px!important}.teamSide small{font-size:7.5px!important;max-width:42px!important}.heroCenter h2{font-size:12px!important}.heroCenter b{font-size:24px!important}.badges{margin-top:0!important;justify-content:center!important}
  .statsTopGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:3px!important}.metricPair small{font-size:6px!important}.metricNumbers{grid-template-columns:1fr 18px 1fr!important}.metricNumbers b{font-size:12px!important}.metricVs{width:18px!important;height:18px!important}.metricVs:after{font-size:8px!important;left:6px!important;top:3px!important}
  .statsMiddleRow{grid-template-columns:42px minmax(0,1fr) 42px!important;gap:4px!important}.shotBoxPro{grid-template-columns:32px minmax(0,1fr) 32px!important}.shotBoxPro strong{font-size:12px!important}.sideCounters strong{display:none!important}.field3d{height:68px!important}.flowCard{min-height:126px!important}.flowWrap{height:78px!important}.flowLegend{grid-template-columns:repeat(3,1fr)!important;overflow:hidden!important}.marketLine{grid-template-columns:1fr!important}.bookies button{min-width:auto!important;flex:1!important}
}
@media(max-width:520px){.page{padding:5px!important}h1{font-size:23px!important}.filters{grid-template-columns:repeat(3,1fr)!important}.search{height:32px!important}.proStats{padding:4px!important}.statsTopGrid{grid-template-columns:1fr!important}.metricPair{display:grid!important;grid-template-columns:80px 1fr!important;align-items:center!important}.metricPair small{text-align:left!important;height:auto!important;font-size:7px!important}.metricNumbers{grid-template-columns:34px 18px 34px!important;justify-content:end!important}.dualMiniBar{grid-column:1/-1!important}.statsMiddleRow{grid-template-columns:1fr!important}.sideCounters{grid-template-columns:repeat(3,1fr)!important}.flowLegend{display:none!important}}


/* ===== CORREÇÃO FINAL MOBILE: ESTATÍSTICAS PROPORCIONAIS IGUAL PC ===== */
@media(max-width:700px){
  .proStats{
    display:grid!important;
    grid-template-columns:1fr!important;
    gap:4px!important;
    min-height:auto!important;
    padding:5px!important;
  }

  .statsTopGrid{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:3px!important;
  }

  .metricPair{
    display:block!important;
    min-width:0!important;
    min-height:42px!important;
    padding:3px!important;
  }

  .metricPair small{
    display:block!important;
    text-align:center!important;
    height:10px!important;
    font-size:5.7px!important;
    line-height:1!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
    letter-spacing:-.25px!important;
  }

  .metricNumbers{
    display:grid!important;
    grid-template-columns:1fr 16px 1fr!important;
    gap:1px!important;
    align-items:center!important;
    justify-content:center!important;
    min-height:18px!important;
  }

  .metricNumbers b{
    font-size:11px!important;
    width:auto!important;
    min-width:0!important;
    text-align:center!important;
  }

  .metricVs{
    width:16px!important;
    height:16px!important;
    background:conic-gradient(var(--home) 0 50%, var(--away) 50% 100%)!important;
  }

  .metricVs:before{inset:4px!important}
  .metricVs:after{
    font-size:7px!important;
    left:5.4px!important;
    top:2.4px!important;
  }
  .metricVs.danger:after{left:5px!important}
  .metricVs.ball:after{left:5.8px!important;top:3px!important;font-size:6px!important}

  .dualMiniBar{
    grid-column:auto!important;
    height:3px!important;
    margin-top:1px!important;
  }

  .statsMiddleRow{
    display:grid!important;
    grid-template-columns:38px minmax(0,1fr) 38px!important;
    gap:4px!important;
    align-items:center!important;
  }

  .sideCounters{
    display:grid!important;
    grid-template-columns:repeat(3,1fr)!important;
    padding:2px!important;
    gap:1px!important;
    min-height:35px!important;
  }

  .sideCounters strong{
    display:block!important;
    grid-column:1/-1!important;
    font-size:6px!important;
    max-width:34px!important;
  }

  .sideCounters span{
    font-size:8px!important;
  }

  .sideCounters b{
    font-size:7px!important;
  }

  .shotBoxPro{
    display:grid!important;
    grid-template-columns:30px minmax(0,1fr) 30px!important;
    gap:3px!important;
    padding:3px 4px!important;
    min-height:35px!important;
  }

  .shotBoxPro small{
    font-size:5.9px!important;
    height:8px!important;
    line-height:1!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }

  .shotBoxPro strong{
    font-size:11px!important;
  }

  .shotBoxPro .shotBars{
    gap:2px!important;
  }

  .shotBoxPro .shotBars span,
  .shotBoxPro .shotBars em{
    height:3px!important;
  }

  .matchHero{
    grid-template-columns:42px minmax(0,1fr) 42px!important;
    height:60px!important;
    min-height:60px!important;
  }

  .heroLogo{
    width:31px!important;
    height:31px!important;
    max-width:31px!important;
    max-height:31px!important;
  }

  .teamSide small{
    font-size:6.8px!important;
    max-width:39px!important;
  }

  .heroCenter h2{
    font-size:11px!important;
    line-height:1!important;
  }

  .heroCenter p{
    font-size:7px!important;
    margin:2px 0!important;
  }

  .heroCenter b{
    font-size:22px!important;
  }

  .heroCenter strong{
    font-size:10px!important;
  }

  .badges span{
    font-size:7px!important;
    padding:2px 5px!important;
  }

  .field3d{
    height:62px!important;
  }

  .flowCard{
    min-height:112px!important;
    padding:4px!important;
  }

  .flowWrap{
    height:68px!important;
  }

  .flowMinuteScale{
    font-size:6.8px!important;
  }
}

@media(max-width:520px){
  .statsTopGrid{
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
  }

  .metricPair{
    display:block!important;
  }

  .metricPair small{
    text-align:center!important;
  }

  .metricNumbers{
    grid-template-columns:1fr 15px 1fr!important;
  }

  .statsMiddleRow{
    grid-template-columns:36px minmax(0,1fr) 36px!important;
  }

  .sideCounters strong{
    display:block!important;
  }

  .shotBoxPro{
    grid-template-columns:28px minmax(0,1fr) 28px!important;
  }

  .shotBoxPro strong{
    font-size:10px!important;
  }
}



/* ===== CORREÇÃO PROPORCIONAL FINAL: MOBILE + PC ===== */
.metricVs{
  background:var(--ring-bg)!important;
}
.metricVs:before{background:#07141a!important}
.metricNumbers b{
  font-variant-numeric:tabular-nums!important;
}
.shotSplitBars{
  display:grid!important;
  gap:3px!important;
}
.splitBar{
  width:100%!important;
  height:4px!important;
  display:flex!important;
  overflow:hidden!important;
  border-radius:999px!important;
  background:#0b1117!important;
}
.splitBar i,
.splitBar em{
  display:block!important;
  height:100%!important;
  min-width:1px!important;
  opacity:.98!important;
}
.splitBar i{border-radius:999px 0 0 999px!important}
.splitBar em{border-radius:0 999px 999px 0!important}

.sideCounters{
  align-self:stretch!important;
}
.sideCounters span{
  min-width:0!important;
}
.statsMiddleRow{
  align-items:stretch!important;
}
.shotBoxPro{
  align-self:stretch!important;
}

@media(max-width:700px){
  .proStats{
    overflow:hidden!important;
  }
  .statsTopGrid{
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
  }
  .metricPair{
    min-width:0!important;
    overflow:hidden!important;
  }
  .metricNumbers{
    grid-template-columns:minmax(18px,1fr) 16px minmax(18px,1fr)!important;
  }
  .statsMiddleRow{
    grid-template-columns:38px minmax(0,1fr) 38px!important;
  }
  .sideCounters{
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    overflow:hidden!important;
  }
  .sideCounters strong{
    display:block!important;
    grid-column:1/-1!important;
  }
  .shotBoxPro{
    grid-template-columns:31px minmax(0,1fr) 31px!important;
    overflow:hidden!important;
  }
  .shotBoxPro strong{
    font-size:10.5px!important;
    min-width:0!important;
  }
  .shotSplitBars{
    gap:2px!important;
  }
  .splitBar{
    height:3px!important;
  }
}

@media(max-width:430px){
  .statsTopGrid{
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:2px!important;
  }
  .metricPair small{
    font-size:5.3px!important;
    letter-spacing:-.35px!important;
  }
  .metricNumbers b{
    font-size:10px!important;
  }
  .metricVs{
    width:15px!important;
    height:15px!important;
  }
  .statsMiddleRow{
    grid-template-columns:34px minmax(0,1fr) 34px!important;
  }
  .sideCounters span{
    font-size:7px!important;
  }
  .sideCounters b{
    font-size:6.5px!important;
  }
}



/* ===== CORREÇÃO DEFINITIVA MOBILE: CARTÕES EM CADA LADO + GRÁFICO REDONDO PROPORCIONAL ===== */

/* Mantém o layout das estatísticas igual ao PC também no celular */
@media(max-width:700px){
  .proStats{
    width:100%!important;
    display:grid!important;
    grid-template-columns:1fr!important;
    gap:4px!important;
  }

  .statsTopGrid{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:3px!important;
  }

  .metricPair{
    display:block!important;
    min-width:0!important;
    overflow:visible!important;
  }

  .metricNumbers{
    display:grid!important;
    grid-template-columns:minmax(20px,1fr) 18px minmax(20px,1fr)!important;
    justify-items:center!important;
    align-items:center!important;
  }

  .metricNumbers b{
    display:block!important;
    min-width:0!important;
    width:auto!important;
    text-align:center!important;
    font-size:11px!important;
  }

  /* O gráfico redondo volta a aparecer e muda conforme a proporção real */
  .metricVs,
  .metricVs.danger,
  .metricVs.ball{
    display:block!important;
    visibility:visible!important;
    opacity:1!important;
    width:18px!important;
    height:18px!important;
    min-width:18px!important;
    min-height:18px!important;
    border-radius:50%!important;
    position:relative!important;
    flex:0 0 18px!important;
    background:conic-gradient(var(--home) 0 var(--pct,50%), var(--away) var(--pct,50%) 100%)!important;
    box-shadow:0 0 5px rgba(255,255,255,.16)!important;
  }

  .metricVs:before,
  .metricVs.danger:before,
  .metricVs.ball:before{
    content:""!important;
    position:absolute!important;
    inset:4px!important;
    background:#07141a!important;
    border-radius:50%!important;
    z-index:1!important;
  }

  .metricVs:after{
    content:"▶"!important;
    position:absolute!important;
    left:5.8px!important;
    top:2.6px!important;
    color:#e5e7eb!important;
    font-size:7px!important;
    z-index:2!important;
  }

  .metricVs.danger:after{
    content:"➤"!important;
    left:5.2px!important;
    top:2.4px!important;
  }

  .metricVs.ball:after{
    content:"●"!important;
    left:6.5px!important;
    top:3.2px!important;
    font-size:6px!important;
  }

  /* Cartões/escanteios sempre separados: casa esquerda, fora direita */
  .statsMiddleRow{
    display:grid!important;
    grid-template-columns:42px minmax(0,1fr) 42px!important;
    grid-template-areas:"home shots away"!important;
    align-items:center!important;
    gap:4px!important;
  }

  .sideHome{
    grid-area:home!important;
    justify-self:stretch!important;
  }

  .sideAway{
    grid-area:away!important;
    justify-self:stretch!important;
  }

  .shotBoxPro{
    grid-area:shots!important;
    min-width:0!important;
  }

  .sideCounters{
    display:grid!important;
    grid-template-columns:repeat(3,1fr)!important;
    gap:1px!important;
    align-items:center!important;
    justify-items:center!important;
    min-height:35px!important;
    padding:2px!important;
  }

  .sideCounters strong{
    display:block!important;
    grid-column:1/-1!important;
    font-size:6px!important;
    max-width:36px!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }

  .sideCounters span{
    display:grid!important;
    justify-items:center!important;
    font-size:8px!important;
    line-height:1!important;
  }

  .sideCounters b{
    font-size:7px!important;
    line-height:1!important;
  }

  /* Finalizações e chutes ao gol: duas linhas proporcionais, casa vs fora */
  .shotSplitBars{
    display:grid!important;
    gap:2px!important;
  }

  .splitBar{
    width:100%!important;
    height:3px!important;
    display:flex!important;
    overflow:hidden!important;
    border-radius:999px!important;
    background:#0b1117!important;
  }

  .splitBar i,
  .splitBar em{
    display:block!important;
    height:100%!important;
    min-width:1px!important;
  }
}

/* Em celulares menores, não empilha os cartões dos dois times: mantém casa | finalizações | fora */
@media(max-width:520px){
  .statsTopGrid{
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
  }

  .metricPair{
    display:block!important;
    min-height:42px!important;
  }

  .metricPair small{
    text-align:center!important;
    font-size:5.6px!important;
  }

  .statsMiddleRow{
    grid-template-columns:40px minmax(0,1fr) 40px!important;
    grid-template-areas:"home shots away"!important;
  }

  .sideCounters{
    grid-template-columns:repeat(3,1fr)!important;
  }

  .sideCounters strong{
    display:block!important;
  }

  .shotBoxPro{
    grid-template-columns:30px minmax(0,1fr) 30px!important;
  }
}

/* ===== AJUSTE FINAL: GRÁFICO REDONDO PC + MOBILE E MINI CAMPO 5D COM CLIMA ===== */
.metricVs{
  display:block!important;
  border-radius:50%!important;
  background:conic-gradient(var(--home) 0 var(--pct,50%), var(--away) var(--pct,50%) 100%)!important;
  box-shadow:0 0 8px rgba(255,255,255,.16), inset 0 0 2px rgba(255,255,255,.35)!important;
  flex:none!important;
}
.metricVs:before{display:block!important;content:""!important;position:absolute!important;border-radius:50%!important;background:#07141a!important;z-index:1!important}
.metricVs:after{display:block!important;z-index:2!important}
.statsTopGrid .metricPair .metricNumbers .metricVs{visibility:visible!important;opacity:1!important}

/* PC mantém os redondos visíveis */
@media(min-width:701px){
  .metricVs{width:22px!important;height:22px!important;position:relative!important}
  .metricVs:before{inset:5px!important}
  .metricVs:after{left:7px!important;top:3.5px!important;font-size:9px!important;color:#e5e7eb!important;position:absolute!important}
  .metricVs.danger:after{left:6.5px!important}
  .metricVs.ball:after{left:7.5px!important;top:4px!important;font-size:7px!important}
}

/* Mobile também mantém os redondos visíveis, sem sumir */
@media(max-width:700px){
  .metricVs{width:16px!important;height:16px!important;position:relative!important;min-width:16px!important;min-height:16px!important}
  .metricVs:before{inset:4px!important}
  .metricVs:after{left:5.4px!important;top:2.4px!important;font-size:7px!important;position:absolute!important;color:#e5e7eb!important}
  .metricVs.danger:after{left:5px!important}
  .metricVs.ball:after{left:5.8px!important;top:3px!important;font-size:6px!important}
}

/* Mini campo mais realista 5D, com estádio, luz e clima */
.miniMap{
  position:relative!important;
  perspective:520px!important;
  isolation:isolate!important;
  overflow:hidden!important;
  border-radius:14px!important;
}
.stadiumLights{
  position:absolute!important;
  left:18px!important;
  right:18px!important;
  top:0!important;
  height:18px!important;
  display:flex!important;
  justify-content:space-around!important;
  pointer-events:none!important;
  z-index:3!important;
}
.stadiumLights i{
  width:24px!important;
  height:13px!important;
  border-radius:0 0 18px 18px!important;
  background:radial-gradient(circle at 50% 15%,rgba(255,255,255,.95),rgba(190,230,255,.45) 38%,transparent 72%)!important;
  filter:blur(.2px)!important;
  opacity:.8!important;
}
.weatherBadge{
  position:absolute!important;
  right:10px!important;
  top:7px!important;
  z-index:5!important;
  display:flex!important;
  align-items:center!important;
  gap:4px!important;
  padding:3px 7px!important;
  border-radius:999px!important;
  border:1px solid rgba(255,255,255,.18)!important;
  background:rgba(2,6,10,.68)!important;
  box-shadow:0 4px 12px rgba(0,0,0,.35)!important;
  font-size:8px!important;
  font-weight:900!important;
  color:#e5e7eb!important;
}
.weatherBadge span{font-size:12px!important;line-height:1!important}
.field3d{
  height:76px!important;
  margin-top:10px!important;
  border-radius:14px!important;
  background:
    radial-gradient(circle at 50% -20%,rgba(255,255,255,.22),transparent 30%),
    repeating-linear-gradient(90deg,#41a72b 0 24px,#2f8d22 24px 48px)!important;
  transform:perspective(360px) rotateX(31deg) scale(1.01)!important;
  transform-origin:center bottom!important;
  box-shadow:
    inset 0 11px 18px rgba(255,255,255,.14),
    inset 0 -24px 24px rgba(0,0,0,.42),
    0 11px 18px rgba(0,0,0,.55)!important;
}
.field3d:before{
  content:""!important;
  position:absolute!important;
  inset:-8px 0 0!important;
  background:linear-gradient(180deg,rgba(255,255,255,.18),transparent 38%,rgba(0,0,0,.24))!important;
  z-index:1!important;
  pointer-events:none!important;
}
.field3d:after{
  content:""!important;
  position:absolute!important;
  inset:0!important;
  background:
    repeating-linear-gradient(0deg,rgba(255,255,255,.04) 0 1px,transparent 1px 10px),
    radial-gradient(circle at 52% 42%,rgba(255,255,255,.15),transparent 40%)!important;
  z-index:1!important;
  pointer-events:none!important;
}
.field3d > *{position:absolute;z-index:2}.field3d .weatherLayer{z-index:4!important;pointer-events:none!important;inset:0!important}
.weather-rain .weatherLayer{
  background:repeating-linear-gradient(115deg,rgba(180,220,255,.0) 0 7px,rgba(180,220,255,.55) 7px 8px,rgba(180,220,255,.0) 8px 14px)!important;
  opacity:.42!important;
  animation:rainMove .7s linear infinite!important;
}
.weather-rain .field3d{filter:saturate(.9) brightness(.88)!important}
.weather-cloud .field3d{filter:saturate(.9) brightness(.82)!important}
.weather-sun .field3d{filter:saturate(1.15) brightness(1.08)!important}
.weather-sun .weatherLayer{background:radial-gradient(circle at 82% 7%,rgba(255,220,90,.25),transparent 22%)!important}
.weather-cloud .weatherLayer{background:linear-gradient(180deg,rgba(180,200,220,.25),transparent 40%)!important}
@keyframes rainMove{from{background-position:0 0}to{background-position:-12px 22px}}

@media(max-width:700px){
  .field3d{height:66px!important;margin-top:8px!important;transform:perspective(330px) rotateX(29deg) scale(1.01)!important}
  .weatherBadge{right:8px!important;top:5px!important;font-size:7px!important;padding:2px 6px!important}
  .weatherBadge span{font-size:10px!important}.stadiumLights{height:14px!important;left:14px!important;right:14px!important}.stadiumLights i{width:18px!important;height:10px!important}
}

/* ===== AJUSTE API REAL: 1 CARD CENTRALIZADO, ALERTA E LOGOS ===== */
.grid.isSingle{
  grid-template-columns:minmax(320px,440px)!important;
  justify-content:center!important;
}
.grid.isSingle .card{
  width:100%!important;
}
.heroLogo{
  border-radius:6px!important;
  background:rgba(255,255,255,.04)!important;
  padding:1px!important;
}
.metricVs{
  background:conic-gradient(var(--home) 0 var(--pct), var(--away) var(--pct) 100%)!important;
}
.marketLine{
  border-color:rgba(250,204,21,.75)!important;
  box-shadow:0 0 16px rgba(250,204,21,.18)!important;
}
.marketLine div:first-child b::before{
  content:"🔥 ";
}
@media(max-width:700px){
  .grid.isSingle{grid-template-columns:1fr!important}
}


/* ===== VOLTAR COMO ERA: JOGO NÃO FICA CENTRALIZADO ===== */
.grid.isSingle{grid-template-columns:repeat(3,minmax(0,1fr))!important;justify-content:stretch!important}
.grid.isSingle .card{max-width:none!important;margin:0!important}
@media(max-width:1100px){.grid.isSingle{grid-template-columns:1fr!important}}


/* ===== AGRUPAMENTO DE MERCADOS POR JOGO ===== */
.marketBadges{display:flex;gap:3px;flex-wrap:wrap;justify-content:flex-end;max-width:78%}
.marketsPanel{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin-top:7px;border:1px solid rgba(250,204,21,.38);border-radius:8px;padding:6px;background:linear-gradient(180deg,rgba(250,204,21,.07),rgba(0,0,0,.18));box-shadow:0 0 12px rgba(250,204,21,.08)}
.signalChip{display:grid;grid-template-columns:1fr auto;gap:2px 6px;align-items:center;border:1px solid rgba(255,255,255,.10);border-radius:7px;background:rgba(0,0,0,.25);padding:5px 6px;min-height:42px}
.signalChip.strong{border-color:rgba(250,204,21,.65);box-shadow:0 0 10px rgba(250,204,21,.10)}
.signalChip b{font-size:10px;font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:uppercase}
.signalChip span{grid-column:1/-1;font-size:8.5px;font-weight:800;color:#d1d5db;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.signalChip strong{font-size:12px;font-weight:900;color:#22c55e;text-align:right}
.signalChip em{font-style:normal;font-size:8.5px;color:#facc15;font-weight:900;text-align:right}
@media(max-width:700px){.marketBadges{max-width:100%;justify-content:center}.marketsPanel{grid-template-columns:1fr}.signalChip{min-height:38px}}


.realStatsBadge{
  background:#16a34a!important;
  color:#fff!important;
  border:1px solid rgba(255,255,255,.18)!important;
  box-shadow:0 0 8px rgba(22,163,74,.20)!important;
}

.estimatedStatsBadge{
  background:#7c2d12!important;
  color:#fff!important;
  border:1px solid rgba(255,255,255,.18)!important;
  box-shadow:0 0 8px rgba(124,45,18,.18)!important;
}

@media(max-width:700px){
  .realStatsBadge,.estimatedStatsBadge{
    font-size:6.6px!important;
    padding:2px 4px!important;
  }
}


.realEventsBadge{
  background:#1d4ed8!important;
  color:#fff!important;
  border:1px solid rgba(147,197,253,.35)!important;
  box-shadow:0 0 8px rgba(29,78,216,.25)!important;
}

.noEventsBadge{
  background:#374151!important;
  color:#d1d5db!important;
  border:1px solid rgba(255,255,255,.12)!important;
}

.flowRealTag{
  display:inline-block!important;
  margin-left:6px!important;
  padding:1px 5px!important;
  border-radius:999px!important;
  background:#1d4ed8!important;
  color:#fff!important;
  font-size:7px!important;
  vertical-align:middle!important;
}

.realEventIcon{
  filter:drop-shadow(0 0 8px rgba(250,204,21,.9))!important;
  transform:translateX(-50%) scale(1.12)!important;
}

.realEventIcon.home{
  bottom:calc(50% + 24px)!important;
}

.realEventIcon.away{
  top:calc(50% + 24px)!important;
}

@media(max-width:700px){
  .realEventsBadge,.noEventsBadge{
    font-size:6.6px!important;
    padding:2px 4px!important;
  }
  .flowRealTag{
    font-size:6px!important;
    padding:1px 4px!important;
  }
}




.realOddsBadge{
  background:#ca8a04!important;
  color:#fff!important;
  border:1px solid rgba(255,255,255,.18)!important;
  box-shadow:0 0 8px rgba(250,204,21,.22)!important;
}

.noOddsBadge{
  background:#374151!important;
  color:#fff!important;
  border:1px solid rgba(255,255,255,.14)!important;
}

.oddRealChip{
  border-color:rgba(250,204,21,.80)!important;
  background:linear-gradient(180deg,rgba(250,204,21,.11),rgba(0,0,0,.26))!important;
  box-shadow:0 0 10px rgba(250,204,21,.12)!important;
}

.oddRealText{
  color:#facc15!important;
  font-weight:900!important;
}

@media(max-width:700px){
  .realOddsBadge,.noOddsBadge{
    font-size:6.6px!important;
    padding:2px 4px!important;
  }
}

/* ===== AJUSTES MAKINE: TEMPO, CORES DISTINTAS E CRONOLOGIA MINUTO A MINUTO ===== */
.heroCenter strong.gameMinute{
  display:block!important;
  margin-top:-4px!important;
  transform:translateY(-3px)!important;
  line-height:1!important;
  color:#ef4444!important;
}

.heroCenter strong.preliveMinute{
  display:inline-block!important;
  margin-top:-2px!important;
  transform:translateY(-2px)!important;
  padding:2px 7px!important;
  border-radius:999px!important;
  background:#374151!important;
  color:#facc15!important;
  font-size:9px!important;
  line-height:1!important;
}

.flowPreliveTag{
  display:inline-block!important;
  margin-left:6px!important;
  padding:1px 5px!important;
  border-radius:999px!important;
  background:#7c2d12!important;
  color:#fff!important;
  font-size:7px!important;
  vertical-align:middle!important;
}

.flowSpike.level-1{
  opacity:.72!important;
}

.flowSpike.level-2{
  opacity:.9!important;
}

.flowSpike.level-3{
  width:2.4px!important;
  opacity:1!important;
}

.flowSpike.realMinute{
  box-shadow:0 0 10px currentColor!important;
}

.flowWrap{
  background:
    linear-gradient(180deg,rgba(34,197,94,.045),rgba(0,0,0,.08)),
    linear-gradient(90deg,rgba(255,255,255,.035),rgba(255,255,255,0))!important;
}

.flowWrap:after{
  content:""!important;
  position:absolute!important;
  left:42px!important;
  right:8px!important;
  top:50%!important;
  height:1px!important;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent)!important;
  pointer-events:none!important;
}

@media(max-width:700px){
  .heroCenter strong.gameMinute{
    margin-top:-3px!important;
    transform:translateY(-2px)!important;
    font-size:9px!important;
  }

  .heroCenter strong.preliveMinute{
    font-size:7px!important;
    padding:2px 5px!important;
  }

  .flowPreliveTag{
    font-size:6px!important;
    padding:1px 4px!important;
  }
}

/* ===== MAKINE FINAL: VISIBILIDADE LIMPA, SINAL FORTE E MINIMAPA AO VIVO ===== */
.page{padding:6px!important}
.topBar{margin-bottom:6px!important}
.statusWrap{gap:6px!important}
.pill{padding:6px 10px!important;font-size:12px!important}
.filters{gap:4px!important;grid-template-columns:repeat(17,minmax(0,1fr))!important}
.filters button{height:30px!important;font-size:8.5px!important;padding:4px 3px!important}
.search{height:34px!important;font-size:12px!important;margin-bottom:6px!important}
.grid{grid-template-columns:repeat(auto-fit,minmax(330px,1fr))!important;gap:8px!important}
.card{padding:6px!important;min-height:520px!important}
.matchHero{grid-template-columns:48px 1fr 48px!important;min-height:62px!important;height:62px!important}
.heroLogo{width:34px!important;height:34px!important;max-width:34px!important;max-height:34px!important}
.teamSide small{font-size:7px!important;max-width:42px!important}
.heroCenter h2{font-size:12px!important}
.heroCenter p{font-size:8px!important;margin:2px 0!important}
.heroCenter b{font-size:22px!important}
.heroCenter strong{font-size:11px!important;display:block!important;position:relative!important;top:-4px!important}
.badges{margin-top:-2px!important;margin-bottom:5px!important;gap:3px!important;align-items:center!important;flex-wrap:wrap!important}
.badges span{font-size:7px!important;padding:2px 5px!important}
.marketBadges{max-width:55%!important}

.highlightSignal{
  display:grid!important;
  grid-template-columns:1fr auto!important;
  align-items:center!important;
  gap:6px!important;
  background:linear-gradient(180deg,rgba(250,204,21,.08),rgba(0,0,0,.22))!important;
  border:1px solid rgba(250,204,21,.35)!important;
  border-radius:8px!important;
  padding:5px 7px!important;
  margin-bottom:6px!important;
}
.highlightSignal.strong{
  border-color:rgba(250,204,21,.72)!important;
  box-shadow:0 0 14px rgba(250,204,21,.14)!important;
}
.highlightSignalText small{
  display:block!important;
  font-size:7px!important;
  font-weight:900!important;
  color:#facc15!important;
  letter-spacing:.3px!important;
}
.highlightSignalText b{
  display:block!important;
  font-size:12px!important;
  line-height:1.05!important;
}
.highlightSignalText span{
  display:block!important;
  font-size:9px!important;
  color:#e5e7eb!important;
  margin-top:1px!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  max-width:210px!important;
}
.highlightSignalMeta{
  display:grid!important;
  justify-items:end!important;
  gap:2px!important;
}
.highlightSignalMeta strong{
  font-size:16px!important;
  color:#22c55e!important;
  line-height:1!important;
}
.highlightSignalMeta em{
  font-style:normal!important;
  font-size:9px!important;
  color:#facc15!important;
  font-weight:900!important;
  white-space:nowrap!important;
}

.proStats{padding:4px!important;gap:4px!important;min-height:auto!important}
.metricPair small{font-size:6.5px!important;height:11px!important}
.metricNumbers b{font-size:13px!important}
.metricVs{width:18px!important;height:18px!important}
.metricVs:before{inset:4px!important}
.metricVs:after{left:5.5px!important;top:2.8px!important;font-size:7px!important}
.statsMiddleRow{grid-template-columns:40px minmax(0,1fr) 40px!important;gap:4px!important}
.sideCounters{padding:2px!important}
.sideCounters strong{font-size:6.5px!important;max-width:34px!important}
.sideCounters span{font-size:8px!important}
.shotBoxPro{grid-template-columns:30px minmax(0,1fr) 30px!important;padding:4px!important}
.shotBoxPro small{font-size:6.3px!important}
.shotBoxPro strong{font-size:12px!important}
.splitBar{height:3px!important}

.miniMap{margin:0 auto 6px!important;padding:0 2px!important}
.livePulse{
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  gap:8px!important;
  background:rgba(3,10,14,.82)!important;
  border:1px solid rgba(255,255,255,.12)!important;
  border-radius:999px!important;
  padding:4px 8px!important;
  margin:0 2px 4px!important;
}
.livePulse b{font-size:8px!important;color:#fff!important}
.livePulse span{font-size:8px!important;color:#cbd5e1!important;font-weight:800!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.livePulse.high b{color:#facc15!important}
.livePulse.medium b{color:#22c55e!important}
.livePulse.low b{color:#93c5fd!important}
.livePulse.idle b{color:#cbd5e1!important}

.field3d.liveField{
  height:66px!important;
  margin-top:4px!important;
  position:relative!important;
  overflow:hidden!important;
}
.attackTrail{
  position:absolute!important;
  height:3px!important;
  border-radius:999px!important;
  transform:translateY(-50%)!important;
  opacity:.92!important;
  z-index:4!important;
  filter:blur(.1px)!important;
}
.playerDot{
  position:absolute!important;
  width:6px!important;
  height:6px!important;
  border-radius:50%!important;
  transform:translate(-50%,-50%)!important;
  z-index:5!important;
  box-shadow:0 0 8px currentColor!important;
}
.liveBall{
  position:absolute!important;
  width:8px!important;
  height:8px!important;
  border-radius:50%!important;
  background:#fff!important;
  transform:translate(-50%,-50%)!important;
  z-index:7!important;
  border:1px solid rgba(255,255,255,.9)!important;
}
.ballAura{
  position:absolute!important;
  inset:-4px!important;
  border-radius:50%!important;
  opacity:.28!important;
  animation:mbPulse 1s ease-in-out infinite!important;
}
@keyframes mbPulse{
  0%{transform:scale(.8);opacity:.15}
  50%{transform:scale(1.65);opacity:.38}
  100%{transform:scale(.8);opacity:.15}
}
.mapStats.compact{
  grid-template-columns:repeat(3,1fr)!important;
  font-size:8px!important;
  margin-top:2px!important;
}
.mapStats.compact span{
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}

.flowCard{min-height:118px!important;padding:5px!important}
.flowCard h3{font-size:9px!important;margin-bottom:2px!important}
.flowMinuteScale{font-size:7px!important;padding:0 8px 2px 40px!important}
.flowWrap{height:72px!important;padding-left:40px!important;padding-right:8px!important}
.flowWrap:before{left:40px!important;right:8px!important}
.flowWrap:after{left:40px!important;right:8px!important}
.middleLine{left:40px!important;right:8px!important}
.teamMini{width:36px!important;font-size:7px!important}
.teamMini img{width:16px!important;height:16px!important}
.nowLine b{font-size:7px!important;padding:1px 4px!important}
.flowSpike{width:1.5px!important}
.flowIcon{font-size:9px!important}
.flowLegend{font-size:7px!important;gap:4px!important}

.marketsPanel{
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:4px!important;
  margin-top:6px!important;
  padding:5px!important;
}
.signalChip{min-height:34px!important;padding:4px 5px!important}
.signalChip b{font-size:9px!important}
.signalChip span,.signalChip em{font-size:7.8px!important}
.signalChip strong{font-size:11px!important}
.signalChip:not(.oddRealChip) em{color:#9ca3af!important}

.bookies{display:none!important}

@media(max-width:700px){
  .grid{grid-template-columns:1fr!important}
  .filters{grid-template-columns:repeat(4,minmax(0,1fr))!important}
  .marketBadges{max-width:100%!important;justify-content:center!important}
  .highlightSignal{grid-template-columns:1fr auto!important}
  .highlightSignalText span{max-width:170px!important}
  .field3d.liveField{height:60px!important}
}

@media(max-width:430px){
  .filters{grid-template-columns:repeat(3,minmax(0,1fr))!important}
}

/* ===== MAKINE FINAL 2: TELA UNICA, PRÉ-LIVE VIP E MINIMAPA COM POSSE ===== */
.page{
  padding:5px!important;
}
.topBar{
  margin-bottom:4px!important;
  align-items:flex-start!important;
}
h1{
  font-size:32px!important;
}
.subTitle{
  font-size:10px!important;
  margin-top:2px!important;
}
.statusWrap{
  gap:5px!important;
  justify-content:flex-end!important;
}
.pill{
  padding:5px 9px!important;
  font-size:11px!important;
  border-radius:7px!important;
}
.notice{
  display:none!important;
}
.filters{
  grid-template-columns:repeat(17,minmax(0,1fr))!important;
  gap:4px!important;
  margin-bottom:5px!important;
}
.filters button{
  height:27px!important;
  padding:3px 2px!important;
  font-size:8px!important;
  border-radius:6px!important;
}
.search{
  height:30px!important;
  padding:6px 9px!important;
  font-size:11px!important;
  margin-bottom:6px!important;
}
.grid{
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:8px!important;
  align-items:start!important;
}
.card{
  min-height:0!important;
  height:auto!important;
  padding:6px!important;
  border-radius:9px!important;
  display:flex!important;
  flex-direction:column!important;
}
.matchHero{
  grid-template-columns:44px minmax(0,1fr) 44px!important;
  height:52px!important;
  min-height:52px!important;
  gap:4px!important;
}
.heroLogo{
  width:31px!important;
  height:31px!important;
  max-width:31px!important;
  max-height:31px!important;
}
.teamSide small{
  font-size:6.6px!important;
  max-width:40px!important;
}
.heroCenter h2{
  font-size:11px!important;
  line-height:1!important;
}
.heroCenter p{
  font-size:7px!important;
  margin:1px 0!important;
}
.heroCenter b{
  font-size:21px!important;
  line-height:.9!important;
  margin-top:1px!important;
}
.heroCenter strong.gameMinute{
  display:inline-grid!important;
  place-items:center!important;
  width:32px!important;
  height:15px!important;
  margin:2px auto 0!important;
  transform:none!important;
  position:relative!important;
  top:0!important;
  border-radius:999px!important;
  background:#ef4444!important;
  color:#fff!important;
  font-size:9px!important;
  line-height:1!important;
}
.heroCenter strong.preliveMinute{
  margin:2px auto 0!important;
  transform:none!important;
  padding:2px 6px!important;
  font-size:7px!important;
  background:#4a1c08!important;
  color:#facc15!important;
}
.badges{
  margin-top:2px!important;
  margin-bottom:4px!important;
  min-height:16px!important;
  gap:3px!important;
  justify-content:flex-start!important;
}
.badges span{
  font-size:6.7px!important;
  padding:2px 5px!important;
}
.marketBadges{
  margin-left:auto!important;
  max-width:48%!important;
  justify-content:flex-end!important;
}

.highlightSignal{
  min-height:32px!important;
  padding:4px 6px!important;
  margin-bottom:5px!important;
  border-color:rgba(250,204,21,.70)!important;
  background:linear-gradient(180deg,rgba(250,204,21,.13),rgba(0,0,0,.26))!important;
}
.highlightSignalText small{
  font-size:6.5px!important;
}
.highlightSignalText b{
  font-size:11px!important;
}
.highlightSignalText span{
  font-size:8px!important;
}
.highlightSignalMeta strong{
  font-size:16px!important;
  color:#22ff86!important;
}
.highlightSignalMeta em{
  font-size:8px!important;
}

.proStats{
  min-height:70px!important;
  padding:4px!important;
  gap:3px!important;
  margin-bottom:4px!important;
}
.statsTopGrid{
  gap:3px!important;
}
.metricPair{
  min-height:36px!important;
  padding:2px 3px!important;
}
.metricPair small{
  font-size:5.9px!important;
  height:10px!important;
}
.metricNumbers{
  min-height:18px!important;
  grid-template-columns:1fr 17px 1fr!important;
}
.metricNumbers b{
  font-size:12px!important;
}
.metricVs{
  width:17px!important;
  height:17px!important;
}
.metricVs:before{
  inset:4px!important;
}
.metricVs:after{
  left:5.6px!important;
  top:2.3px!important;
  font-size:7px!important;
}
.metricVs.danger:after{
  left:5.2px!important;
}
.metricVs.ball:after{
  left:6.2px!important;
  top:3px!important;
  font-size:5.8px!important;
}
.statsMiddleRow{
  grid-template-columns:36px minmax(0,1fr) 36px!important;
  gap:4px!important;
}
.sideCounters{
  min-height:30px!important;
  padding:2px!important;
}
.sideCounters strong{
  font-size:5.7px!important;
  max-width:31px!important;
}
.sideCounters span{
  font-size:7px!important;
}
.sideCounters b{
  font-size:6.8px!important;
}
.shotBoxPro{
  min-height:30px!important;
  grid-template-columns:28px minmax(0,1fr) 28px!important;
  padding:3px 4px!important;
  gap:3px!important;
}
.shotBoxPro small{
  font-size:5.7px!important;
  height:7px!important;
}
.shotBoxPro strong{
  font-size:10.5px!important;
}
.splitBar{
  height:3px!important;
}

.miniMap{
  margin:0 auto 4px!important;
  padding:0 2px!important;
}
.livePulse{
  height:18px!important;
  padding:2px 7px!important;
  margin:0 2px 2px!important;
}
.livePulse b{
  font-size:7px!important;
}
.livePulse span{
  font-size:7px!important;
}
.weatherBadge{
  top:21px!important;
  right:7px!important;
  padding:2px 5px!important;
  font-size:6.5px!important;
}
.weatherBadge span{
  font-size:9px!important;
}
.stadiumLights{
  top:18px!important;
  height:10px!important;
}
.stadiumLights i{
  width:18px!important;
  height:8px!important;
}
.field3d.liveField{
  height:48px!important;
  margin-top:3px!important;
  border-radius:10px!important;
  transform:perspective(290px) rotateX(29deg) scale(1.01)!important;
}
.playerDot{
  width:5px!important;
  height:5px!important;
}
.liveBall{
  width:7px!important;
  height:7px!important;
}
.attackTrail{
  height:2px!important;
}
.mapStats.compact{
  font-size:6.8px!important;
  margin-top:1px!important;
}

.flowCard{
  min-height:91px!important;
  padding:4px!important;
  margin-top:4px!important;
}
.flowCard h3{
  font-size:8px!important;
  height:11px!important;
  line-height:11px!important;
  margin-bottom:1px!important;
}
.flowRealTag,
.flowPreliveTag{
  font-size:5.6px!important;
  padding:1px 4px!important;
}
.flowMinuteScale{
  font-size:6px!important;
  padding:0 7px 1px 36px!important;
}
.flowWrap{
  height:54px!important;
  padding-left:36px!important;
  padding-right:7px!important;
}
.flowWrap:before{
  left:36px!important;
  right:7px!important;
}
.flowWrap:after{
  left:36px!important;
  right:7px!important;
}
.middleLine{
  left:36px!important;
  right:7px!important;
}
.teamMini{
  width:32px!important;
  font-size:6px!important;
}
.teamMini img{
  width:14px!important;
  height:14px!important;
}
.homeMini{
  top:4px!important;
}
.awayMini{
  bottom:4px!important;
}
.nowLine b{
  font-size:6px!important;
  padding:1px 3px!important;
}
.flowSpike{
  width:1.3px!important;
}
.flowSpike.level-3{
  width:2px!important;
}
.flowIcon{
  font-size:8px!important;
}
.flowIcon.home,
.realEventIcon.home{
  bottom:calc(50% + 18px)!important;
}
.flowIcon.away,
.realEventIcon.away{
  top:calc(50% + 18px)!important;
}
.flowLegend{
  display:none!important;
}

.marketsPanel{
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:4px!important;
  margin-top:4px!important;
  padding:4px!important;
}
.signalChip{
  min-height:30px!important;
  padding:3px 5px!important;
  border-radius:6px!important;
}
.signalChip b{
  font-size:8px!important;
}
.signalChip span{
  font-size:6.8px!important;
}
.signalChip strong{
  font-size:10px!important;
}
.signalChip em{
  font-size:6.8px!important;
}
.bookies{
  display:none!important;
}

.noOddsBadge{
  background:#1f2937!important;
}
.realOddsBadge{
  background:#ca8a04!important;
}
.base{
  background:#243141!important;
}
.preliveVipLock{
  background:#7c2d12!important;
}

@media(max-width:1100px){
  .grid{
    grid-template-columns:1fr!important;
  }
  .card{
    min-height:auto!important;
  }
  .filters{
    grid-template-columns:repeat(4,1fr)!important;
  }
  .marketBadges{
    max-width:100%!important;
    justify-content:center!important;
  }
}

@media(min-width:1101px){
  .page{
    height:100vh!important;
    overflow:hidden!important;
  }
  .grid{
    height:calc(100vh - 128px)!important;
    overflow-y:auto!important;
    padding-bottom:8px!important;
  }
}


/* ===== CORRECAO MAKINE: 3 JOGOS POR LINHA, SEM SOBREPOR, COMPACTO E ROLAGEM NORMAL ===== */
@media(min-width:1101px){
  .page{
    height:auto!important;
    min-height:100vh!important;
    overflow-x:hidden!important;
    overflow-y:auto!important;
    padding:6px!important;
  }

  .grid{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    grid-auto-rows:auto!important;
    gap:10px!important;
    align-items:start!important;
    height:auto!important;
    max-height:none!important;
    overflow:visible!important;
    padding-bottom:20px!important;
  }

  .card{
    position:relative!important;
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    overflow:hidden!important;
    display:flex!important;
    flex-direction:column!important;
    gap:5px!important;
    padding:6px!important;
    isolation:isolate!important;
  }
}

/* Mantem as secoes em fluxo normal para uma nao invadir a outra */
.card > *{
  position:relative;
  min-width:0!important;
}

.matchHero{
  height:64px!important;
  min-height:64px!important;
  margin-bottom:0!important;
}

.heroCenter strong.gameMinute{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  min-width:34px!important;
  height:18px!important;
  margin-top:-3px!important;
  padding:1px 8px!important;
  border-radius:999px!important;
  background:#ef4444!important;
  color:#fff!important;
  font-size:10px!important;
  line-height:1!important;
  transform:none!important;
  top:auto!important;
}

.heroCenter strong.preliveMinute{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  height:18px!important;
  margin-top:-3px!important;
  padding:1px 8px!important;
  border-radius:999px!important;
  background:#7c2d12!important;
  color:#facc15!important;
  font-size:8px!important;
  line-height:1!important;
  transform:none!important;
  top:auto!important;
}

.badges{
  margin-top:0!important;
  margin-bottom:4px!important;
  min-height:auto!important;
  display:flex!important;
  flex-wrap:wrap!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:3px!important;
}

.marketBadges{
  max-width:100%!important;
  justify-content:flex-start!important;
}

.highlightSignal{
  min-height:42px!important;
  margin:0 0 5px!important;
  padding:5px 7px!important;
  grid-template-columns:minmax(0,1fr) auto!important;
}

.highlightSignalText span{
  max-width:100%!important;
}

.proStats{
  margin:0 0 5px!important;
  min-height:76px!important;
  padding:4px!important;
}

.miniMap{
  margin:0 0 5px!important;
  padding:0 2px!important;
  overflow:hidden!important;
}

.livePulse{
  height:18px!important;
  margin:0 0 3px!important;
}

.field3d.liveField{
  height:56px!important;
  margin-top:3px!important;
}

.mapStats.compact{
  min-height:12px!important;
  overflow:hidden!important;
  white-space:nowrap!important;
}

.flowCard{
  margin-top:0!important;
  min-height:104px!important;
  padding:4px!important;
  overflow:hidden!important;
}

.flowWrap{
  height:64px!important;
  overflow:hidden!important;
}

.flowLegend{
  display:none!important;
}

.marketsPanel{
  margin-top:0!important;
  padding:4px!important;
  gap:4px!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
}

.signalChip{
  min-height:32px!important;
}

.signalChip em{
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}

.bookies{
  display:none!important;
}

/* Desktop menor ainda mantem 3 colunas sem quebrar */
@media(min-width:1101px) and (max-width:1280px){
  .grid{
    gap:8px!important;
  }

  .card{
    padding:5px!important;
  }

  .heroCenter h2{
    font-size:11px!important;
  }

  .heroCenter b{
    font-size:20px!important;
  }

  .badges span{
    font-size:6.6px!important;
    padding:2px 4px!important;
  }

  .highlightSignalText b{
    font-size:10px!important;
  }

  .highlightSignalMeta strong{
    font-size:14px!important;
  }

  .proStats{
    min-height:70px!important;
  }

  .field3d.liveField{
    height:50px!important;
  }

  .flowCard{
    min-height:96px!important;
  }

  .flowWrap{
    height:58px!important;
  }

  .signalChip{
    min-height:30px!important;
  }
}

/* Tablet/celular continua uma coluna limpa */
@media(max-width:1100px){
  .page{
    height:auto!important;
    overflow-y:auto!important;
  }

  .grid{
    grid-template-columns:1fr!important;
    height:auto!important;
    overflow:visible!important;
  }

  .card{
    height:auto!important;
    overflow:hidden!important;
  }
}



/* ===== MAKINE AJUSTE: MINIMAPA VIVO + PRE-LIVE VIP + SINAL ACIONAVEL ===== */
.livePulse{
  border-color:rgba(255,255,255,.18)!important;
  background:linear-gradient(90deg,rgba(4,10,14,.92),rgba(11,24,31,.88))!important;
}
.livePulse.high{border-color:rgba(250,204,21,.65)!important;box-shadow:0 0 10px rgba(250,204,21,.18)!important}
.livePulse.medium{border-color:rgba(34,197,94,.45)!important;box-shadow:0 0 8px rgba(34,197,94,.15)!important}
.livePulse.low{border-color:rgba(59,130,246,.45)!important}
.livePulse.neutral,.livePulse.idle{border-color:rgba(250,204,21,.38)!important;background:linear-gradient(90deg,rgba(92,38,5,.35),rgba(12,17,23,.9))!important}
.livePulse b{letter-spacing:.2px!important;text-transform:uppercase!important}
.livePulse span{text-transform:none!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:58%!important}
.field3d.liveField{background:
  radial-gradient(circle at 50% -18%,rgba(255,255,255,.24),transparent 28%),
  repeating-linear-gradient(90deg,#39a52a 0 20px,#2b8321 20px 40px)!important;
}
.attackTrail{
  height:4px!important;
  min-width:12px!important;
  box-shadow:0 0 10px currentColor!important;
  animation:trailRun 1.35s linear infinite!important;
}
@keyframes trailRun{0%{opacity:.35;filter:blur(.5px)}50%{opacity:1;filter:blur(0)}100%{opacity:.45;filter:blur(.5px)}}
.playerDot{width:6px!important;height:6px!important;border:1px solid rgba(255,255,255,.55)!important;animation:playerJitter 2.2s ease-in-out infinite!important}
@keyframes playerJitter{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(calc(-50% + 1px),calc(-50% - 1px)) scale(1.08)}}
.liveBall{
  width:9px!important;height:9px!important;
  animation:ballMove 1.05s ease-in-out infinite!important;
  box-shadow:0 0 12px rgba(255,255,255,.9)!important;
}
.liveBall.high{box-shadow:0 0 14px rgba(250,204,21,.95)!important}
.liveBall.medium{box-shadow:0 0 12px rgba(34,197,94,.85)!important}
.liveBall.low{box-shadow:0 0 10px rgba(147,197,253,.75)!important}
@keyframes ballMove{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(calc(-50% + 3px),calc(-50% - 2px)) scale(1.18)}}
.ballAura{animation:mbPulse .9s ease-in-out infinite!important}
.mapStats.compact span{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.highlightSignalText small{color:#facc15!important}
.highlightSignalText b{color:#fff!important}
.highlightSignalMeta em{white-space:nowrap!important;max-width:130px!important;overflow:hidden!important;text-overflow:ellipsis!important}
.signalChip span{font-size:8px!important}
.signalChip em{font-size:7.5px!important}
.market:nth-child(n+7){display:none!important}

/* deixa 3 jogos por linha, mas sem tentar colocar tudo numa tela so */
@media(min-width:1101px){
  .grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;align-items:start!important;overflow:visible!important;height:auto!important}
  .card{height:auto!important;min-height:0!important;max-height:none!important;overflow:hidden!important;gap:5px!important}
  .flowLegend{display:none!important}
}
@media(min-width:1101px) and (max-width:1280px){
  .filters{grid-template-columns:repeat(9,minmax(0,1fr))!important}
  .field3d.liveField{height:52px!important}
  .flowWrap{height:58px!important}
  .heroCenter h2{font-size:11px!important}
  .highlightSignalText b{font-size:10px!important}
  .highlightSignalMeta strong{font-size:14px!important}
}
@media(max-width:700px){
  .livePulse span{max-width:50%!important}
  .field3d.liveField{height:58px!important}
}


/* ===== CORRECAO MAKINE: SEM DEMO/FALLBACK E ESTADO VAZIO ===== */
.emptyState{
  min-height:210px!important;
  display:grid!important;
  place-items:center!important;
  align-content:center!important;
  gap:10px!important;
  text-align:center!important;
  background:linear-gradient(180deg,rgba(7,20,28,.7),rgba(0,0,0,.2))!important;
}
.emptyState b{
  color:#58f5a5!important;
  font-size:18px!important;
}
.emptyState span{
  color:#d1d5db!important;
  font-weight:800!important;
  max-width:780px!important;
}
.infoNotice{
  background:#082f49!important;
  border-color:#0ea5e9!important;
}



/* ===== V7: MENU LIMPO + STATS EXATAS ===== */
.filters{
  display:grid!important;
  grid-template-columns:repeat(8,minmax(0,1fr))!important;
  gap:5px!important;
  align-items:center!important;
}
.filters button{
  min-height:30px!important;
  height:auto!important;
  font-size:9px!important;
  padding:6px 5px!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
.statsEstimatedBox{
  position:relative!important;
  opacity:.92!important;
}
.statsEstimatedBox .metricNumbers b,
.statsEstimatedBox .sideCounters b,
.statsEstimatedBox .shotBoxPro strong{
  color:#9ca3af!important;
}
.statsEstimatedBox .dualMiniBar,
.statsEstimatedBox .shotSplitBars{
  opacity:.38!important;
}
.statsOverlayNotice{
  position:absolute!important;
  right:6px!important;
  top:-12px!important;
  z-index:12!important;
  display:flex!important;
  align-items:center!important;
  gap:5px!important;
  border:1px solid rgba(250,204,21,.55)!important;
  background:rgba(36,18,4,.88)!important;
  color:#facc15!important;
  border-radius:999px!important;
  padding:2px 7px!important;
  font-size:7px!important;
  font-weight:900!important;
  pointer-events:none!important;
}
.statsOverlayNotice small{
  color:#e5e7eb!important;
  font-size:6px!important;
  font-weight:800!important;
}
.realStatsBadge{background:#16a34a!important}
.estimatedStatsBadge{background:#4b5563!important;color:#e5e7eb!important}
@media(max-width:1100px){
  .filters{grid-template-columns:repeat(4,minmax(0,1fr))!important}
}
@media(max-width:520px){
  .filters{grid-template-columns:repeat(3,minmax(0,1fr))!important}
  .statsOverlayNotice small{display:none!important}
}


/* ===== V10 MULTI-API ESTAVEL ===== */
.filters .activeBtn{
  background:#19d56b!important;
  color:#001b0b!important;
  border-color:#22c55e!important;
  box-shadow:0 0 10px rgba(34,197,94,.20)!important;
}
.signalChip{
  border-color:rgba(250,204,21,.34)!important;
}
.estimatedStatsBadge{
  background:#374151!important;
  color:#e5e7eb!important;
}


/* ===== SCANNER VIP + MENU UMA LINHA ===== */
.filters{
  display:flex!important;
  flex-wrap:nowrap!important;
  gap:5px!important;
  overflow-x:auto!important;
  padding-bottom:2px!important;
  scrollbar-width:thin!important;
}
.filters button{
  flex:1 1 0!important;
  min-width:64px!important;
  height:29px!important;
  padding:4px 3px!important;
  font-size:8px!important;
  line-height:1!important;
  white-space:nowrap!important;
}
.scannerVipPanel{
  border:1px solid rgba(250,204,21,.55);
  background:linear-gradient(180deg,rgba(23,22,8,.96),rgba(5,14,14,.96));
  border-radius:12px;
  padding:10px;
  margin:8px 0 10px;
  box-shadow:0 0 20px rgba(250,204,21,.08);
}
.scannerHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.scannerHead small{color:#facc15;font-weight:900}.scannerHead h2{margin:2px 0;color:#fff;font-size:18px}.scannerHead p{margin:0;color:#d1d5db;font-size:12px;font-weight:700}.scannerHead strong{background:#facc15;color:#111827;border-radius:999px;padding:7px 12px;font-weight:900;white-space:nowrap}.scannerControls{display:grid;grid-template-columns:180px 160px 1fr;gap:8px;margin-bottom:10px}.scannerControls label{display:grid;gap:4px;color:#d1d5db;font-size:11px;font-weight:900}.scannerControls select{height:34px;border-radius:8px;border:1px solid #0f7a3e;background:#07141a;color:#fff;font-weight:900;padding:0 8px}.scannerTarget{border:1px solid rgba(34,197,94,.45);border-radius:8px;background:#06110d;padding:7px 10px;display:grid;align-content:center}.scannerTarget span{font-size:10px;color:#9ca3af;font-weight:900}.scannerTarget b{color:#58f5a5;font-size:14px}.scannerRanking{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.scannerResult{display:grid;grid-template-columns:40px 1fr 54px 76px 88px;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.13);background:rgba(0,0,0,.26);border-radius:10px;padding:8px}.scannerResult .rank{background:#facc15;color:#111827;border-radius:999px;font-weight:900;text-align:center;padding:5px 0}.scannerResult b{display:block;color:#fff;font-size:12px}.scannerResult small{display:block;color:#d1d5db;font-size:10px;font-weight:800}.scannerResult em{display:block;color:#58f5a5;font-style:normal;font-weight:900;font-size:11px}.scannerResult strong{font-size:20px;color:#22c55e;text-align:center}.scannerResult .backtest{color:#facc15;text-align:center}.scannerResult button{border:0;background:#1ccc67;color:#001b0b;border-radius:8px;padding:7px;font-weight:900;cursor:pointer;font-size:10px}
@media(max-width:1100px){.scannerControls{grid-template-columns:1fr 1fr}.scannerTarget{grid-column:1/-1}.scannerRanking{grid-template-columns:1fr}.scannerResult{grid-template-columns:36px 1fr 48px}.scannerResult .backtest,.scannerResult button{grid-column:2/-1}.filters button{flex:0 0 92px!important}}

/* AJUSTES MEKINEBET - stats sempre visíveis, pré-live limpo e nomes maiores */
.statsOverlayNotice{display:none!important}
.statsEstimatedBox{opacity:1!important}
.metricNumbers b,.shotNumbers b,.statsTopGrid b{opacity:1!important}
.heroCenter h2{
  font-size:19px!important;
  line-height:1.14!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:unset!important;
}
.teamSide small{
  font-size:12px!important;
  line-height:1.12!important;
  max-width:116px!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:unset!important;
}
.matchHero{grid-template-columns:82px 1fr 82px!important;min-height:94px!important}
.card{min-width:420px}
.preliveMinute{font-size:12px!important;color:#facc15!important}
.gameMinute{font-size:14px!important;color:#ef4444!important}

`;
