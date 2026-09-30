import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Icon } from './ui/Icons'
import { useToastStore } from '../stores'

function FormattedReport({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.86rem', lineHeight: 1.65 }}>
      {lines.map((line, lIdx) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={lIdx} style={{ height: 4 }} />
        
        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={lIdx} style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 12, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--accent-green)' }}>◈</span> {trimmed.slice(4)}
            </h4>
          )
        }
        if (trimmed.startsWith('#### ') || trimmed.startsWith('**1.') || trimmed.startsWith('**2.') || trimmed.startsWith('**3.') || trimmed.startsWith('**4.')) {
          return (
            <h5 key={lIdx} style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--accent-green)', marginTop: 8, marginBottom: 2 }}>
              {trimmed.replace(/^####\s*/, '')}
            </h5>
          )
        }

        // Bullet point formatting
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ')
        const cleanLine = isBullet ? trimmed.slice(2) : trimmed
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g)

        return (
          <div key={lIdx} style={{ paddingLeft: isBullet ? 14 : 0, position: 'relative' }}>
            {isBullet && (
              <span style={{ position: 'absolute', left: 2, top: 0, color: 'var(--accent-green)', fontWeight: 'bold' }}>•</span>
            )}
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={pIdx} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                    {part.slice(2, -2)}
                  </strong>
                )
              }
              return <span key={pIdx} style={{ color: 'var(--text-secondary)' }}>{part}</span>
            })}
          </div>
        )
      })}
    </div>
  )
}

