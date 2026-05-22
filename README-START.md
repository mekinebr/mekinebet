# MekineBet pronto para startar

## Rodar local

```bash
npm install
npm start
```

Isso inicia:
- Frontend: http://localhost:5173
- Backend/API: http://localhost:3001

## Testes rápidos

```bash
curl http://localhost:3001/api/health
```

## Publicar Firebase Hosting

```bash
npm run build
firebase login
firebase init hosting
firebase deploy
```

Quando publicar, cadastre as variáveis do `.env` também no ambiente do servidor/backend. O Firebase Hosting sozinho hospeda o frontend; o backend Express precisa ficar em Railway, Render, Vercel Functions ou Cloud Run.

## Segurança

Não suba `.env` nem `server/config/serviceAccountKey.json` no GitHub.
