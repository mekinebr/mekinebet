import { useEffect, useState } from "react";

export default function App() {

  const [signals, setSignals] = useState([]);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {

    const fetchSignals = async () => {

      try {

        const response = await fetch(
          "https://mekinebet.onrender.com/api/signals"
        );

        const data = await response.json();

        setSignals(data.activeSignals || []);

        setBackendOnline(true);

      } catch (error) {

        console.error(error);

        setBackendOnline(false);

      }

    };

    fetchSignals();

  }, []);

  return (
    <div
      style={{
        background: "#050816",
        color: "white",
        minHeight: "100vh",
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

      <hr />

      {signals.map((signal) => (

        <div
          key={signal.id}
          style={{
            border: "1px solid #00ff99",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "15px"
          }}
        >

          <h2>{signal.match}</h2>

          <p>{signal.league}</p>

          <p>{signal.market}</p>

          <p>Odd: {signal.odd}</p>

          <p>Status: {signal.status}</p>

        </div>

      ))}

    </div>
  );
}
