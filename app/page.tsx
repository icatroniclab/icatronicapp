import Link from 'next/link'
import {
  Wrench, Cpu, Key, ScanLine, CalendarDays, BarChart3,
  Shield, Bot, BellRing, TrendingUp, Users, Zap,
  CheckCircle, ArrowRight, ChevronRight,
} from 'lucide-react'

// ─── Datos ────────────────────────────────────────────────────────────────────

const SERVICES = [
  { icon: ScanLine,    title: 'Diagnóstico electrónico', desc: 'Escaneo OBD completo con registro de códigos DTC y exportación de logs CSV para cada trabajo.' },
  { icon: Cpu,         title: 'Reparación de módulos',   desc: 'Seguimiento de ECU, BCM y airbags: inspección física, mediciones de pines y resultado final documentado.' },
  { icon: Key,         title: 'Programación de llaves',  desc: 'Copias, carcasas y comandos registrados como trabajos rápidos con cobro al instante.' },
  { icon: Wrench,      title: 'Órdenes de trabajo',      desc: 'Historial completo por vehículo con presupuesto itemizado, fotos adjuntas e informes PDF.' },
  { icon: CalendarDays,title: 'Agenda de turnos',        desc: 'Notificaciones push automáticas 15 minutos antes de cada turno, sin importar si la pestaña está abierta.' },
  { icon: BarChart3,   title: 'Análisis financiero',     desc: 'Ingresos, gastos y rendimiento mensual en gráficos claros. Conocé los números reales de tu taller.' },
]

const STEPS = [
  { n: '01', title: 'Ingresá el trabajo',        desc: 'En segundos cargás una orden de vehículo, un trabajo de módulo o un servicio rápido como una copia de llave.' },
  { n: '02', title: 'Diagnosticá y presupuestá', desc: 'Registrá fallas, adjuntá logs del scanner, cargá códigos DTC y generá el presupuesto con ítems detallados.' },
  { n: '03', title: 'Seguí el progreso',          desc: 'Actualizá el estado en tiempo real mientras avanzás. El sistema lleva el registro de cada cambio.' },
  { n: '04', title: 'Cobrá y analizá',            desc: 'Cerrá el trabajo, registrá el pago parcial o total, y revisá cómo le fue al taller en el panel de análisis.' },
]

const FEATURES = [
  { icon: Shield,     title: 'Sistema todo en uno',       desc: 'Vehículos, módulos, trabajos rápidos, finanzas, stock y turnos — un solo lugar, sin saltar entre apps.' },
  { icon: Bot,        title: 'Asistente IA integrado',    desc: 'Consultá al asistente de inteligencia artificial para diagnósticos difíciles y soluciones técnicas.' },
  { icon: BellRing,   title: 'Notificaciones push',       desc: 'Alertas de turnos próximos directamente en el navegador, incluso con la pestaña cerrada.' },
  { icon: TrendingUp, title: 'Analytics en tiempo real',  desc: 'Marcas frecuentes, DTC recurrentes, ticket promedio y rendimiento por período.' },
  { icon: Users,      title: 'Acceso multi-usuario',      desc: 'Todo el equipo trabaja en simultáneo con acceso seguro desde cualquier dispositivo.' },
  { icon: Zap,        title: 'Rápido y sin fricciones',   desc: 'Interfaz construida para el ritmo de un taller. Cargás un trabajo en menos de 30 segundos.' },
]

