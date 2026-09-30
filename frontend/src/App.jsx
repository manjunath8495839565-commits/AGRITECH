import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useToastStore } from './stores'

// Pages
import Dashboard from './pages/Dashboard'
import FarmerApp from './pages/FarmerApp'
import NetworkView from './pages/NetworkView'
import FieldScene from './pages/FieldScene'
import AdvisoryPage from './pages/AdvisoryPage'

import { Icon } from './components/ui/Icons'

const navItems = [
  { to: '/', label: 'Global Operations', icon: 'globe', exact: true },
  { to: '/farmer', label: 'Farmer Workspace', icon: 'farmer' },
  { to: '/network', label: 'Network Monitor', icon: 'network' },
  { to: '/field', label: 'Field 3D Scene', icon: 'field' },
  { to: '/advisory', label: 'Agronomic Advisory', icon: 'sparkles' },
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
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="var(--accent-green)" strokeWidth="2" />
          <path d="M16 8v16M8 16h16" stroke="var(--accent-green)" strokeWidth="1.8" />
          <circle cx="16" cy="16" r="4" fill="var(--accent-green)" />
        </svg>
        <span className="sidebar-logo-text">AgriN Connect</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Icon name={icon} size={16} />
            <span>{label}</span>
            {to === '/advisory' && (
              <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: '0.62rem', padding: '1px 5px' }}>
                AI
              </span>
            )}
          </NavLink>
        ))}
      </div>

      <div style={{ marginTop: 'auto', padding: '12px 6px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
          <span className={`dot dot-${online ? 'green' : 'red'} dot-pulse`} />
          <span>{online ? 'Telemetry Live' : 'Offline'}</span>
        </div>
        {alerts > 0 && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--accent-amber)' }}>
            <Icon name="alert" size={13} color="var(--accent-amber)" />
            <span>{alerts} Active alerts</span>
          </div>
        )}
        <button
          onClick={toggleTheme}
          id="theme-toggle"
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', marginTop: 12, justifyContent: 'space-between', fontSize: '0.74rem' }}
          title="Toggle color theme"
        >
          <span>Theme</span>
          <span style={{ color: 'var(--text-muted)' }}>{theme === 'light' ? 'Light' : 'Dark'}</span>
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
