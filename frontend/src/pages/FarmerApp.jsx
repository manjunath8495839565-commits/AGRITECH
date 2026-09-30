import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useToastStore } from '../stores'

// ── Country → Zone picker ──────────────────────────────────────
const COUNTRIES = {
  India: [
    { id: 'IN-PNJ', name: 'Punjab', lat: 30.90, lon: 75.85, climate: 'Semi-arid', crops: ['wheat', 'rice', 'maize'] },
    { id: 'IN-KAR', name: 'Karnataka', lat: 12.97, lon: 77.59, climate: 'Tropical', crops: ['rice', 'sugarcane', 'cotton'] },
    { id: 'IN-MHR', name: 'Maharashtra', lat: 19.75, lon: 75.71, climate: 'Tropical', crops: ['soybean', 'sugarcane', 'onion'] },
  ],
  Kenya: [
    { id: 'KE-RVL', name: 'Rift Valley', lat: -0.30, lon: 36.10, climate: 'Highland', crops: ['maize', 'wheat', 'coffee'] },
    { id: 'KE-CEN', name: 'Central', lat: -0.42, lon: 37.01, climate: 'Highland', crops: ['tea', 'coffee', 'banana'] },
  ],
  Nigeria: [
    { id: 'NG-KAN', name: 'Kano', lat: 12.00, lon: 8.52, climate: 'Semi-arid', crops: ['groundnut', 'sorghum', 'millet'] },
    { id: 'NG-OGN', name: 'Ogun', lat: 7.16, lon: 3.35, climate: 'Tropical', crops: ['cassava', 'maize', 'cocoa'] },
  ],
  Ghana: [
    { id: 'GH-ASH', name: 'Ashanti', lat: 6.73, lon: -1.62, climate: 'Tropical', crops: ['cocoa', 'cassava', 'plantain'] },
  ],
}

const DEMO_FARMERS = {
  'IN-PNJ': [
    { id: 'F001', name: 'Gurpreet Singh', area_ha: 4.5, crop: 'wheat', phone: '+91-98765-43210' },
    { id: 'F002', name: 'Mandeep Kaur', area_ha: 2.1, crop: 'rice', phone: '+91-98123-45678' },
    { id: 'F003', name: 'Harjit Brar', area_ha: 7.3, crop: 'maize', phone: '+91-97654-32109' },
  ],
  'IN-KAR': [
    { id: 'F004', name: 'Ravi Kumar', area_ha: 3.2, crop: 'sugarcane', phone: '+91-99001-12345' },
    { id: 'F005', name: 'Lakshmi Devi', area_ha: 1.8, crop: 'rice', phone: '+91-94455-67890' },
  ],
  'IN-MHR': [
    { id: 'F006', name: 'Suresh Patil', area_ha: 5.0, crop: 'soybean', phone: '+91-98234-56789' },
  ],
  'KE-RVL': [
    { id: 'F007', name: 'James Mwangi', area_ha: 2.8, crop: 'maize', phone: '+254-722-123456' },
    { id: 'F008', name: 'Grace Wanjiku', area_ha: 1.5, crop: 'coffee', phone: '+254-733-987654' },
  ],
  'KE-CEN': [
    { id: 'F009', name: 'Peter Kamau', area_ha: 3.1, crop: 'tea', phone: '+254-711-234567' },
  ],
  'NG-KAN': [
    { id: 'F010', name: 'Musa Abdullahi', area_ha: 6.2, crop: 'groundnut', phone: '+234-803-123456' },
    { id: 'F011', name: 'Fatima Yusuf', area_ha: 4.0, crop: 'sorghum', phone: '+234-806-789012' },
  ],
  'NG-OGN': [
    { id: 'F012', name: 'Emeka Okafor', area_ha: 2.5, crop: 'cassava', phone: '+234-802-345678' },
  ],
  'GH-ASH': [
    { id: 'F013', name: 'Kwame Mensah', area_ha: 3.7, crop: 'cocoa', phone: '+233-244-123456' },
  ],
}

