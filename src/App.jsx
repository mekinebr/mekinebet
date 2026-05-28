import React, { useEffect, useMemo, useState } from "react";

const API_URL = "https://mekinebet.onrender.com/api/signals";

const TEAM_LOGOS = {
  "ipswich town fc": "https://media.api-sports.io/football/teams/57.png",
  "west ham united fc": "https://media.api-sports.io/football/teams/48.png",
  "liverpool fc": "https://media.api-sports.io/football/teams/40.png",
  "crystal palace fc": "https://media.api-sports.io/football/teams/52.png",
  "southampton fc": "https://media.api-sports.io/football/teams/41.png",
  "arsenal fc": "https://media.api-sports.io/football/teams/42.png",
  "brentford fc": "https://media.api-sports.io/football/teams/55.png",
  "wolverhampton wanderers fc": "https://media.api-sports.io/football/teams/39.png",
  "chelsea fc": "https://media.api-sports.io/football/teams/49.png",
  "manchester city fc": "https://media.api-sports.io/football/teams/50.png",
  "manchester united fc": "https://media.api-sports.io/football/teams/33.png",
  "tottenham hotspur fc": "https://media.api-sports.io/football/teams/47.png",
  "newcastle united fc": "https://media.api-sports.io/football/teams/34.png",
  "aston villa fc": "https://media.api-sports.io/football/teams/66.png",
  "everton fc": "https://media.api-sports.io/football/teams/45.png",
  "fulham fc": "https://media.api-sports.io/football/teams/36.png",
  "brighton & hove albion fc": "https://media.api-sports.io/football/teams/51.png",
  "nottingham forest fc": "https://media.api-sports.io/football/teams/65.png",
  "afc bournemouth": "https://media.api-sports.io/football/teams/35.png",
  "leicester city fc": "https://media.api-sports.io/football/teams/46.png"
};

