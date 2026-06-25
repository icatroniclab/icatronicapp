import Link from 'next/link'

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0c1728' }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative w-full max-w-sm px-4">
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

        <div
          className="relative rounded-[2px] p-8 flex flex-col items-center gap-6"
          style={{
            background: '#192638',
            border: '1px solid rgba(0,229,255,0.2)',
            boxShadow: '0 0 40px rgba(0,229,255,0.06)',
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[2px]"
            style={{ background: '#00e5ff', boxShadow: '0 0 14px rgba(0,229,255,0.7)' }}
          />

          <p className="text-[#7a9aaa] text-sm text-center">
            Sistema de gestión para taller de electrónica automotriz
          </p>

          <Link
            href="/trabajos"
            className="w-full py-3 text-center font-bold uppercase tracking-[0.15em] rounded-[2px] transition-all duration-200"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              background: '#00e5ff',
              color: '#111c2e',
              display: 'block',
            }}
          >
            Ingresar
          </Link>
        </div>
      </div>
    </div>
  )
}