// ── Soil Health Card Component ─────────────────────────────────
function SoilHealthView({ soil, loading, farmer, zone }) {
  const [showAll, setShowAll] = useState(false)

  if (loading) {
    return <div className="skeleton" style={{ height: 160, borderRadius: 8 }} />
  }

  if (!soil || !soil.properties || soil.properties.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
        No soil data available for this location.
      </div>
    )
  }

  const getProp = (name, depth = '0-5cm') => {
    const p = soil.properties.find(x => x.name === name && x.depth === depth) ||
              soil.properties.find(x => x.name === name)
    return p ? p.value : null
  }

  const phRaw = getProp('phh2o')
  const ph = phRaw ? (phRaw > 14 ? phRaw / 10 : phRaw) : 7.0
  const socRaw = getProp('soc')
  const soc = socRaw ? socRaw / 10 : 14.0 // g/kg
  const nRaw = getProp('nitrogen')
  const nitrogen = nRaw ? nRaw / 100 : 2.1 // g/kg
  const cecRaw = getProp('cec')
  const cec = cecRaw ? cecRaw / 10 : 20.0 // cmol/kg
  const bdodRaw = getProp('bdod')
  const bdod = bdodRaw ? bdodRaw / 100 : 1.35 // g/cm³

  const clayRaw = getProp('clay') || 260
  const sandRaw = getProp('sand') || 410
  const siltRaw = getProp('silt') || 330
  const totalTexture = (clayRaw + sandRaw + siltRaw) || 1000
  const clayPct = Math.round((clayRaw / totalTexture) * 100)
  const sandPct = Math.round((sandRaw / totalTexture) * 100)
  const siltPct = Math.max(0, 100 - clayPct - sandPct)

  let textureClass = 'Loam'
  if (clayPct > 35) textureClass = 'Clay Loam'
  else if (sandPct > 50) textureClass = 'Sandy Loam'
  else if (siltPct > 45) textureClass = 'Silty Loam'

  let phLabel = 'Optimal'
  let phColor = 'var(--accent-green)'
  if (ph < 6.0) { phLabel = 'Acidic'; phColor = 'var(--accent-amber)' }
  else if (ph > 7.6) { phLabel = 'Alkaline'; phColor = 'var(--accent-blue)' }

  let guidance = `Soil pH is in the optimal range (${ph.toFixed(1)}) for ${farmer.crop}. Nutrients are readily available to root systems.`
  if (ph < 6.0) {
    guidance = `Slightly acidic soil (${ph.toFixed(1)}). Consider applying agricultural lime (1–2 t/ha) or wood ash before planting ${farmer.crop}.`
  } else if (ph > 7.6) {
    guidance = `Alkaline/calcareous soil (${ph.toFixed(1)}). Incorporate farmyard manure, green manure (Dhaincha), or gypsum to enhance micronutrient uptake for ${farmer.crop}.`
  }

  const propMeta = {
    phh2o: { name: 'Soil pH (H₂O)', fmt: v => (v > 14 ? (v / 10).toFixed(1) : v.toFixed(1)), unit: 'pH' },
    nitrogen: { name: 'Total Nitrogen', fmt: v => (v / 100).toFixed(2), unit: 'g/kg' },
    soc: { name: 'Organic Carbon', fmt: v => (v / 10).toFixed(1), unit: 'g/kg' },
    clay: { name: 'Clay Content', fmt: v => (v / 10).toFixed(1), unit: '%' },
    sand: { name: 'Sand Content', fmt: v => (v / 10).toFixed(1), unit: '%' },
    silt: { name: 'Silt Content', fmt: v => (v / 10).toFixed(1), unit: '%' },
    cec: { name: 'Cation Exchange (CEC)', fmt: v => (v / 10).toFixed(1), unit: 'cmol/kg' },
    bdod: { name: 'Bulk Density', fmt: v => (v / 100).toFixed(2), unit: 'g/cm³' },
  }

  return (
    <div>
      {/* 4 Primary Soil Metrics */}
      <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
        <div style={{ padding: '12px 14px', background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🧪 Soil pH (Topsoil)</span>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: phColor, color: '#fff', fontWeight: 600 }}>{phLabel}</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: phColor }}>{ph.toFixed(1)}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>Target: 6.0 – 7.5</div>
        </div>

        <div style={{ padding: '12px 14px', background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🍂 Organic Carbon (SOC)</span>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.2)', color: 'var(--accent-green)', fontWeight: 600 }}>
              {soc > 15 ? 'Rich' : soc > 8 ? 'Good' : 'Low'}
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{(soc / 10).toFixed(2)}%</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{soc.toFixed(1)} g/kg carbon</div>
        </div>

        <div style={{ padding: '12px 14px', background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🌿 Total Nitrogen (N)</span>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.2)', color: 'var(--accent-blue)', fontWeight: 600 }}>Available</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent-blue)' }}>{nitrogen.toFixed(2)} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>g/kg</span></div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>Root zone reserve</div>
        </div>

        <div style={{ padding: '12px 14px', background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>⚡ Cation Capacity (CEC)</span>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(234,179,8,0.2)', color: 'var(--accent-amber)', fontWeight: 600 }}>High Retention</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent-amber)' }}>{cec.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>cmol/kg</span></div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>Bulk density: {bdod.toFixed(2)} g/cm³</div>
        </div>
      </div>

      {/* Soil Texture Composition Bar */}
      <div style={{ padding: '12px 14px', background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>🌾 Soil Texture Composition</span>
          <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>{textureClass}</span>
        </div>

        {/* Multi-segment progress bar */}
        <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.05)', marginBottom: 8 }}>
          <div style={{ width: `${sandPct}%`, background: '#f59e0b', transition: 'width 0.5s' }} title={`Sand: ${sandPct}%`} />
          <div style={{ width: `${siltPct}%`, background: '#06b6d4', transition: 'width 0.5s' }} title={`Silt: ${siltPct}%`} />
          <div style={{ width: `${clayPct}%`, background: '#10b981', transition: 'width 0.5s' }} title={`Clay: ${clayPct}%`} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <span><span style={{ color: '#f59e0b', fontWeight: 700 }}>■</span> Sand: {sandPct}%</span>
          <span><span style={{ color: '#06b6d4', fontWeight: 700 }}>■</span> Silt: {siltPct}%</span>
          <span><span style={{ color: '#10b981', fontWeight: 700 }}>■</span> Clay: {clayPct}%</span>
        </div>
      </div>

      {/* Agronomic recommendation */}
      <div style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.08)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)', marginBottom: 14 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-green)', marginBottom: 2 }}>💡 Agronomic Advisory for {farmer.crop}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{guidance}</div>
      </div>

      {/* Depth Profile Toggle */}
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => setShowAll(!showAll)}
          style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 6, width: '100%', padding: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          {showAll ? '▲ Hide All 24 Measurements' : `▼ View All 24 Depth Profiles (0–5cm, 5–15cm, 15–30cm)`}
        </button>

        {showAll && (
          <div style={{ marginTop: 8, maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {soil.properties?.map((p, i) => {
              const meta = propMeta[p.name] || { name: p.name, fmt: v => v.toFixed(2), unit: p.unit }
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-glass)', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.72rem' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{meta.name}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{p.depth}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{meta.fmt(p.value)}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{meta.unit}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="provenance-bar">
        <span className="source-badge">ISRIC SoilGrids v2</span>
        <span>Lat: {zone.lat}, Lon: {zone.lon}</span>
        <span>{soil.properties?.length} measurements</span>
      </div>
    </div>
  )
}

// ── Farmer action panel ────────────────────────────────────────
function FarmerActions({ farmer, zone, country }) {
  const toast = useToastStore()
  const [tab, setTab] = useState('weather')
  const [weather, setWeather] = useState(null)
  const [soil, setSoil] = useState(null)
  const [price, setPrice] = useState(null)
  const [ndvi, setNdvi] = useState(null)
  const [loading, setLoading] = useState({})

  const load = async (type, force = false) => {
    setLoading(l => ({ ...l, [type]: true }))
    try {
      if (type === 'weather' && (!weather || force)) {
        const [cur, frc] = await Promise.all([
          api.weather.current(zone.lat, zone.lon),
          api.weather.forecast(zone.lat, zone.lon, 5),
        ])
        setWeather({ current: cur.data, forecast: frc.data })
      }
      if (type === 'soil' && (!soil || force)) {
        const r = await api.soil.report(zone.lat, zone.lon)
        setSoil(r.data)
      }
      if (type === 'price' && (!price || force)) {
        const r = await api.prices.crop(farmer.crop, country)
        setPrice(r.data)
      }
      if (type === 'satellite' && (!ndvi || force)) {
        const r = await api.satellite.ndvi(zone.lat, zone.lon, 60)
        setNdvi(r.data)
      }
    } catch (e) {
      toast.show(`Failed to load ${type}: ${e.message}`, 'error')
    } finally {
      setLoading(l => ({ ...l, [type]: false }))
    }
  }

  useEffect(() => {
    setWeather(null)
    setSoil(null)
    setPrice(null)
    setNdvi(null)
    load(tab, true)
  }, [farmer.id, zone.id])

  const tabs = [
    { id: 'weather', label: '🌤 Weather' },
    { id: 'soil', label: '🌱 Soil' },
    { id: 'price', label: '💰 Price' },
    { id: 'satellite', label: '🛰 NDVI' },
  ]

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', flexShrink: 0,
        }}>🧑‍🌾</div>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 2 }}>{farmer.name}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            {farmer.area_ha} ha • {farmer.crop} • {zone.name}, {country}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <span className="badge badge-green">{farmer.crop}</span>
          <span className="badge badge-blue">{farmer.area_ha}ha</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id}
            id={`farmer-tab-${t.id}`}
            onClick={() => { setTab(t.id); load(t.id) }}
            style={{
              background: tab === t.id ? 'rgba(34,197,94,0.1)' : 'none',
              border: 'none', borderBottom: tab === t.id ? '2px solid var(--accent-green)' : '2px solid transparent',
              color: tab === t.id ? 'var(--accent-green)' : 'var(--text-secondary)',
              padding: '8px 16px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
              fontFamily: 'var(--font-sans)', transition: 'all 0.2s', borderRadius: '6px 6px 0 0',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div className="fade-in" key={tab}>
        {tab === 'weather' && (
          <div>
            {loading.weather && <div className="skeleton" style={{ height: 80, borderRadius: 8 }} />}
            {weather?.current && (
              <div>
                <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Temperature', value: `${weather.current.temperature_2m?.toFixed(1)}°C`, icon: '🌡️' },
                    { label: 'Humidity', value: `${weather.current.relative_humidity_2m?.toFixed(0)}%`, icon: '💧' },
                    { label: 'Wind', value: `${weather.current.wind_speed_10m?.toFixed(1)} km/h`, icon: '🌬️' },
                    { label: 'Precipitation', value: `${weather.current.precipitation?.toFixed(1)} mm`, icon: '🌧️' },
                  ].map(({ label, value, icon }) => (
                    <div key={label} style={{ padding: '12px 14px', background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>{icon} {label}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div className="provenance-bar">
                  <span className="source-badge">Open-Meteo API</span>
                  <span>Lat: {zone.lat}, Lon: {zone.lon}</span>
                  <span>Live</span>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'soil' && (
          <SoilHealthView soil={soil} loading={loading.soil} farmer={farmer} zone={zone} />
        )}


        {tab === 'price' && (
          <div>
            {loading.price && <div className="skeleton" style={{ height: 100, borderRadius: 8 }} />}
            {price && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-display)' }}>
                  {price.currency} {price.price_local?.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '8px 0' }}>per tonne • {price.crop}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>≈ USD {price.price_usd?.toLocaleString()}</div>
                <div className="provenance-bar" style={{ justifyContent: 'center', marginTop: 16 }}>
                  <span className="source-badge">USDA/FAO ref + open.er-api.com</span>
                  <span>{price.date}</span>
                  <span>{price.market} market</span>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'satellite' && (
          <div>
            {loading.satellite && <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />}
            {ndvi && ndvi.length > 0 && (
              <div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 100, marginBottom: 12 }}>
                  {ndvi.slice(-14).map((p, i) => {
                    const h = Math.max(8, p.ndvi * 100)
                    const color = p.ndvi > 0.5 ? 'var(--accent-green)' : p.ndvi > 0.3 ? 'var(--accent-amber)' : 'var(--accent-red)'
                    return (
                      <div key={i} data-tooltip={`NDVI: ${p.ndvi} (${p.date})`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'help' }}>
                        <div style={{ width: '100%', height: `${h}px`, background: color, borderRadius: '3px 3px 1px 1px', opacity: 0.8 }} />
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  <span>{ndvi.length} scenes</span>
                  <span>•</span>
                  <span>Latest: {ndvi.at(-1)?.ndvi?.toFixed(3)} NDVI</span>
                  <span>•</span>
                  <span style={{ color: ndvi.at(-1)?.ndvi > 0.4 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                    {ndvi.at(-1)?.ndvi > 0.5 ? 'Healthy crop' : ndvi.at(-1)?.ndvi > 0.3 ? 'Moderate growth' : 'Low vegetation'}
                  </span>
                </div>
                <div className="provenance-bar">
                  <span className="source-badge">Sentinel-2 L2A via Element84 STAC</span>
                  <span>cloud &lt;30%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Farmer App ────────────────────────────────────────────
export default function FarmerApp() {
  const [step, setStep] = useState('country') // country → zone → farmer
  const [country, setCountry] = useState(null)
  const [zone, setZone] = useState(null)
  const [farmer, setFarmer] = useState(null)

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>🧑‍🌾 Farmer Intelligence App</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Live weather, soil, prices, and satellite data for every farmer
        </p>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <button onClick={() => { setStep('country'); setCountry(null); setZone(null); setFarmer(null) }}
            style={{ background: country ? 'rgba(34,197,94,0.1)' : 'none', border: 'none', color: country ? 'var(--accent-green)' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', padding: '3px 8px', borderRadius: 4 }}>
            🌍 Country
          </button>
          {country && <><span style={{ color: 'var(--text-muted)' }}>›</span>
            <button onClick={() => { setStep('zone'); setZone(null); setFarmer(null) }}
              style={{ background: zone ? 'rgba(34,197,94,0.1)' : 'none', border: 'none', color: zone ? 'var(--accent-green)' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', padding: '3px 8px', borderRadius: 4 }}>
              {country}
            </button></>}
          {zone && <><span style={{ color: 'var(--text-muted)' }}>›</span>
            <button onClick={() => { setStep('farmer'); setFarmer(null) }}
              style={{ background: farmer ? 'rgba(34,197,94,0.1)' : 'none', border: 'none', color: farmer ? 'var(--accent-green)' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', padding: '3px 8px', borderRadius: 4 }}>
              {zone.name}
            </button></>}
          {farmer && <><span style={{ color: 'var(--text-muted)' }}>›</span><span style={{ color: 'var(--text-primary)' }}>{farmer.name}</span></>}
        </div>
      </div>

      {/* Step: Country */}
      {step === 'country' && (
        <div className="fade-in">
          <h3 style={{ fontSize: '1rem', marginBottom: 16, color: 'var(--text-secondary)' }}>Select a country to explore</h3>
          <div className="grid-4">
            {Object.keys(COUNTRIES).map(c => (
              <button key={c} id={`country-${c.toLowerCase()}`}
                onClick={() => { setCountry(c); setStep('zone') }}
                className="card"
                style={{ padding: '24px 20px', border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--bg-card)', textAlign: 'center', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>
                  {{ India: '🇮🇳', Kenya: '🇰🇪', Nigeria: '🇳🇬', Ghana: '🇬🇭' }[c]}
                </div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{c}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{COUNTRIES[c].length} zones</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Zone */}
      {step === 'zone' && (
        <div className="fade-in">
          <h3 style={{ fontSize: '1rem', marginBottom: 16, color: 'var(--text-secondary)' }}>Select a farming zone in {country}</h3>
          <div className="grid-3">
            {COUNTRIES[country].map(z => (
              <button key={z.id} id={`zone-${z.id.toLowerCase()}`}
                onClick={() => { setZone(z); setStep('farmer') }}
                className="card"
                style={{ padding: '20px', border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--bg-card)', textAlign: 'left', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📍</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{z.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{z.climate} • {z.lat.toFixed(2)}°N {z.lon.toFixed(2)}°E</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {z.crops.map(crop => <span key={crop} className="badge badge-green" style={{ fontSize: '0.6rem' }}>{crop}</span>)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>{(DEMO_FARMERS[z.id] || []).length} farmers</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Farmer */}
      {step === 'farmer' && !farmer && (
        <div className="fade-in">
          <h3 style={{ fontSize: '1rem', marginBottom: 16, color: 'var(--text-secondary)' }}>Select a farmer in {zone?.name}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {(DEMO_FARMERS[zone?.id] || []).map(f => (
              <button key={f.id} id={`farmer-${f.id.toLowerCase()}`}
                onClick={() => setFarmer(f)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.background = 'rgba(34,197,94,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}
              >
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🧑‍🌾</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{f.area_ha} ha • {f.crop} • {f.phone}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="badge badge-green">{f.crop}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Farmer detail */}
      {farmer && zone && country && (
        <div className="fade-in">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setFarmer(null)}>← Back to farmers</button>
          </div>
          <FarmerActions farmer={farmer} zone={zone} country={country} />
        </div>
      )}
    </div>
  )
}
