import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useToastStore } from './stores'

// Pages
import Dashboard from './pages/Dashboard'
import FarmerApp from './pages/FarmerApp'
import NetworkView from './pages/NetworkView'
import FieldScene from './pages/FieldScene'
import AdvisoryPage from './pages/AdvisoryPage'

// Icons as SVG components
const Icon = ({ d, size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ICONS = {
  globe: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0c-2.76 0-5 4.48-5 10s2.24 10 5 10 5-4.48 5-10-2.24-10-5-10zM2 12h20',
  farmer: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  network: 'M22 12h-4l-3 9L9 3l-3 9H2',
  field: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  advisory: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  alert: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  leaf: 'M17 8C8 10 5.9 16.17 3.82 22M11.6 8c-2.16 3.29-1.7 7.85-.85 11.85',
}

const navItems = [
  { to: '/', label: 'Globe Dashboard', icon: ICONS.globe, exact: true },
  { to: '/farmer', label: 'Farmer App', icon: ICONS.farmer },
  { to: '/network', label: 'Network View', icon: ICONS.network },
  { to: '/field', label: 'Field Scene', icon: ICONS.field },
  { to: '/advisory', label: 'Ask AgriN', icon: ICONS.advisory },
]

function Sidebar({ alerts }) {
  const [online, setOnline] = useState(true)
  const [theme, setTheme] = useState(() => localStorage.getItem('agrin-theme') || 'light')

  useEffect(() => {
    const handler = () => setOnline(navigator.onLine)
    window.addEventListener('online', handler)
    window.addEventListener('offline', handler)
    return () => { window.removeEventListener('online', handler); window.removeEventListener('offline', handler) }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('agrin-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(t => (t === 'light' ? 'dark' : 'light'))
  }

  return (
    <nav className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-logo">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="16" fill="rgba(5,150,105,0.12)" />
          <path d="M16 6C10.477 6 6 10.477 6 16s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6z" stroke="var(--accent-green)" strokeWidth="1.5" />
          <path d="M16 6c-2.761 0-5 4.477-5 10s2.239 10 5 10 5-4.477 5-10-2.239-10-5-10z" stroke="var(--accent-green)" strokeWidth="1.5" />
          <line x1="6" y1="16" x2="26" y2="16" stroke="var(--accent-green)" strokeWidth="1.5" />
          <path d="M9 10.5c2 1.5 5 2.5 7 2.5s5-1 7-2.5" stroke="var(--accent-green)" strokeWidth="1" />
        </svg>
        <span className="sidebar-logo-text">AgriN v2</span>
      </div>

      {navItems.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <Icon d={icon} size={17} />
          {label}
          {to === '/advisory' && <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: '0.6rem' }}>AI</span>}
        </NavLink>
      ))}

      <div style={{ marginTop: 'auto', padding: '12px 6px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span className={`dot dot-${online ? 'green' : 'red'} dot-pulse`} />
          {online ? 'All systems live' : 'Offline mode'}
        </div>
        {alerts > 0 && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--accent-amber)' }}>
            <Icon d={ICONS.alert} size={13} color="var(--accent-amber)" />
            {alerts} active alert{alerts > 1 ? 's' : ''}
          </div>
        )}
        <button
          onClick={toggleTheme}
          id="theme-toggle"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', marginTop: 12, padding: '7px 10px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600,
            fontFamily: 'var(--font-sans)', transition: 'var(--transition)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          title="Toggle color theme"
        >
          <span>Appearance</span>
          <span>{theme === 'light' ? '☀️ Light' : '🌙 Dark'}</span>
        </button>
      </div>
    </nav>
  )
}


function ToastContainer() {
  const { toasts, dismiss } = useToastStore()
  const colors = { success: 'var(--accent-green)', error: 'var(--accent-red)', info: 'var(--accent-blue)', warning: 'var(--accent-amber)' }
  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className="toast" style={{ borderLeftColor: colors[t.type], borderLeftWidth: 3 }}>
          <span style={{ color: colors[t.type], flexShrink: 0 }}>●</span>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button onClick={() => dismiss(t.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const [alertCount] = useState(2) // demo

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <>
      <Sidebar alerts={alertCount} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/farmer" element={<FarmerApp />} />
          <Route path="/network" element={<NetworkView />} />
          <Route path="/field" element={<FieldScene />} />
          <Route path="/advisory" element={<AdvisoryPage />} />
        </Routes>
      </main>
      <ToastContainer />
    </>
  )
}
