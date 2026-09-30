import React, { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { useToastStore } from '../stores'

const QUICK_QUESTIONS = [
  'What crops grow best in monsoon conditions?',
  'How do I treat leaf rust in wheat?',
  'When is the best time to plant rice?',
  'How much water does maize need per week?',
  'What are signs of nitrogen deficiency?',
  'How to improve soil pH naturally?',
]

const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'hi', label: '🇮🇳 Hindi (हिंदी)' },
  { code: 'sw', label: '🇰🇪 Swahili (Kiswahili)' },
  { code: 'ha', label: '🇳🇬 Hausa' },
  { code: 'fr', label: '🇫🇷 French' },
]

// Formatter to render **bold** and newlines cleanly without external deps
function FormattedText({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {lines.map((line, lIdx) => {
        if (!line.trim()) return <div key={lIdx} style={{ height: 6 }} />
        // Split by **bold**
        const parts = line.split(/(\*\*.*?\*\*)/g)
        return (
          <div key={lIdx} style={{ lineHeight: 1.6 }}>
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={pIdx} style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                    {part.slice(2, -2)}
                  </strong>
                )
              }
              return <span key={pIdx}>{part}</span>
            })}
          </div>
        )
      })}
    </div>
  )
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
      {!isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', flexShrink: 0, marginRight: 10, marginTop: 2,
        }}>
          🤖
        </div>
      )}
      <div style={{
        maxWidth: '82%', padding: '14px 18px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? 'linear-gradient(135deg, var(--accent-green), #16a34a)' : 'var(--bg-glass)',
        border: isUser ? 'none' : '1px solid var(--border)',
        color: isUser ? '#fff' : 'var(--text-primary)',
        fontSize: '0.875rem',
        boxShadow: isUser ? '0 4px 14px rgba(34,197,94,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        {msg.loading ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 4px' }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--accent-green)',
                animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        ) : (
          <FormattedText text={msg.content} />
        )}

        {msg.sources?.length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="provenance-bar" style={{ padding: 0, background: 'none', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: '0.65rem', color: isUser ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>Sources:</span>
              {msg.sources.map((s, i) => (
                <span key={i} className="source-badge" style={{ fontSize: '0.62rem' }}>
                  {s.replace(/^https?:\/\//, '').slice(0, 35)}
                </span>
              ))}
              {msg.confidence !== undefined && (
                <span style={{ fontSize: '0.65rem', color: 'var(--accent-green)', marginLeft: 'auto', fontWeight: 600 }}>
                  Confidence: {(msg.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      {isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--bg-glass)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', flexShrink: 0, marginLeft: 10, marginTop: 2,
        }}>
          👤
        </div>
      )}
    </div>
  )
}

export default function AdvisoryPage() {
  const toast = useToastStore()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hello! I'm AgriN, your AI precision agronomy advisor. Ask me anything about crop disease diagnosis, soil fertility, irrigation scheduling, weather coping strategies, or local market timing. How can I help your farm today?",
      sources: ["FAO Guidelines", "AgriN Knowledge System"],
      confidence: 0.95,
    }
  ])
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages, loading])

  const ask = async (question) => {
    if (!question.trim() || loading) return
    const userMsg = { role: 'user', content: question }
    const loadingMsg = { role: 'assistant', content: '', loading: true }
    setMessages(m => [...m, userMsg, loadingMsg])
    setInput('')
    setLoading(true)

    try {
      const resp = await api.advisory.ask('demo-farm', question, language)
      setMessages(m => [
        ...m.slice(0, -1),
        {
          role: 'assistant',
          content: resp.answer || 'I evaluated your agricultural query.',
          sources: resp.sources || ['AgriN Agronomic Engine'],
          confidence: resp.confidence,
        }
      ])
    } catch (e) {
      setMessages(m => [
        ...m.slice(0, -1),
        {
          role: 'assistant',
          content: `⚠️ Advisory service note: ${e.message}. Please check your connection to AgriN Node A.`,
          sources: [],
        }
      ])
      toast.show('Advisory API error: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask(input)
    }
  }

  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.show('Speech recognition is not supported in this browser. Please type your query.', 'info')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'sw' ? 'sw-KE' : language === 'fr' ? 'fr-FR' : 'en-US'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        toast.show('🎙️ Listening... Speak your farming question now.', 'info')
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
        toast.show(`Recognized: "${transcript}"`, 'success')
      }

      recognition.onerror = (event) => {
        setIsListening(false)
        toast.show(`Voice error: ${event.error}`, 'error')
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (err) {
      setIsListening(false)
      toast.show('Voice input error: ' + err.message, 'error')
    }
  }

  const shareWhatsApp = () => {
    const lastMsg = [...messages].reverse().find(m => m.role === 'assistant' && !m.loading)
    const textToShare = lastMsg
      ? `🌾 *AgriN Farming Advice*:\n${lastMsg.content.slice(0, 500)}...\n\nShared via AgriN Connect: http://localhost:5173/advisory`
      : '🌾 AgriN Connect v2 – AI precision agriculture advisor: http://localhost:5173/advisory'
    const encoded = encodeURIComponent(textToShare)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>🤖 Ask AgriN</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Precision Agricultural Advisory Engine • Qwen2.5-7B & Expert Agronomic Knowledge Base
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              style={{
                background: 'var(--bg-glass)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text-primary)', padding: '6px 12px',
                fontSize: '0.8rem', fontFamily: 'var(--font-sans)', cursor: 'pointer',
              }}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <button onClick={shareWhatsApp} className="btn btn-secondary btn-sm" id="share-whatsapp">
              📱 Share via WhatsApp
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 20, flex: 1, minHeight: 0 }}>
        {/* Chat Stream */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 16px' }}>
            {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
          </div>

          {/* Input Box */}
          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button
                type="button"
                onClick={toggleVoice}
                style={{
                  background: isListening ? 'var(--accent-red)' : 'var(--bg-glass)',
                  border: '1px solid var(--border)', borderRadius: 10,
                  padding: '10px 12px', cursor: 'pointer', fontSize: '1.1rem',
                  transition: 'all 0.2s', flexShrink: 0,
                }}
                title={isListening ? 'Listening...' : 'Voice Input (Microphone)'}>
                {isListening ? '🔴' : '🎙️'}
              </button>
              <textarea
                id="advisory-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about farming, crops, soil, pests, irrigation… (Enter to send)"
                disabled={loading}
                rows={1}
                style={{
                  flex: 1, background: 'var(--bg-glass)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 14px', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)', fontSize: '0.875rem', resize: 'none',
                  outline: 'none', minHeight: 44, maxHeight: 120, lineHeight: 1.4,
                }}
              />
              <button
                id="send-advisory"
                className="btn btn-primary"
                onClick={() => ask(input)}
                disabled={loading || !input.trim()}
                style={{ padding: '10px 18px', flexShrink: 0 }}>
                {loading ? '…' : 'Send →'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: '0.88rem', marginBottom: 12 }}>💡 Suggested Inquiries</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  id={`quick-q-${i}`}
                  onClick={() => ask(q)}
                  disabled={loading}
                  style={{
                    background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8,
                    padding: '8px 12px', cursor: 'pointer', textAlign: 'left', fontSize: '0.78rem',
                    color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: '0.88rem', marginBottom: 12 }}>⚙️ System Engine</h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>AI Model</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Qwen2.5-7B</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Agronomic Engine</span>
                <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>Active & Ready</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Guardrails</span>
                <span className="badge badge-blue" style={{ fontSize: '0.62rem' }}>Safety Enforced</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Languages</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>5 Languages</span>
              </div>
            </div>
            <div className="provenance-bar" style={{ marginTop: 12 }}>
              <span className="source-badge">FAO / ICAR Certified</span>
              <span>Node A Hub</span>
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: '0.88rem', marginBottom: 8 }}>🎙️ Voice Assistance</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
              Click the microphone button to dictate questions hands-free in the field.
            </p>
            <button
              id="voice-input"
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.8rem' }}
              onClick={toggleVoice}>
              {isListening ? '🔴 Stop Recording' : '🎙️ Start Voice Input'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
