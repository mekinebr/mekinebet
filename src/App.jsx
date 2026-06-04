import React, { useEffect, useState, useRef } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://mekinebet-api.onrender.com").replace(/\/$/, "");
const API_URL = `${API_BASE_URL}/api/signals`;
const WS_URL = `${API_BASE_URL.replace('http', 'ws')}/ws`;

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [agora, setAgora] = useState(new Date());

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const prevSignalsRef = useRef([]);
  const audioContextRef = useRef(null);

  // ==================== NOTIFICAÇÃO SONORA ====================
  const playNotification = (type = "normal") => {
    if (!soundEnabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type === "green" ? "sine" : "sawtooth";
      osc.frequency.value = type === "green" ? 880 : 660;
      gain.gain.value = type === "green" ? 0.45 : 0.35;

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      setTimeout(() => osc.stop(), type === "green" ? 650 : 300);

      if (type === "green") {
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          osc2.frequency.value = 1100;
          osc2.type = "sine";
          const gain2 = ctx.createGain();
          gain2.gain.value = 0.3;
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          setTimeout(() => osc2.stop(), 450);
        }, 280);
      }
    } catch (e) {
      console.log("🔇 Áudio não disponível");
    }
  };

  // ==================== WEBSOCKET ====================
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("✅ WebSocket Conectado");
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const lista = Array.isArray(data?.activeSignals) ? data.activeSignals : [];
        const normalizados = lista.map(normalizarSinal);
        setSignals(agruparPorPartida(normalizados));
        setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
      } catch (err) {
        console.error("Erro WS:", err);
      }
    };

    ws.onclose = () => {
      console.log("🔴 WebSocket desconectado - reconectando...");
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    };

    wsRef.current = ws;
  };

  // ==================== FALLBACK HTTP ====================
  async function carregarHTTP() {
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      const data = await res.json();
      const lista = Array.isArray(data?.activeSignals) ? data.activeSignals : [];
      const normalizados = lista.map(normalizarSinal);
      setSignals(agruparPorPartida(normalizados));
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) {
      console.error("Erro HTTP:", e);
    } finally {
      setLoading(false);
    }
  }

  // ==================== DETECÇÃO DE SINAIS PARA SOM ====================
  useEffect(() => {
    const strongNow = signals.filter(s => alertaForte(s) || temGreen(s));
    const prevStrong = prevSignalsRef.current;

    strongNow.forEach(signal => {
      const isNew = !prevStrong.some(p => p.id === signal.id);
      if (isNew) {
        if (temGreen(signal)) playNotification("green");
        else if (alertaForte(signal)) playNotification("normal");
      }
    });

    prevSignalsRef.current = strongNow;
  }, [signals]);

  // ==================== INICIALIZAÇÃO ====================
  useEffect(() => {
    connectWebSocket();

    const polling = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        carregarHTTP();
      }
    }, 7000);

    return () => {
      clearInterval(polling);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    const clock = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  // ==================== RENDER ====================
  return (
    <div className="page">
      <div className="topBar">
        <h1>MekineBet Scanner</h1>
        <div className="controls">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`soundBtn ${soundEnabled ? 'active' : ''}`}
          >
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

              <div className={`proStats ${statsReal ? "realStatsBox" : "statsEstimatedBox"}`}>
                {/* Suas estatísticas aqui */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
