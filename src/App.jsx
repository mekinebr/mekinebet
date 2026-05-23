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

  return (
    <div style={{ background: "#050816", minHeight: "100vh", color: "white", padding: 30, fontFamily: "Arial" }}>
      <h1>MekineBet AO VIVO</h1>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        {["todos", "live", "prelive", "over15", "over25", "btts", "cantos", "favorito", "1x"].map((item) => (
          <button
            key={item}
            onClick={() => setFiltro(item)}
            style={{
              padding: "10px 15px",
              borderRadius: 10,
              border: "1px solid #00ff99",
              background: filtro === item ? "#00ff99" : "#111827",
              color: filtro === item ? "#000" : "#fff",
              cursor: "pointer"
            }}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      <input
        placeholder="Buscar time, liga ou mercado..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{
          width: "100%",
          padding: 15,
          borderRadius: 10,
          marginBottom: 20,
          border: "1px solid #00ff99",
          background: "#111827",
          color: "white"
        }}
      />

      <h3>Jogos ao vivo: {sinais.filter((s) => s.type === "live").length}</h3>
      <h3>Sinais ativos: {sinaisFiltrados.length}</h3>

      {loading && <p>Carregando sinais...</p>}

      {!loading && sinaisFiltrados.length === 0 && (
        <p>Nenhum sinal encontrado.</p>
      )}

      {sinaisFiltrados.map((sinal) => (
        <div
          key={sinal.id}
          style={{
            background: "#111827",
            padding: 20,
            borderRadius: 12,
            marginTop: 20,
            border: "1px solid #00ff99"
          }}
        >
          <h2>{sinal.match}</h2>

          <p><strong>Liga:</strong> {sinal.league}</p>
          <p><strong>Placar:</strong> {sinal.score || "vs"}</p>
          <p><strong>Mercado:</strong> {sinal.market}</p>
          <p><strong>Odd:</strong> {sinal.odd}</p>
          <p><strong>Status:</strong> {sinal.status}</p>
          <p><strong>Minuto:</strong> {sinal.minute}</p>
          <p><strong>Categoria:</strong> {sinal.category}</p>
          <p><strong>Favorito:</strong> {sinal.favorito}</p>
          <p><strong>Confiança:</strong> {sinal.confidence || 80}%</p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 15 }}>
            {sinal.novibet && (
              <a href={sinal.novibet} target="_blank" rel="noreferrer">
                <button style={btnStyle}>Novibet</button>
              </a>
            )}

            {sinal.betano && (
              <a href={sinal.betano} target="_blank" rel="noreferrer">
                <button style={btnStyle}>Betano</button>
              </a>
            )}

            {sinal.bet365 && (
              <a href={sinal.bet365} target="_blank" rel="noreferrer">
                <button style={btnStyle}>Bet365</button>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const btnStyle = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  background: "#00ff99",
  color: "#000",
  fontWeight: "bold",
  cursor: "pointer"
};
