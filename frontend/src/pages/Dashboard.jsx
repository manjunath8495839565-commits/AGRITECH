import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useToastStore } from '../stores'
import { Icon } from '../components/ui/Icons'

// ── Mini stat card ──────────────────────────────────────────────
function StatCard({ label, value, unit, sub, iconName }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div className="stat-block">
          <span className="stat-label">{label}</span>
          <div className="stat-value">
            {value !== null && value !== undefined ? (
              <>
                {value}
                {unit && <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>{unit}</span>}
              </>
            ) : (
              <span className="skeleton" style={{ width: 80, height: 30, display: 'block' }} />
            )}
          </div>
          {sub && <span className="stat-sub">{sub}</span>}
        </div>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <Icon name={iconName} size={18} />
        </div>
      </div>
    </div>
  )
}

// ── Forecast Bar Chart ─────────────────────────────────────────
function ForecastChart({ days }) {
  if (!days?.length) return <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-sm)' }} />
  const max = Math.max(...days.map(d => d.temperature_max))
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
      {days.map((d, i) => {
        const pct = Math.max(15, Math.round((d.temperature_max / (max || 1)) * 80))
        const label = new Date(d.date).toLocaleDateString('en', { weekday: 'short' })
        const hasRain = d.precipitation_sum > 0
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {d.temperature_max.toFixed(0)}°
            </span>
            <div
              style={{
                width: '100%',
                maxWidth: 24,
                height: `${pct}px`,
                background: hasRain ? 'var(--text-primary)' : 'var(--accent-green)',
                borderRadius: '3px 3px 1px 1px',
                transition: 'height 0.3s ease',
                position: 'relative',
              }}
            >
              {hasRain && (
                <div
                  style={{
                    position: 'absolute',
                    top: -16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <Icon name="droplet" size={11} color="var(--accent-blue)" />
                </div>
              )}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Global Activity Feed ───────────────────────────────────────
const SAMPLE_ACTIVITY = [
  { time: '2m ago', msg: 'Farm KEN-042 diagnosed: leaf rust detected', type: 'alert', icon: 'alert' },
  { time: '5m ago', msg: 'Interop packet A→B: price update relay verified', type: 'info', icon: 'network' },
  { time: '12m ago', msg: 'Heavy precipitation advisory issued for Tana River zone', type: 'warning', icon: 'rain' },
  { time: '18m ago', msg: 'AgriN agronomic advisory answered for Farm IND-017', type: 'success', icon: 'check' },
  { time: '24m ago', msg: 'Sentinel-2 pass: NDVI +0.12 calibrated in Punjab zone', type: 'info', icon: 'satellite' },
  { time: '31m ago', msg: 'USD/INR benchmark exchange rate updated: 83.94', type: 'info', icon: 'price' },
]

function ActivityFeed() {
  const badgeMap = {
    alert: 'badge-red',
    info: 'badge-blue',
    warning: 'badge-amber',
    success: 'badge-green',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {SAMPLE_ACTIVITY.map((a, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            padding: '11px 0',
            borderBottom: i < SAMPLE_ACTIVITY.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            <Icon name={a.icon} size={13} color="var(--text-secondary)" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
              {a.msg}
            </p>
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
        <span
          key={name}
          className={`badge badge-${status === 'live' ? 'green' : status === 'config_required' ? 'amber' : 'red'}`}
        >
          <span className={`dot dot-${status === 'live' ? 'green' : status === 'config_required' ? 'amber' : 'red'}`} />
          {name.replace(/_/g, ' ')}
        </span>
      ))}
    </div>
  )
}

// ── Globe visualization ───────────────────────────────────────
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
    const phi = (lat * Math.PI) / 180
    const lambda = ((lon + angle) * Math.PI) / 180
    const x = r * Math.cos(phi) * Math.sin(lambda)
    const y = -r * Math.sin(phi)
    const z = r * Math.cos(phi) * Math.cos(lambda)
    const visible = z > -20
    return { x: x + r, y: y + r, visible, scale: (z + r) / (2 * r) }
  }

  const R = 115
  return (
    <div style={{ position: 'relative', width: R * 2, height: R * 2, maxWidth: '100%', margin: '0 auto' }}>
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
        const phi = (lat * Math.PI) / 180
        const cy = R - R * Math.sin(phi)
        const rx = R * Math.cos(phi)
        const ry = rx * 0.3
        return <ellipse key={lat} cx={R} cy={cy} rx={rx} ry={ry} stroke="rgba(34,197,94,0.08)" strokeWidth="1" fill="none"
          style={{ position: 'absolute', width: '100%', height: '100%' }} />
      })}
      {/* Zone dots */}
      <svg width={R * 2} height={R * 2} style={{ position: 'absolute', top: 0, left: 0 }}>
        {[[-45, 0, 45].map(lat => {
          const phi = (lat * Math.PI) / 180
          const cy = R - R * Math.sin(phi)
          const rx = R * Math.cos(phi)
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
  const [health, setHealth] = useState(null)
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Global Operations</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
            Real-time agricultural intelligence • {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge badge-green">
            <span className="dot dot-green dot-pulse" />
            Node Alpha Active
          </span>
          <span className="badge">24 Connected Farms</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          label="Temperature"
          value={w ? w.temperature_2m?.toFixed(1) : null}
          unit="°C"
          sub="Bangalore centroid"
          iconName="thermometer"
        />
        <StatCard
          label="Relative Humidity"
          value={w ? w.relative_humidity_2m?.toFixed(0) : null}
          unit="%"
          sub="Vapor saturation"
          iconName="droplet"
        />
        <StatCard
          label="Wind Velocity"
          value={w ? w.wind_speed_10m?.toFixed(1) : null}
          unit="km/h"
          sub="10m surface elevation"
          iconName="wind"
        />
        <StatCard
          label="Precipitation"
          value={w ? w.precipitation?.toFixed(1) : null}
          unit="mm"
          sub="Measured hour"
          iconName="rain"
        />
      </div>

      {/* Main grid */}
      <div className="dashboard-main-grid" style={{ marginBottom: 24 }}>
        {/* Globe + forecast */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="globe" size={17} color="var(--accent-green)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Global Farm Telemetry Mesh</h3>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-green">24 farms</span>
                <span className="badge">5 nodes</span>
              </div>
            </div>
            <GlobeMini />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              {[
                ['India', 'var(--accent-green)'],
                ['Kenya', 'var(--accent-amber)'],
                ['Nigeria', 'var(--accent-blue)'],
                ['Senegal', 'var(--accent-purple)'],
                ['Bangladesh', 'var(--accent-cyan)'],
              ].map(([l, c]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="rain" size={16} color="var(--accent-green)" />
                <h3 style={{ fontSize: '0.98rem' }}>7-Day Meteorological Horizon</h3>
              </div>
              <span className="source-badge">Open-Meteo ECMWF</span>
            </div>
            <ForecastChart days={forecast} />
            <div style={{ marginTop: 14, display: 'flex', gap: 14, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, background: 'var(--accent-green)', borderRadius: 2 }} />
                Dry spell
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, background: 'var(--text-primary)', borderRadius: 2 }} />
                Precipitation event
              </span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Provider health */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Provider Infrastructure</h3>
            <ProviderHealth providers={health?.providers} />
            {!health && <div className="skeleton" style={{ height: 50, borderRadius: 'var(--radius-sm)' }} />}
            <div className="provenance-bar" style={{ marginTop: 12 }}>
              <span>Node: {health?.node || 'Local'}</span>
              <span>•</span>
              <span>Build: v{health?.version || '2.0'}</span>
              <span>•</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{health?.status || 'Online'}</span>
            </div>
          </div>

          {/* Activity feed */}
          <div className="card" style={{ padding: 20, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: '0.9rem' }}>Activity Stream</h3>
              <span className="badge badge-green">
                <span className="dot dot-green dot-pulse" />
                Live
              </span>
            </div>
            <ActivityFeed />
          </div>

          {/* Quick actions */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Platform Navigation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { label: 'Farmer Dossier & Scan', href: '/farmer', icon: 'farmer' },
                { label: 'Network Telemetry Monitor', href: '/network', icon: 'network' },
                { label: 'Field 3D Synthesis', href: '/field', icon: 'field' },
                { label: 'Agronomic AI Advisory', href: '/advisory', icon: 'sparkles' },
              ].map(({ label, href, icon }) => (
                <a key={href} href={href} className="btn btn-secondary btn-sm" style={{ justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Icon name={icon} size={14} color="var(--text-secondary)" />
                    {label}
                  </span>
                  <Icon name="arrowRight" size={13} color="var(--text-muted)" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Colophon */}
      <div style={{ textAlign: 'center', padding: '16px 0', borderTop: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        Open-Meteo • ISRIC SoilGrids • NASA POWER • Copernicus Sentinel STAC • AgriN Connect v2
      </div>
    </div>
  )
}
