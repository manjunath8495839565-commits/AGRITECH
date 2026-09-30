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

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('agrin-theme') || 'light')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('agrin-theme', theme)
  }, [theme])
  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))
  return [theme, toggleTheme]
}

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const handler = () => setOnline(navigator.onLine)
    window.addEventListener('online', handler)
    window.addEventListener('offline', handler)
    return () => {
      window.removeEventListener('online', handler)
      window.removeEventListener('offline', handler)
    }
  }, [])
  return online
}

function Sidebar({ alerts, theme, toggleTheme, online }) {
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

function MobileHeader({ theme, toggleTheme, online }) {
  return (
    <header className="mobile-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="var(--accent-green)" strokeWidth="2.2" />
          <path d="M16 8v16M8 16h16" stroke="var(--accent-green)" strokeWidth="2" />
          <circle cx="16" cy="16" r="4" fill="var(--accent-green)" />
        </svg>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
          AgriN Connect
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: 'var(--bg-secondary)', borderRadius: 12, fontSize: '0.68rem' }}>
          <span className={`dot dot-${online ? 'green' : 'red'} dot-pulse`} />
          <span style={{ color: 'var(--text-secondary)' }}>{online ? 'Live' : 'Off'}</span>
        </div>
        <button
          onClick={toggleTheme}
          className="btn-icon btn-secondary"
          style={{ padding: 6, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Toggle theme"
        >
          <Icon name={theme === 'light' ? 'moon' : 'sun'} size={15} />
        </button>
      </div>
    </header>
  )
}

function MobileBottomNav() {
  const mobileNavs = [
    { to: '/', label: 'Global', icon: 'globe', exact: true },
    { to: '/farmer', label: 'Farmer', icon: 'farmer' },
    { to: '/advisory', label: 'Advisor', icon: 'sparkles', badge: 'AI' },
    { to: '/field', label: '3D Field', icon: 'field' },
    { to: '/network', label: 'Mesh', icon: 'network' },
  ]

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
      {mobileNavs.map(({ to, label, icon, badge, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={18} />
            {badge && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -8,
                  fontSize: '0.55rem',
                  padding: '1px 3px',
                  borderRadius: 4,
                  background: 'var(--accent-green)',
                  color: '#ffffff',
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {badge}
              </span>
            )}
          </div>
          <span className="mobile-nav-label">{label}</span>
        </NavLink>
      ))}
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
  const [alertCount] = useState(2)
  const [theme, toggleTheme] = useTheme()
  const online = useOnlineStatus()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <>
      <Sidebar alerts={alertCount} theme={theme} toggleTheme={toggleTheme} online={online} />
      <MobileHeader theme={theme} toggleTheme={toggleTheme} online={online} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/farmer" element={<FarmerApp />} />
          <Route path="/network" element={<NetworkView />} />
          <Route path="/field" element={<FieldScene />} />
          <Route path="/advisory" element={<AdvisoryPage />} />
        </Routes>
      </main>
      <MobileBottomNav />
      <ToastContainer />
    </>
  )
}
