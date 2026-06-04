import React, { useEffect, useState, useRef } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://mekinebet-api.onrender.com").replace(/\/$/, "");
const API_URL = `${API_BASE_URL}/api/signals`;

// ==================== CONSTANTES ====================
const TEAM_LOGOS = {
  "ipswich town fc": "https://media.api-sports.io/football/teams/57.png",
  "west ham united fc": "https://media.api-sports.io/football/teams/48.png",
  "liverpool fc": "https://media.api-sports.io/football/teams/40.png",
  "flamengo": "https://media.api-sports.io/football/teams/127.png",
  "palmeiras": "https://media.api-sports.io/football/teams/121.png",
};

const TEAM_COLORS = {};

// ==================== FUNÇÕES BÁSICAS (necessárias) ====================
const normalizar = (v = "") => String(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

const valor = (...vals) => vals.find(v => v !== undefined && v !== null && v !== "") ?? "";

const numero = (v) => {
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return isFinite(n) ? n : 0;
};

const normalizarSinal = (item = {}) => ({
  ...item,
  match: item.match || `${item.homeTeam || "Casa"} vs ${item.awayTeam || "Fora"}`,
  homeTeam: item.homeTeam || item.home,
  awayTeam: item.awayTeam || item.away,
  score: item.score || "0 - 0",
  confidence: Number(item.confidence) || 70,
  pressure: Number(item.pressure) || 70,
  market: item.market || "Monitoramento",
});

const agruparPorPartida = (lista) => lista; // simplificado por enquanto

// ==================== FUNÇÕES DO APP ====================
export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [agora, setAgora] = useState(new Date());

  const prevSignalsRef = useRef([]);

  function tempoAoVivoTexto(item) {
    return "AO VIVO";
  }

  function melhorSinalAtual(item) {
    return item;
  }

  function temGreen(item) {
    return String(item.alert || "").toLowerCase().includes("green");
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
      setSignals(normalizados);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) {
      console.error("Erro ao buscar API:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const strongNow = signals.filter(s => temGreen(s));
    const prev = prevSignalsRef.current;

    strongNow.forEach(signal => {
      if (!prev.some(p => p.id === signal.id)) {
        playNotification("green");
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
      <div className="topBar">
        <h1>MekineBet Scanner</h1>
        <button onClick={() => setSoundEnabled(!soundEnabled)}>
          {soundEnabled ? "🔊 Som Ativo" : "🔇 Som Off"}
        </button>
        <span>Atualizado: {lastUpdate}</span>
      </div>

      <div className="grid">
        {signals.length === 0 ? (
          <p>Carregando sinais...</p>
        ) : (
          signals.map((item) => (
            <div key={item.id} className="card">
              <div className="matchHero">
                <div className="heroCenter">
                  <h2>{item.match}</h2>
                  <b>{item.score}</b>
                  <strong>AO VIVO</strong>
                </div>
              </div>

              <div className="highlightSignal strong">
                <b>{item.market}</b>
                <span style={{ color: "#22c55e" }}>{item.alert || "SINAL FORTE"}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
