'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    // Auth bypass: ir directo al dashboard
    window.location.href = '/trabajos'
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-deep)' }}
    >
      {/* animated grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          animation: 'gridShift 20s linear infinite',
        }}
      />

      <div className="relative w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-bold tracking-[0.2em] uppercase mb-2"
            style={{ fontFamily: 'Rajdhani, sans-serif', textShadow: '0 0 30px rgba(0,229,255,0.4)' }}
          >
            <span style={{ color: '#00e5ff' }}>ICATRONIC</span>
            <span style={{ color: '#e8f0f4' }}>APP</span>
          </h1>
          <p className="text-[0.7rem] tracking-[0.25em] uppercase" style={{ color: '#7a9aaa' }}>
            Electrónica Automotriz
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="relative rounded-[2px] p-8 space-y-5"
          style={{
            background: '#192638',
            border: '1px solid rgba(0,229,255,0.2)',
            boxShadow: '0 0 40px rgba(0,229,255,0.06)',
          }}
        >
          {/* top accent */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[2px]"
            style={{ background: '#00e5ff', boxShadow: '0 0 14px rgba(0,229,255,0.7)' }}
          />

          <div>
            <label
              className="block text-[0.7rem] font-semibold uppercase tracking-[0.2em] mb-2"
              style={{ color: '#7a9aaa' }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="usuario@taller.com"
              className="w-full rounded-[2px] px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none"
              style={{
                background: 'rgba(0,229,255,0.03)',
                border: '1px solid rgba(0,229,255,0.14)',
                color: '#e8f0f4',
              }}
              onFocus={e => { e.target.style.borderColor = '#00b8cc'; e.target.style.boxShadow = '0 0 0 3px rgba(0,229,255,0.12)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(0,229,255,0.14)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div>
            <label
              className="block text-[0.7rem] font-semibold uppercase tracking-[0.2em] mb-2"
              style={{ color: '#7a9aaa' }}
            >
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-[2px] px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none"
              style={{
                background: 'rgba(0,229,255,0.03)',
                border: '1px solid rgba(0,229,255,0.14)',
                color: '#e8f0f4',
              }}
              onFocus={e => { e.target.style.borderColor = '#00b8cc'; e.target.style.boxShadow = '0 0 0 3px rgba(0,229,255,0.12)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(0,229,255,0.14)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {error && (
            <p
              className="text-sm text-center rounded-[2px] py-2 px-3"
              style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-bold uppercase tracking-[0.15em] rounded-[2px] transition-all duration-200 disabled:opacity-40"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              background: '#00e5ff',
              color: '#111c2e',
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes gridShift {
          0% { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
      `}</style>
    </div>
  )
}
