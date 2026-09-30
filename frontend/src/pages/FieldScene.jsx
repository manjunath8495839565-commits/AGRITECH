import React, { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { useToastStore } from '../stores'
import { Icon } from '../components/ui/Icons'

// ── 3D Field Scene (CSS + SVG + Canvas simulation) ─────────────
function FieldCanvas({ ndvi, rain, sun, temp }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height

    const animate = () => {
      ctx.clearRect(0, 0, W, H)

      // Sky gradient – changes with sun intensity
      const skyLight = Math.max(0, Math.min(1, sun / 100))
      const skyTop = `hsl(${210 + skyLight * 20}, ${40 + skyLight * 30}%, ${8 + skyLight * 12}%)`
      const skyBtm = `hsl(${220 + skyLight * 15}, ${30 + skyLight * 20}%, ${12 + skyLight * 8}%)`
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.55)
      skyGrad.addColorStop(0, skyTop)
      skyGrad.addColorStop(1, skyBtm)
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, W, H * 0.55)

      // Sun/Moon
      if (sun > 20) {
        const sunX = W * (0.3 + sun / 200), sunY = H * 0.12
        const sunR = 20 + sun / 10
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 2)
        sunGrad.addColorStop(0, `rgba(251,191,36,${0.4 + sun / 200})`)
        sunGrad.addColorStop(0.4, `rgba(251,191,36,${0.2 + sun / 300})`)
        sunGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = sunGrad
        ctx.beginPath()
        ctx.arc(sunX, sunY, sunR * 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(251,191,36,${0.6 + sun / 150})`
        ctx.beginPath()
        ctx.arc(sunX, sunY, sunR * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // Clouds if rain
      if (rain > 20) {
        ctx.fillStyle = `rgba(100,116,139,${rain / 200})`
        [[W*0.2, H*0.08, 60, 25], [W*0.5, H*0.06, 80, 30], [W*0.75, H*0.09, 55, 22]].forEach(([x,y,w,h]) => {
          ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, Math.PI*2); ctx.fill()
        })
      }

      // Ground
      const groundGrad = ctx.createLinearGradient(0, H * 0.52, 0, H)
      const ndviNorm = Math.max(0, Math.min(1, ndvi))
      const hue = 60 + ndviNorm * 80 // yellow to green
      const sat = 20 + ndviNorm * 50
      const lit = 8 + ndviNorm * 12
      groundGrad.addColorStop(0, `hsl(${hue}, ${sat}%, ${lit + 6}%)`)
      groundGrad.addColorStop(1, `hsl(${hue}, ${sat}%, ${lit}%)`)
      ctx.fillStyle = groundGrad
      ctx.fillRect(0, H * 0.52, W, H * 0.48)

      // Crop rows (perspective)
      const rows = 8
      for (let r = 0; r < rows; r++) {
        const t = r / rows
        const y = H * (0.55 + t * 0.42)
        const rowW = 30 + t * (W - 60)
        const cx = W / 2
        const plants = Math.floor(5 + t * 12)
        const plantH = (8 + ndviNorm * 22) * (0.3 + t * 0.7)
        const plantColor = `hsl(${hue}, ${40 + ndviNorm * 40}%, ${15 + ndviNorm * 20}%)`

        for (let p = 0; p < plants; p++) {
          const px = cx - rowW / 2 + (rowW / (plants - 1)) * p
          // Stem
          ctx.strokeStyle = `hsl(${hue - 20}, 40%, 20%)`
          ctx.lineWidth = 1 + t * 1.5
          ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y - plantH * 0.6); ctx.stroke()
          // Leaves
          ctx.fillStyle = plantColor
          ctx.beginPath(); ctx.ellipse(px - plantH * 0.25, y - plantH * 0.5, plantH * 0.2, plantH * 0.08, -0.5, 0, Math.PI * 2); ctx.fill()
          ctx.beginPath(); ctx.ellipse(px + plantH * 0.25, y - plantH * 0.4, plantH * 0.2, plantH * 0.08, 0.5, 0, Math.PI * 2); ctx.fill()
          // Grain/head
          if (ndviNorm > 0.4) {
            ctx.fillStyle = `hsl(45, 80%, ${30 + ndviNorm * 20}%)`
            ctx.beginPath(); ctx.ellipse(px, y - plantH, plantH * 0.1, plantH * 0.22, 0, 0, Math.PI * 2); ctx.fill()
          }
        }
      }

      // Rain drops
      if (rain > 10) {
        ctx.strokeStyle = `rgba(147,197,253,${rain / 150})`
        ctx.lineWidth = 1
        for (let i = 0; i < rain / 5; i++) {
          const rx = Math.random() * W, ry = Math.random() * H * 0.6
          ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 2, ry + 8); ctx.stroke()
        }
      }

      // NDVI overlay text
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(8, 8, 140, 52)
      ctx.fillStyle = '#22c55e'; ctx.font = 'bold 11px Inter'; ctx.fillText('NDVI Live Scene', 14, 24)
      ctx.fillStyle = '#94a3b8'; ctx.font = '10px Inter'
      ctx.fillText(`NDVI: ${ndviNorm.toFixed(3)}  Temp: ${temp}°C`, 14, 38)
      ctx.fillText(`Rain: ${rain}%  Solar: ${sun}%`, 14, 52)
    }

    animate()
  }, [ndvi, rain, sun, temp])

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={340}
      style={{
        width: '100%',
        height: 'auto',
        aspectRatio: '640 / 340',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        display: 'block',
      }}
    />
  )
}

export default function FieldScene() {
  const toast = useToastStore()
  const [ndvi, setNdvi] = useState(0.62)
  const [rain, setRain] = useState(20)
  const [sun, setSun] = useState(70)
  const [temp, setTemp] = useState(27)
  const [ndviSeries, setNdviSeries] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)
  const [loading, setLoading] = useState(false)

  // Bangalore coords
  const LAT = 12.97, LON = 77.59

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.satellite.ndvi(LAT, LON, 60).then(r => {
        setNdviSeries(r.data)
        if (r.data?.length) setNdvi(r.data.at(-1).ndvi)
      }).catch(() => {}),
      api.satellite.thumbnail(LAT, LON).then(r => setThumbnail(r.thumbnail_url)).catch(() => {}),
      api.weather.current(LAT, LON).then(r => {
        setTemp(r.data.temperature_2m?.toFixed(0))
        setRain(Math.min(100, r.data.precipitation * 20))
      }).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const ndviStatus = ndvi > 0.6 ? { label: 'Excellent', color: 'var(--accent-green)' }
    : ndvi > 0.4 ? { label: 'Healthy', color: 'var(--accent-cyan)' }
    : ndvi > 0.2 ? { label: 'Moderate', color: 'var(--accent-amber)' }
    : { label: 'Stressed', color: 'var(--accent-red)' }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: 4, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="network" size={22} color="var(--accent-blue)" />
          <span>Field 3D Scene</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
          Live Sentinel-2 NDVI + interactive canopy simulation • Bangalore, India
        </p>
      </div>

      <div className="field-scene-grid">
        {/* 3D Canvas */}
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="leaf" size={16} color="var(--accent-green)" />
                <span>Field Simulation</span>
              </h3>
              <span className="badge" style={{ background: ndviStatus.color + '20', color: ndviStatus.color, border: `1px solid ${ndviStatus.color}40` }}>
                {ndviStatus.label} vegetation
              </span>
            </div>
            <FieldCanvas ndvi={ndvi} rain={rain} sun={sun} temp={Number(temp)} />
            <div className="provenance-bar" style={{ marginTop: 12 }}>
              <span className="source-badge">Sentinel-2 L2A via Element84 STAC</span>
              <span>Lat: {LAT}, Lon: {LON}</span>
              {loading && <span style={{ color: 'var(--accent-amber)' }}>Loading…</span>}
            </div>
          </div>

          {/* NDVI time series */}
          {ndviSeries && ndviSeries.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="trending-up" size={16} color="var(--accent-green)" />
                <span>NDVI Time Series (60 days)</span>
              </h3>
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 80 }}>
                {ndviSeries.slice(-20).map((p, i) => {
                  const h = Math.max(4, p.ndvi * 80)
                  const color = p.ndvi > 0.5 ? 'var(--accent-green)' : p.ndvi > 0.3 ? 'var(--accent-amber)' : 'var(--accent-red)'
                  return (
                    <div key={i} data-tooltip={`${p.date}: NDVI ${p.ndvi.toFixed(3)}`}
                      style={{ flex: 1, background: color, height: `${h}px`, borderRadius: '3px 3px 1px 1px', cursor: 'help', transition: 'height 0.3s', opacity: i === ndviSeries.slice(-20).length - 1 ? 1 : 0.7 }} />
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                <span>{ndviSeries.at(0)?.date}</span>
                <span>{ndviSeries.at(-1)?.date}</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 16 }}>Scene Controls</h3>

            {[
              { label: 'NDVI Index', icon: 'leaf', value: ndvi, set: setNdvi, min: 0, max: 1, step: 0.01, display: v => v.toFixed(3), color: 'var(--accent-green)' },
              { label: 'Rainfall (%)', icon: 'rain', value: rain, set: setRain, min: 0, max: 100, step: 1, display: v => `${v}%`, color: 'var(--accent-blue)' },
              { label: 'Solar Exposure (%)', icon: 'sun', value: sun, set: setSun, min: 0, max: 100, step: 1, display: v => `${v}%`, color: 'var(--accent-amber)' },
              { label: 'Temperature', icon: 'thermometer', value: temp, set: setTemp, min: 10, max: 45, step: 0.5, display: v => `${Number(v).toFixed(1)}°C`, color: 'var(--accent-red)' },
            ].map(({ label, icon, value, set, min, max, step, display, color }) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name={icon} size={13} color={color} />
                    <span>{label}</span>
                  </label>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color }}>{display(value)}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={value}
                  onChange={e => set(Number(e.target.value))}
                  style={{ width: '100%', accentColor: color, cursor: 'pointer' }} />
              </div>
            ))}
          </div>

          {/* Satellite thumbnail */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="network" size={15} color="var(--accent-blue)" />
              <span>Latest Scene</span>
            </h3>
            {thumbnail ? (
              <div>
                <img src={thumbnail} alt="Sentinel-2 thumbnail" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)' }} onError={e => { e.target.style.display = 'none' }} />
                <div className="provenance-bar" style={{ marginTop: 8 }}>
                  <span className="source-badge">Sentinel-2 L2A</span>
                  <a href={thumbnail} target="_blank" rel="noopener" style={{ color: 'var(--accent-blue)', fontSize: '0.7rem' }}>Open →</a>
                </div>
              </div>
            ) : (
              <div style={{ height: 120, background: 'var(--bg-glass)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {loading ? 'Loading scene…' : 'No recent scene available'}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 12 }}>📊 Crop Assessment</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Vegetation Health', value: ndviStatus.label, color: ndviStatus.color },
                { label: 'NDVI Score', value: ndvi.toFixed(3), color: 'var(--accent-green)' },
                { label: 'Est. Yield Potential', value: ndvi > 0.5 ? 'High' : ndvi > 0.3 ? 'Medium' : 'Low', color: ndvi > 0.5 ? 'var(--accent-green)' : 'var(--accent-amber)' },
                { label: 'Water Stress', value: ndvi < 0.3 ? 'High' : ndvi < 0.5 ? 'Moderate' : 'Low', color: ndvi < 0.3 ? 'var(--accent-red)' : 'var(--accent-green)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
