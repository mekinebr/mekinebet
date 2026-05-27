import React, { useEffect, useMemo, useState } from "react";

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const [ultimoAlerta, setUltimoAlerta] = useState("");
  const [popupAlerta, setPopupAlerta] = useState(null);

  async function ativarNotificacoes() {
    try {
      if ("Notification" in window) {
        const permissao =
          await Notification.requestPermission();

        console.log("Permissão:", permissao);
      }

      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/sw.js");
        console.log("SW registrado");
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function mostrarPush(alerta) {
    try {
      if (Notification.permission !== "granted") return;

      const registration =
        await navigator.serviceWorker.ready;

      registration.showNotification(
        "🚨 MekineBet ALERTA",
        {
          body:
            `${alerta.match} | ${alerta.market}
IA ${alerta.confidence || 70}%`,
          icon: "/logo192.png",
          badge: "/logo192.png",
          vibrate: [200, 100, 200],
          tag: "mekine-alerta"
        }
      );
    } catch (err) {
      console.log(err);
    }
  }

  async function carregar() {
    try {
      const res = await fetch(
        "https://mekinebet.onrender.com/api/signals"
      );

      const data = await res.json();

      const novos =
        data.activeSignals || [];

      setSignals(novos);

      setLastUpdate(
        new Date().toLocaleTimeString("pt-BR")
      );

      const alerta = novos.find(
        (s) =>
          s.source === "api-sports-live" &&
          (
            s.alert?.includes("IMINENTE") ||
            (s.confidence || 0) >= 85 ||
            (s.pressure || 0) >= 88
          )
      );

      if (
        alerta &&
        alerta.id !== ultimoAlerta
      ) {
        setUltimoAlerta(alerta.id);

        setPopupAlerta(alerta);

        mostrarPush(alerta);

        const audio = new Audio(
          "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
        );

        audio.volume = 0.45;

        audio.play().catch(() => {});

        setTimeout(() => {
          setPopupAlerta(null);
        }, 9000);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    ativarNotificacoes();

    carregar();

    const intervalo = setInterval(
      carregar,
      30000
    );

    return () => clearInterval(intervalo);
  }, []);

  function isLiveReal(item) {
    return (
      item.type === "live" &&
      item.source === "api-sports-live"
    );
  }

  function isVipLiberado(item) {
    return (
      (item.confidence || 70) >= 82 ||
      item.alert?.includes("IMINENTE") ||
      item.alert?.includes("GOL")
    );
  }

  const sinaisFiltrados = useMemo(() => {
    let filtrados = signals.filter(
      (item) => {
        const texto =
          `${item.match}
${item.league}
${item.market}`.toLowerCase();

        if (
          !texto.includes(
            busca.toLowerCase()
          )
        )
          return false;

        if (filtro === "TODOS")
          return true;

        if (filtro === "LIVE")
          return isLiveReal(item);

        if (filtro === "HISTORICO")
          return !isLiveReal(item);

        if (filtro === "OVER15")
          return (
            isLiveReal(item) &&
            item.category === "over15"
          );

        if (filtro === "OVER25")
          return (
            isLiveReal(item) &&
            item.category === "over25"
          );

        if (filtro === "BTTS")
          return (
            isLiveReal(item) &&
            item.category === "btts"
          );

        if (filtro === "TOP IA")
          return (
            (item.confidence || 70) >= 82
          );

        if (filtro === "VIP")
          return isVipLiberado(item);

        if (filtro === "ALERTA")
          return (
            isLiveReal(item) &&
            item.alert?.includes("GOL")
          );

        return true;
      }
    );

    filtrados.sort((a, b) => {
      const alertaA =
        a.alert?.includes("IMINENTE")
          ? 1000
          : 0;

      const alertaB =
        b.alert?.includes("IMINENTE")
          ? 1000
          : 0;

      const scoreA =
        alertaA +
        (a.confidence || 70) * 2 +
        (a.pressure || 70);

      const scoreB =
        alertaB +
        (b.confidence || 70) * 2 +
        (b.pressure || 70);

      return scoreB - scoreA;
    });

    return filtrados;
  }, [signals, busca, filtro]);

  const liveCount =
    signals.filter(isLiveReal).length;

  const alertCount =
    signals.filter(
      (s) =>
        isLiveReal(s) &&
        s.alert?.includes("GOL")
    ).length;

 return (
  <div
    style={{
      minHeight: "100vh",
      background: "#020617",
      padding: "25px",
      color: "white",
      fontFamily: "Arial"
    }}
  >
    <h1
      style={{
        color: "#00ffd0",
        fontSize: "72px",
        fontWeight: "900",
        marginBottom: "20px"
      }}
    >
      MekineBet AO VIVO
    </h1>

    <div
      style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        marginBottom: "20px"
      }}
    >
      <div className="top-info">
        🔴 Live real: {liveCount}
      </div>

      <div className="top-info">
        🚨 Alertas: {alertCount}
      </div>

      <div className="top-info">
        👑 VIP visual ativo
      </div>

      <div className="top-info">
        🔄 Atualizado: {lastUpdate}
      </div>
    </div>

    <div
      style={{
        background: "#7c2d12",
        border: "1px solid #f97316",
        padding: "25px",
        borderRadius: "18px",
        marginBottom: "20px",
        boxShadow:
          "0 0 25px rgba(249,115,22,.4)"
      }}
    >
      📊 Mostrando base IA e histórico.
      Nenhum LIVE real disponível
      neste momento.
    </div>

    <div
      style={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        marginBottom: "20px"
      }}
    >
      {[
        "LIVE",
        "ALERTA",
        "OVER15",
        "OVER25",
        "BTTS",
        "HISTORICO",
        "TOP IA",
        "VIP",
        "TODOS"
      ].map((btn) => (
        <button
          key={btn}
          onClick={() => setFiltro(btn)}
          style={{
            padding: "12px 22px",
            borderRadius: "14px",
            border:
              "1px solid #00ffd0",
            background:
              filtro === btn
                ? "#00ffd0"
                : "transparent",
            color:
              filtro === btn
                ? "#000"
                : "#fff",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          {btn}
        </button>
      ))}
    </div>

    <input
      placeholder="Buscar jogo, liga ou mercado..."
      value={busca}
      onChange={(e) =>
        setBusca(e.target.value)
      }
      style={{
        width: "100%",
        padding: "18px",
        borderRadius: "14px",
        background: "#0f172a",
        border: "1px solid #00ffd0",
        color: "white",
        marginBottom: "25px",
        fontSize: "18px"
      }}
    />

    {popupAlerta && (
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          background: "#7f1d1d",
          padding: "20px",
          borderRadius: "18px",
          zIndex: 9999,
          width: "320px",
          border:
            "2px solid #ef4444",
          boxShadow:
            "0 0 30px rgba(239,68,68,.7)"
        }}
      >
        <h2>
          🚨 GOL IMINENTE
        </h2>

        <p>
          {popupAlerta.match}
        </p>

        <p>
          IA:
          {" "}
          {popupAlerta.confidence}%
        </p>
      </div>
    )}

    {loading ? (
      <h2>Carregando...</h2>
    ) : sinaisFiltrados.length === 0 ? (
      <div
        style={{
          background: "#111827",
          padding: "30px",
          borderRadius: "18px",
          border:
            "1px solid #00ffd0"
        }}
      >
        Nenhum sinal encontrado
        nesse filtro.
      </div>
    ) : (
      sinaisFiltrados.map(
        (item, index) => (
          <div
            key={index}
            style={{
              background:
                "linear-gradient(135deg,#0f172a,#020617)",
              border:
                isVipLiberado(item)
                  ? "2px solid gold"
                  : "1px solid #00ffd0",
              borderRadius: "24px",
              padding: "25px",
              marginBottom: "25px",
              boxShadow:
                isVipLiberado(item)
                  ? "0 0 30px rgba(255,215,0,.4)"
                  : "0 0 20px rgba(0,255,208,.2)"
            }}
          >
            <h1
              style={{
                color: "#00ffd0",
                fontSize: "56px",
                marginBottom: "10px"
              }}
            >
              {item.match}
            </h1>

            <p
              style={{
                color: "#cbd5e1"
              }}
            >
              {item.league}
            </p>

            <div
              style={{
                marginTop: "25px",
                lineHeight: "2.1",
                fontSize: "18px"
              }}
            >
              ⚽ Placar:
              {" "}
              {item.score || "0-0"}

              <br />

              🎯 Mercado:
              {" "}
              {item.market}

              <br />

              💰 Odd:
              {" "}
              {item.odd || "1.72"}

              <br />

              🤖 IA:
              {" "}
              {item.confidence || 70}%

              <br />

              🔥 Pressão:
              {" "}
              {item.pressure || 70}%

              <br />

              📢 Alerta:
              {" "}
              {item.alert ||
                "MONITORAMENTO IA"}
            </div>

            <div
              style={{
                width: "100%",
                height: "18px",
                background: "#1e293b",
                borderRadius: "999px",
                overflow: "hidden",
                marginTop: "18px"
              }}
            >
              <div
                style={{
                  width: `${
                    item.confidence || 70
                  }%`,
                  height: "100%",
                  background:
                    "linear-gradient(90deg,gold,#facc15)"
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "22px",
                flexWrap: "wrap"
              }}
            >
              <button className="bet-btn">
                Betano
              </button>

              <button className="bet-btn blue">
                Novibet
              </button>

              <button className="bet-btn orange">
                Bet365
              </button>
            </div>
          </div>
        )
      )
    )}
  </div>
);
