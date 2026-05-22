MEKINEBET - VERSÃO CHECKOUT VIP CORRIGIDA

O que foi ajustado:
- Botão Entrar VIP agora chama o backend Render.
- Frontend mostra erro real no console/alerta se checkout falhar.
- Backend aceita Firebase Admin ou fallback por UID/email.
- /api/health mostra status do backend.
- /api/create-checkout cria preferência Mercado Pago e retorna link.
- Status VIP consulta por firebase_uid ou email.

PASSO A PASSO:

1) Subir backend no Render
No Render, use:
Build Command: npm install
Start Command: npm run server

2) Variáveis do Render
Cadastre no Render as variáveis do backend:
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
MP_ACCESS_TOKEN
ODDS_API_KEY
SPORTMONKS_TOKEN
APIFOOTBALL_TOKEN
APP_URL=https://mekinebet-bd1a6.web.app
API_URL=https://mekinebet.onrender.com
PORT=3001

3) Testar backend
Abra:
https://mekinebet.onrender.com/api/health

4) Publicar frontend
No CMD, dentro da pasta:
npm.cmd install
npm.cmd run build
firebase deploy

5) Testar no site
Abra:
https://mekinebet-bd1a6.web.app
F12 > Console
Clique Entrar VIP.
