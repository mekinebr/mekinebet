export default function App() {
  const sinais = [
    {
      jogo: "Flamengo vs Palmeiras",
      mercado: "Over 2.5 FT",
      odd: 1.85
    },
    {
      jogo: "Manchester City vs Arsenal",
      mercado: "BTTS",
      odd: 1.72
    },
    {
      jogo: "Real Madrid vs Sevilla",
      mercado: "Favorito Forte",
      odd: 1.55
    }
  ];

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
          <h2>{sinal.jogo}</h2>
          <p>{sinal.mercado}</p>
          <strong>Odd: {sinal.odd}</strong>
        </div>
      ))}
    </div>
  );
}
