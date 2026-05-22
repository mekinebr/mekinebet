import { useEffect, useState } from "react";

function App() {

  const [signals, setSignals] = useState([]);
  const [backendOnline, setBackendOnline] = useState(false);

  const [stats, setStats] = useState({
    liveGames: 0,
    activeSignals: 0
  });

  const fetchSignals = async () => {

    try {

      const response = await fetch(
        "https://mekinebet.onrender.com/api/signals"
      );

      const data = await response.json();

      console.log("API DATA:", data);

      setSignals(data.activeSignals || []);

      setStats({
        liveGames: data.liveGames || 0,
        activeSignals: data.activeSignals?.length || 0
      });

      setBackendOnline(true);

    } catch (error) {

      console.error(error);

      setBackendOnline(false);

      setSignals([]);

    }

  };

  useEffect(() => {

    fetchSignals();

    const interval = setInterval(() => {
      fetchSignals();
    }, 30000);

    return () => clearInterval(interval);

  }, []);

  return (
    <div
      style={{
        background: "#050816",
        minHeight: "100vh",
        color: "white",
        padding: "20px",
        fontFamily: "Arial"
      }}
    >

      <h1>MekineBet</h1>

      <h2>
        Backend:
        {" "}
        {backendOnline ? "ONLINE ✅" : "OFFLINE ❌"}
      </h2>

      <h3>
        Jogos ao vivo:
        {" "}
        {stats.liveGames}
      </h3>

      <h3>
        Sinais ativos:
        {" "}
        {stats.activeSignals}
      </h3>

      <hr />

      {signals.length === 0 ? (

        <p>Nenhum sinal encontrado.</p>

      ) : (

        signals.map((signal) => (

          <div
            key={signal.id}
            style={{
              border: "1px solid #00ff99",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "15px",
              background: "#0b1220"
            }}
          >

            <h2>{signal.match}</h2>

            <p>
              Liga:
              {" "}
              {signal.league}
            </p>

            <p>
              Mercado:
              {" "}
              {signal.market}
            </p>

            <p>
              Odd:
              {" "}
              {signal.odd}
            </p>

            <p>
              Minuto:
              {" "}
              {signal.minute}
            </p>

            <p>
              Categoria:
              {" "}
              {signal.category}
            </p>

            <p>
              Favorito:
              {" "}
              {signal.favorito}
            </p>

            <p>
              Status:
              {" "}
              {signal.status}
            </p>

          </div>

        ))

      )}

    </div>
  );
}

export default App;