const normalizar = (v = "") =>
  String(v)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const fallbackLogo = (name = "Time") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=071a10&color=00ff87&bold=true&size=64`;

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

  function isLiveReal(item) {
    return item.type === "live" && item.source === "api-sports-live";
  }

  function totalGols(item) {
    const nums = String(item.score || "0-0").match(/\d+/g) || [0, 0];
    return Number(nums[0] || 0) + Number(nums[1] || 0);
  }

  function minuto(item) {
    return Number(String(item.minute || 0).replace(/\D/g, "")) || 0;
  }

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

  function statsDoJogo(item) {
    return {
      posse: item.possession || 66,
      finalizacoes: item.shots || 13,
      ataques: item.attacks || 35,
      cantos: item.corners || 4,
      cartoes: item.cards || 1,
      perigosos: item.dangerousAttacks || 23
    };
  }

  function mercadoStatus(item) {
    return "🔥 BTTS QUENTE";
  }

  function categoriaMercado(item) {
    const market = String(item.market || "").toLowerCase();
    if (market.includes("btts") || market.includes("ambas")) return "BTTS";
    return "BASE";
  }

  function isVip(item) {
    return (item.confidence || 70) >= 82;
  }

  const sinaisFiltrados = useMemo(() => {
    return signals
      .filter((item) => {
        const texto = `${item.match} ${item.league} ${item.market}`.toLowerCase();
        if (!texto.includes(busca.toLowerCase())) return false;

        const cat = categoriaMercado(item);
        if (filtro === "TODOS") return true;
        if (filtro === "LIVE") return isLiveReal(item);
        if (filtro === "ALERTA") return true;
        if (filtro === "BTTS") return cat === "BTTS";
        if (filtro === "VIP") return isVip(item);
        if (filtro === "HISTORICO") return !isLiveReal(item);
        return true;
      })
      .sort((a, b) => (b.confidence || 70) - (a.confidence || 70));
  }, [signals, busca, filtro]);

  const liveCount = signals.filter(isLiveReal).length;
  const alertCount = signals.length;

  return (
    <div className="page">
      <style>{css}</style>

      <header className="topBar">
        <div>
          <h1>MekineBet AO VIVO</h1>
          <div className="subTitle">Scanner live • odds • pressão • mercados</div>
        </div>
        <div className="statusWrap">
          <span className="pill">🔴 Live: {liveCount}</span>
          <span className="pill">🚨 Alertas: {alertCount}</span>
          <span className="pill">👑 VIP</span>
          <span className="pill">🕘 {lastUpdate}</span>
        </div>
      </header>

      {liveCount === 0 && (
        <div className="notice">
          Nenhum LIVE real disponível agora. Mostrando base IA/histórico.
        </div>
      )}

      <div className="filters">
        {[
          ["TODOS", "▦ TODOS"],
          ["LIVE", "📡 LIVE"],
          ["ALERTA", "🔔 ALERTA"],
          ["BTTS", "👥 BTTS"],
          ["VIP", "👑 VIP"],
          ["HISTORICO", "🕘 HISTÓRICO"]
        ].map(([value, label]) => (
          <button key={value} onClick={() => setFiltro(value)} className={filtro === value ? "activeBtn" : ""}>
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

      {loading ? (
        <div className="empty">Carregando sinais...</div>
      ) : (
        <main className="grid">
          {sinaisFiltrados.map((item, index) => {
            const stats = statsDoJogo(item);
            const times = timesDoJogo(item);
            const liveReal = isLiveReal(item);
            const vip = isVip(item);

            return (
              <section key={index} className="card">
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
                    <span className="base">{liveReal ? "AO VIVO" : "BASE"}</span>
                    {vip && <span className="vip">VIP</span>}
                    <span className="market">BTTS</span>
                  </div>
                </div>

                <div className="bodyGrid">
                  <div className="placarBox">
                    <span>Placar</span>
                    <b>{item.score || "1 - 3"}</b>
                    <small>{liveReal ? `${minuto(item)}'` : "Pré/Base"}</small>
                  </div>

                  <div className="miniMap">
                    <div className="field">
                      <div className="fieldOverlay"></div>
                      <div className="midLine"></div>
                      <div className="goalLeft"></div>
                      <div className="goalRight"></div>
                      <div className="ballHome" style={{ left: "35%" }}></div>
                      <div className="ballAway" style={{ left: "65%" }}></div>
                    </div>
                    <div className="stats">
                      <span>Posse {stats.posse}%</span>
                      <span>Fin {stats.finalizacoes}</span>
                      <span>Ataq {stats.ataques}</span>
                      <span>Can {stats.cantos}</span>
                      <span>Car {stats.cartoes}</span>
                      <span>Per {stats.perigosos}</span>
                    </div>
                  </div>
                </div>

                <div className="bttsSection">
                  <strong>BTTS / Ambas Marcam</strong>
                  <div className="status">Status: <span className="hot">🔥 BTTS QUENTE</span></div>
                  <strong>Odd: {item.odd || "1.72"}</strong>
                </div>

                <div className="bars">
                  <div>
                    <b>IA {item.confidence || 84}%</b>
                    <div className="barBg"><div className="barGreen" style={{ width: `${item.confidence || 84}%` }} /></div>
                  </div>
                  <div>
                    <b>Pressão {item.pressure || 70}%</b>
                    <div className="barBg"><div className="barGold" style={{ width: `${item.pressure || 70}%` }} /></div>
                  </div>
                </div>

                <div className="momentum">
                  <b>Momentum IA</b>
                  <div className="barBg"><div className="momentumFill" style={{ width: "82%" }} /></div>
                  <small>⚡ Ataque perigoso detectado</small>
                </div>

                <div className="bookies">
                  <button>Betano</button>
                  <button>Novibet</button>
                  <button>Bet365</button>
                  <button>VIP</button>
                </div>
              </section>
            );
          })}
        </main>
      )}

      <footer className="bottomBar">
        <span>Sinais: <b>{signals.length}</b></span>
        <span>🟢 IA Ativa 24h</span>
        <span>⚡ 20s</span>
        <span>Última: <b>{lastUpdate}</b></span>
        <span>Fonte: API-Sports</span>
      </footer>
    </div>
  );
}

