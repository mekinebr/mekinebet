import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://mekinebet-api.onrender.com").replace(/\/$/, "");
const API_URL = `${API_BASE_URL}/api/signals`;

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
  "brighton & hove albion fc": "https://media.api-sports.io/football/teams/51.png",
  "flamengo": "https://media.api-sports.io/football/teams/127.png",
  "cr flamengo": "https://media.api-sports.io/football/teams/127.png",
  "flamengo rj": "https://media.api-sports.io/football/teams/127.png",
  "palmeiras": "https://media.api-sports.io/football/teams/121.png",
  "se palmeiras": "https://media.api-sports.io/football/teams/121.png",
  "sao paulo": "https://media.api-sports.io/football/teams/126.png",
  "são paulo": "https://media.api-sports.io/football/teams/126.png",
  "corinthians": "https://media.api-sports.io/football/teams/131.png",
  "vasco da gama": "https://media.api-sports.io/football/teams/133.png",
  "botafogo": "https://media.api-sports.io/football/teams/120.png",
  "fluminense": "https://media.api-sports.io/football/teams/124.png",
  "atletico mineiro": "https://media.api-sports.io/football/teams/1062.png",
  "atlético mineiro": "https://media.api-sports.io/football/teams/1062.png",
  "gremio": "https://media.api-sports.io/football/teams/130.png",
  "grêmio": "https://media.api-sports.io/football/teams/130.png",
  "internacional": "https://media.api-sports.io/football/teams/119.png"
};

const TEAM_COLORS = {
  "ipswich town fc": "#2563eb",
  "west ham united fc": "#7a263a",
  "liverpool fc": "#ef4444",
  "crystal palace fc": "#2563eb",
  "southampton fc": "#ef4444",
  "arsenal fc": "#facc15",
  "tottenham hotspur fc": "#f8fafc",
  "brighton & hove albion fc": "#2563eb",
  "wolverhampton wanderers fc": "#f59e0b",
  "brentford fc": "#ef4444",
  "newcastle united fc": "#e5e7eb",
  "everton fc": "#2563eb",
  "flamengo": "#ef4444",
  "cr flamengo": "#ef4444",
  "flamengo rj": "#ef4444",
  "palmeiras": "#22c55e",
  "se palmeiras": "#22c55e",
  "sao paulo": "#f8fafc",
  "são paulo": "#f8fafc",
  "corinthians": "#f8fafc",
  "vasco da gama": "#f8fafc",
  "botafogo": "#e5e7eb",
  "fluminense": "#7f1d1d",
  "atletico mineiro": "#f8fafc",
  "atlético mineiro": "#f8fafc",
  "gremio": "#60a5fa",
  "grêmio": "#60a5fa",
  "internacional": "#ef4444"
};

const normalizar = (v = "") =>
  String(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

const fallbackLogo = (name = "Time") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=071a10&color=00ff87&bold=true&size=96`;

const valor = (...vals) => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

const numero = (...vals) => {
  const v = valor(...vals);
  if (v === undefined) return undefined;
  const n = Number(String(v).replace("%", "").replace(",", ".").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

const usarValor = (v, fallback) =>
  v === undefined || v === null || Number.isNaN(Number(v)) ? fallback : Number(v);

// ... (todas as funções continuam iguais até o return) ...

export default function App() {
  // ... (todo o estado e funções permanecem iguais) ...

  return (
    <div className="page">
      {/* ... header, filters, etc ... */}

      {sinaisFiltrados.map((item, index) => {
        const stats = statsDoJogo(item);
        const liveReal = item.type === "live";
        const times = timesDoJogo(item);
        const { homeColor, awayColor } = teamColorPair(times.casa, times.fora);
        const weather = climaDoJogo(item, index);
        const events = timelineEvents(item, index, homeColor, awayColor);
        const hasOdds = jogoOddReal(item);
        const strongest = melhorMercadoDoFiltro(item);
        const liveMap = buildLiveMapState(item, index);
        const statsReal = jogoStatsReal(item);

        return (
          <section key={item.id || index} className="card" data-live={liveReal ? "true" : "false"}>
            <div className="matchHero">
              <div className="teamSide">
                <img className="heroLogo" src={logoCasa(item)} alt={times.casa} onError={(e) => (e.currentTarget.src = fallbackLogo(times.casa))} />
                <small style={{ color: homeColor }}>{nomeCurto(times.casa)}</small>
              </div>
              <div className="heroCenter">
                <p>{item.league || "Liga"}</p>
                <b>{item.score || "0-0"}</b>
                {/* ✅ Bola vermelha removida */}
                <strong className={liveReal ? "" : "preliveMinute"}>
                  {liveReal ? tempoAoVivoTexto(item) : `VIP 24H • ${textoInicio(item)}`}
                </strong>
              </div>
              <div className="teamSide right">
                <img className="heroLogo" src={logoFora(item)} alt={times.fora} onError={(e) => (e.currentTarget.src = fallbackLogo(times.fora))} />
                <small style={{ color: awayColor }}>{nomeCurto(times.fora)}</small>
              </div>
            </div>

            {/* Todo o restante do card está exatamente como estava no seu script original */}

          </section>
        );
      })}
    </div>
  );
}
