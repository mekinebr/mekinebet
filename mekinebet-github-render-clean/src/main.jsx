import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Activity, Crown, Database, Lock, Radio, Search, ShieldCheck, TrendingUp, Zap } from 'lucide-react'
import { auth, googleProvider } from './lib/firebase'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { createCheckout, getHealth, getSignals, getVipStatus } from './lib/api'
import { supabase } from './lib/supabase'
import './style.css'

function LoginBox({ user, vip }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, email, password)
      else await createUserWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError(err?.message || 'Verifique email/senha ou ative Email/Password no Firebase Auth.')
    }
  }

  if (user) {
    return (
      <div className="userbox">
        <b>{user.email}</b>
        <span className={vip ? 'vipBadge on' : 'vipBadge'}>{vip ? 'VIP ativo' : 'Free'}</span>
        <button className="btn ghost" onClick={() => signOut(auth)}>Sair</button>
      </div>
    )
  }

  return (
    <form className="login" onSubmit={submit}>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email" type="email" />
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="senha" type="password" />
      <button className="btn" type="submit">{mode === 'login' ? 'Entrar' : 'Cadastrar'}</button>
      <button className="btn ghost" type="button" onClick={() => signInWithPopup(auth, googleProvider)}>Entrar com Google</button>
      <button className="link" type="button" onClick={() => setMode(mode === 'login' ? 'cadastro' : 'login')}>{mode === 'login' ? 'Criar conta' : 'Já tenho conta'}</button>
      {error && <small className="error">{error}</small>}
    </form>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [vip, setVip] = useState(false)
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('Todos')
  const [apiStatus, setApiStatus] = useState('Verificando...')
  const [message, setMessage] = useState('')

  useEffect(() => onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser)
    setVip(false)
    if (currentUser) {
      try {
        const data = await getVipStatus()
        setVip(!!data.vip)
      } catch (err) {
        console.warn('VIP status via backend:', err.message)

        // Fallback direto no Supabase: útil quando o Firebase Admin ainda não está configurado no Render.
        try {
          const { data, error } = await supabase
            .from('users_vip')
            .select('*')
            .or(`firebase_uid.eq.${currentUser.uid},email.eq.${currentUser.email}`)
            .maybeSingle()

          if (error) throw error
          setVip(!!data?.is_vip)
        } catch (supabaseErr) {
          console.warn('VIP status via Supabase:', supabaseErr.message)
        }
      }
    }
  }), [])

  async function loadSignals() {
    setLoading(true)
    setMessage('')
    try {
      await getHealth()
      setApiStatus('Online')
      const data = await getSignals()
      setSignals(Array.isArray(data.signals) ? data.signals : [])
      if (!data.signals?.length) setMessage('Nenhum sinal real retornado agora. Verifique se as APIs de futebol possuem jogos disponíveis no momento.')
    } catch (err) {
      setApiStatus('Offline')
      setSignals([])
      setMessage(`Backend/API indisponível: ${err.message}`)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSignals()
    const timer = setInterval(loadSignals, 30000)
    return () => clearInterval(timer)
  }, [])

  async function vipCheckout() {
    console.log('[MekineBet] Clique no botão VIP detectado')

    if (!auth.currentUser) {
      alert('Faça login ou crie uma conta antes de assinar o VIP.')
      return
    }

    try {
      const data = await createCheckout('mensal')
      const checkoutUrl = data.init_point || data.sandbox_init_point || data.checkout_url

      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        console.error('Resposta do checkout sem link:', data)
        alert('Checkout criado, mas o Mercado Pago não retornou o link de pagamento.')
      }
    } catch (err) {
      console.error('Erro ao abrir VIP:', err)
      alert(`Erro ao abrir VIP: ${err.message}`)
    }
  }

  const filtered = useMemo(() => signals.filter(s => {
    if (filter === 'Todos') return true
    if (filter === 'Ao vivo') return s.status === 'live'
    if (filter === 'Pré-live') return s.status === 'pre'
    return `${s.signal} ${s.market}`.toLowerCase().includes(filter.toLowerCase())
  }), [signals, filter])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><div className="logo"><Zap size={25}/></div><div><h1>MekineBet</h1><p>AI Sports Signals</p></div></div>
        <nav><span>Previsões</span><span>Ao vivo</span><span>Pré-live</span><span>VIP</span></nav>
        <button className="btn" onClick={vipCheckout}><Lock size={15}/> {vip ? 'VIP ativo' : 'Entrar VIP'}</button>
      </header>

      <main>
        <section className="hero">
          <div>
            <span className="pill">APIs conectadas em tempo real</span>
            <h2>Previsões inteligentes para futebol</h2>
            <p>Odds, SportMonks e API-Football trabalhando juntas para sinais ao vivo, pré-live, favoritos fortes, zebra, gols HT/FT e cantos.</p>
          </div>
          <LoginBox user={user} vip={vip} />
        </section>

        <section className="stats">
          <Card icon={<Radio/>} label="Jogos ao vivo" value={signals.filter(s => s.status === 'live').length} />
          <Card icon={<Activity/>} label="Sinais ativos" value={signals.length} />
          <Card icon={<ShieldCheck/>} label="Backend" value={apiStatus} />
          <Card icon={<Crown/>} label="Status VIP" value={vip ? 'Ativo' : 'Free'} />
        </section>

        <section className="sources">
          {['The Odds API', 'SportMonks', 'API-Football'].map((s) => <div className="source" key={s}><Database/><div><b>{s}</b><small>{apiStatus}</small></div></div>)}
        </section>

        <section className="filters">
          <div className="search"><Search size={18}/> Buscar time, liga ou mercado...</div>
          {['Todos','Ao vivo','Pré-live','Over 1.5','Over 2.5','BTTS','Cantos','Zebra','Favorito'].map(f => <button className={filter===f?'active':''} onClick={() => setFilter(f)} key={f}>{f}</button>)}
        </section>

        {loading && <p className="muted">Atualizando sinais reais...</p>}
        {message && <p className="notice">{message}</p>}
        <section className="signals">
          {filtered.map((game, index) => <Signal game={game} vip={vip} key={`${game.home}-${game.away}-${index}`} />)}
        </section>
      </main>
    </div>
  )
}

function Card({ icon, label, value }) {
  return <div className="card"><div className="cardIcon">{icon}</div><p>{label}</p><strong>{value}</strong></div>
}

function Signal({ game, vip }) {
  return <article className="signal"><div className="match"><div className="meta"><span className={game.status === 'live' ? 'live' : 'pre'}>{game.time}</span><small>{game.league}</small><em>{game.source || 'APIs reais'}</em>{!vip && <em>Prévia free</em>}</div><div className="teams"><h3>{game.home}</h3><div>{game.score}</div><h3>{game.away}</h3></div></div><div className="ai"><div className="aiHead"><div><small>Sinal IA MekineBet</small><h4>{vip ? game.signal : '🔒 Sinal VIP bloqueado'}</h4></div><TrendingUp/></div><div className="metrics"><span><small>Conf.</small><b>{vip ? `${game.confidence}%` : '--'}</b></span><span><small>Odd</small><b>{vip ? game.odd : '--'}</b></span><span><small>Mercado</small><b>{vip ? game.market : 'Assine VIP'}</b></span></div><div className="bookies"><button className="betano">Betano</button><button className="bet365">Bet365</button><button className="novibet">Novibet</button></div></div></article>
}

createRoot(document.getElementById('root')).render(<App />)
