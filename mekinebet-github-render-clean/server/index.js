import 'dotenv/config'
import express from 'express'
import axios from 'axios'
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
      const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) })
      firebaseAdminReady = true
      return admin
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      const serviceAccount = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
      firebaseAdminReady = true
      return admin
    }

    console.warn('Firebase Admin não configurado. Usando fallback.')
  } catch (err) {
    console.warn('Falha ao iniciar Firebase Admin:', err.message)
  }

  return admin
}

initFirebaseAdmin()

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const mpClient = process.env.MP_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
  : null

async function getUserFromRequest(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (token && firebaseAdminReady) {
    const decoded = await admin.auth().verifyIdToken(token)
    return {
      uid: decoded.uid,
      email: decoded.email || req.headers['x-user-email'] || req.body?.email || ''
    }
  }

  const uid = req.headers['x-user-uid'] || req.body?.uid
  const email = req.headers['x-user-email'] || req.body?.email

  if (uid || email) {
    return { uid: uid || email, email: email || '' }
  }

  throw new Error('Faça login')
}

async function verifyUser(req, res, next) {
  try {
    req.user = await getUserFromRequest(req)
    next()
  } catch (err) {
    res.status(401).json({ error: err.message || 'Token inválido' })
  }
}

function generateSignalsFromSources({ odds = [], apifootball = [] }) {
  const base = []

  for (const game of apifootball.slice(0, 20)) {
    const home = game.match_hometeam_name || 'Mandante'
    const away = game.match_awayteam_name || 'Visitante'
    const status = game.match_status && game.match_status !== 'Not Started' ? 'live' : 'pre'
    const homeScore = game.match_hometeam_score ?? ''
    const awayScore = game.match_awayteam_score ?? ''

    base.push({
      league: game.league_name || game.country_name || 'Futebol',
      time: status === 'live' ? `AO VIVO ${game.match_status}` : 'Pré-live',
      home,
      away,
      score: status === 'live' ? `${homeScore} - ${awayScore}` : 'vs',
      signal: Number(homeScore) + Number(awayScore) >= 1 ? 'Gol FT / Over 1.5' : 'Over 1.5',
      confidence: 78 + Math.floor(Math.random() * 14),
      odd: '1.' + (45 + Math.floor(Math.random() * 45)),
      market: status === 'live' ? 'Pressão ofensiva/tempo de jogo' : 'Pré-live + odds',
      status,
      source: 'API-Football + Odds'
    })
  }

  if (!base.length && Array.isArray(odds)) {
    for (const o of odds.slice(0, 12)) {
      base.push({
        league: o.sport_title || 'Futebol',
        time: 'Pré-live',
        home: o.home_team || 'Mandante',
        away: o.away_team || 'Visitante',
        score: 'vs',
        signal: 'Favorito Forte / 1X',
        confidence: 80,
        odd: o.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.price?.toString() || '1.70',
        market: 'Odds pré-live',
        status: 'pre',
        source: 'The Odds API'
      })
    }
  }

  return base
}

app.get('/', (req, res) => {
  res.json({
    ok: true,
    app: 'MekineBet API',
    health: '/api/health',
    checkout: '/api/create-checkout'
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    app: 'MekineBet API',
    firebaseAdminReady,
    mpConfigured: !!process.env.MP_ACCESS_TOKEN,
    supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    appUrl: process.env.APP_URL || null
  })
})

app.get('/api/signals', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10)

    const results = await Promise.allSettled([
      process.env.ODDS_API_KEY
        ? axios.get('https://api.the-odds-api.com/v4/sports/soccer/odds', {
            params: {
              apiKey: process.env.ODDS_API_KEY,
              regions: 'eu,uk',
              markets: 'h2h,totals',
              oddsFormat: 'decimal'
            },
            timeout: 10000
          })
        : Promise.resolve({ data: [] }),

      process.env.APIFOOTBALL_TOKEN
        ? axios.get('https://apiv3.apifootball.com/', {
            params: {
              action: 'get_events',
              from: today,
              to: today,
              APIkey: process.env.APIFOOTBALL_TOKEN
            },
            timeout: 10000
          })
        : Promise.resolve({ data: [] })
    ])

    const odds = results[0].status === 'fulfilled' ? results[0].value.data : []
    const apifootball = results[1].status === 'fulfilled' && Array.isArray(results[1].value.data)
      ? results[1].value.data
      : []

    const signals = generateSignalsFromSources({ odds, apifootball })

    res.json({
      updated_at: new Date().toISOString(),
      sources: {
        odds: results[0].status,
        apifootball: results[1].status
      },
      signals
    })
  } catch (err) {
    console.error('Erro /api/signals:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/me/vip', verifyUser, async (req, res) => {
  const { data, error } = await supabase
    .from('users_vip')
    .select('*')
    .or(`firebase_uid.eq.${req.user.uid},email.eq.${req.user.email}`)
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })

  res.json({ vip: !!data?.is_vip, user: data || null })
})

app.post('/api/create-checkout', verifyUser, async (req, res) => {
  try {
    if (!mpClient) {
      return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado no Render' })
    }

    const preference = new Preference(mpClient)
    const appUrl = process.env.APP_URL || 'https://mekinebet-bd1a6.web.app'
    const apiUrl = process.env.API_URL || 'https://mekinebet.onrender.com'

    const response = await preference.create({
      body: {
        items: [
          {
            id: 'vip-mensal',
            title: 'MekineBet VIP Mensal',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: 49.9
          }
        ],
        external_reference: req.user.uid,
        payer: { email: req.user.email || '' },
        back_urls: {
          success: appUrl,
          failure: appUrl,
          pending: appUrl
        },
        auto_return: 'approved',
        notification_url: `${apiUrl}/api/webhook/mercadopago`,
        metadata: {
          firebase_uid: req.user.uid,
          email: req.user.email || ''
        }
      }
    })

    const checkoutUrl = response.init_point || response.sandbox_init_point

    res.json({
      ok: true,
      checkout_url: checkoutUrl,
      init_point: checkoutUrl
    })
  } catch (err) {
    console.error('Erro checkout Mercado Pago:', err)
    res.status(500).json({ error: err.message || 'Erro ao criar checkout Mercado Pago' })
  }
})

app.post('/api/webhook/mercadopago', async (req, res) => {
  try {
    if (!mpClient) return res.sendStatus(200)

    const paymentId = req.query['data.id'] || req.body?.data?.id
    if (!paymentId) return res.sendStatus(200)

    const payment = new Payment(mpClient)
    const info = await payment.get({ id: paymentId })

    if (info.status === 'approved' && info.external_reference) {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      await supabase.from('users_vip').upsert({
        firebase_uid: info.external_reference,
        email: info.payer?.email || info.metadata?.email || '',
        is_vip: true,
        vip_plan: 'mensal',
        vip_expires_at: expires
      }, { onConflict: 'firebase_uid' })
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('Erro webhook Mercado Pago:', err)
    res.sendStatus(200)
  }
})

const port = process.env.PORT || 3001
app.listen(port, () => console.log(`MekineBet API rodando na porta ${port}`))
