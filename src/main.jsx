import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Render sem React.StrictMode para evitar execucao dupla em desenvolvimento/build
// e facilitar identificar erro real do App.
ReactDOM.createRoot(document.getElementById("root")).render(<App />);

// Limpa Service Worker/cache antigo para o navegador nao carregar bundle velho.
// Depois que o app estiver estavel, se quiser PWA, podemos reativar com controle de versao.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      console.log("Service Worker e caches antigos removidos");
    } catch (err) {
      console.log("Erro ao remover Service Worker/cache:", err);
    }
  });
}