// ─── Página ───────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen antialiased overflow-x-hidden" style={{ fontFamily: 'Exo 2, sans-serif' }}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/8"
        style={{ background: 'rgba(10,10,15,0.88)', backdropFilter: 'blur(14px)' }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/logo-full.svg" alt="ICATRONIC" className="h-7 w-auto" />
          <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-300 font-medium">
            <a href="#servicios"      className="hover:text-white transition-colors">Servicios</a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a>
            <a href="#ventajas"      className="hover:text-white transition-colors">Ventajas</a>
          </nav>
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-5 py-2 rounded-[3px] text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:shadow-[0_0_22px_rgba(0,229,255,0.45)]"
            style={{ fontFamily: 'Rajdhani, sans-serif', background: '#00e5ff', color: '#111c2e' }}
          >
            Ingresar
          </Link>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          SECCIÓN 1 — HERO
          Fondo: negro (#111c2e) con trama circuit
          Texto principal: blanco / slate-200
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-16" style={{ background: '#111c2e' }}>
        {/* Trama circuit */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,229,255,0.045) 1px,transparent 1px),' +
              'linear-gradient(90deg,rgba(0,229,255,0.045) 1px,transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />
        {/* Glow radial */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 40%, rgba(0,229,255,0.09) 0%, transparent 70%)' }}
        />

        <div className="relative max-w-4xl mx-auto px-6 py-28 text-center">
          {/* Chips de confianza */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {['Electrónica automotriz', 'Sistema todo en uno', 'IA integrada'].map(c => (
              <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-200 border border-white/12 bg-white/6">
                <CheckCircle size={10} className="text-cyan-400 shrink-0" />
                {c}
              </span>
            ))}
          </div>

          {/* H1 — máximo contraste */}
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-5 leading-[1.04]"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            <span style={{ color: '#00e5ff', textShadow: '0 0 55px rgba(0,229,255,0.35)' }}>ICATRONIC</span>
            <span className="text-white"> APP</span>
            <br />
            <span className="text-white text-3xl sm:text-4xl lg:text-[2.6rem] font-bold">
              Tu taller, bajo control total
            </span>
          </h1>

          {/* Párrafo hero — slate-200 para contraste AAA sobre negro */}
          <p className="max-w-2xl mx-auto text-slate-200 text-lg sm:text-xl leading-relaxed mb-10">
            Gestión integral diseñada para talleres de electrónica automotriz. Órdenes, módulos,
            llaves, finanzas y análisis — todo en un solo lugar, sin papeles ni planillas.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 px-8 py-3.5 rounded-[3px] font-bold text-sm uppercase tracking-widest transition-all duration-200 hover:shadow-[0_0_32px_rgba(0,229,255,0.5)]"
              style={{ fontFamily: 'Rajdhani, sans-serif', background: '#00e5ff', color: '#111c2e' }}
            >
              Empezar ahora <ArrowRight size={15} />
            </Link>
            <a
              href="#como-funciona"
              className="flex items-center gap-2 px-8 py-3.5 rounded-[3px] font-semibold text-sm text-slate-200 border border-white/18 hover:border-cyan-400/60 hover:text-white transition-all duration-200"
            >
              Ver cómo funciona
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECCIÓN 2 — SERVICIOS
          Fondo: gris oscuro (#111827 = gray-900)
          Variación visible respecto al hero negro
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="servicios" className="py-24" style={{ background: '#111827' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 mb-3">Funcionalidades</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Todo lo que necesita tu taller
            </h2>
            {/* Subtítulo sección — slate-300 (contraste ≥ 7:1 sobre #111827) */}
            <p className="text-slate-300 text-base max-w-xl mx-auto leading-relaxed">
              Cada módulo fue pensado para el ritmo real de un taller. Nada sobra, nada falta.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-[4px] p-6 border border-white/8 bg-white/4 hover:border-cyan-400/35 hover:bg-white/6 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-[3px] flex items-center justify-center mb-4 shrink-0" style={{ background: 'rgba(0,229,255,0.12)' }}>
                  <Icon size={19} style={{ color: '#00e5ff' }} />
                </div>
                {/* Título tarjeta — blanco */}
                <h3 className="font-bold text-white mb-2 text-[0.95rem]" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em' }}>
                  {title}
                </h3>
                {/* Descripción — slate-300 */}
                <p className="text-slate-300 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECCIÓN 3 — CÓMO FUNCIONA (PASOS)
          Fondo: celeste oscuro (#04111e)
          Tarjetas de paso: bg distinto (#0c2236), zoom al hover
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="como-funciona" className="py-24" style={{ background: '#04111e' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 mb-3">Proceso</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Cómo funciona
            </h2>
            {/* Subtítulo — slate-200 sobre azul oscuro */}
            <p className="text-slate-200 text-base max-w-xl mx-auto leading-relaxed">
              Del ingreso del vehículo al cobro final, cada paso queda registrado y es rastreable.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(({ n, title, desc }) => (
              <div
                key={n}
                /* Fondo de tarjeta claramente distinto al fondo de sección (#04111e → #0c2236)
                   Hover: zoom suave + borde cyan + sombra cyan — 300 ms ease-out */
                className="relative rounded-[4px] p-6 border border-cyan-900/50 cursor-default select-none
                           transition-all duration-300 ease-out
                           hover:scale-[1.05] hover:border-cyan-400/80
                           hover:shadow-[0_6px_32px_rgba(0,229,255,0.22)]"
                style={{ background: '#0c2236' }}
              >
                {/* Número decorativo — cyan visible pero decorativo */}
                <span
                  className="block text-6xl font-black leading-none mb-4 text-cyan-400/60"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  {n}
                </span>
                {/* Título paso — blanco */}
                <h3 className="font-bold text-white mb-2 text-[0.95rem]" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em' }}>
                  {title}
                </h3>
                {/* Descripción paso — slate-200 (alta legibilidad sobre azul oscuro) */}
                <p className="text-slate-200 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECCIÓN 4 — POR QUÉ ELEGIRNOS
          Fondo: blanco/claro (slate-50) — contraste máximo, sección "luz"
          Texto: oscuro para cumplir WCAG AAA sobre fondo claro
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="ventajas" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 mb-3">Ventajas</span>
            {/* H2 sobre fondo claro — slate-900 */}
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Por qué elegirnos
            </h2>
            {/* Párrafo — slate-700 (contraste ≥ 5:1 sobre blanco) */}
            <p className="text-slate-700 text-base max-w-xl mx-auto leading-relaxed">
              Construido específicamente para talleres de electrónica automotriz, no un sistema genérico adaptado a medias.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 p-5 rounded-[4px] border border-slate-200 bg-white hover:border-cyan-300 hover:shadow-md transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-[3px] flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(0,180,210,0.1)' }}>
                  <Icon size={18} style={{ color: '#0098b5' }} />
                </div>
                <div>
                  {/* Título feature — slate-900 */}
                  <h3 className="font-bold text-slate-900 mb-1 text-sm" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em' }}>
                    {title}
                  </h3>
                  {/* Descripción — slate-700 */}
                  <p className="text-slate-700 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECCIÓN 5 — CTA
          Fondo: negro (#111c2e) — cierra el ciclo, contrasta con el blanco anterior
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: '#111c2e' }}>
        {/* Glow de fondo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,229,255,0.07) 0%, transparent 70%)' }}
        />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2
            className="text-3xl sm:text-5xl font-extrabold text-white mb-5"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            Tomá el control de{' '}
            <span style={{ color: '#00e5ff', textShadow: '0 0 40px rgba(0,229,255,0.4)' }}>tu taller</span>
            {' '}hoy
          </h2>
          {/* Párrafo CTA — slate-200 */}
          <p className="text-slate-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Empezá a gestionar órdenes, módulos, finanzas y turnos desde un solo sistema construido para vos.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-[3px] font-bold text-sm uppercase tracking-widest transition-all duration-200 hover:shadow-[0_0_44px_rgba(0,229,255,0.5)]"
            style={{ fontFamily: 'Rajdhani, sans-serif', background: '#00e5ff', color: '#111c2e' }}
          >
            Ingresar al sistema <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#060608', borderTop: '1px solid rgba(255,255,255,0.06)' }} className="py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src="/logo-full.svg" alt="ICATRONIC" className="h-6 w-auto opacity-55" />
          {/* Texto footer — slate-400 (suficiente contraste sobre negro profundo) */}
          <p className="text-slate-400 text-xs text-center sm:text-right">
            © {new Date().getFullYear()} ICATRONIC — Sistema de gestión para electrónica automotriz
          </p>
        </div>
      </footer>

    </div>
  )
}
