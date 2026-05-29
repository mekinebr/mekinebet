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

  function nomeCurto(nome = "") {
    return String(nome)
      .replace(/Football Club/gi, "")
      .replace(/\bAFC\b/gi, "")
      .replace(/\bFC\b/gi, "")
      .replace(/\bTown\b/gi, "")
      .replace(/\bUnited\b/gi, "")
      .replace(/\bWanderers\b/gi, "Wolves")
      .replace(/\bHotspur\b/gi, "Spurs")
      .replace(/\bCrystal Palace\b/gi, "Crystal")
      .replace(/\bSouthampton\b/gi, "Saints")
      .replace(/\bManchester\b/gi, "Man.")
      .replace(/\bBrighton & Hove Albion\b/gi, "Brighton")
      .replace(/\bNottingham Forest\b/gi, "Nottm Forest")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tituloJogo(item) {
    const t = timesDoJogo(item);
    return `${nomeCurto(t.casa)} vs ${nomeCurto(t.fora)}`;
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

  // ... (outras funções mantidas)

  return (
    <div className="page">
      <style>{css}</style>

      {/* Header, Filters, Search... (mantidos) */}

      <main className="grid">
        {sinaisFiltrados.map((item, index) => {
          const times = timesDoJogo(item);
          const vip = isVip(item);

          return (
            <section key={index} className="card">
              {/* Header com logos grandes */}
              <div className="matchHero">
                <img className="heroLogo" src={logoCasa(item)} alt="" />
                <div className="heroCenter">
                  <h2>{tituloJogo(item)}</h2>
                  <p>{item.league}</p>
                </div>
                <img className="heroLogo" src={logoFora(item)} alt="" />
              </div>

              {/* Cronologia de Partida (Sofascore Style) */}
              <div className="timeline">
                <div className="timelineHeader">
                  <span>📋 CRONOLOGIA DA PARTIDA</span>
                </div>
                <div className="timelineContent">
                  <div className="timelineBar">
                    <div className="teamLeft">
                      <img src={logoCasa(item)} alt="" />
                    </div>
                    <div className="events">
                      <div className="event green">15' ⚽ Gol</div>
                      <div className="event purple">28' 🟨 Cartão</div>
                      <div className="event green">42' ⚽ Gol</div>
                      <div className="event purple">55' 🔄 Substituição</div>
                    </div>
                    <div className="teamRight">
                      <img src={logoFora(item)} alt="" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Restante do card (mantido) */}
              {/* ... placar, campo, stats, etc. */}
            </section>
          );
        })}
      </main>
    </div>
  );
}

const css = `
/* ... estilos anteriores mantidos ... */

/* CRONOLOGIA SOFASCORE STYLE */
.timeline {
  margin: 10px 0;
  background: #071a10;
  border: 1px solid #0f7a3e;
  border-radius: 10px;
  padding: 10px;
}

.timelineHeader {
  text-align: center;
  color: #00ff70;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.timelineBar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  background: #0a1f17;
  border-radius: 8px;
  padding: 0 8px;
  position: relative;
}

.teamLeft, .teamRight {
  width: 32px;
  flex-shrink: 0;
}

.teamLeft img, .teamRight img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #1e3a2f;
}

.events {
  flex: 1;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 0;
}

.event {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.green { background: #22c55e; color: #111; }
.purple { background: #8b5cf6; color: #fff; }

@media (max-width: 900px) {
  .timelineBar { height: auto; flex-direction: column; padding: 8px; }
  .events { flex-wrap: wrap; }
}
`;

export default App;
