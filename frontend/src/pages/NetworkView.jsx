import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useToastStore } from '../stores'
import { Icon } from '../components/ui/Icons'

// ── Node simulation ────────────────────────────────────────────
const NODES = [
  { id: 'A', name: 'Node Alpha', country: 'India', status: 'online', lat: 12.97, lon: 77.59, farms: 8, packets: 1247 },
  { id: 'B', name: 'Node Beta', country: 'Kenya', status: 'online', lat: -1.29, lon: 36.82, farms: 5, packets: 834 },
  { id: 'C', name: 'Node Gamma', country: 'Nigeria', status: 'online', lat: 6.52, lon: 3.38, farms: 6, packets: 612 },
  { id: 'D', name: 'Node Delta', country: 'Ghana', status: 'degraded', lat: 5.55, lon: -0.20, farms: 3, packets: 289 },
]

// ── Packet log ─────────────────────────────────────────────────
const SAMPLE_PACKETS = [
  { id: 'PKT-001', from: 'A', to: 'B', type: 'farm_alert', status: 'accepted', time: '2m ago', sig: 'valid' },
  { id: 'PKT-002', from: 'B', to: 'A', type: 'price_update', status: 'accepted', time: '5m ago', sig: 'valid' },
  { id: 'PKT-003', from: 'A', to: 'C', type: 'outbreak_warning', status: 'accepted', time: '12m ago', sig: 'valid' },
  { id: 'PKT-004', from: 'D', to: 'A', type: 'farm_alert', status: 'rejected', time: '18m ago', sig: 'invalid' },
  { id: 'PKT-005', from: 'C', to: 'B', type: 'weather_sync', status: 'accepted', time: '23m ago', sig: 'valid' },
  { id: 'PKT-006', from: 'A', to: 'D', type: 'price_update', status: 'accepted', time: '31m ago', sig: 'valid' },
]

