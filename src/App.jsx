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
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=071a10&color=00ff87&bold=true&size=96`;

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

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
        <div>
          <h1>MekineBet AO VIVO</h1>
          <div className="subTitle">🟢 Scanner live • odds • pressão • mercados</div>
        </div>
        <div className="statusWrap">
          <span className="pill">🔴 Live: {signals.length}</span>
          <span className="pill">🚨 Alertas: 13</span>
          <span className="pill">👑 VIP</span>
          <span className="pill">🕘 {lastUpdate}</span>
        </div>
      </header>

      <div className="notice">
        📊 Nenhum LIVE real disponível agora. Mostrando base IA/histórico enquanto monitora automaticamente.
      </div>

      <div className="filters">
        {[
          ["TODOS", "▦ TODOS"],
          ["LIVE", "📡 LIVE"],
          ["ALERTA", "🔔 ALERTA"],
          ["OVER05", "↗ OVER 0,5"],
          ["OVER15", "↗ OVER 1,5"],
          ["OVER25", "↗ OVER 2,5"],
          ["BTTS", "👥 BTTS"],
          ["VIP", "👑 VIP"],
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
            <section key={index} className="card">
              <div className="cardHeader">
                <div className="teams">
                  <img src={logoCasa(item)} alt="" onError={(e) => e.currentTarget.src = fallbackLogo(times.casa)} />
                  <div className="teamName home">{times.casa}</div>
                  <div className="vs">VS</div>
                  <div className="teamName away">{times.fora}</div>
                  <img src={logoFora(item)} alt="" onError={(e) => e.currentTarget.src = fallbackLogo(times.fora)} />
                </div>

                <div className="badges">
                  <span className="badge base">BASE</span>
                  {vip && <span className="badge vip">VIP</span>}
                  <span className="badge btts">BTTS</span>
                </div>
              </div>

              <div className="bodyGrid">
                <div className="placarBox">
                  <span>Placar</span>
                  <b>{item.score || "1 - 3"}</b>
                  <small>Pré/Base</small>
                </div>

                <div className="miniField">
                  <div className="field">
                    <div className="fieldOverlay"></div>
                    <div className="centerCircle"></div>
                    <div className="midLine"></div>
                    <div className="goalLeft"></div>
                    <div className="goalRight"></div>
                    <div className="ball home"></div>
                    <div className="ball away"></div>
                  </div>
                </div>
              </div>

              <div className="bttsBox">
                <strong>BTTS / Ambas Marcam</strong>
                <div>Status: <span className="hot">🔥 BTTS QUENTE</span></div>
                <strong>Odd: 1.72</strong>
              </div>

              <div className="bars">
                <div className="barContainer">
                  <b>IA 84%</b>
                  <div className="bar"><div className="fill green" style={{ width: "84%" }}></div></div>
                </div>
                <div className="barContainer">
                  <b>Pressão 70%</b>
                  <div className="bar"><div className="fill gold" style={{ width: "70%" }}></div></div>
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
body { margin: 0; background: #0a0f0c; font-family: Arial, sans-serif; color: #fff; }

.topBar { background: linear-gradient(180deg, #10281d, #0b1511); border: 1px solid #00d66f; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; }
h1 { color: #00ff70; font-size: 28px; font-weight: 900; }

.notice { background: #4a1c08; border: 1px solid #ff8800; padding: 10px; border-radius: 8px; margin-bottom: 10px; font-weight: bold; }

.filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 6px; margin-bottom: 10px; }
.filters button { padding: 9px 6px; background: #1f2a25; border: 1px solid #00d66f; border-radius: 6px; font-size: 11px; font-weight: bold; }
.filters button.active { background: #00d66f; color: #001b0b; }

.search { width: 100%; padding: 12px; background: #1a2520; border: 1px solid #00d66f; border-radius: 8px; margin-bottom: 12px; }

.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 12px; }

.card { background: linear-gradient(180deg, #102016, #0a1411); border: 1px solid #00d66f; border-radius: 10px; padding: 12px; }

/* LOGOS GRANDES + NOMES MENORES */
.teams { display: flex; align-items: center; gap: 10px; }
.teams img { width: 52px; height: 52px; border-radius: 50%; background: #fff; padding: 4px; border: 2px solid #1e3a2f; flex-shrink: 0; }

.teamName { 
  font-size: 13px; 
  font-weight: 700; 
  color: #ffffff; 
  flex: 1; 
  min-width: 0; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
}
.home { text-align: right; }
.away { text-align: left; }
.vs { font-size: 15px; font-weight: 900; color: #00ff9d; padding: 0 8px; }

/* CAMPO 3D */
.miniField { margin-top: 8px; }
.field {
  height: 78px;
  background: linear-gradient(180deg, #0f6b2e 0%, #0a5a25 50%, #0f6b2e 100%);
  border: 3px solid #ffffff66;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 10px 20px rgba(0,0,0,0.6), inset 0 -10px 20px rgba(255,255,255,0.1);
}

.field::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg, transparent 0px, transparent 26px, rgba(255,255,255,0.25) 26px, rgba(255,255,255,0.25) 28px);
}

.centerCircle {
  position: absolute;
  top: 50%; left: 50%;
  width: 36px; height: 36px;
  border: 2.5px solid rgba(255,255,255,0.85);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.midLine {
  position: absolute;
  left: 50%; top: 0; bottom: 0;
  width: 3px;
  background: rgba(255,255,255,0.9);
}

.goalLeft, .goalRight {
  position: absolute;
  top: 22%; width: 26px; height: 56%;
  border: 4px solid rgba(255,255,255,0.95);
  border-radius: 4px;
}
.goalLeft { left: 0; border-right: none; }
.goalRight { right: 0; border-left: none; }

.ball {
  position: absolute;
  top: 41%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 4px 10px rgba(0,0,0,0.7), 0 0 12px currentColor;
}

.home { background: #facc15; left: 34%; }
.away { background: #00d9ff; left: 62%; }

/* Outros elementos */
.bttsBox, .bars, .bookies { margin-top: 10px; }
.bars .bar { height: 7px; background: #1e293b; border-radius: 999px; overflow: hidden; }
.fill { height: 100%; border-radius: 999px; }
.green { background: #00ff70; }
.gold { background: #facc15; }
`;

export default App;
