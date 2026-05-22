import 'dotenv/config'
import express from 'express'
import admin from 'firebase-admin'
import { createClient } from '@supabase/supabase-js'
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import fs from 'fs'

const app = express()

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-uid, x-user-email')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }

  next()
})

app.use(express.json())

let firebaseAdminReady = false

function initFirebaseAdmin() {
  if (admin.apps.length) {
    firebaseAdminReady = true
    return admin
  }

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const json = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        'base64'
      ).toString('utf8')

      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(json))
      })

      firebaseAdminReady = true
      return admin
    }

    if (
      process.env.GOOGLE_APPLICATION_CREDENTIALS &&
      fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    ) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')
      )

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      })

      firebaseAdminReady = true
      return admin
    }

    console.warn('Firebase Admin não configurado.')
  } catch (err) {
    console.warn('Falha Firebase Admin:', err.message)
  }

  return admin
}

initFirebaseAdmin()

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const mpClient = process.env.MP_ACCESS_TOKEN
  ? new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN
    })
  : null

async function getUserFromRequest(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (token && firebaseAdminReady) {
    const decoded = await admin.auth().verifyIdToken(token)

    return {
      uid: decoded.uid,
      email: decoded.email || ''
    }
  }

  const uid = req.headers['x-user-uid'] || req.body?.uid
  const email = req.headers['x-user-email'] || req.body?.email

  if (uid || email) {
    return {
      uid: uid || email,
      email: email || ''
    }
  }

  throw new Error('Faça login')
}

async function verifyUser(req, res, next) {
  try {
    req.user = await getUserFromRequest(req)
    next()
  } catch (err) {
    res.status(401).json({
      error: err.message || 'Token inválido'
    })
  }
}

function generateSignalsFromSources({ odds = [], apifootball = [] }) {
  const base = []

  for (const game of apifootball.slice(0, 20)) {
    const home = game.match_hometeam_name || 'Mandante'
    const away = game.match_awayteam_name || 'Visitante'

    const status =
      game.match_status &&
      game.match_status !== 'Not Started'
        ? 'live'
        : 'pre'

    const homeScore = Number(game.match_hometeam_score || 0)
    const awayScore = Number(game.match_awayteam_score || 0)

    base.push({
      league: game.league_name || 'Futebol',
      time: status === 'live'
        ? `AO VIVO ${game.match_status}`
        : 'Pré-live',

      home,
      away,

      score:
        status === 'live'
          ? `${homeScore} - ${awayScore}`
          : 'vs',

      signal:
        homeScore + awayScore >= 1
          ? 'Gol FT / Over 1.5'
          : 'Over 1.5',

      confidence: 80,
      odd: '1.70',
      market: 'Odds',
      status,
      source: 'API'
    })
  }

  return base
}

app.get('/', (req, res) => {
  res.json({
    ok: true,
    app: 'MekineBet API'
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    ok: true
  })
})

app.get('/api/signals', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10)

    let odds = []
    let apifootball = []

    try {
      if (process.env.ODDS_API_KEY) {
        const oddsRes = await fetch(
          `https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=eu,uk&markets=h2h,totals&oddsFormat=decimal`
        )

        odds = await oddsRes.json()
      }
    } catch (e) {
      console.log('Erro Odds API')
    }

    try {
      if (process.env.APIFOOTBALL_TOKEN) {
        const apiRes = await fetch(
          `https://apiv3.apifootball.com/?action=get_events&from=${today}&to=${today}&APIkey=${process.env.APIFOOTBALL_TOKEN}`
        )

        apifootball = await apiRes.json()
      }
    } catch (e) {
      console.log('Erro APIFootball')
    }

    const signals = generateSignalsFromSources({
      odds,
      apifootball
    })

    res.json({
      updated_at: new Date().toISOString(),
      signals
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      error: err.message
    })
  }
})

const port = process.env.PORT || 3001

app.listen(port, () => {
  console.log(`MekineBet API rodando na porta ${port}`)
})
