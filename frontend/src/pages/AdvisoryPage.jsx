import React, { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { useToastStore } from '../stores'
import { Icon } from '../components/ui/Icons'

const QUICK_QUESTIONS = [
  'What crops grow best in monsoon conditions?',
  'How do I treat leaf rust in wheat?',
  'When is the best time to plant rice?',
  'How much water does maize need per week?',
  'What are signs of nitrogen deficiency?',
  'How to improve soil pH naturally?',
]

const LANGUAGES = [
  { code: 'en', label: 'English (EN)' },
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'sw', label: 'Swahili (Kiswahili)' },
  { code: 'ha', label: 'Hausa' },
  { code: 'fr', label: 'French' },
]

function FormattedText({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {lines.map((line, lIdx) => {
        if (!line.trim()) return <div key={lIdx} style={{ height: 4 }} />
        const parts = line.split(/(\*\*.*?\*\*)/g)
        return (
          <div key={lIdx} style={{ lineHeight: 1.6 }}>
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={pIdx} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
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
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-tint)',
            border: '1px solid rgba(5, 150, 105, 0.25)',
            color: 'var(--accent-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginRight: 10,
            marginTop: 2,
          }}
        >
          <Icon name="sparkles" size={15} />
        </div>
      )}
      <div
        style={{
          maxWidth: '80%',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: isUser ? 'var(--accent-green)' : 'var(--bg-card)',
          border: isUser ? 'none' : '1px solid var(--border)',
          color: isUser ? '#ffffff' : 'var(--text-primary)',
          fontSize: '0.875rem',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {msg.loading ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 4px' }}>
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent-green)',
                  animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        ) : (
          <FormattedText text={msg.content} />
        )}

        {msg.sources?.length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: isUser ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border)' }}>
            <div className="provenance-bar" style={{ padding: 0, background: 'none', border: 'none', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: '0.68rem', color: isUser ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>Citations:</span>
              {msg.sources.map((s, i) => (
                <span
                  key={i}
                  className="source-badge"
                  style={{
                    fontSize: '0.65rem',
                    background: isUser ? 'rgba(255,255,255,0.15)' : 'var(--bg-secondary)',
                    color: isUser ? '#ffffff' : 'var(--text-secondary)',
                    borderColor: isUser ? 'rgba(255,255,255,0.3)' : 'var(--border)',
                  }}
                >
                  {s.replace(/^https?:\/\//, '').slice(0, 35)}
                </span>
              ))}
              {msg.provider && (
                <span
                  className="source-badge"
                  style={{
                    fontSize: '0.65rem',
                    background: 'rgba(5, 150, 105, 0.15)',
                    color: 'var(--accent-green)',
                    borderColor: 'rgba(5, 150, 105, 0.3)',
                    fontWeight: 600,
                  }}
                >
                  ⚡ {msg.provider} {msg.latency_ms ? `(${msg.latency_ms}ms)` : ''}
                </span>
              )}
              {msg.confidence !== undefined && (
                <span style={{ fontSize: '0.68rem', color: isUser ? '#ffffff' : 'var(--accent-green)', marginLeft: 'auto', fontWeight: 600 }}>
                  Confidence: {(msg.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      {isUser && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginLeft: 10,
            marginTop: 2,
          }}
        >
          <Icon name="user" size={15} />
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
      content: "Hello. I am AgriN, your AI precision agronomy advisor. Ask me anything about crop disease diagnosis, soil fertility, irrigation scheduling, weather coping strategies, or local market timing. How can I help your farm today?",
      sources: ["FAO Guidelines", "AgriN Knowledge Base"],
      confidence: 0.95,
    }
  ])
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [engineStatus, setEngineStatus] = useState(null)
  const chatRef = useRef(null)

  useEffect(() => {
    api.advisory.status().then(setEngineStatus).catch(() => {})
  }, [])

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
          provider: resp.provider,
          latency_ms: resp.latency_ms,
        }
      ])
    } catch (e) {
      setMessages(m => [
        ...m.slice(0, -1),
        {
          role: 'assistant',
          content: `Advisory service note: ${e.message}. Please check connection to AgriN Node Alpha.`,
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
        toast.show('Listening... Speak your farming question now.', 'info')
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
      ? `AgriN Farming Advice:\n${lastMsg.content.slice(0, 500)}...\n\nShared via AgriN Connect: http://localhost:5173/advisory`
      : 'AgriN Connect v2 – AI precision agriculture advisor: http://localhost:5173/advisory'
    const encoded = encodeURIComponent(textToShare)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  return (
    <div className="advisory-page-container fade-in">
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: '1.4rem', marginBottom: 0 }}>Agronomic AI Advisory</h1>
              {engineStatus?.ollama?.connected ? (
                <span className="badge badge-green" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span className="dot dot-green" style={{ width: 6, height: 6 }} />
                  Local Ollama: {engineStatus.ollama.active_model}
                </span>
              ) : (
                <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                  Agronomic Knowledge Core
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
              Unprompted AI Agricultural Intelligence • Powered by Local Ollama & Agronomic Corpus
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                padding: '6px 10px',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <button onClick={shareWhatsApp} className="btn btn-secondary btn-sm" id="share-whatsapp">
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      <div className="advisory-main-grid">
        {/* Chat Stream */}
        <div className="card advisory-chat-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 16px' }}>
            {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
          </div>

          {/* Input Box */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                onClick={toggleVoice}
                className="btn btn-secondary"
                style={{
                  padding: '9px 12px',
                  background: isListening ? 'var(--accent-red)' : 'var(--bg-card)',
                  color: isListening ? '#ffffff' : 'var(--text-secondary)',
                  borderColor: isListening ? 'var(--accent-red)' : 'var(--border)',
                }}
                title={isListening ? 'Listening...' : 'Voice Input (Microphone)'}
              >
                <Icon name="mic" size={16} />
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
                  flex: 1,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '9px 12px',
                  fontSize: '0.88rem',
                  resize: 'none',
                  outline: 'none',
                  minHeight: 40,
                  maxHeight: 100,
                  lineHeight: 1.4,
                }}
              />
              <button
                id="send-advisory"
                className="btn btn-primary"
                onClick={() => ask(input)}
                disabled={loading || !input.trim()}
                style={{ padding: '9px 16px', flexShrink: 0 }}
              >
                {loading ? 'Synthesizing…' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: '0.88rem', marginBottom: 12 }}>Suggested Questions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  id={`quick-q-${i}`}
                  onClick={() => ask(q)}
                  disabled={loading}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-sans)',
                    transition: 'var(--transition)',
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: '0.88rem', marginBottom: 12 }}>Engine Specs</h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Active Model</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {engineStatus?.ollama?.active_model || 'Qwen2.5'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Engine Type</span>
                <span className={engineStatus?.ollama?.connected ? 'badge badge-green' : 'badge badge-blue'} style={{ fontSize: '0.62rem' }}>
                  {engineStatus?.ollama?.connected ? 'Local Ollama Core' : 'Agronomic KB'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Inference</span>
                <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>
                  {engineStatus?.ollama?.connected ? 'Local Metal / GPU' : 'Deterministic'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Guardrails</span>
                <span className="badge badge-blue" style={{ fontSize: '0.62rem' }}>Safety Enforced</span>
              </div>
            </div>
            <div className="provenance-bar" style={{ marginTop: 12 }}>
              <span className="source-badge">
                {engineStatus?.ollama?.connected ? `Ollama (${engineStatus.ollama.active_model})` : 'FAO / ICAR Standard'}
              </span>
              <span>Node Alpha Hub</span>
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: '0.88rem', marginBottom: 6 }}>Voice Input</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
              Click the microphone button to dictate questions hands-free in the field.
            </p>
            <button
              id="voice-input"
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.8rem' }}
              onClick={toggleVoice}
            >
              {isListening ? 'Stop Recording' : 'Start Voice Input'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
