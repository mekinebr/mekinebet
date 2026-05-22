# MekineBet AI Signals

Projeto React + Vite com Firebase Auth, Supabase VIP, Mercado Pago Checkout e APIs de futebol.

## Instalar

```bash
npm install
```

## Configurar variáveis

Copie `.env.example` para `.env` e preencha as chaves.

Importante: não envie `.env` nem `serviceAccountKey.json` para o GitHub.

## Rodar frontend

```bash
npm run dev
```

## Rodar backend

Em outro terminal:

```bash
npm run server
```

## Build

```bash
npm run build
```

## Firebase Hosting

```bash
firebase login
firebase init hosting
npm run build
firebase deploy
```

## SQL Supabase

```sql
create table if not exists users_vip (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text unique not null,
  email text not null,
  is_vip boolean default false,
  vip_plan text default 'free',
  vip_expires_at timestamptz,
  created_at timestamptz default now()
);
```

Para webhook do Mercado Pago liberar VIP automaticamente, use `SUPABASE_SERVICE_ROLE_KEY` somente no backend.
