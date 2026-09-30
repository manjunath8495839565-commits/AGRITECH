import React, { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { useToastStore } from '../stores'
import { Icon } from '../components/ui/Icons'

// ── 6 Countries & Metadata ─────────────────────────────────────
const COUNTRIES_DATA = [
  { id: 'India', name: 'India', flag: '🇮🇳', code: 'IN', phonePrefix: '+91', currency: 'INR', lang: 'en' },
  { id: 'Brazil', name: 'Brazil', flag: '🇧🇷', code: 'BR', phonePrefix: '+55', currency: 'BRL', lang: 'pt' },
  { id: 'Russia', name: 'Russia', flag: '🇷🇺', code: 'RU', phonePrefix: '+7', currency: 'RUB', lang: 'ru' },
  { id: 'China', name: 'China', flag: '🇨🇳', code: 'CN', phonePrefix: '+86', currency: 'CNY', lang: 'zh' },
  { id: 'South Africa', name: 'South Africa', flag: '🇿🇦', code: 'ZA', phonePrefix: '+27', currency: 'ZAR', lang: 'en' },
  { id: 'Ethiopia', name: 'Ethiopia', flag: '🇪🇹', code: 'ET', phonePrefix: '+251', currency: 'ETB', lang: 'am' },
]

const STORAGE_KEY = 'agrin_farmer_profile'

// ── Soil Health Card Component ─────────────────────────────────
function SoilHealthView({ soil, loading, farmer, region }) {
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
  const soc = socRaw ? socRaw / 10 : 14.0
  const nRaw = getProp('nitrogen')
  const nitrogen = nRaw ? nRaw / 100 : 2.1
  const cecRaw = getProp('cec')
  const cec = cecRaw ? cecRaw / 10 : 20.0
  const bdodRaw = getProp('bdod')
  const bdod = bdodRaw ? bdodRaw / 100 : 1.35

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

  let guidance = `Soil pH is in the optimal range (${ph.toFixed(1)}) for ${farmer.crop}. Essential nutrients are bio-available.`
  if (ph < 6.0) {
    guidance = `Slightly acidic soil (${ph.toFixed(1)}). Consider applying agricultural lime (1–2 t/ha) or wood ash before planting ${farmer.crop}.`
  } else if (ph > 7.6) {
    guidance = `Alkaline/calcareous soil (${ph.toFixed(1)}). Incorporate compost, green manure, or gypsum to enhance micronutrient uptake for ${farmer.crop}.`
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
      <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
        <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="flask" size={13} color="var(--accent-green)" /> Soil pH (Topsoil)
            </span>
            <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>{phLabel}</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: phColor }}>{ph.toFixed(1)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Target: 6.0 – 7.5 pH</div>
        </div>

        <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="leaf" size={13} color="var(--accent-green)" /> Organic Carbon (SOC)
            </span>
            <span className="badge" style={{ fontSize: '0.65rem' }}>
              {soc > 15 ? 'Rich' : soc > 8 ? 'Good' : 'Low'}
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{(soc / 10).toFixed(2)}%</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{soc.toFixed(1)} g/kg carbon</div>
        </div>

        <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="leaf" size={13} color="var(--accent-blue)" /> Total Nitrogen (N)
            </span>
            <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>Available</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent-blue)' }}>{nitrogen.toFixed(2)} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>g/kg</span></div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Root zone reserve</div>
        </div>

        <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="shield" size={13} color="var(--accent-amber)" /> Cation Capacity (CEC)
            </span>
            <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>High Retention</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent-amber)' }}>{cec.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>cmol/kg</span></div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Bulk density: {bdod.toFixed(2)} g/cm³</div>
        </div>
      </div>

      {/* Texture Bar */}
      <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>Soil Texture Fraction</span>
          <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>{textureClass}</span>
        </div>

        <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', background: 'var(--border)', marginBottom: 8 }}>
          <div style={{ width: `${sandPct}%`, background: 'var(--accent-amber)', transition: 'width 0.5s' }} title={`Sand: ${sandPct}%`} />
          <div style={{ width: `${siltPct}%`, background: 'var(--accent-blue)', transition: 'width 0.5s' }} title={`Silt: ${siltPct}%`} />
          <div style={{ width: `${clayPct}%`, background: 'var(--accent-green)', transition: 'width 0.5s' }} title={`Clay: ${clayPct}%`} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <span>Sand: <strong>{sandPct}%</strong></span>
          <span>Silt: <strong>{siltPct}%</strong></span>
          <span>Clay: <strong>{clayPct}%</strong></span>
        </div>
      </div>

      <div style={{ padding: '12px 14px', background: 'var(--accent-tint)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(5, 150, 105, 0.25)', marginBottom: 14 }}>
        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-green)', marginBottom: 2 }}>
          Agronomic Advisory for {farmer.crop}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{guidance}</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => setShowAll(!showAll)}
          style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 6, width: '100%', padding: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          {showAll ? '▲ Hide All 24 Measurements' : '▼ View All 24 Depth Profiles (0–5cm, 5–15cm, 15–30cm)'}
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
        <span>Lat: {region.lat}, Lon: {region.lon}</span>
        <span>{soil.properties?.length} measurements</span>
      </div>
    </div>
  )
}

