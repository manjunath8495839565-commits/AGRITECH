import React, { useEffect, useState, useRef } from 'react'
import { api } from '../lib/api'
import { useToastStore } from '../stores'

// ── Mini stat card ──────────────────────────────────────────────
function StatCard({ label, value, unit, sub, color = 'var(--accent-green)', icon }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div className="stat-block">
          <span className="stat-label">{label}</span>
          <span className="stat-value" style={{ color }}>
            {value !== null && value !== undefined ? value : <span className="skeleton" style={{ width: 80, height: 32, display: 'block' }} />}
            {value !== null && value !== undefined && unit && <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginLeft: 4 }}>{unit}</span>}
          </span>
          {sub && <span className="stat-sub">{sub}</span>}
        </div>
        {icon && <div style={{ fontSize: '1.6rem' }}>{icon}</div>}
      </div>
    </div>
  )
}

// ── Weather Code to emoji ───────────────────────────────────────
function weatherEmoji(code) {
  if (code === 0) return '☀️'
  if (code <= 3) return '🌤️'
  if (code <= 49) return '🌫️'
  if (code <= 69) return '🌧️'
  if (code <= 79) return '❄️'
  if (code <= 99) return '⛈️'
  return '🌡️'
}

// ── Forecast Bar Chart ─────────────────────────────────────────
function ForecastChart({ days }) {
  if (!days?.length) return <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
  const max = Math.max(...days.map(d => d.temperature_max))
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 120 }}>
      {days.map((d, i) => {
        const pct = (d.temperature_max / max) * 80
        const label = new Date(d.date).toLocaleDateString('en', { weekday: 'short' })
        const hasRain = d.precipitation_sum > 0
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{d.temperature_max.toFixed(0)}°</span>
            <div style={{
              width: '100%', height: `${pct}px`, minHeight: 8,
              background: hasRain
                ? 'linear-gradient(to top, var(--accent-blue), rgba(59,130,246,0.4))'
                : 'linear-gradient(to top, var(--accent-green), rgba(34,197,94,0.3))',
              borderRadius: '4px 4px 2px 2px', transition: 'height 0.5s ease',
              position: 'relative',
            }}>
              {hasRain && <span style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem' }}>💧</span>}
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Global Activity Feed ───────────────────────────────────────
const SAMPLE_ACTIVITY = [
  { time: '2m ago', msg: '🌾 Farm KEN-042 diagnosed: leaf rust detected', type: 'alert' },
  { time: '5m ago', msg: '📦 Interop packet A→B: price update relay', type: 'info' },
  { time: '12m ago', msg: '🌧️ Flood alert issued for Tana River zone', type: 'warning' },
  { time: '18m ago', msg: '✅ AgriN advisory answered for Farm IND-017', type: 'success' },
  { time: '24m ago', msg: '🛰️ Sentinel-2 pass: NDVI +0.12 in Punjab zone', type: 'info' },
  { time: '31m ago', msg: '💱 USD/INR updated: 83.94', type: 'info' },
]

function ActivityFeed() {
  const colors = { alert: 'var(--accent-red)', info: 'var(--accent-blue)', warning: 'var(--accent-amber)', success: 'var(--accent-green)' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {SAMPLE_ACTIVITY.map((a, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: i < SAMPLE_ACTIVITY.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[a.type], flexShrink: 0, marginTop: 5, boxShadow: `0 0 6px ${colors[a.type]}` }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', margin: 0 }}>{a.msg}</p>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.time}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Provider Health Badges ─────────────────────────────────────
function ProviderHealth({ providers }) {
  if (!providers) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {Object.entries(providers).map(([name, status]) => (
        <span key={name} className={`badge badge-${status === 'live' ? 'green' : status === 'config_required' ? 'amber' : 'red'}`}>
          <span className={`dot dot-${status === 'live' ? 'green' : status === 'config_required' ? 'amber' : 'red'}`} style={{ width: 5, height: 5 }} />
          {name.replace(/_/g, ' ')}
        </span>
      ))}
    </div>
  )
}

// ── Globe visualization (CSS-based, no WebGL needed for now) ───
function GlobeMini() {
  const [angle, setAngle] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setAngle(a => (a + 0.3) % 360), 50)
    return () => clearInterval(id)
  }, [])

  const zones = [
    { lat: 12.97, lon: 77.59, label: 'India', color: 'var(--accent-green)' },
    { lat: -1.29, lon: 36.82, label: 'Kenya', color: 'var(--accent-amber)' },
    { lat: 6.52, lon: 3.38, label: 'Nigeria', color: 'var(--accent-blue)' },
    { lat: 14.69, lon: -17.44, label: 'Senegal', color: 'var(--accent-purple)' },
    { lat: 23.69, lon: 90.35, label: 'Bangladesh', color: 'var(--accent-cyan)' },
  ]

  // Simple 2D projection
  const project = (lat, lon, r) => {
    const φ = (lat * Math.PI) / 180
    const λ = ((lon + angle) * Math.PI) / 180
    const x = r * Math.cos(φ) * Math.sin(λ)
    const y = -r * Math.sin(φ)
    const z = r * Math.cos(φ) * Math.cos(λ)
    const visible = z > -20
    return { x: x + r, y: y + r, visible, scale: (z + r) / (2 * r) }
  }

  const R = 130
  return (
    <div style={{ position: 'relative', width: R * 2, height: R * 2, margin: '0 auto' }}>
      {/* Globe sphere */}
      <div style={{
        width: R * 2, height: R * 2, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, rgba(34,197,94,0.15) 0%, rgba(6,182,212,0.08) 40%, rgba(59,130,246,0.05) 70%, rgba(0,0,0,0.4) 100%)',
        border: '1px solid rgba(34,197,94,0.2)',
        boxShadow: '0 0 60px rgba(34,197,94,0.1), inset 0 0 40px rgba(0,0,0,0.5)',
        position: 'absolute',
      }} />
      {/* Latitude lines */}
      {[-45, 0, 45].map(lat => {
        const φ = (lat * Math.PI) / 180
        const cy = R - R * Math.sin(φ)
        const rx = R * Math.cos(φ)
        const ry = rx * 0.3
        return <ellipse key={lat} cx={R} cy={cy} rx={rx} ry={ry} stroke="rgba(34,197,94,0.08)" strokeWidth="1" fill="none"
          style={{ position: 'absolute', width: '100%', height: '100%' }} />
      })}
      {/* Zone dots */}
      <svg width={R * 2} height={R * 2} style={{ position: 'absolute', top: 0, left: 0 }}>
        {[[-45, 0, 45].map(lat => {
          const φ = (lat * Math.PI) / 180
          const cy = R - R * Math.sin(φ)
          const rx = R * Math.cos(φ)
          return <ellipse key={lat} cx={R} cy={cy} rx={rx} ry={rx * 0.3} stroke="rgba(34,197,94,0.08)" strokeWidth="1" fill="none" />
        })]}
        {zones.map((z, i) => {
          const p = project(z.lat, z.lon, R * 0.85)
          if (!p.visible) return null
          const opacity = 0.4 + p.scale * 0.6
          return (
            <g key={i} opacity={opacity}>
              <circle cx={p.x + R * 0.15} cy={p.y + R * 0.15} r={4 + p.scale * 4} fill={z.color} opacity={0.2} />
              <circle cx={p.x + R * 0.15} cy={p.y + R * 0.15} r={3} fill={z.color} />
              {p.scale > 0.6 && (
                <text x={p.x + R * 0.15 + 6} y={p.y + R * 0.15 + 4} fontSize="9" fill={z.color} fontFamily="Inter">{z.label}</text>
              )}
            </g>
          )
        })}
        {/* Arc connections */}
        {zones.slice(0, -1).map((z, i) => {
          const p1 = project(z.lat, z.lon, R * 0.85)
          const p2 = project(zones[i + 1].lat, zones[i + 1].lon, R * 0.85)
          if (!p1.visible || !p2.visible) return null
          return (
            <path key={i}
              d={`M ${p1.x + R * 0.15} ${p1.y + R * 0.15} Q ${R} ${R * 0.4} ${p2.x + R * 0.15} ${p2.y + R * 0.15}`}
              stroke="rgba(34,197,94,0.3)" strokeWidth="1" fill="none" strokeDasharray="3,3" />
          )
        })}
      </svg>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function Dashboard() {
  const toast = useToastStore()
  const [health, setHealth] = useState(null)
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)

  // Default to Bangalore for demo
  const LAT = 12.97
  const LON = 77.59

  useEffect(() => {
    Promise.all([
      api.health().then(setHealth).catch(() => {}),
      api.weather.current(LAT, LON).then(r => setWeather(r.data)).catch(() => {}),
      api.weather.forecast(LAT, LON, 7).then(r => setForecast(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const w = weather

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>
            🌍 Global Operations
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Live agricultural intelligence • {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge badge-green">
            <span className="dot dot-green dot-pulse" style={{ width: 6, height: 6 }} />
            Node A Live
          </span>
          <span className="badge badge-blue">24 Farms</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Temperature" value={w ? w.temperature_2m?.toFixed(1) : null} unit="°C" sub="Bangalore, India" icon={weatherEmoji(w?.weather_code || 0)} color="var(--accent-amber)" />
        <StatCard label="Humidity" value={w ? w.relative_humidity_2m?.toFixed(0) : null} unit="%" sub="Relative humidity" icon="💧" color="var(--accent-blue)" />
        <StatCard label="Wind Speed" value={w ? w.wind_speed_10m?.toFixed(1) : null} unit="km/h" sub="10m above ground" icon="🌬️" color="var(--accent-cyan)" />
        <StatCard label="Precipitation" value={w ? w.precipitation?.toFixed(1) : null} unit="mm" sub="Current hour" icon="🌧️" color="var(--accent-purple)" />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>
        {/* Globe + forecast */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1rem' }}>🌐 Global Farm Network</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-green">24 active farms</span>
                <span className="badge badge-blue">5 zones</span>
              </div>
            </div>
            <GlobeMini />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              {[['India', 'var(--accent-green)'], ['Kenya', 'var(--accent-amber)'], ['Nigeria', 'var(--accent-blue)'], ['Senegal', 'var(--accent-purple)'], ['Bangladesh', 'var(--accent-cyan)']].map(([l, c]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>📈 7-Day Weather Forecast – Bangalore</h3>
            <ForecastChart days={forecast} />
            <div style={{ marginTop: 12, display: 'flex', gap: 12, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 4, background: 'var(--accent-green)', borderRadius: 2 }} />Dry day</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 4, background: 'var(--accent-blue)', borderRadius: 2 }} />Rain day</span>
              <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>Source: Open-Meteo API</span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Provider health */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: 14 }}>⚡ Provider Status</h3>
            <ProviderHealth providers={health?.providers} />
            {!health && <div className="skeleton" style={{ height: 60, borderRadius: 8 }} />}
            <div className="provenance-bar" style={{ marginTop: 12 }}>
              <span>Node: {health?.node || '—'}</span>
              <span>•</span>
              <span>v{health?.version || '—'}</span>
              <span>•</span>
              <span style={{ color: 'var(--accent-green)' }}>{health?.status || '—'}</span>
            </div>
          </div>

          {/* Activity feed */}
          <div className="card" style={{ padding: 20, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: '0.9rem' }}>📡 Live Activity</h3>
              <span className="badge badge-green">
                <span className="dot dot-green dot-pulse" style={{ width: 5, height: 5 }} />
                Live
              </span>
            </div>
            <ActivityFeed />
          </div>

          {/* Quick actions */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>⚡ Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '🌾 View Farmer App', href: '/farmer' },
                { label: '🌐 Network Monitor', href: '/network' },
                { label: '🛰️ Field 3D Scene', href: '/field' },
                { label: '🤖 Ask AgriN AI', href: '/advisory' },
              ].map(({ label, href }) => (
                <a key={href} href={href} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Source attribution */}
      <div style={{ textAlign: 'center', padding: '16px 0', borderTop: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        Data: Open-Meteo • SoilGrids (ISRIC) • NASA POWER • Element84 STAC • open.er-api.com •
        AgriN Connect v2 – Built for precision agriculture
      </div>
    </div>
  )
}
