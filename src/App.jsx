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
body { margin: 0; background: #0a0f0c; font-family: Arial, sans-serif; color
