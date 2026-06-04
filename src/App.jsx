import React, { useEffect, useState, useRef } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://mekinebet-api.onrender.com").replace(/\/$/, "");
const API_URL = `${API_BASE_URL}/api/signals`;

// ==================== CONSTANTES ORIGINAIS ====================
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
  "palmeiras": "https://media.api-sports.io/football/teams/121.png",
  "sao paulo": "https://media.api-sports.io/football/teams/126.png",
  "corinthians": "https://media.api-sports.io/football/teams/131.png",
  "vasco da gama": "https://media.api-sports.io/football/teams/133.png",
  "botafogo": "https://media.api-sports.io/football/teams/120.png",
  "fluminense": "https://media.api-sports.io/football/teams/124.png",
  "atletico mineiro": "https://media.api-sports.io/football/teams/1062.png",
  "gremio": "https://media.api-sports.io/football/teams/130.png",
  "internacional": "https://media.api-sports.io/football/teams/119.png",
};

const TEAM_COLORS = {
  "flamengo": "#ef4444",
  "palmeiras": "#22c55e",
  "sao paulo": "#f8fafc",
  "corinthians": "#f8fafc",
  // ... adicione mais se quiser
};

// ==================== FUNÇÕES ORIGINAIS (você deve colar todas aqui) ====================
// Cole todas as funções que estavam no arquivo original:
// normalizar, valor, numero, normalizarSinal, agruparPorPartida, statsDoJogo, 
// jogoStatsReal, jogoAoVivo, minuto, periodoDoJogo, logoCasa, logoFora, tituloJogo, 
// categoriaMercado, alertaForte, mercadoStatus, mercadosBaseDoItem, etc.

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [agora, setAgora] = useState(new Date());

  const prevSignalsRef = useRef([]);

  // ==================== FUNÇÕES MELHORADAS ====================
  function tempoAoVivoTexto(item) {
    const m = Math.max(0, minuto(item));
    const s = String(agora.getSeconds()).padStart(2, "0");
    return `${periodoDoJogo(item)} • ${m}'${s}`;
  }

  function melhorSinalAtual(item) {
    const mercados = mercadosBaseDoItem(item);
    if (!mercados?.length) return item;

    return mercados.reduce((melhor, atual) => {
      const scoreMelhor = (Number(melhor.confidence) || 70) + (Number(melhor.pressure) || 70);
      const scoreAtual = (Number(atual.confidence) || 70) + (Number(atual.pressure) || 70);
      return scoreAtual > scoreMelhor ? atual : melhor;
    });
  }

  function temGreen(item) {
    return mercadosBaseDoItem(item).some(m =>
      String(m.alert || "").toLowerCase().includes("green")
    );
  }

  const playNotification = (type = "normal") => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio(type === "green" 
        ? "https://freesound.org/data/previews/66/66930_931655-lq.mp3" 
        : "https://freesound.org/data/previews/387/387186_7258990-lq.mp3");
      audio.volume = 0.6;
      audio.play();
    } catch (e) {}
  };

  async function carregar() {
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      const data = await res.json();
      const lista = Array.isArray(data?.activeSignals) ? data.activeSignals : [];
      const normalizados = lista.map(normalizarSinal);
      setSignals(agruparPorPartida(normalizados));
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) {
      console.error("Erro ao buscar API:", e);
    } finally {
      setLoading(false);
    }
  }

  // Notificação sonora
  useEffect(() => {
    const strongNow = signals.filter(s => alertaForte(s) || temGreen(s));
    const prev = prevSignalsRef.current;

    strongNow.forEach(signal => {
      if (!prev.some(p => p.id === signal.id)) {
        playNotification(temGreen(signal) ? "green" : "normal");
      }
    });

    prevSignalsRef.current = strongNow;
  }, [signals]);

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const clock = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  return (
    <div className="page">
      {/* TopBar mantida original */}
      <div className="topBar">
        <h1>MekineBet Scanner</h1>
        <div className="statusWrap">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="soundBtn">
            {soundEnabled ? "🔊 Som Ativo" : "🔇 Som Off"}
          </button>
          <span>Atualizado: {lastUpdate}</span>
        </div>
      </div>

      <div className="grid">
        {signals.map((item) => {
          const sinalPrincipal = temGreen(item) ? melhorSinalAtual(item) : item;
          const statsReal = jogoStatsReal(item);
          const isLive = jogoAoVivo(item);

          return (
            <div key={item.id} className="card">
              {/* PLACAR - SEM BOLA VERMELHA */}
              <div className="matchHero">
                <img src={logoCasa(item)} className="heroLogo" alt="" />
                <div className="heroCenter">
                  <h2>{tituloJogo(item)}</h2>
                  <b>{item.score || "0 - 0"}</b>
                  <strong className="gameMinute">
                    {isLive ? tempoAoVivoTexto(item) : "PRÉ-LIVE"}
                  </strong>
                </div>
                <img src={logoFora(item)} className="heroLogo" alt="" />
              </div>

              {/* SINAL PRINCIPAL */}
              <div className={`highlightSignal ${alertaForte(sinalPrincipal) ? "strong" : ""}`}>
                <div className="highlightSignalText">
                  <small>{categoriaMercado(sinalPrincipal)}</small>
                  <b>{sinalPrincipal.market}</b>
                  <span style={{ color: temGreen(item) ? "#22c55e" : "#facc15", fontWeight: "900" }}>
                    {sinalPrincipal.alert || mercadoStatus(sinalPrincipal)}
                  </span>
                </div>
                <div className="highlightSignalMeta">
                  <strong>{sinalPrincipal.confidence}%</strong>
                  <em>{sinalPrincipal.odd}</em>
                </div>
              </div>

              {/* STATS - COR REAL */}
              <div className={`proStats ${statsReal ? "realStatsBox" : "statsEstimatedBox"}`}>
                {/* Cole aqui todo o conteúdo antigo de .proStats do seu arquivo original */}
              </div>

              {/* Mantenha o resto do card (minimap, flow, etc.) como estava originalmente */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
