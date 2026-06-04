import React, { useEffect, useState, useRef } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://mekinebet-api.onrender.com").replace(/\/$/, "");
const API_URL = `${API_BASE_URL}/api/signals`;

// ==================== SUAS CONSTANTES E FUNÇÕES ORIGINAIS (mantidas iguais) ====================
const TEAM_LOGOS = { /* ... seu TEAM_LOGOS original ... */ };
const TEAM_COLORS = { /* ... seu TEAM_COLORS original ... */ };
const DEMO_SIGNALS = [ /* ... seu DEMO_SIGNALS original ... */ ];

// (Cole todas as funções originais aqui - normalizar, valor, numero, normalizarSinal, agruparPorPartida, etc.)

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const [apiInfo, setApiInfo] = useState({ /* ... seu apiInfo original ... */ });

  const [scannerMercado, setScannerMercado] = useState("GOLS");
  const [scannerLinha, setScannerLinha] = useState("2.5");
  const [agora, setAgora] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);

  const prevSignalsRef = useRef([]);

  // ==================== MELHORIAS ADICIONADAS ====================
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
      String(m.alert || m.status || "").toLowerCase().includes("green")
    );
  }

  const playNotification = (type = "normal") => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio(type === "green" 
        ? "https://freesound.org/data/previews/66/66930_931655-lq.mp3" 
        : "https://freesound.org/data/previews/387/387186_7258990-lq.mp3");
      audio.volume = 0.65;
      audio.play();
    } catch (e) {}
  };

  // ==================== CARREGAMENTO (4 SEGUNDOS) ====================
  async function carregar() {
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      const data = await res.json();
      const lista = Array.isArray(data?.activeSignals) ? data.activeSignals : [];
      const normalizados = lista.map(normalizarSinal);
      setSignals(agruparPorPartida(normalizados));
      setApiInfo({ /* ... seu setApiInfo original ... */ });
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) {
      console.error("Erro ao buscar API MekineBet:", e);
      setSignals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    const timer = setInterval(carregar, 4000); // ← 4 segundos
    return () => clearInterval(timer);
  }, []);

  // Notificações sonoras
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
    const relogio = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(relogio);
  }, []);

  // ==================== RENDER (mantido o layout original) ====================
  return (
    <div className="page">
      {/* Todo o header, filtros, scanner, etc. mantido como original */}

      <main className="grid">
        {sinaisFiltrados.map((item, index) => {
          const sinalPrincipal = temGreen(item) ? melhorSinalAtual(item) : item; // ← TROCA AUTOMÁTICA
          const statsReal = jogoStatsReal(item);
          const isLive = jogoAoVivo(item);

          return (
            <section key={item.id || index} className="card" data-live={isLive ? "true" : "false"}>
              {/* PLACAR - SEM BOLA VERMELHA */}
              <div className="matchHero">
                <div className="teamSide">
                  <img className="heroLogo" src={logoCasa(item)} alt="" onError={(e) => e.currentTarget.src = fallbackLogo(timesDoJogo(item).casa)} />
                  <small>{nomeCurto(timesDoJogo(item).casa)}</small>
                </div>
                <div className="heroCenter">
                  <p>{item.league || "Liga"}</p>
                  <b>{item.score || "0 - 0"}</b>
                  <strong className={isLive ? "gameMinute" : "preliveMinute"}>
                    {isLive ? tempoAoVivoTexto(item) : `VIP 24H • ${textoInicio(item)}`}
                  </strong>
                </div>
                <div className="teamSide right">
                  <img className="heroLogo" src={logoFora(item)} alt="" onError={(e) => e.currentTarget.src = fallbackLogo(timesDoJogo(item).fora)} />
                  <small>{nomeCurto(timesDoJogo(item).fora)}</small>
                </div>
              </div>

              {/* SINAL PRINCIPAL MAIS VISÍVEL */}
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

              {/* STATS COM COR REAL */}
              <div className={`proStats ${statsReal ? "realStatsBox" : "statsEstimatedBox"}`}>
                {/* TODO O CONTEÚDO ANTIGO DAS ESTATÍSTICAS FICA AQUI */}
              </div>

              {/* O RESTO DO CARD (minimap, flow, marketsPanel, etc.) FICA EXATAMENTE COMO ESTAVA */}
            </section>
          );
        })}
      </main>
    </div>
  );
}
