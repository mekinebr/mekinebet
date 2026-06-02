import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Limpa Service Worker antigo
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      for (const registration of registrations) {
        await registration.unregister();
      }

      if ("caches" in window) {
        const cacheNames = await caches.keys();

        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }

      console.log("MekineBet cache limpo");
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
    }
  });
}
