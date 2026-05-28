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
                  
                  <div className="teamContainer">
                    <div className="teamName home">{times.casa}</div>
                    <div className="vs">VS</div>
                    <div className="teamName away">{times.fora}</div>
                  </div>

                  <img src={logoFora(item)} alt="" onError={(e) => e.currentTarget.src = fallbackLogo(times.fora)} />
                </div>

                <div className="badges">
                  <span className="badge base">BASE</span>
                  {vip && <span className="badge vip">VIP</span>}
                  <span className="badge market">BTTS</span>
                </div>
              </div>

              {/* Restante do card (campo, placar, stats...) permanece igual */}
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

/* === ALINHAMENTO PERFEITO DOS TIMES === */
.teams {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.teams img {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #fff;
  padding: 3px;
  border: 2px solid #1e3a2f;
  flex-shrink: 0;
}

.teamContainer {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 8px;
  min-width: 0;
}

.teamName {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.teamName.home { text-align: right; }
.teamName.away { text-align: left; }

.vs {
  font-size: 14px;
  font-weight: 900;
  color: #00ff9d;
  padding: 0 8px;
  flex-shrink: 0;
}

/* Outros estilos (mantidos) */
.card { background: linear-gradient(145deg, #0f241e, #0a1814); border: 1px solid #1e3a2f; border-radius: 16px; padding: 16px; }
.card:hover { transform: translateY(-6px); border-color: #00ff9d; }

.field { height: 82px; background: linear-gradient(#0f6b2e, #0a5a25); border: 2px solid #ffffff55; border-radius: 12px; position: relative; overflow: hidden; }
`;

export default App;
