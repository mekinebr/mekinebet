import React, { useEffect, useMemo, useState } from "react";

const API_URL = "https://mekinebet.onrender.com/api/signals";

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
  "brighton & hove albion fc": "https://media.api-sports.io/football/teams/51.png"
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
          ["TODOS", "▦ TODOS"], ["LIVE", "📡 LIVE"], ["ALERTA", "🔔 ALERTA"],
          ["OVER05", "↗ OVER 0,5"], ["OVER15", "↗ OVER 1,5"], ["OVER25", "↗ OVER 2,5"],
          ["BTTS", "👥 BTTS"], ["VIP", "👑 VIP"], ["HISTORICO", "🕘 HISTÓRICO"]
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
              <div className="matchHero">
                <img className="heroLogo" src={logoCasa(item)} alt="" />
                <div className="heroCenter">
                  <h2>{times.casa} <span className="vs">VS</span> {times.fora}</h2>
                  <p>{item.league}</p>
                </div>
                <img className="heroLogo" src={logoFora(item)} alt="" />
              </div>

              <div className="timeline">
                <div className="timelineTitle">📋 CRONOLOGIA DA PARTIDA</div>
                <div className="timelineBar">
                  <div className="teamSide"><img src={logoCasa(item)} alt="" /></div>
                  <div className="events">
                    <div className="event green">15' ⚽ Gol</div>
                    <div className="event yellow">28' 🟨 Cartão</div>
                    <div className="event green">42' ⚽ Gol</div>
                  </div>
                  <div className="teamSide"><img src={logoFora(item)} alt="" /></div>
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

.card { background: linear-gradient(180deg, #102016, #0a1411); border: 1px solid #00d66f; border-radius: 10px; padding: 12px; min-height: 460px; }

.teams { display: flex; align-items: center; gap: 10px; }
.teams img { width: 52px; height: 52px; border-radius: 50%; background: #fff; padding: 4px; border: 2px solid #1e3a2f; flex-shrink: 0; }

.teamName { font-size: 13px; font-weight: 700; color: #ffffff; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.home { text-align: right; }
.away { text-align: left; }
.vs { font-size: 15px; font-weight: 900; color: #00ff9d; padding: 0 8px; }

.timeline { margin: 10px 0; background: #071a10; border: 1px solid #0f7a3e; border-radius: 10px; padding: 10px; }
.timelineTitle { text-align: center; color: #00ff70; font-size: 11px; font-weight: 700; margin-bottom: 8px; }
.timelineBar { display: flex; align-items: center; gap: 8px; background: #0a1f17; border-radius: 8px; padding: 6px; }
.teamSide img { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #1e3a2f; }
.events { flex: 1; display: flex; gap: 6px; overflow-x: auto; }
.event { padding: 4px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; white-space: nowrap; }
.green { background: #22c55e; color: #111; }
.yellow { background: #facc15; color: #000; }

.field { height: 78px; background: linear-gradient(180deg, #0f6b2e, #0a5a25); border: 3px solid #ffffff66; border-radius: 12px; position: relative; overflow: hidden; }
.ball { position: absolute; top: 41%; width: 14px; height: 14px; border-radius: 50%; }
.home { background: #facc15; left: 34%; }
.away { background: #00d9ff; left: 62%; }
`;

export default App;
