import React, { useEffect, useMemo, useState } from "react";
// ... (mesmo código de cima, só trocando o CSS e adicionando algumas classes)

const css = `
* { box-sizing: border-box; }
body { margin: 0; background: #050a07; font-family: system-ui, -apple-system, Arial, sans-serif; color: #fff; }

.page { padding: 8px; min-height: 100vh; }

/* === HEADER MAIS PREMIUM === */
.topBar {
  background: linear-gradient(135deg, #0f2a1f, #0a1a14);
  border: 1px solid #00ff87;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 10px;
  box-shadow: 0 4px 20px rgba(0, 255, 135, 0.15);
}

h1 { 
  color: #00ff87; 
  font-size: 28px; 
  margin: 0; 
  font-weight: 900; 
  text-shadow: 0 0 15px rgba(0, 255, 135, 0.5);
}

/* Cards com Glass Effect */
.card {
  background: linear-gradient(180deg, #0f2a20, #0a1a15);
  border: 1px solid rgba(0, 255, 135, 0.4);
  border-radius: 12px;
  padding: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.card:hover {
  transform: translateY(-4px);
  border-color: #00ff87;
  box-shadow: 0 12px 30px rgba(0, 255, 135, 0.25);
}

.card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(0,255,135,0.03), transparent);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.card:hover::before { opacity: 1; }

/* VIP Glow */
.vip {
  background: linear-gradient(90deg, #ffd700, #ffed4e);
  color: #000;
  box-shadow: 0 0 12px #ffd700;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

/* Campo Mais Bonito */
.field {
  height: 68px;
  background: repeating-linear-gradient(90deg, #0f6b2e, #0f6b2e 24px, #15913d 24px, #15913d 48px);
  border: 2px solid #ffffff44;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.6);
}

.ballHome, .ballAway {
  transition: left 0.8s ease;
  animation: kick 3s infinite alternate;
}

@keyframes kick {
  from { transform: scale(1); }
  to { transform: scale(1.15); }
}

/* Barras com Glow */
.barGreen {
  background: linear-gradient(90deg, #00ff87, #22ffaa);
  box-shadow: 0 0 8px #00ff87;
}

.barGold {
  background: linear-gradient(90deg, #ffcc00, #ffe066);
  box-shadow: 0 0 8px #ffcc00;
}

/* Botões mais modernos */
.bookies button {
  padding: 9px 10px;
  font-size: 11.5px;
  font-weight: 700;
  border-radius: 8px;
  transition: all 0.2s;
}

.bookies button:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
}
`;
