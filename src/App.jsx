import React, { useEffect, useMemo, useState } from "react";

const API_URL = "https://mekinebet.onrender.com/api/signals";

const TEAM_LOGOS = {
  "ipswich town fc": "https://media.api-sports.io/football/teams/57.png",
  "west ham united fc": "https://media.api-sports.io/football/teams/48.png",
  "liverpool fc": "https://media.api-sports.io/football/teams/40.png",
  "crystal palace fc": "https://media.api-sports.io/football/teams/52.png",
  "southampton fc": "https://media.api-sports.io/football/teams/41.png",
  "arsenal fc": "https://media.api-sports.io/football/teams/42.png",
};

const normalizar = (v = "") =>
  String(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

const fallbackLogo = (name = "Time") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0a1f17&color=00ff9d&bold=true&size=80`;

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);

  async function carregar() {
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      const data = await res.json();
      setSignals(data.activeSignals || []);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    const timer = setInterval(carregar, 20000);
    return () => clearInterval(timer);
  }, []);

  function timesDoJogo(item) {
    const partes = String(item.match || "").split(/\s+vs\s+|\s+x\s+/i);
    return {
      casa: item.homeTeam || partes[0] || "Casa",
      fora: item.awayTeam || partes[1] || "Fora"
    };
  }

  function logoCasa(item) {
    const t = timesDoJogo(item);
    const key = normalizar(t.casa);
    return TEAM_LOGOS[key] || fallbackLogo(t.casa);
  }

  function logoFora(item) {
    const t = timesDoJogo(item);
    const key = normalizar(t.fora);
    return TEAM_LOGOS[key] || fallbackLogo(t.fora);
  }

  function isVip(item) {
    return (item.confidence || 70) >= 82;
  }

  const sinaisFiltrados = useMemo(() => {
    return signals
      .filter((item) => {
        const texto = `${item.match} ${item.league} ${item.market}`.toLowerCase();
        if (!texto.includes(busca.toLowerCase())) return false;
        if (filtro === "VIP") return isVip(item);
        return true;
      })
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }, [signals, busca, filtro]);

  return (
    <div className="page">
      <style>{css}</style>

      <header className="topBar">
        <div className="headerLeft">
          <h1>MekineBet</h1>
          <span className="liveTag">AO VIVO</span>
        </div>
        <div className="statusWrap">
          <span className="pill">🔴 LIVE: {signals.length}</span>
          <span className="pill">👑 VIP</span>
          <span className="pill">🕘 {lastUpdate}</span>
        </div>
      </header>

      <div className="filters">
        {[
          ["TODOS", "▦ TODOS"], ["LIVE", "📡 LIVE"], ["ALERTA", "🔔 ALERTA"],
          ["OVER05", "↗ 0,5"], ["OVER15", "↗ 1,5"], ["OVER25", "↗ 2,5"],
          ["BTTS", "👥 BTTS"], ["TOP IA", "🧠 TOP IA"], ["VIP", "👑 VIP"],
          ["HISTORICO", "🕘 HISTÓRICO"]
        ].map(([value, label]) => (
          <button key={value} onClick={() => setFiltro(value)} className={filtro === value ? "active" : ""}>
            {label}
          </button>
        ))}
      </div>

      <input
        placeholder="🔍 Buscar jogo, liga ou mercado..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="search"
      />

      <main className="grid">
        {sinaisFiltrados.map((item, index) => {
          const times = timesDoJogo(item);
          const vip = isVip(item);

          return (
            <section 
              key={index} 
              className={`card ${vip ? 'vip-card' : ''}`}
              onClick={() => setSelectedCard(item)}
            >
              <div className="cardHeader">
                <div className="teams">
                  <img src={logoCasa(item)} alt="" onError={(e) => e.currentTarget.src = fallbackLogo(times.casa)} />
                  <div className="teamText">
                    <h2>{item.match}</h2>
                    <p>{item.league}</p>
                  </div>
                  <img src={logoFora(item)} alt="" onError={(e) => e.currentTarget.src = fallbackLogo(times.fora)} />
                </div>
                <div className="badges">
                  <span className="badge base">BASE</span>
                  {vip && <span className="badge vip">VIP</span>}
                  <span className="badge market">BTTS</span>
                </div>
              </div>

              <div className="bodyGrid">
                <div className="placar">
                  <div className="score">{item.score || "2 - 1"}</div>
                  <small>45'</small>
                </div>

                <div className="fieldContainer">
                  <div className="field">
                    <div className="centerCircle"></div>
                    <div className="midLine"></div>
                    <div className="goalLeft"></div>
                    <div className="goalRight"></div>
                    
                    <div className="ballHome"></div>
                    <div className="ballAway"></div>
                  </div>
                </div>
              </div>

              <div className="btts">
                <strong>BTTS / Ambas Marcam</strong>
                <div className="status hot">🔥 BTTS QUENTE</div>
                <div className="odd">Odd: <strong>{item.odd || "1.72"}</strong></div>
              </div>

              <div className="statsContainer">
                <div className="statBar">
                  <span>IA {item.confidence || 84}%</span>
                  <div className="bar"><div className="fill green" style={{ width: `${item.confidence || 84}%` }}></div></div>
                </div>
                <div className="statBar">
                  <span>Pressão {item.pressure || 70}%</span>
                  <div className="bar"><div className="fill gold" style={{ width: `${item.pressure || 70}%` }}></div></div>
                </div>
              </div>

              <div className="bookies">
                <button>Betano</button>
                <button>Novibet</button>
                <button>Bet365</button>
                <button className="vipBtn">VIP</button>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

const css = `
* { box-sizing: border-box; }
body { margin: 0; background: #050a07; font-family: system-ui, sans-serif; color: #e0f2e9; }

.page { padding: 10px; min-height: 100vh; }

/* === MINI CAMPO REALISTA + ANIMAÇÕES AVANÇADAS === */
.field {
  height: 82px;
  background: linear-gradient(#0f6b2e, #0d5f28);
  border: 2px solid #ffffff44;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
}

.field::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg, transparent 0px, transparent 26px, rgba(255,255,255,0.12) 26px, rgba(255,255,255,0.12) 28px);
}

.centerCircle {
  position: absolute;
  top: 50%; left: 50%;
  width: 36px; height: 36px;
  border: 2px solid rgba(255,255,255,0.65);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.midLine {
  position: absolute;
  left: 50%; top: 0; bottom: 0;
  width: 2px;
  background: rgba(255,255,255,0.75);
}

.goalLeft, .goalRight {
  position: absolute;
  top: 22%; width: 24px; height: 56%;
  border: 3px solid rgba(255,255,255,0.9);
  border-radius: 4px;
}
.goalLeft { left: 0; border-right: none; }
.goalRight { right: 0; border-left: none; }

/* Bolas com movimento realista + brilho */
.ballHome, .ballAway {
  position: absolute;
  top: 41%;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  box-shadow: 
    0 4px 12px rgba(0,0,0,0.7),
    0 0 15px currentColor;
  animation: ballMovement 5s infinite alternate ease-in-out;
}

.ballHome {
  background: #ffdd00;
  left: 32%;
  animation-delay: 0.3s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.7), 0 0 18px #ffdd00;
}

.ballAway {
  background: #00ddff;
  left: 58%;
  animation-delay: 1.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.7), 0 0 18px #00ddff;
}

@keyframes ballMovement {
  0%   { left: 32%; transform: scale(1); }
  100% { left: 65%; transform: scale(1.1); }
}

/* Animação das Barras */
.bar {
  height: 8px;
  background: #1e3a2f;
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}

.fill {
  height: 100%;
  border-radius: 999px;
  transition: width 1.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.green { 
  background: linear-gradient(90deg, #00ff9d, #22ffb3); 
  box-shadow: 0 0 12px #00ff9d;
}

.gold { 
  background: linear-gradient(90deg, #ffd700, #ffea80); 
  box-shadow: 0 0 12px #ffd700;
}

/* Estilos Gerais Premium */
.card:hover .field { box-shadow: inset 0 0 40px rgba(0, 255, 157, 0.35); }
.vip-card .ballHome, .vip-card .ballAway { animation-duration: 3.2s; }
`;

export default App;