export function CropSuitabilityCard({ farmer, region, country, weather, soil, onUpdateCrop }) {
  const toast = useToastStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeCrop, setActiveCrop] = useState(farmer?.crop || 'Rice')
  const [expanded, setExpanded] = useState(true)

  // Sync activeCrop if farmer.crop changes
  useEffect(() => {
    if (farmer?.crop) {
      setActiveCrop(farmer.crop)
    }
  }, [farmer?.crop])

  const evaluateSuitability = async (targetCrop) => {
    if (!region || !farmer) return
    setLoading(true)
    try {
      // Extract pH from soil if already loaded
      let soilPh = undefined
      if (soil?.properties) {
        const phProp = soil.properties.find(p => p.name === 'phh2o' && p.depth === '0-5cm')
        if (phProp && phProp.value) {
          soilPh = phProp.value > 14 ? phProp.value / 10.0 : phProp.value
        }
      }

      // Extract temp from weather if loaded
      const tempC = weather?.current?.temperature_2m
      const humidityPct = weather?.current?.relative_humidity_2m

      const payload = {
        crop: targetCrop,
        farm_id: farmer.id || 'farm_local',
        farmer_name: farmer.farmer_name || farmer.name || 'Farmer',
        area_ha: farmer.area_ha || 2.0,
        region_name: region.name,
        country: country || 'India',
        lat: region.lat,
        lon: region.lon,
        typical_crops: region.typical_crops || ['rice', 'soybean', 'maize', 'cotton'],
        climate: region.climate || 'Subtropical',
        language: 'en',
        soil_ph: soilPh,
        temp_c: tempC,
        humidity_pct: humidityPct,
      }

      const res = await api.advisory.cropSuitability(payload)
      setData(res)
      setActiveCrop(targetCrop)
    } catch (err) {
      toast.show(`Crop evaluation error: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Trigger evaluation on initial mount or when farmer/region change
  useEffect(() => {
    evaluateSuitability(farmer?.crop || 'Rice')
  }, [farmer?.id, farmer?.crop, region?.id])

  const handleApplyCrop = (newCrop) => {
    if (onUpdateCrop) {
      onUpdateCrop(newCrop)
      toast.show(`Farm crop updated to ${newCrop}!`, 'success')
    }
  }

  const score = data?.suitability_score ?? 0
  const isOptimal = score >= 85
  const isModerate = score >= 65 && score < 85
  const scoreColor = isOptimal ? 'var(--accent-green)' : isModerate ? 'var(--accent-amber)' : 'var(--accent-red)'
  const scoreBg = isOptimal ? 'rgba(5, 150, 105, 0.12)' : isModerate ? 'rgba(217, 119, 6, 0.12)' : 'rgba(220, 38, 38, 0.12)'
  const scoreBorder = isOptimal ? 'rgba(5, 150, 105, 0.3)' : isModerate ? 'rgba(217, 119, 6, 0.3)' : 'rgba(220, 38, 38, 0.3)'

  return (
    <div
      className="card fade-in"
      style={{
        marginTop: 20,
        padding: 'clamp(14px, 3vw, 24px)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${isOptimal ? 'rgba(5, 150, 105, 0.3)' : 'var(--border)'}`,
        boxShadow: isOptimal ? '0 4px 20px rgba(5, 150, 105, 0.08)' : 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(5, 150, 105, 0.15)',
              border: '1px solid rgba(5, 150, 105, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-green)',
            }}
          >
            <Icon name="sparkles" size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                AI Crop Suitability & Optimization Report
              </h3>
              {data?.provider && (
                <span
                  className="badge"
                  style={{
                    background: 'rgba(5, 150, 105, 0.15)',
                    color: 'var(--accent-green)',
                    border: '1px solid rgba(5, 150, 105, 0.3)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                  }}
                >
                  ⚡ Powered by Ollama ({data.provider.replace('ollama:', '')})
                </span>
              )}
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Assessing whether <strong>{activeCrop}</strong> is your field's highest-yielding choice based on ISRIC soil chemistry and live microclimate.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => evaluateSuitability(activeCrop)}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}
          >
            <Icon name="refresh" size={13} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Analyzing...' : 'Re-Evaluate'}</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !data && (
        <div style={{ padding: '24px 0' }}>
          <div className="skeleton" style={{ height: 90, borderRadius: 8, marginBottom: 14 }} />
          <div className="skeleton" style={{ height: 160, borderRadius: 8 }} />
        </div>
      )}

      {/* Main Analysis Content */}
      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Top Score & Verdict Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              background: scoreBg,
              border: `1px solid ${scoreBorder}`,
              borderRadius: 'var(--radius-sm)',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Score Gauge Circle */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--bg-card)',
                  border: `3px solid ${scoreColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 0 12px ${scoreColor}40`,
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                  {score}%
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>
                  Match
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: scoreColor,
                    }}
                  >
                    {isOptimal ? '🌟 Optimal Crop Choice' : isModerate ? '⚡ Strong Match' : '⚠️ Sub-optimal Choice'}
                  </span>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.72rem',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    Evaluating: {data.crop}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 640 }}>
                  {data.verdict_summary}
                </div>
              </div>
            </div>

            {/* Quick Farm Switcher if Simulating Alternative */}
            {data.crop.toLowerCase() !== farmer?.crop?.toLowerCase() && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleApplyCrop(data.crop)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Icon name="check" size={13} />
                <span>Switch Farm to {data.crop}</span>
              </button>
            )}
          </div>

          {/* Condition Matrix Grid */}
          <div className="grid-3" style={{ gap: 12 }}>
            {/* 1. Soil pH */}
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="leaf" size={12} />
                  Soil pH Chemistry
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--accent-green)',
                    fontWeight: 600,
                  }}
                >
                  Target: {data.metrics?.optimal_ph?.[0]}–{data.metrics?.optimal_ph?.[1]}
                </span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {data.metrics?.soil_ph?.toFixed(1)} pH
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {data.metrics?.ph_status}
              </div>
            </div>

            {/* 2. Microclimate Temp */}
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="thermometer" size={12} />
                  Microclimate Temperature
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--accent-blue)',
                    fontWeight: 600,
                  }}
                >
                  Optimal: {data.metrics?.optimal_temp_c?.[0]}–{data.metrics?.optimal_temp_c?.[1]}°C
                </span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {data.metrics?.temp_c?.toFixed(1)}°C
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {data.metrics?.temp_status}
              </div>
            </div>

            {/* 3. Soil Fertility (SOC & Nitrogen) */}
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="flask" size={12} />
                  Soil Fertility (ISRIC)
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                  Topsoil 0-5cm
                </span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {data.metrics?.nitrogen_g_kg} g/kg N
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Organic Carbon (SOC): {data.metrics?.soc_g_kg} g/kg • Rain: {data.metrics?.rain_7d_mm}mm
              </div>
            </div>
          </div>

          {/* Alternative Crops Comparison Bar (Rice vs Soybean vs Maize) */}
          {data.alternative_crops && data.alternative_crops.length > 0 && (
            <div
              style={{
                padding: '16px 18px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Comparative Crop Alternatives for Your Soil & Climate
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Click any alternative to simulate suitability score and comparative agronomic advantages:
                  </span>
                </div>
                {farmer?.crop && data.crop.toLowerCase() !== farmer.crop.toLowerCase() && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => evaluateSuitability(farmer.crop)}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Reset to {farmer.crop}
                  </button>
                )}
              </div>

              <div className="grid-3" style={{ gap: 10 }}>
                {data.alternative_crops.map((alt) => {
                  const isCurSimulated = activeCrop.toLowerCase() === alt.name.toLowerCase()
                  return (
                    <div
                      key={alt.name}
                      onClick={() => evaluateSuitability(alt.name)}
                      style={{
                        padding: '12px 14px',
                        background: isCurSimulated ? 'var(--accent-tint)' : 'var(--bg-card)',
                        borderRadius: 6,
                        border: isCurSimulated ? '1px solid var(--accent-green)' : '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-green)')}
                      onMouseLeave={(e) => {
                        if (!isCurSimulated) e.currentTarget.style.borderColor = 'var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {alt.name}
                        </span>
                        <span
                          className="badge"
                          style={{
                            background: alt.score >= 85 ? 'rgba(5, 150, 105, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                            color: alt.score >= 85 ? 'var(--accent-green)' : 'var(--accent-amber)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          {alt.score}% Match
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {alt.reason}
                      </p>
                      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                          {isCurSimulated ? 'Currently Viewing' : 'Click to Simulate →'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Full Ollama Agronomic Report */}
          <div
            style={{
              padding: '18px 20px',
              background: 'var(--bg-glass)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                marginBottom: expanded ? 14 : 0,
              }}
              onClick={() => setExpanded(!expanded)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="sparkles" size={16} color="var(--accent-green)" />
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Detailed Agronomic Evaluation (Ollama Neural Intelligence)
                </h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {data.latency_ms && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Generated in {(data.latency_ms / 1000).toFixed(1)}s
                  </span>
                )}
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                  {expanded ? '▲ Collapse' : '▼ Expand Full Report'}
                </span>
              </div>
            </div>

            {expanded && (
              <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <FormattedReport text={data.report_markdown} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
