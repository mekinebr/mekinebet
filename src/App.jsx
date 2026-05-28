import React, { useEffect, useMemo, useState } from "react";

const API_URL = "https://mekinebet.onrender.com/api/signals";

const TEAM_LOGOS = {
  "ipswich town fc": "https://media.api-sports.io/football/teams/57.png",
  "west ham united fc": "https://media.api-sports.io/football/teams/48.png",
  "liverpool fc": "https://media.api-sports.io/football/teams/40.png",
  "crystal palace fc": "https://media.api-sports.io/football/teams/52.png",
  "southampton fc": "https://media.api-sports.io/football/teams/41.png",
  "arsenal fc": "https://media.api-sports.io/football/teams/42.png",
  // Adicione mais times aqui se quiser
};

const normalizar = (v = "") => String(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

const fallbackLogo = (name = "Time") => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0a1f17&color=00ff9d&bold=true&size=80`;

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

  function isVip(item) {
    return (item.confidence || 70) >= 82;
  }

  const sinaisFiltrados = useMemo(() => {
    return signals
      .filter((item) => {
        const texto = `${item.match} ${item.league} ${item.market}`.toLowerCase();
        if (!texto.includes(busca.toLowerCase())) return false;
        if (filtro === "TODOS") return true;
        if (filtro === "VIP") return isVip(item);
        return true;
      })
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }, [signals, busca, filtro]);

  const liveCount = signals.length;

  return (
    <div className="page">
      <style>{css}</style>

      <header className="topBar">
        <div className="headerLeft">
          <h1>MekineBet</h1>
          <span className="liveTag">AO VIVO</span>
        </div>
        <div className="statusWrap">
          <span className="pill">🔴 LIVE: {liveCount}</span>
          <span className="pill">👑 VIP</span>
          <span className="pill">🕘 {lastUpdate}</span>
        </div>
      </header>

      <div className="filters">
        {[
          ["TODOS", "▦ TODOS"],
          ["LIVE", "📡 LIVE"],
          ["ALERTA", "🔔 ALERTA"],
          ["OVER05", "↗ 0,5"],
          ["OVER15", "↗ 1,5"],
          ["OVER25", "↗ 2,5"],
          ["BTTS", "👥 BTTS"],
          ["TOP IA", "🧠 TOP IA"],
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

      {loading ? (
        <div className="loading">Carregando sinais ao vivo...</div>
      ) : (
        <main className="grid">
          {sinaisFiltrados.map((item, index) => {
            const stats = statsDoJogo(item);
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
                    <div className="score">{item.score || "1 - 3"}</div>
                    <small>45'</small>
                  </div>
                  <div className="fieldContainer">
                    <div className="field">
                      <div className="ballHome" style={{ left: "38%" }}></div>
                      <div className="ballAway" style={{ left: "62%" }}></div>
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
      )}

      {/* MODAL */}
      {selectedCard && (
        <div className="modalOverlay" onClick={() => setSelectedCard(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{selectedCard.match}</h2>
            <p>Detalhes completos do sinal</p>
            <button onClick={() => setSelectedCard(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

const css = `
* { box-sizing: border-box; }
body { margin: 0; background: #050a07; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; color: #e0f2e9; }

.page { padding: 10px; min-height: 100vh; }

.topBar {
  background: linear-gradient(135deg, #0c1f18, #081510);
  border: 1px solid #00ff9d;
  border-radius: 14px;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  box-shadow: 0 8px 32px rgba(0, 255, 157, 0.15);
}

h1 { color: #00ff9d; font-size: 29px; font-weight: 900; letter-spacing: -1px; }

.liveTag { background: #ff0033; color: white; padding: 4px 12px; border-radius: 30px; font-size: 12px; font-weight: bold; }

.filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(92px, 1fr)); gap: 6px; margin-bottom: 12px; }
.filters button {
  padding: 10px 8px; background: #0f1c17; border: 1px solid #1e3a2f; color: #a3d4c0;
  border-radius: 8px; font-weight: 600; font-size: 11.5px; cursor: pointer; transition: all 0.2s;
}
.filters button.active { background: #00ff9d; color: #001f14; border-color: #00ff9d; }

.search {
  width: 100%; padding: 14px 16px; background: #0a1612; border: 1px solid #1e3a2f;
  border-radius: 10px; color: white; font-size: 15px; margin-bottom: 14px;
}

.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(365px, 1fr)); gap: 14px; }

.card {
  background: linear-gradient(145deg, #0f241e, #0a1814);
  border: 1px solid #1e3a2f;
  border-radius: 14px;
  padding: 14px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0,0,0,0.4);
}

.card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: #00ff9d;
  box-shadow: 0 25px 50px rgba(0, 255, 157, 0.25);
}

.vip-card { border-color: #ffd700; box-shadow: 0 0 30px rgba(255, 215, 0, 0.3); }

.cardHeader { display: flex; justify-content: space-between; margin-bottom: 12px; }
.teams { display: flex; align-items: center; gap: 10px; flex: 1; }
.teams img { width: 34px; height: 34px; border-radius: 50%; background: #fff; padding: 3px; border: 2px solid #1e3a2f; }

.btts, .statsContainer, .bookies { margin-top: 10px; }

.modalOverlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 1000;
}

.modal {
  background: #0a1f17; padding: 30px; border-radius: 16px; border: 1px solid #00ff9d; max-width: 500px;
  animation: modalPop 0.3s ease;
}

@keyframes modalPop { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
`;

export default App;
