import 'dotenv/config'
import express from 'express'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const app = express()

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }

  next()
})

app.use(express.json())

const mpClient = process.env.MP_ACCESS_TOKEN
  ? new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN
    })
  : null

app.get('/', (req, res) => {
  res.json({
    ok: true,
    app: 'MekineBet API Online'
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mpConfigured: !!process.env.MP_ACCESS_TOKEN
  })
})

app.post('/api/create-checkout', async (req, res) => {
  try {
    if (!mpClient) {
      return res.status(500).json({
        error: 'MP_ACCESS_TOKEN não configurado'
      })
    }

    const preference = new Preference(mpClient)

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
        ]
      }
    })

    res.json({
      ok: true,
      checkout_url: response.init_point || response.sandbox_init_point
    })
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

const port = process.env.PORT || 3001

app.listen(port, () => {
  console.log(`MekineBet API online na porta ${port}`)
})
