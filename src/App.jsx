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
    <div>
      APP OK
    </div>
  );
}
