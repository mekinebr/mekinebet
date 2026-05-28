import React, { useEffect, useMemo, useState } from "react";

const API_URL = "https://mekinebet.onrender.com/api/signals";

const TEAM_LOGOS = {
  "ipswich town fc": "https://media.api-sports.io/football/teams/57.png",
  "west ham united fc": "https://media.api-sports.io/football/teams/48.png",
  "liverpool fc": "https://media.api-sports.io/football/teams/40.png",
  "crystal palace fc": "https://media.api-sports.io/football/teams/52.png",
  "southampton fc": "https://media.api-sports.io/football/teams/41.png",
  "arsenal fc": "https://media.api-sports.io/football/teams/42.png",
  // ... (adicione mais times se precisar)
};

const normalizar = (v = "") =>
  String(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

const fallbackLogo = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1a&color=00b172&bold=true&size=64`;

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
        if (filtro === "TODOS") return true;
        if (filtro === "VIP") return isVip(item);
        return true;
      })
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }, [signals, busca, filtro]);

  return (
    <div className="page">
      <style>{css}</style>

      {/* Header Bet365 Style */}
      <header className="bet365-header">
        <div className="logo">bet365</div>
        <nav>
          <span className="active">AO VIVO</span>
          <span>PRÉ-JOGO</span>
          <span>CASSINO</span>
        </nav>
        <div className="actions">
          <button className="btn-promocoes">Promoções</button>
          <button className="btn-registro">Registre-se</button>
          <button className="btn-login">Login</button>
        </div>
      </header>

      <div className="main-container">
        {/* Sidebar */}
        <div className="sidebar">
          <h3>Em Alta</h3>
          <ul>
            <li>Premier League</li>
            <li>Copa Libertadores</li>
            <li>Champions League</li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="content">
          <div className="top-filters">
            <input
              placeholder="Buscar jogo ou liga..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="search-input"
            />
            <div className="filter-buttons">
              {["TODOS", "VIP", "BTTS", "OVER 2.5"].map((f) => (
                <button
                  key={f}
                  className={filtro === f ? "active" : ""}
                  onClick={() => setFiltro(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <h2 className="section-title">Sinais AO VIVO - MekineBet Scanner</h2>

          {loading ? (
            <div className="loading">Carregando mercados ao vivo...</div>
          ) : (
            <div className="matches-list">
              {sinaisFiltrados.map((item, index) => {
                const times = timesDoJogo(item);
                return (
                  <div key={index} className="match-row">
                    <div className="match-info">
                      <div className="teams">
                        <img src={logoCasa(item)} alt="" />
                        <span>{times.casa}</span>
                        <strong>VS</strong>
                        <span>{times.fora}</span>
                        <img src={logoFora(item)} alt="" />
                      </div>
                      <div className="league">{item.league}</div>
                    </div>

                    <div className="odds">
                      <div className="odd-box">
                        <small>BTTS</small>
                        <strong>{item.odd || "1.72"}</strong>
                      </div>
                      <div className="odd-box">
                        <small>IA</small>
                        <strong className="confidence">{item.confidence || 84}%</strong>
                      </div>
                      <div className="odd-box vip">
                        <small>VIP</small>
                        <strong>🔥</strong>
                      </div>
                    </div>

                    <div className="status">
                      <span className="live-dot">● AO VIVO</span>
                      <small>{item.score || "1-1"} • {item.minute || "45'"}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <footer className="bet365-footer">
        Última atualização: {lastUpdate} • IA Ativa 24h
      </footer>
    </div>
  );
}

const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0e0e0e; color: #ddd; font-family: Arial, sans-serif; }

.page { min-height: 100vh; background: #0e0e0e; }

.bet365-header {
  background: #1a1a1a;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 3px solid #00b172;
}

.logo {
  color: #00b172;
  font-size: 32px;
  font-weight: 900;
  letter-spacing: -2px;
}

nav span {
  margin: 0 18px;
  font-weight: bold;
  cursor: pointer;
  padding: 8px 0;
}

nav .active {
  color: #00b172;
  border-bottom: 3px solid #00b172;
}

.actions button {
  margin-left: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: bold;
}

.btn-promocoes { background: #ffcc00; color: #000; }
.btn-registro { background: #00b172; color: white; }
.btn-login { background: #333; color: white; }

.main-container {
  display: flex;
  min-height: calc(100vh - 60px);
}

.sidebar {
  width: 220px;
  background: #141414;
  padding: 20px;
  border-right: 1px solid #222;
}

.content {
  flex: 1;
  padding: 20px;
}

.top-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  background: #1f1f1f;
  border: 1px solid #333;
  border-radius: 6px;
  color: white;
  font-size: 15px;
}

.filter-buttons button {
  padding: 10px 18px;
  background: #1f1f1f;
  border: 1px solid #333;
  color: #ddd;
  border-radius: 6px;
  cursor: pointer;
}

.filter-buttons .active {
  background: #00b172;
  color: white;
  border-color: #00b172;
}

.section-title {
  color: #00b172;
  margin-bottom: 16px;
  font-size: 20px;
  font-weight: bold;
}

.matches-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.match-row {
  background: #1a1a1a;
  border: 1px solid #222;
  border-radius: 8px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
}

.match-row:hover {
  background: #222;
  border-color: #00b172;
}

.teams {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: bold;
}

.teams img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.odds {
  display: flex;
  gap: 12px;
}

.odd-box {
  text-align: center;
  background: #111;
  padding: 8px 14px;
  border-radius: 6px;
  min-width: 70px;
}

.odd-box strong {
  display: block;
  font-size: 18px;
  color: #00ff9d;
}

.confidence { color: #00b172; }

.vip strong { color: #ffd700; }

.status {
  text-align: right;
  min-width: 110px;
}

.live-dot {
  color: #00ff00;
  font-weight: bold;
}

.bet365-footer {
  background: #111;
  text-align: center;
  padding: 12px;
  color: #666;
  font-size: 13px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #00b172;
  font-size: 18px;
}
`;
