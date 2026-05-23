import React, { useEffect, useState } from "react";

export default function App() {
  const [sinais, setSinais] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  async function carregarSinais() {
    try {
      const response = await fetch("https://mekinebet.onrender.com/api/signals");
      const data = await response.json();
      setSinais(data.activeSignals || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarSinais();
    const interval = setInterval(carregarSinais, 30000);
    return () => clearInterval(interval);
  }, []);

  const sinaisFiltrados = sinais.filter((sinal) => {
    const texto = `${sinal.match} ${sinal.league} ${sinal.market} ${sinal.category}`.toLowerCase();
    const passaBusca = texto.includes(busca.toLowerCase());
    const passaFiltro =
      filtro === "todos" ||
      sinal.type === filtro ||
      sinal.category === filtro;

    return passaBusca && passaFiltro;
  });

  function posicaoBola(sinal) {
    const minuto = Number(sinal.minute) || 45;
    const left = Math.min(88, Math.max(12, minuto));
    const top = sinal.category === "cantos" ? 18 : sinal.category === "favorito" ? 35 : 50;
    return { left: `${left}%`, top: `${top}%` };
  }

  return (
    <div style={page}>
      <h1>MekineBet AO VIVO</h1>

      <div style={filters}>
        {["todos", "live", "prelive", "over15", "over25", "btts", "cantos", "favorito", "1x"].map((item) => (
          <button key={item} onClick={() => setFiltro(item)} style={filtro === item ? activeBtn : btn}>
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      <input
        placeholder="Buscar time, liga ou mercado..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={input}
      />

      <h3>Jogos ao vivo: {sinais.filter((s) => s.type === "live").length}</h3>
      <h3>Sinais ativos: {sinaisFiltrados.length}</h3>

      {loading && <p>Carregando sinais...</p>}
      {!loading && sinaisFiltrados.length === 0 && <p>Nenhum sinal encontrado.</p>}

      {sinaisFiltrados.map((sinal) => {
        const bola = posicaoBola(sinal);

        return (
          <div key={sinal.id} style={card}>
            <h2>{sinal.match}</h2>

            <p><strong>Liga:</strong> {sinal.league}</p>
            <p><strong>Placar:</strong> {sinal.score || "vs"}</p>
            <p><strong>Mercado:</strong> {sinal.market}</p>
            <p><strong>Odd:</strong> {sinal.odd}</p>
            <p><strong>Status:</strong> {sinal.status}</p>
            <p><strong>Minuto:</strong> {sinal.minute}</p>
            <p><strong>Favorito:</strong> {sinal.favorito}</p>
            <p><strong>Confiança:</strong> {sinal.confidence || 80}%</p>

            <h3>Mapa ao vivo do jogo</h3>

            <div style={campo}>
              <div style={meioCampo}></div>
              <div style={areaEsq}></div>
              <div style={areaDir}></div>
              <div style={linhaCentro}></div>

              <div style={{ ...bolaStyle, left: bola.left, top: bola.top }}>
                ⚽
              </div>

              <div style={acao}>
                {sinal.category === "cantos" && "Pressão por cantos"}
                {sinal.category === "over15" && "Pressão ofensiva"}
                {sinal.category === "over25" && "Jogo aberto"}
                {sinal.category === "btts" && "Ambas equipes atacando"}
                {sinal.category === "favorito" && `Domínio: ${sinal.favorito}`}
                {sinal.category === "1x" && "Proteção pré-live"}
              </div>
            </div>

            <div style={buttons}>
              {sinal.novibet && <a href={sinal.novibet} target="_blank" rel="noreferrer"><button style={betBtn}>Novibet</button></a>}
              {sinal.betano && <a href={sinal.betano} target="_blank" rel="noreferrer"><button style={betBtn}>Betano</button></a>}
              {sinal.bet365 && <a href={sinal.bet365} target="_blank" rel="noreferrer"><button style={betBtn}>Bet365</button></a>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const page = {
  background: "#050816",
  minHeight: "100vh",
  color: "white",
  padding: 30,
  fontFamily: "Arial"
};

const filters = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 20
};

const btn = {
  padding: "10px 15px",
  borderRadius: 10,
  border: "1px solid #00ff99",
  background: "#111827",
  color: "#fff",
  cursor: "pointer"
};

const activeBtn = {
  ...btn,
  background: "#00ff99",
  color: "#000",
  fontWeight: "bold"
};

const input = {
  width: "100%",
  padding: 15,
  borderRadius: 10,
  marginBottom: 20,
  border: "1px solid #00ff99",
  background: "#111827",
  color: "white"
};

const card = {
  background: "#111827",
  padding: 20,
  borderRadius: 12,
  marginTop: 20,
  border: "1px solid #00ff99"
};

const campo = {
  position: "relative",
  height: 220,
  borderRadius: 14,
  background: "linear-gradient(90deg, #064e3b, #047857)",
  border: "2px solid white",
  overflow: "hidden",
  marginTop: 10
};

const meioCampo = {
  position: "absolute",
  left: "50%",
  top: 0,
  width: 2,
  height: "100%",
  background: "white",
  opacity: 0.8
};

const linhaCentro = {
  position: "absolute",
  left: "43%",
  top: "30%",
  width: 90,
  height: 90,
  border: "2px solid white",
  borderRadius: "50%",
  opacity: 0.8
};

const areaEsq = {
  position: "absolute",
  left: 0,
  top: "25%",
  width: 70,
  height: "50%",
  border: "2px solid white",
  borderLeft: 0
};

const areaDir = {
  position: "absolute",
  right: 0,
  top: "25%",
  width: 70,
  height: "50%",
  border: "2px solid white",
  borderRight: 0
};

const bolaStyle = {
  position: "absolute",
  transform: "translate(-50%, -50%)",
  fontSize: 34,
  animation: "pulse 1s infinite"
};

const acao = {
  position: "absolute",
  bottom: 10,
  left: 10,
  background: "rgba(0,0,0,0.6)",
  padding: "8px 12px",
  borderRadius: 10,
  fontWeight: "bold"
};

const buttons = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 15
};

const betBtn = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  background: "#00ff99",
  color: "#000",
  fontWeight: "bold",
  cursor: "pointer"
};
