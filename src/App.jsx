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
                  <div className="teamNames">
                    <div className="teamName">{times.casa}</div>
                    <div className="vs">VS</div>
                    <div className="teamName">{times.fora}</div>
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
body { margin: 0; background: #050a07; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; color: #e0f2e9; }

.page { padding: 10px; min-height: 100vh; }

/* HEADER AVANÇADO */
.topBar {
  background: linear-gradient(135deg, #0c1f18, #081510);
  border: 1px solid rgba(0, 255, 157, 0.6);
  border-radius: 16px;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  box-shadow: 0 10px 40px rgba(0, 255, 157, 0.2);
  backdrop-filter: blur(10px);
}

h1 { 
  color: #00ff9d; 
  font-size: 30px; 
  font-weight: 900; 
  letter-spacing: -1.5px;
  text-shadow: 0 0 20px rgba(0, 255, 157, 0.5);
}

.liveTag { 
  background: linear-gradient(90deg, #ff0033, #ff3366);
  color: white; 
  padding: 6px 14px; 
  border-radius: 30px; 
  font-size: 13px; 
  font-weight: bold;
  box-shadow: 0 0 15px rgba(255, 51, 102, 0.6);
}

/* FILTROS */
.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(95px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.filters button {
  padding: 11px 10px;
  background: rgba(15, 28, 23, 0.95);
  border: 1px solid rgba(30, 58, 47, 0.8);
  color: #a3d4c0;
  border-radius: 10px;
  font-weight: 600;
  font-size: 11.8px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
}

.filters button:hover { background: rgba(30, 58, 47, 0.9); transform: translateY(-2px); }
.filters button.active {
  background: linear-gradient(90deg, #00ff9d, #22ffb3);
  color: #001f14;
  border-color: #00ff9d;
  box-shadow: 0 0 15px rgba(0, 255, 157, 0.5);
}

/* CARD AVANÇADO */
.card {
  background: linear-gradient(145deg, #0f241e, #0a1814);
  border: 1px solid rgba(30, 58, 47, 0.8);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  cursor: pointer;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(0,255,157,0.06), transparent);
  opacity: 0;
  transition: opacity 0.4s;
}

.card:hover::before { opacity: 1; }
.card:hover {
  transform: translateY(-10px) scale(1.03);
  border-color: #00ff9d;
  box-shadow: 0 25px 60px rgba(0, 255, 157, 0.3);
}

.vip-card {
  border-color: #ffd700;
  box-shadow: 0 0 35px rgba(255, 215, 0, 0.4);
}

/* TIMES */
.teams { display: flex; align-items: center; gap: 12px; }
.teams img { width: 38px; height: 38px; border-radius: 50%; padding: 3px; background: #fff; border: 2px solid #1e3a2f; }

.teamNames { display: flex; align-items: center; gap: 10px; flex: 1; }
.teamName {
  font-size: 15.5px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}
.vs { color: #00ff9d; font-weight: 900; font-size: 14px; }

/* CAMPO REALISTA */
.field {
  height: 86px;
  background: linear-gradient(#0f6b2e, #0a5a25);
  border: 2px solid #ffffff55;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 40px rgba(0,0,0,0.8);
}

.field::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg, transparent 0px, transparent 26px, rgba(255,255,255,0.2) 26px, rgba(255,255,255,0.2) 28px);
}

.centerCircle, .midLine, .goalLeft, .goalRight { /* ... */ }

.ballHome, .ballAway {
  position: absolute;
  top: 40%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: 0 5px 15px rgba(0,0,0,0.8), 0 0 20px currentColor;
  animation: ballMovement 4.5s infinite alternate ease-in-out;
}

.ballHome { background: #ffdd00; left: 30%; }
.ballAway { background: #00ddff; left: 55%; }

@keyframes ballMovement {
  0% { left: 30%; transform: scale(1) rotate(0deg); }
  100% { left: 68%; transform: scale(1.15) rotate(30deg); }
}
`;

export default App;