export default function NetworkView() {
  const toast = useToastStore()
  const [packets, setPackets] = useState(SAMPLE_PACKETS)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)

  // Simulate packet reception every 8 seconds
  useEffect(() => {
    const types = ['farm_alert', 'price_update', 'weather_sync', 'outbreak_warning', 'ndvi_update']
    const nodes = ['A', 'B', 'C', 'D']
    const id = setInterval(() => {
      const from = nodes[Math.floor(Math.random() * nodes.length)]
      let to = nodes[Math.floor(Math.random() * nodes.length)]
      while (to === from) to = nodes[Math.floor(Math.random() * nodes.length)]
      const type = types[Math.floor(Math.random() * types.length)]
      setPackets(p => [{
        id: `PKT-${String(Date.now()).slice(-4)}`,
        from, to, type,
        status: Math.random() > 0.1 ? 'accepted' : 'rejected',
        time: 'just now',
        sig: Math.random() > 0.1 ? 'valid' : 'invalid',
      }, ...p].slice(0, 20))
    }, 8000)
    return () => clearInterval(id)
  }, [])

  const runInteropTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      // 1. Get a new packet template
      const tpl = await api.interop.newPacket()
      // 2. Sign it
      const { signature } = await api.interop.sign(tpl)
      // 3. Send signed packet
      const ack = await api.interop.send({ ...tpl, signature })
      setTestResult({ success: ack.accepted, reason: ack.reason, packet_id: ack.packet_id, signed: true })
      toast.show(`Packet ${ack.packet_id.slice(0, 8)}… ${ack.accepted ? 'accepted ✅' : 'rejected ❌'}`, ack.accepted ? 'success' : 'error')

      // 4. Test tampered packet (should be rejected)
      const tamperedAck = await api.interop.send({ ...tpl, signature: 'tampered-invalid-sig' })
      setTestResult(prev => ({ ...prev, tamperTest: { accepted: tamperedAck.accepted, reason: tamperedAck.reason } }))
    } catch (e) {
      setTestResult({ success: false, reason: e.message })
      toast.show('Interop test failed: ' + e.message, 'error')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="globe" size={24} color="var(--accent-blue)" />
          <span>Network View</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Multi-node interoperability monitor • HMAC-SHA256 signed packets
        </p>
      </div>

      {/* Node status grid */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {NODES.map(node => (
          <div key={node.id} className="card"
            style={{ padding: '18px 20px', cursor: 'pointer', border: `1px solid ${selectedNode?.id === node.id ? 'var(--accent-green)' : 'var(--border)'}`, transition: 'all 0.2s' }}
            onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>Node {node.id}</span>
              <span className={`badge badge-${node.status === 'online' ? 'green' : 'amber'}`}>
                <span className={`dot dot-${node.status === 'online' ? 'green' : 'amber'} dot-pulse`} style={{ width: 5, height: 5 }} />
                {node.status}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{node.name} • {node.country}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div><span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-green)' }}>{node.farms}</span><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 3 }}>farms</span></div>
              <div><span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{node.packets.toLocaleString()}</span><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 3 }}>packets</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Packet log */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem' }}>📦 Live Packet Stream</h3>
            <span className="badge badge-green">
              <span className="dot dot-green dot-pulse" style={{ width: 5, height: 5 }} />
              Auto-refreshing
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {packets.map((p, i) => (
              <div key={p.id} className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 8, border: `1px solid ${p.status === 'rejected' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}` }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>{p.id}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  <strong style={{ color: 'var(--accent-green)' }}>Node {p.from}</strong> → <strong style={{ color: 'var(--accent-blue)' }}>Node {p.to}</strong>
                </span>
                <span className="badge badge-blue" style={{ fontSize: '0.6rem', flexShrink: 0 }}>{p.type}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <span className={`badge badge-${p.sig === 'valid' ? 'green' : 'red'}`} style={{ fontSize: '0.6rem' }}>sig:{p.sig}</span>
                  <span className={`badge badge-${p.status === 'accepted' ? 'green' : 'red'}`} style={{ fontSize: '0.6rem' }}>{p.status}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{p.time}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Interop test */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>🔐 Interop Test Suite</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Test the full A→B packet flow with HMAC-SHA256 signature verification. Tampered packets should be rejected.
            </p>
            <button id="run-interop-test" className="btn btn-primary" style={{ width: '100%' }} onClick={runInteropTest} disabled={testing}>
              {testing ? '⏳ Testing…' : '▶ Run Interop Test'}
            </button>

            {testResult && (
              <div className="fade-in" style={{ marginTop: 16 }}>
                <div style={{ padding: '12px 14px', background: testResult.success ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: 8, border: `1px solid ${testResult.success ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>
                    {testResult.success ? '✅ Signed packet accepted' : '❌ Signed packet rejected'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    Packet: {testResult.packet_id?.slice(0, 16)}…<br />
                    {testResult.reason}
                  </div>
                </div>
                {testResult.tamperTest && (
                  <div style={{ padding: '12px 14px', background: !testResult.tamperTest.accepted ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: 8, border: `1px solid ${!testResult.tamperTest.accepted ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>
                      {!testResult.tamperTest.accepted ? '✅ Tampered packet rejected' : '❌ Tampered packet wrongly accepted!'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{testResult.tamperTest.reason}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Network topology viz */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="network" size={16} color="var(--accent-blue)" />
              <span>Topology</span>
            </h3>
            <svg viewBox="0 0 300 260" style={{ width: '100%' }}>
              {/* Links */}
              {[['A','B'], ['A','C'], ['A','D'], ['B','C'], ['C','D']].map(([f, t]) => {
                const pos = { A: [150, 60], B: [60, 180], C: [240, 180], D: [150, 230] }
                return <line key={`${f}-${t}`} x1={pos[f][0]} y1={pos[f][1]} x2={pos[t][0]} y2={pos[t][1]} stroke="rgba(59,130,246,0.2)" strokeWidth="1.5" strokeDasharray="4,3" />
              })}
              {/* Nodes */}
              {NODES.map(node => {
                const pos = { A: [150, 60], B: [60, 180], C: [240, 180], D: [150, 230] }
                const [x, y] = pos[node.id]
                const color = node.status === 'online' ? '#22c55e' : '#f59e0b'
                return (
                  <g key={node.id}>
                    <circle cx={x} cy={y} r={26} fill="rgba(13,23,42,0.9)" stroke={color} strokeWidth="2" />
                    <circle cx={x} cy={y} r={30} fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />
                    <text x={x} y={y - 2} textAnchor="middle" fill={color} fontSize="13" fontWeight="bold" fontFamily="Space Grotesk">Node {node.id}</text>
                    <text x={x} y={y + 12} textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="Inter">{node.country}</text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