// ── Plant Infection Scan Card (Part C) ─────────────────────────
function PlantScanCard({ farmer, region }) {
  const toast = useToastStore()
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanStep, setScanStep] = useState(0)
  const [scanResult, setScanResult] = useState(null)
  const [errorBanner, setErrorBanner] = useState(null)
  const [activeTreatmentTab, setActiveTreatmentTab] = useState('organic')

  // Sample leaf generator for instant testability
  const handleLoadSample = (sampleType) => {
    setErrorBanner(null)
    setScanResult(null)
    const canvas = document.createElement('canvas')
    canvas.width = 250
    canvas.height = 250
    const ctx = canvas.getContext('2d')

    if (sampleType === 'blurry') {
      // Flat solid color fails Laplacian variance gate
      ctx.fillStyle = '#4ade80'
      ctx.fillRect(0, 0, 250, 250)
    } else {
      // High detail leaf texture
      const grad = ctx.createLinearGradient(0, 0, 250, 250)
      grad.addColorStop(0, '#15803d')
      grad.addColorStop(0.5, '#22c55e')
      grad.addColorStop(1, '#166534')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.ellipse(125, 125, 90, 50, Math.PI / 4, 0, 2 * Math.PI)
      ctx.fill()

      if (sampleType === 'diseased') {
        // Draw necrotic concentric spots
        ctx.fillStyle = '#78350f'
        ctx.beginPath()
        ctx.arc(100, 110, 18, 0, 2 * Math.PI)
        ctx.arc(150, 140, 14, 0, 2 * Math.PI)
        ctx.fill()
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    canvas.toBlob((blob) => {
      const file = new File([blob], `${sampleType}_specimen.jpg`, { type: 'image/jpeg' })
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }, 'image/jpeg')
  }

  const handleFileSelect = (e) => {
    setErrorBanner(null)
    setScanResult(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 8 * 1024 * 1024) {
      toast.show('File exceeds maximum size limit of 8 MB', 'error')
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const runScan = async () => {
    if (!selectedFile) {
      toast.show('Please select or capture a leaf photo first', 'error')
      return
    }

    setScanning(true)
    setErrorBanner(null)
    setScanResult(null)
    setScanStep(1)

    const timer1 = setTimeout(() => setScanStep(2), 500)
    const timer2 = setTimeout(() => setScanStep(3), 1100)
    const timer3 = setTimeout(() => setScanStep(4), 1700)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('crop', farmer.crop || '')
      formData.append('language', 'en')
      formData.append('lat', String(region.lat || 12.97))
      formData.append('lon', String(region.lon || 77.59))

      const res = await api.plantScan.scan(formData)
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)

      if (res.status === 'retake_required') {
        setErrorBanner({
          type: 'quality_failed',
          title: 'Photo Quality Check Failed',
          message: res.error || 'Please retake with steady focus and natural daylight.',
        })
      } else if (res.status === 'not_a_plant') {
        setErrorBanner({
          type: 'not_plant',
          title: 'Specimen Unrecognized',
          message: res.error || 'The image does not appear to be a crop leaf.',
        })
      } else {
        setScanResult(res)
        toast.show('Plant infection analysis complete', 'success')
      }
    } catch (err) {
      setErrorBanner({
        type: 'api_error',
        title: 'Analysis Error',
        message: err.message || 'Failed to complete plant scan. Check connection.',
      })
    } finally {
      setScanning(false)
      setScanStep(0)
    }
  }

  const getSeverityBadge = (sev) => {
    const s = (sev || 'Moderate').toLowerCase()
    if (s === 'critical' || s === 'high') return <span className="badge badge-red">{sev}</span>
    if (s === 'moderate') return <span className="badge badge-amber">{sev}</span>
    return <span className="badge badge-green">{sev}</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Upload Zone */}
      <div style={{
        border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)',
        padding: '24px 20px', textAlign: 'center', background: 'var(--bg-glass)',
        transition: 'var(--transition)',
      }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {previewUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 140, height: 140, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--accent-green)', boxShadow: 'var(--shadow-card)' }}>
              <img src={previewUrl} alt="Leaf Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="camera" size={13} />
                <span>Choose Different Photo</span>
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={runScan}
                disabled={scanning}
                style={{ minWidth: 120, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Icon name={scanning ? 'clock' : 'scan'} size={13} />
                <span>{scanning ? 'Scanning...' : 'Analyze Leaf'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-sm)', margin: '0 auto 12px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-green)',
            }}>
              <Icon name="leaf" size={22} />
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
              Capture or Upload Crop Leaf
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: 16 }}>
              Hold camera steady in good daylight. ViT + Vision-LLM will verify foliar disease & prescribe targeted treatment.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="camera" size={13} />
                <span>Upload Leaf Photo</span>
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleLoadSample('diseased')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="leaf" size={13} />
                <span>Load Sample Leaf</span>
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleLoadSample('blurry')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="alert" size={13} />
                <span>Test Blur Gate</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scanning Step Narration */}
      {scanning && (
        <div style={{
          padding: '14px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="dot dot-green dot-pulse" />
            <span>Analyzing foliar tissue...</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div style={{ color: scanStep >= 1 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              {scanStep >= 1 ? '✓' : '○'} Step 1: Checking blur Laplacian variance & exposure
            </div>
            <div style={{ color: scanStep >= 2 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              {scanStep >= 2 ? '✓' : '○'} Step 2: Running ViT foliar pathology classifier
            </div>
            <div style={{ color: scanStep >= 3 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              {scanStep >= 3 ? '✓' : '○'} Step 3: Reviewing symptoms with Vision-LLM pathologist
            </div>
            <div style={{ color: scanStep >= 4 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              {scanStep >= 4 ? '✓' : '○'} Step 4: Correlating live weather & spore microclimate
            </div>
          </div>
        </div>
      )}

      {/* Retake / Quality Error Banner */}
      {errorBanner && (
        <div style={{
          padding: '14px 16px', background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(239,68,68,0.2)', display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="alert" size={16} color="var(--accent-red)" />
            <span style={{ fontWeight: 600, color: 'var(--accent-red)', fontSize: '0.85rem' }}>{errorBanner.title}</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{errorBanner.message}</p>
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="camera" size={13} />
              <span>Retake Photo</span>
            </button>
          </div>
        </div>
      )}

      {/* Diagnosis Results */}
      {scanResult && (
        (() => {
          const diag = scanResult.diagnosis || scanResult.fused || scanResult
          if (!diag || !diag.disease_name && !diag.display_name) return null
          const diseaseName = diag.disease_name || diag.display_name
          const confidence = diag.confidence || 0.85
          const catalogTag = diag.catalog_tag || 'catalog'
          const explanation = diag.explanation || diag.vlm_review?.farmer_explanation
          const nextStep = diag.next_step || diag.vlm_review?.next_step
          const treatment = diag.treatment || {}
          const weatherRisk = diag.weather_risk || scanResult.weather_risk
          const interop = diag.interop || scanResult.interop

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Main Card */}
              <div style={{
                padding: '18px 20px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 2 }}>
                      Pathology Diagnosis Result
                    </div>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                      {diseaseName}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      Crop: <strong style={{ color: 'var(--text-primary)' }}>{farmer.crop}</strong> • {catalogTag}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {getSeverityBadge(treatment.severity)}
                    <span className="badge badge-blue">Quality: Passed</span>
                  </div>
                </div>

                {/* Confidence Meter (From CV Only) */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Classifier Certainty</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.round(confidence * 100)}%`,
                      background: 'var(--accent-green)',
                      borderRadius: 3,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>

                {/* Pathologist Review Notes */}
                {explanation && (
                  <div style={{
                    padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)', marginBottom: 14,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <Icon name="flask" size={13} />
                      <span>Visual Pathology Review</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {explanation}
                    </div>
                    {nextStep && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginTop: 6, fontWeight: 500 }}>
                        Immediate step: {nextStep}
                      </div>
                    )}
                  </div>
                )}

                {/* Two-Tier Treatment Recommendation */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-sm"
                      onClick={() => setActiveTreatmentTab('organic')}
                      style={{
                        background: activeTreatmentTab === 'organic' ? 'var(--accent-green)' : 'var(--bg-secondary)',
                        color: activeTreatmentTab === 'organic' ? '#fff' : 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      Tier 1: Bio-Control
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => setActiveTreatmentTab('chemical')}
                      style={{
                        background: activeTreatmentTab === 'chemical' ? 'var(--accent-amber)' : 'var(--bg-secondary)',
                        color: activeTreatmentTab === 'chemical' ? '#fff' : 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      Tier 2: Targeted Chemical
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => setActiveTreatmentTab('prevention')}
                      style={{
                        background: activeTreatmentTab === 'prevention' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                        color: activeTreatmentTab === 'prevention' ? '#fff' : 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      Tier 3: Cultural Practice
                    </button>
                  </div>

                  <div style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                    {activeTreatmentTab === 'organic' && (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--accent-green)', marginBottom: 4 }}>Eco-Friendly Biological Management</div>
                        <p style={{ color: 'var(--text-secondary)' }}>
                          {treatment.organic_treatment || 'Apply neem oil solution (1500 ppm) or copper hydroxide protectant. Spray early morning.'}
                        </p>
                      </div>
                    )}
                    {activeTreatmentTab === 'chemical' && (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--accent-amber)', marginBottom: 4 }}>Targeted Chemical Controls & PPE Advisory</div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>
                          {treatment.chemical_treatment || 'Apply systemic fungicide adhering strictly to localized dosage rates.'}
                        </p>
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icon name="alert" size={13} color="var(--accent-red)" />
                          <span>Always wear mask, eye protection, and observe minimum 7-day pre-harvest interval.</span>
                        </div>
                      </div>
                    )}
                    {activeTreatmentTab === 'prevention' && (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 4 }}>Long-Term Agronomic Sanitation</div>
                        <p style={{ color: 'var(--text-secondary)' }}>
                          {treatment.prevention || 'Ensure proper spacing for aeration. Remove and burn heavily infected foliage. Avoid overhead sprinkler irrigation.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Microclimate Weather Risk Box */}
              {weatherRisk && (
                <div style={{
                  padding: '14px 18px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', flexWrap: 'wrap', gap: 12,
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--accent-blue)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <Icon name="cloud-rain" size={13} />
                      <span>Live Microclimate Spore Risk</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                      {weatherRisk.risk_level} ({Math.round(weatherRisk.risk_score * 100)}% pressure)
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      Current: {weatherRisk.temp_c}°C • Humidity {weatherRisk.humidity_pct}%
                    </div>
                  </div>
                  <span className="source-badge">Live Open-Meteo Synced</span>
                </div>
              )}

              {/* Interop Acknowledged Stamp */}
              {interop && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8,
                  border: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-secondary)', flexWrap: 'wrap', gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>✓</span>
                    <span>{interop.ack_stamp}</span>
                    <span style={{ color: 'var(--text-muted)' }}>• ID: {interop.packet_id}</span>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    SHA-256: {interop.image_hash}...
                  </div>
                </div>
              )}
            </div>
          )
        })()
      )}

    </div>
  )
}

// ── Farmer Actions Tabs (5 Action Cards) ───────────────────────
function FarmerActions({ farmer, region, country, onEditDetails }) {
  const toast = useToastStore()
  const [tab, setTab] = useState('scan') // default to scan
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
          api.weather.current(region.lat, region.lon),
          api.weather.forecast(region.lat, region.lon, 5),
        ])
        setWeather({ current: cur.data, forecast: frc.data })
      }
      if (type === 'soil' && (!soil || force)) {
        const r = await api.soil.report(region.lat, region.lon)
        setSoil(r.data)
      }
      if (type === 'price' && (!price || force)) {
        const r = await api.prices.crop(farmer.crop, country)
        setPrice(r.data)
      }
      if (type === 'satellite' && (!ndvi || force)) {
        const r = await api.satellite.ndvi(region.lat, region.lon, 60)
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
  }, [farmer.id, region.id])

  const tabs = [
    { id: 'scan', label: 'Plant Scan', icon: 'scan' },
    { id: 'weather', label: 'Weather', icon: 'cloud-sun' },
    { id: 'soil', label: 'Soil Health', icon: 'leaf' },
    { id: 'price', label: 'Market Prices', icon: 'trending-up' },
    { id: 'satellite', label: 'Satellite NDVI', icon: 'network' },
  ]

  return (
    <div className="card" style={{ padding: 24 }}>
      {/* Farmer Profile Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent-green)', flexShrink: 0,
        }}>
          <Icon name="farmer" size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: 2, fontWeight: 600 }}>{farmer.farmer_name || farmer.name}</h3>
            {farmer.phone && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({farmer.phone})</span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            {farmer.area_ha} ha (≈ {(farmer.area_ha * 2.47105).toFixed(1)} acres) • {farmer.crop} • {region.name}, {country}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="badge badge-green">{farmer.crop}</span>
          <span className="badge badge-blue">{farmer.area_ha} ha</span>
          <button className="btn btn-secondary btn-sm" onClick={onEditDetails} style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="edit" size={13} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* 5 Action Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', overflowX: 'auto', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id}
            id={`farmer-tab-${t.id}`}
            onClick={() => { setTab(t.id); load(t.id) }}
            style={{
              background: tab === t.id ? 'var(--bg-secondary)' : 'none',
              border: 'none', borderBottom: tab === t.id ? '2px solid var(--accent-green)' : '2px solid transparent',
              color: tab === t.id ? 'var(--accent-green)' : 'var(--text-secondary)',
              padding: '10px 16px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
              fontFamily: 'var(--font-sans)', transition: 'all 0.15s', borderRadius: '4px 4px 0 0',
              whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <Icon name={t.icon} size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="fade-in" key={tab}>
        {tab === 'scan' && (
          <PlantScanCard farmer={farmer} region={region} />
        )}

        {tab === 'weather' && (
          <div>
            {loading.weather && <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />}
            {weather?.current && (
              <div>
                <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Temperature', value: `${weather.current.temperature_2m?.toFixed(1)}°C`, icon: 'thermometer' },
                    { label: 'Humidity', value: `${weather.current.relative_humidity_2m?.toFixed(0)}%`, icon: 'droplet' },
                    { label: 'Wind Speed', value: `${weather.current.wind_speed_10m?.toFixed(1)} km/h`, icon: 'wind' },
                    { label: 'Precipitation', value: `${weather.current.precipitation?.toFixed(1)} mm`, icon: 'rain' },
                  ].map(({ label, value, icon }) => (
                    <div key={label} style={{ padding: '12px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon name={icon} size={13} />
                        <span>{label}</span>
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {weather.forecast && weather.forecast.length > 0 && (
                  <div style={{ marginTop: 16, marginBottom: 16 }}>
                    <h4 style={{ fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-secondary)' }}>5-Day Daily Outlook</h4>
                    <div className="grid-3" style={{ gap: 8 }}>
                      {weather.forecast.slice(0, 5).map((f, idx) => (
                        <div key={idx} style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.75rem' }}>
                          <div style={{ fontWeight: 600 }}>{f.date}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                            <span>High: <strong>{f.temperature_max?.toFixed(1)}°C</strong></span>
                            <span style={{ color: 'var(--text-muted)' }}>Low: {f.temperature_min?.toFixed(1)}°C</span>
                          </div>
                          <div style={{ color: 'var(--accent-blue)', marginTop: 2 }}>Rain: {f.precipitation_sum?.toFixed(1)} mm</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="provenance-bar">
                  <span className="source-badge">Open-Meteo API</span>
                  <span>Lat: {region.lat}, Lon: {region.lon}</span>
                  <span className="badge badge-green">LIVE</span>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'soil' && (
          <SoilHealthView soil={soil} loading={loading.soil} farmer={farmer} region={region} />
        )}

        {tab === 'price' && (
          <div>
            {loading.price && <div className="skeleton" style={{ height: 100, borderRadius: 8 }} />}
            {price && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
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
                      <div key={i} title={`NDVI: ${p.ndvi} (${p.date})`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: '100%', height: `${h}px`, background: color, borderRadius: '3px 3px 1px 1px', opacity: 0.85 }} />
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

// ── Farmer Profile Form (Part A) ───────────────────────────────
function FarmerRegistrationForm({ region, country, initialProfile, onSave, onCancel }) {
  const toast = useToastStore()
  const [name, setName] = useState(initialProfile?.farmer_name || initialProfile?.name || '')
  const [phone, setPhone] = useState(initialProfile?.phone || '')
  const [phoneHelp, setPhoneHelp] = useState('')
  const [unit, setUnit] = useState('ha') // 'ha' or 'ac'
  const [areaInput, setAreaInput] = useState(initialProfile?.area_ha ? String(initialProfile.area_ha) : '2.5')
  const [cropInput, setCropInput] = useState(initialProfile?.crop || (region.typical_crops?.[0] || 'wheat'))
  const [cropList, setCropList] = useState([])
  const [cropSuggestions, setCropSuggestions] = useState([])
  const [showCropDropdown, setShowCropDropdown] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load >= 40 crops from API
  useEffect(() => {
    api.crops.list().then(res => {
      if (res && res.crops) {
        setCropList(res.crops)
      }
    }).catch(() => {})
  }, [])

  // Crop filter autocomplete
  useEffect(() => {
    if (!cropInput || cropInput.length < 1) {
      setCropSuggestions([])
      return
    }
    const q = cropInput.toLowerCase().trim()
    const matches = cropList.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.scientific_name && c.scientific_name.toLowerCase().includes(q))
    ).slice(0, 8)
    setCropSuggestions(matches)
  }, [cropInput, cropList])

  // Area conversion calculation
  const areaHa = unit === 'ha' ? parseFloat(areaInput) || 0 : (parseFloat(areaInput) || 0) / 2.47105
  const areaAc = unit === 'ac' ? parseFloat(areaInput) || 0 : (parseFloat(areaInput) || 0) * 2.47105

  // Phone validation feedback
  const handlePhoneChange = (val) => {
    setPhone(val)
    if (!val) {
      setPhoneHelp('')
      return
    }
    if (country === 'India') {
      const clean = val.replace(/\D/g, '')
      if (clean.length === 10 && /^[6-9]/.test(clean)) {
        setPhoneHelp('✓ Valid 10-digit mobile number')
      } else {
        setPhoneHelp('Enter 10 digits starting with 6, 7, 8, or 9')
      }
    } else {
      const clean = val.replace(/\D/g, '')
      if (clean.length >= 7 && clean.length <= 15) {
        setPhoneHelp('✓ Valid telephone format')
      } else {
        setPhoneHelp('Enter valid contact number')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.show('Please enter your name', 'error')
      return
    }
    if (areaHa < 0.1 || areaHa > 500) {
      toast.show('Land area must be between 0.1 and 500 hectares (0.25 to 1235 acres)', 'error')
      return
    }
    if (!cropInput.trim()) {
      toast.show('Please specify your main crop', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        area_ha: Math.round(areaHa * 100) / 100,
        crop: cropInput.trim().toLowerCase(),
        region_id: region.id,
        country: country,
      }

      const res = await api.farms.adhoc(payload)
      const farmRecord = res.farm || res
      // Persist profile
      localStorage.setItem(STORAGE_KEY, JSON.stringify(farmRecord))
      toast.show(`Farm registered for ${farmRecord.farmer_name}`, 'success')
      onSave(farmRecord)
    } catch (err) {
      toast.show(err.message || 'Could not save details', 'error')
    } finally {
      setSaving(false)
    }
  }

  const isCatalogCrop = cropList.some(c => c.name.toLowerCase() === cropInput.toLowerCase().trim())

  return (
    <div className="card" style={{ maxWidth: 540, margin: '0 auto', padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="farmer" size={18} color="var(--accent-green)" />
            <span>Farm Profile Details</span>
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Tell us about your land in <strong>{region.name}, {country}</strong>
          </p>
        </div>
        {onCancel && (
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Field 1: Farmer Name */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            1. Farmer Full Name <span style={{ color: 'var(--accent-red)' }}>*</span>
          </label>
          <input
            id="farmer-input-name"
            className="input"
            type="text"
            placeholder="e.g. Ramesh Patel"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        {/* Field 2: Phone (Optional) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              2. Mobile Phone Number <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(Optional)</span>
            </label>
            {phoneHelp && (
              <span style={{ fontSize: '0.7rem', color: phoneHelp.startsWith('✓') ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                {phoneHelp}
              </span>
            )}
          </div>
          <input
            id="farmer-input-phone"
            className="input"
            type="tel"
            placeholder={country === 'India' ? '98765 43210 (10 digits)' : '+55 11 98765-4321'}
            value={phone}
            onChange={e => handlePhoneChange(e.target.value)}
          />
        </div>

        {/* Field 3: Land Area with Hectare/Acre Toggle */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              3. Land Area <span style={{ color: 'var(--accent-red)' }}>*</span>
            </label>
            {/* Unit Toggle Switch */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 6, padding: 2, border: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => setUnit('ha')}
                style={{
                  padding: '3px 8px', fontSize: '0.7rem', fontWeight: 600, border: 'none', borderRadius: 4, cursor: 'pointer',
                  background: unit === 'ha' ? 'var(--accent-green)' : 'transparent',
                  color: unit === 'ha' ? '#fff' : 'var(--text-secondary)',
                }}
              >Hectares (ha)</button>
              <button
                type="button"
                onClick={() => setUnit('ac')}
                style={{
                  padding: '3px 8px', fontSize: '0.7rem', fontWeight: 600, border: 'none', borderRadius: 4, cursor: 'pointer',
                  background: unit === 'ac' ? 'var(--accent-green)' : 'transparent',
                  color: unit === 'ac' ? '#fff' : 'var(--text-secondary)',
                }}
              >Acres (ac)</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              id="farmer-input-area"
              className="input"
              type="number"
              step="0.1"
              min="0.1"
              max="1500"
              value={areaInput}
              onChange={e => setAreaInput(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: 28 }}>
              {unit}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {unit === 'ha' ? `≈ ${areaAc.toFixed(2)} acres` : `≈ ${areaHa.toFixed(2)} hectares`}
          </div>
        </div>

        {/* Field 4: Main Crop with Autocomplete */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              4. Main Cultivated Crop <span style={{ color: 'var(--accent-red)' }}>*</span>
            </label>
            {cropInput && (
              <span className={`badge ${isCatalogCrop ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                {isCatalogCrop ? 'Catalog Verified' : 'Custom Crop'}
              </span>
            )}
          </div>
          <input
            id="farmer-input-crop"
            className="input"
            type="text"
            placeholder="Type crop name (e.g. Wheat, Rice, Coffee, Soybean)..."
            value={cropInput}
            onChange={e => { setCropInput(e.target.value); setShowCropDropdown(true) }}
            onFocus={() => setShowCropDropdown(true)}
            required
          />

          {showCropDropdown && cropSuggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
              boxShadow: 'var(--shadow-card-hover)', maxHeight: 200, overflowY: 'auto', marginTop: 4,
            }}>
              {cropSuggestions.map(c => (
                <div
                  key={c.id}
                  onClick={() => {
                    setCropInput(c.name)
                    setShowCropDropdown(false)
                  }}
                  style={{
                    padding: '8px 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 8 }}>{c.scientific_name}</span>
                  </div>
                  <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{c.category}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick chip suggestions from regional typical crops */}
          {region.typical_crops && region.typical_crops.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Typical in {region.name}:</span>
              {region.typical_crops.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCropInput(c)}
                  style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: 4, padding: '2px 8px', fontSize: '0.68rem', cursor: 'pointer',
                    color: 'var(--text-primary)',
                  }}
                >
                  + {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          id="farmer-form-submit-btn"
          className="btn btn-primary"
          type="submit"
          disabled={saving}
          style={{ width: '100%', marginTop: 8 }}
        >
          {saving ? 'Saving...' : 'Enter Intelligence Workspace →'}
        </button>
      </form>
    </div>
  )
}

// ── Main Farmer App Component ──────────────────────────────────
export default function FarmerApp() {
  const toast = useToastStore()
  const [step, setStep] = useState('country') // 'country' | 'region' | 'farmer'
  const [country, setCountry] = useState(null)
  const [regions, setRegions] = useState([])
  const [regionWeather, setRegionWeather] = useState({})
  const [loadingRegions, setLoadingRegions] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [farmer, setFarmer] = useState(null)
  const [editingFarmer, setEditingFarmer] = useState(false)

  // On mount: check localStorage for remembered profile
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && parsed.farmer_name) {
          // Pre-populate farmer
          setFarmer(parsed)
          if (parsed.country) setCountry(parsed.country)
        }
      }
    } catch {}
  }, [])

  // When country is selected, fetch exactly 3 regions and batched weather
  const handleSelectCountry = async (cName) => {
    setCountry(cName)
    setSelectedRegion(null)
    setLoadingRegions(true)
    setStep('region')

    try {
      const res = await api.regions.list(cName)
      const list = res.regions || res || []
      setRegions(list)

      // Open-Meteo ONE batched call for the 3 regions
      if (list.length > 0) {
        const coordsStr = list.map(r => `${r.latitude || r.lat},${r.longitude || r.lon}`).join(';')
        const batchRes = await api.weather.batch(coordsStr)
        const batchItems = batchRes.batch || (batchRes.data && batchRes.data.results) || []
        if (Array.isArray(batchItems) && batchItems.length > 0) {
          const map = {}
          batchItems.forEach((item, idx) => {
            if (list[idx]) {
              map[list[idx].id] = item
            }
          })
          setRegionWeather(map)
        }
      }

    } catch (err) {
      toast.show(`Could not load regions: ${err.message}`, 'error')
    } finally {
      setLoadingRegions(false)
    }
  }

  // When region is selected
  const handleSelectRegion = (r) => {
    const formatted = {
      ...r,
      lat: r.latitude || r.lat,
      lon: r.longitude || r.lon,
    }
    setSelectedRegion(formatted)
    setStep('farmer')
  }

  // Handle switching user / clear profile
  const handleNotMe = () => {
    localStorage.removeItem(STORAGE_KEY)
    setFarmer(null)
    setEditingFarmer(false)
    toast.show('Profile cleared. Enter new details.', 'info')
  }

  return (
    <div className="fade-in">
      {/* Header & Breadcrumb */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="farmer" size={24} color="var(--accent-green)" />
          <span>Farmer Intelligence Workspace</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Live microclimate weather, ISRIC soil profiles, plant infection vision scan, and market intelligence
        </p>

        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setStep('country'); setCountry(null); setSelectedRegion(null); setEditingFarmer(false) }}
            style={{
              background: country ? 'var(--bg-secondary)' : 'none',
              border: 'none', color: country ? 'var(--accent-green)' : 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', padding: '3px 8px', borderRadius: 4,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
            <Icon name="globe" size={12} />
            <span>Country</span>
          </button>

          {country && (
            <>
              <span style={{ color: 'var(--text-muted)' }}>›</span>
              <button
                onClick={() => { setStep('region'); setSelectedRegion(null); setEditingFarmer(false) }}
                style={{
                  background: selectedRegion ? 'var(--bg-secondary)' : 'none',
                  border: 'none', color: selectedRegion ? 'var(--accent-green)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', padding: '3px 8px', borderRadius: 4,
                }}>
                {country}
              </button>
            </>
          )}

          {selectedRegion && (
            <>
              <span style={{ color: 'var(--text-muted)' }}>›</span>
              <button
                onClick={() => { setStep('farmer'); setEditingFarmer(false) }}
                style={{
                  background: farmer ? 'var(--bg-secondary)' : 'none',
                  border: 'none', color: farmer ? 'var(--accent-green)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', padding: '3px 8px', borderRadius: 4,
                }}>
                {selectedRegion.name}
              </button>
            </>
          )}

          {farmer && (
            <>
              <span style={{ color: 'var(--text-muted)' }}>›</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{farmer.farmer_name || farmer.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Step 1: Country Selection (6 Countries) */}
      {step === 'country' && (
        <div className="fade-in">
          <h3 style={{ fontSize: '0.95rem', marginBottom: 16, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Select your country to access local agricultural intelligence
          </h3>
          <div className="grid-3">
            {COUNTRIES_DATA.map(c => (
              <button
                key={c.id}
                id={`country-${c.id.toLowerCase().replace(' ', '-')}`}
                onClick={() => handleSelectCountry(c.id)}
                className="card"
                style={{
                  padding: '22px 18px', border: '1px solid var(--border)', cursor: 'pointer',
                  background: 'var(--bg-card)', textAlign: 'center', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>{c.flag}</span>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                    padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: 4,
                    border: '1px solid var(--border)', color: 'var(--text-muted)'
                  }}>
                    {c.code}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: 4, color: 'var(--text-primary)' }}>{c.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  3 agro-ecological regions
                </div>
                <div style={{ marginTop: 10 }}>
                  <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>Currency: {c.currency}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Region Selection (Exactly 3 Regions with Batched Live Weather) */}
      {step === 'region' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Select an agro-ecological region in <strong>{country}</strong>
            </h3>
            <span className="source-badge">Open-Meteo Batched Sync</span>
          </div>

          {loadingRegions ? (
            <div className="grid-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 12 }} />)}
            </div>
          ) : (
            <div className="grid-3">
              {regions.map(r => {
                const w = regionWeather[r.id]
                return (
                  <button
                    key={r.id}
                    id={`region-${r.id.toLowerCase()}`}
                    onClick={() => handleSelectRegion(r)}
                    className="card"
                    style={{
                      padding: '20px', border: '1px solid var(--border)', cursor: 'pointer',
                      background: 'var(--bg-card)', textAlign: 'left', transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column', gap: 10,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {r.name}
                      </div>
                      <span className="badge badge-green">LIVE</span>
                    </div>

                    {/* Live Weather Pill */}
                    {w ? (
                      <div style={{
                        padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Icon name="thermometer" size={12} />
                          <strong>{w.temperature_2m?.toFixed(1)}°C</strong>
                        </span>
                        <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Icon name="droplet" size={12} />
                          {w.relative_humidity_2m?.toFixed(0)}%
                        </span>
                        <span style={{ color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Icon name="wind" size={12} />
                          {w.wind_speed_10m?.toFixed(0)} km/h
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Loading live metrics...</div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {r.climate} • Centroid: {(r.latitude || r.lat)?.toFixed(2)}°N, {(r.longitude || r.lon)?.toFixed(2)}°E
                    </div>

                    {r.soil_hint && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Icon name="leaf" size={11} color="var(--accent-amber)" />
                        <span>Soil: {r.soil_hint}</span>
                      </div>
                    )}

                    {r.typical_crops && r.typical_crops.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 'auto' }}>
                        {r.typical_crops.slice(0, 3).map(crop => (
                          <span key={crop} className="badge badge-green" style={{ fontSize: '0.62rem' }}>
                            {crop}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Farmer Form / Profile Workspace */}
      {step === 'farmer' && selectedRegion && (
        <div className="fade-in">
          {/* If farmer profile is stored and not editing */}
          {farmer && !editingFarmer ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Profile Bar with "Not me" and "Edit" */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 18px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent-green)',
                  }}>
                    <Icon name="farmer" size={16} />
                  </div>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Active Farmer: <strong style={{ color: 'var(--text-primary)' }}>{farmer.farmer_name || farmer.name}</strong> ({farmer.crop}, {farmer.area_ha} ha)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingFarmer(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="edit" size={12} />
                    <span>Edit Details</span>
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleNotMe}>
                    <span>Switch Farmer</span>
                  </button>
                </div>
              </div>

              {/* 5 Action Cards Workspace */}
              <FarmerActions
                farmer={farmer}
                region={selectedRegion}
                country={country}
                onEditDetails={() => setEditingFarmer(true)}
              />
            </div>
          ) : (
            /* Farmer Registration Form */
            <FarmerRegistrationForm
              region={selectedRegion}
              country={country}
              initialProfile={farmer}
              onSave={(newFarm) => {
                setFarmer(newFarm)
                setEditingFarmer(false)
              }}
              onCancel={farmer ? () => setEditingFarmer(false) : null}
            />
          )}
        </div>
      )}
    </div>
  )
}
