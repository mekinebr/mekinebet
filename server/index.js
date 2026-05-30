// ==================== MEKINE BET - DASHBOARD.JS (SINAS REAIS) ====================

let state = {
  signals: [],
  filter: 'prelive',
  cache: {}
};

const $ = s => document.querySelector(s);
const API_URL = "http://localhost:10000/api/signals";   // ← Mude se for outro endereço

// ==================== DETECÇÃO DE ZEBRA ====================
function detectZebra(s) {
  if (!s || s.type !== 'RESULTADO' || !s.prelive) return { isZebra: false, score: 0 };
  let score = 0;
  if (s.bestLeague) score += 35;
  const conf = s.confidence || 50;
  if (conf >= 52 && conf <= 73) score += 30;
  if (conf > 68) score += 20;
  return { isZebra: score >= 55, score };
}

// ==================== APOSTAS CRIADAS ====================
function buildCreatedBets(signals) {
  return signals.filter(s => s.prelive && !s.live && s.bestLeague && s.confidence >= 62).map(s => ({
    id: `created-${s.id}`,
    type: 'APOSTA CRIADA',
    home: s.home,
    away: s.away,
    league: s.league,
    confidence: Math.min(88, Math.round(s.confidence * 0.9)),
    market: 'Pacote Casa Favorita',
    subSignals: [
      { market: `${s.home} Vence`, confidence: s.confidence },
      { market: `Over 1.5 Gols ${s.home}`, confidence: Math.round(s.confidence * 0.85) },
      { market: `Over 4.5 Escanteios`, confidence: 68 }
    ]
  }));
}

// ==================== FILTRAGEM ====================
function filterSignals() {
  let arr = [...state.signals];
  const today = new Date().toISOString().slice(0,10);

  if (state.filter === 'prelive') {
    arr = arr.filter(s => s.prelive && !s.live);
  } 
  else if (state.filter === 'live') {
    arr = arr.filter(s => s.live);
  } 
  else if (state.filter === 'favorites') {
    arr = arr.filter(s => 
      s.prelive && !s.live && 
      new Date(s.date).toISOString().slice(0,10) === today &&
      s.type === 'RESULTADO' && 
      (s.bestLeague || s.multipleScore >= 70) && 
      s.confidence >= 72
    );
  } 
  else if (state.filter === 'surprise') {
    arr = arr.filter(s => 
      s.prelive && !s.live && 
      new Date(s.date).toISOString().slice(0,10) === today &&
      s.type === 'RESULTADO' && 
      s.bestLeague && 
      detectZebra(s).isZebra
    );
  } 
  else if (state.filter === 'created') {
    const preSignals = arr.filter(s => s.prelive && !s.live && new Date(s.date).toISOString().slice(0,10) === today);
    arr = buildCreatedBets(preSignals);
  } 
  else if (state.filter === 'multiple') {
    arr = arr.filter(s => s.prelive && s.multipleScore >= 74);
  }

  return arr;
}

// ==================== RENDER ====================
function cardHtml(s) {
  let html = `<div class="card">`;
  html += `<h3>${s.home} x ${s.away}</h3>`;
  html += `<p class="league">${s.league || 'Liga'} • ${s.confidence || 0}%</p>`;
  html += `<div class="signal"><strong>${s.type}</strong> - ${s.market}</div>`;

  if (s.type === 'APOSTA CRIADA' && s.subSignals) {
    html += `<div class="package"><strong>Pacote Sugerido:</strong><br>`;
    s.subSignals.forEach(sub => {
      html += `• ${sub.market} (${sub.confidence}%)<br>`;
    });
    html += `</div>`;
  }
  html += `</div>`;
  return html;
}

function render() {
  const arr = filterSignals();
  $('#list').innerHTML = arr.length 
    ? arr.map(cardHtml).join('') 
    : `<p class="empty">Nenhum sinal encontrado. Clique em Atualizar.</p>`;
}

// ==================== CARREGAR SINAIS REAIS ====================
async function loadSignals() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Erro na API");
    const data = await res.json();

    if (data.ok && Array.isArray(data.activeSignals)) {
      state.signals = data.activeSignals;
      render();
      console.log(`✅ ${data.activeSignals.length} sinais carregados`);
    } else {
      console.warn("Resposta inválida da API");
    }
  } catch (e) {
    console.error("Erro ao buscar sinais:", e);
    $('#list').innerHTML = `<p class="empty">Erro ao conectar com o servidor.<br>Verifique se o Node.js está rodando na porta 10000.</p>`;
  }
}

// ==================== EVENTOS ====================
document.getElementById('refresh').addEventListener('click', loadSignals);

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.filter = tab.dataset.filter;
    render();
  });
});

document.addEventListener('DOMContentLoaded', loadSignals);
