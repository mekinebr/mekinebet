import { useEffect, useState } from "react";

export default function App() {
  const [sinais, setSinais] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregarSinais() {
    try {
      const response = await fetch(
        "https://mekinebet.onrender.com/api/signals"
      );

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

    const interval = setInterval(() => {
      carregarSinais();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        background: "#050816",
        minHeight: "100vh",
        color: "white",
        padding: "30px",
        fontFamily: "Arial"
      }}
    >
      <h1>MekineBet AO VIVO</h1>

      {loading && <p>Carregando sinais...</p>}

      {!loading && sinais.length === 0 && (
        <p>Nenhum sinal encontrado.</p>
      )}

      {sinais.map((sinal, index) => (
        <div
          key={index}
          style={{
            background: "#111827",
            padding: "20px",
            borderRadius: "12px",
            marginTop: "20px",
            border: "1px solid #00ff99"
          }}
        >
          <h2>{sinal.match}</h2>

          <p>
            <strong>Liga:</strong> {sinal.league}
          </p>

          <p>
            <strong>Mercado:</strong> {sinal.market}
          </p>

          <p>
            <strong>Odd:</strong> {sinal.odd}
          </p>

          <p>
            <strong>Status:</strong> {sinal.status}
          </p>

          <p>
            <strong>Minuto:</strong> {sinal.minute}'
          </p>
        </div>
      ))}
    </div>
  );
}
