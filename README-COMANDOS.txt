MEKINEBET - COMANDOS

1) Abra o CMD dentro desta pasta, onde está o package.json.

2) Instalar:
npm.cmd install

3) Rodar local com site + backend:
npm.cmd start

4) Abrir no navegador:
http://localhost:5173

5) Publicar no Firebase Hosting:
npm.cmd run build
firebase deploy

OBS: O firebase.json já está configurado para publicar a pasta dist.
OBS: Não suba .env nem server/config/serviceAccountKey.json para o GitHub.
