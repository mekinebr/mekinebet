<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mekine Bet - Sinais IA</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #e0e0e0; }
    .app { max-width: 1400px; margin: 0 auto; padding: 20px; }
    .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    h1 { color: #00ff88; font-size: 2.2rem; }
    button { padding: 10px 20px; background: #00ff88; color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
    .stats { display: flex; gap: 20px; margin-bottom: 20px; }
    .stats div { background: #1a1a1a; padding: 12px 20px; border-radius: 10px; text-align: center; min-width: 120px; }
    .tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
    .tab { padding: 10px 18px; background: #1f1f1f; border: none; border-radius: 8px; cursor: pointer; }
    .tab.active { background: #00ff88; color: #000; font-weight: bold; }
    .filters { display: flex; gap: 10px; margin-bottom: 20px; }
    input, select { padding: 12px; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; color: white; }
    .signals-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 20px; }
    .card { background: #161616; border-radius: 12px; padding: 20px; border: 1px solid #333; }
    .card.live-card { border-color: #ff4444; }
    .league { color: #00ff88; margin: 8px 0; }
    .signal { background: #00ff8822; padding: 12px; border-radius: 8px; margin: 12px 0; }
    .package { background: #003300; padding: 12px; border-radius: 8px; margin-top: 10px; font-size: 0.95rem; }
    .empty { text-align: center; padding: 60px; color: #666; }
    .live-badge { color: #ff4444; font-weight: bold; }
  </style>
</head>
<body>
  <div class="app">
    <div class="top">
      <h1>MEKINE BET</h1>
      <button id="refresh">↻ Atualizar Sinais</button>
    </div>

    <div class="stats">
      <div><b id="count">0</b><span>Total</span></div>
      <div><b id="preCount">0</b><span>Pré-live</span></div>
      <div><b id="liveCount">0</b><span>Ao Vivo</span></div>
    </div>

    <div class="tabs">
      <button class="tab active" data-filter="prelive">Pré-live</button>
      <button class="tab" data-filter="live">Ao Vivo</button>
      <button class="tab" data-filter="favorites">Favoritos</button>
      <button class="tab" data-filter="surprise">Surpresas</button>
      <button class="tab" data-filter="created">Apostas Criadas</button>
    </div>

    <div class="filters">
      <input type="text" id="q" placeholder="Buscar jogo...">
    </div>

    <div id="list" class="signals-list"></div>
  </div>

  <script>
    let state = { signals: [], filter: 'prelive' };
    const $ = s => document.querySelector(s);
    const API_URL = "https://mekinebet.vercel.app/api/signals"; // ← Mude se necessário

    function detectZebra(s) {
      if (!s || s.type !== 'RESULTADO') return { isZebra: false, score: 0 };
      let score = 0;
      if (s.bestLeague) score += 35;
      const conf = s.confidence || 50;
      if (conf >= 52 && conf <= 73) score += 30;
      if (conf > 68) score += 20;
      return { isZebra: score >= 55, score };
    }

    function buildCreatedBets(signals) {
      return signals.filter(s => s.prelive && s.bestLeague && s.confidence >= 62).map(s => ({
        ...s,
        type: 'APOSTA CRIADA',
        market: 'Pacote Casa Favorita',
        subSignals: [
          { market: `${s.home} Vence`, confidence: s.confidence },
          { market: `Over 1.5 Gols ${s.home}`, confidence: Math.round(s.confidence * 0.85) },
          { market: `Over 4.5 Escanteios`, confidence: 68 }
        ]
      }));
    }

    function filterSignals() {
      let arr = [...state.signals];
      const today = new Date().toISOString().slice(0,10);

      if (state.filter === 'prelive') arr = arr.filter(s => s.prelive && !s.live);
      else if (state.filter === 'live') arr = arr.filter(s => s.live || s.status === "AO VIVO");
      else if (state.filter === 'favorites') {
        arr = arr.filter(s => s.prelive && !s.live && new Date(s.date).toISOString().slice(0,10) === today && s.type === 'RESULTADO' && s.confidence >= 72);
      }
      else if (state.filter === 'surprise') {
        arr = arr.filter(s => s.prelive && !s.live && new Date(s.date).toISOString().slice(0,10) === today && s.type === 'RESULTADO' && detectZebra(s).isZebra);
      }
      else if (state.filter === 'created') {
        arr = buildCreatedBets(arr.filter(s => s.prelive && !s.live));
      }

      return arr;
    }

    function cardHtml(s) {
      const isLive = s.live || s.status === "AO VIVO";
      let html = `<div class="card ${isLive ? 'live-card' : ''}">`;
      html += `<h3>${s.home} x ${s.away}</h3>`;
      html += `<p class="league">${s.league} • ${s.confidence}%</p>`;
      if (isLive) html += `<span class="live-badge">🔴 AO VIVO</span>`;
      html += `<div class="signal"><strong>${s.type}</strong> - ${s.market}</div>`;

      if (s.subSignals) {
        html += `<div class="package"><strong>Pacote Sugerido:</strong><br>`;
        s.subSignals.forEach(sub => html += `• ${sub.market} (${sub.confidence}%)<br>`);
        html += `</div>`;
      }
      html += `</div>`;
      return html;
    }

    function render() {
      const arr = filterSignals();
      $('#list').innerHTML = arr.length ? arr.map(cardHtml).join('') : `<p class="empty">Nenhum sinal encontrado.<br>Clique em Atualizar.</p>`;
    }

    async function loadSignals() {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        if (data.ok && Array.isArray(data.activeSignals)) {
          state.signals = data.activeSignals;
          render();
        }
      } catch (e) {
        $('#list').innerHTML = `<p class="empty">Erro ao conectar com o servidor.</p>`;
      }
    }

    document.getElementById('refresh').addEventListener('click', loadSignals);

    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.filter = tab.dataset.filter;
        render();
      });
    });

    // Carregar ao abrir
    window.onload = loadSignals;
  </script>
</body>
</html>
