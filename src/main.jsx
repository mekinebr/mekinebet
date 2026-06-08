import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Limpa Service Worker/cache antigo apenas em desenvolvimento.
// Em produção isso evita apagar cache útil e melhora o carregamento.
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }

      console.log("MekineBet cache limpo em DEV");
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
    }
  });
}