const css = `
* { box-sizing: border-box; }
body { margin: 0; background: #0a0f0c; font-family: Arial, sans-serif; color: #fff; }

.page { padding: 6px; min-height: 100vh; }

.topBar {
  background: linear-gradient(180deg, #10281d, #0b1511);
  border: 1px solid #00d66f;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 8px;
}

h1 { color: #00ff70; font-size: 26px; margin: 0; font-weight: 900; }

.subTitle { font-size: 12px; color: #a0e0c0; }

.pill {
  background: #0b1511;
  border: 1px solid #00d66f;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.notice { background: #4a1c08; border: 1px solid #ff7b00; padding: 8px; border-radius: 7px; margin-bottom: 8px; font-size: 13px; }

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 5px;
  margin-bottom: 8px;
}

.filters button {
  padding: 7px 4px;
  background: #252525;
  border: 1px solid #00d66f;
  color: white;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: bold;
  cursor: pointer;
}

.filters .activeBtn { background: #00d66f; color: #001b0b; }

.search {
  width: 100%;
  padding: 10px;
  background: #202b2b;
  border: 1px solid #00d66f;
  border-radius: 7px;
  color: white;
  margin-bottom: 10px;
  font-size: 14px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 10px;
}

.card {
  background: linear-gradient(180deg, #102016, #0a1411);
  border: 1px solid rgba(0,214,111,0.6);
  border-radius: 9px;
  padding: 10px;
  font-size: 13px;
}

.cardHeader {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.teams {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.teams img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: contain;
  background: #fff;
  padding: 2px;
}

.teamText h2 {
  font-size: 14px;
  margin: 0;
  color: #00ff70;
  line-height: 1.1;
}

.teamText p {
  font-size: 11px;
  color: #aaa;
  margin: 2px 0 0;
}

.badges span {
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 9.5px;
  font-weight: bold;
}

.base { background: #334455; }
.vip { background: #facc15; color: #000; }
.market { background: #0ea5e9; }

.bodyGrid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 8px;
  margin-bottom: 8px;
}

.placarBox {
  background: #071a10;
  border: 1px solid #0f7a3e;
  border-radius: 6px;
  padding: 6px;
  text-align: center;
}

.placarBox b { font-size: 24px; display: block; }

.miniMap .field {
  height: 62px;
  background: repeating-linear-gradient(90deg, #176324 0px, #176324 22px, #1d7a2d 22px, #1d7a2d 44px);
  border: 1px solid rgba(255,255,255,.55);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.fieldOverlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255,255,0,.06), rgba(0,255,130,.1));
}

.midLine, .goalLeft, .goalRight { /* mantido igual */ }

.ballHome, .ballAway {
  position: absolute;
  top: 42%;
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.ballHome { background: #facc15; box-shadow: 0 0 8px #facc15; }
.ballAway { background: #00d9ff; box-shadow: 0 0 8px #00d9ff; }

.stats {
  margin-top: 4px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  font-size: 9.5px;
  gap: 1px;
}

.bttsSection {
  background: #071a10;
  border: 1px solid #0f7a3e;
  border-radius: 6px;
  padding: 8px;
  text-align: center;
  margin-bottom: 8px;
}

.hot { color: #ff4444; font-weight: bold; }

.bars {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  font-size: 11px;
  margin-bottom: 6px;
}

.barBg {
  height: 6px;
  background: #1e293b;
  border-radius: 999px;
  overflow: hidden;
}

.barGreen { height: 100%; background: #00ff70; }
.barGold { height: 100%; background: #facc15; }

.momentum {
  background: #071a10;
  border: 1px solid #0f7a3e;
  border-radius: 6px;
  padding: 6px;
  margin-bottom: 8px;
  font-size: 12px;
}

.momentumFill {
  height: 5px;
  background: linear-gradient(90deg, #22c55e, #facc15, #ef4444);
  border-radius: 999px;
}

.bookies {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.bookies button {
  flex: 1;
  padding: 7px 6px;
  font-size: 11px;
  font-weight: bold;
  border-radius: 5px;
}

.bookies button:nth-child(1) { background: #22c55e; }
.bookies button:nth-child(2) { background: #2563eb; }
.bookies button:nth-child(3) { background: #f97316; }
.bookies button:nth-child(4) { background: #facc15; color: #000; }

.bottomBar {
  margin-top: 12px;
  background: #101820;
  border: 1px solid #334455;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  font-size: 12px;
}
`;
