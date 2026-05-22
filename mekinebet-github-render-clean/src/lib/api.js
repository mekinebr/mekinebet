import { auth } from './firebase'

const API_BASE = import.meta.env.VITE_API_URL || 'https://mekinebet.onrender.com'

async function authHeaders() {
  const user = auth.currentUser
  const headers = { 'Content-Type': 'application/json' }

  if (user) {
    try {
      headers.Authorization = `Bearer ${await user.getIdToken(true)}`
    } catch (err) {
      console.warn('Não foi possível gerar token Firebase:', err)
    }

    headers['X-User-Uid'] = user.uid
    headers['X-User-Email'] = user.email || ''
  }

  return headers
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  console.log('[MekineBet API]', options.method || 'GET', url)

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(await authHeaders()),
      ...(options.headers || {})
    }
  })

  const text = await res.text()
  let data = {}
  try { data = text ? JSON.parse(text) : {} } catch { data = { error: text } }

  if (!res.ok) {
    throw new Error(data.error || `Erro ${res.status} ao chamar ${path}`)
  }

  return data
}

export async function getHealth() {
  return request('/api/health')
}

export async function getSignals() {
  return request('/api/signals')
}

export async function getVipStatus() {
  return request('/api/me/vip')
}

export async function createCheckout(plan = 'mensal') {
  const user = auth.currentUser

  return request('/api/create-checkout', {
    method: 'POST',
    body: JSON.stringify({
      plan,
      uid: user?.uid || '',
      email: user?.email || ''
    })
  })
}
