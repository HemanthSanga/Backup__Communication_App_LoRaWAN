import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'relay-react-demo-v1'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const DATE_LABEL = new Intl.DateTimeFormat([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())
const STARTER_MESSAGES = [
  { id: 'sample-1', author: 'Maya Kim', initials: 'MK', device: 'NR-UNIT-02', time: '09:38', text: 'At checkpoint 2. Trail is clear, heading east.', status: 'Sample message' },
  { id: 'sample-2', author: 'Jordan Davis', initials: 'JD', device: 'NR-UNIT-01', time: '09:32', text: 'Copy. Keep the ridge line in sight. Check in at 10.', status: 'Sample message' },
  { id: 'sample-3', author: 'Alex Lee', initials: 'AL', device: 'NR-UNIT-03', time: '09:24', text: 'Supply cache located near the north marker.', status: 'Sample message' },
  { id: 'sample-4', author: 'Base station', initials: 'BS', device: 'NR-BASE-01', time: '09:16', text: 'Team check-in received. All clear at base.', status: 'Sample message' },
]
const STARTER_DEVICES = [
  { id: 'NR-UNIT-01', name: 'Jordan’s Field Unit', detail: 'Checked in 2m ago', status: 'Available', initials: 'JD' },
  { id: 'NR-UNIT-02', name: 'Maya’s Field Unit', detail: 'Checked in 7m ago', status: 'Available', initials: 'MK' },
  { id: 'NR-UNIT-03', name: 'Alex’s Field Unit', detail: 'Checked in 12m ago', status: 'Available', initials: 'AL' },
  { id: 'NR-BASE-01', name: 'Base Station', detail: 'Checked in 1m ago', status: 'Available', initials: 'BS' },
  { id: 'NR-UNIT-05', name: 'Spare Unit A', detail: 'Last seen 3h ago', status: 'Offline', initials: '+' },
  { id: 'NR-UNIT-06', name: 'Spare Unit B', detail: 'Last seen yesterday', status: 'Offline', initials: '+' },
]
const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '◫' },
  { id: 'messages', label: 'Messages', icon: '▤' },
  { id: 'devices', label: 'Devices', icon: '⌁' },
  { id: 'map', label: 'Network map', icon: '◎' },
]
const INFO = {
  setup: {
    title: 'Connect a LoRaWAN network',
    paragraphs: [
      'This React app needs a secure server-side integration before it can send LoRaWAN downlinks. There is no radio, gateway, or network server connected in this workspace.',
      'Connect registered end devices through a network server such as The Things Stack or ChirpStack. A backend must authenticate the operator, encode the message for the device, enqueue the downlink, and return its actual network-server status.',
      'Never place LoRaWAN application keys in browser code. Downlink timing and payload capacity vary by device class, regional plan, and network conditions. Verify receipt on the receiving device and maintain an independent emergency communications fallback.',
    ],
  },
  coverage: {
    title: 'Coverage & location',
    paragraphs: [
      'This map is an illustration with sample device locations, not live GPS or gateway telemetry.',
      'A real map should display timestamped location only when a device explicitly sends it. LoRaWAN coverage depends on radio conditions and gateway placement; a check-in is not continuous tracking.',
    ],
  },
  demo: {
    title: 'Demo mode',
    paragraphs: [
      'Demo messages are stored in this browser only. No message is transmitted over LoRaWAN, and the sample device list, delivery labels, network status, and map are illustrative.',
      'Set VITE_API_BASE_URL to a secure backend implementing the documented POST /api/messages contract to enable a real server integration.',
    ],
  },
}

function readDemoState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.error('Unable to load saved demo state.', error)
    return null
  }
}

function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

function Dot({ className = '' }) {
  return <span aria-hidden="true" className={`dot ${className}`} />
}

function Message({ message }) {
  const isQueued = message.status.toLowerCase().includes('queued')
  const isFailed = message.status.toLowerCase().includes('failed')
  return (
    <article className="message-row">
      <span className={`avatar avatar-${message.initials.toLowerCase()}`}>{message.initials}</span>
      <div className="message-content">
        <div className="message-meta">
          <strong>{message.author}</strong>
          <time>{message.time}</time>
        </div>
        <p className="message-text">{message.text}</p>
        <span className={`message-status${isQueued ? ' queued' : ''}${isFailed ? ' failed' : ''}`}>
          <Dot />{message.status}
        </span>
      </div>
    </article>
  )
}

function Device({ device }) {
  const offline = device.status === 'Offline'
  return (
    <div className="device-row">
      <span className="device-icon" aria-hidden="true">⌁</span>
      <div className="device-copy">
        <strong>{device.name}</strong>
        <small>{device.id} · {device.detail}</small>
      </div>
      <span className={`device-status${offline ? ' offline' : ''}`}><Dot />{device.status}</span>
    </div>
  )
}

function CoverageMap({ onInfo }) {
  return (
    <section className="panel map-panel">
      <div className="panel-heading">
        <div><h2>Team coverage</h2><p>Last known device locations <span className="sample-tag">SAMPLE DATA</span></p></div>
        <button className="outline-button" onClick={onInfo}>About coverage <span>↗</span></button>
      </div>
      <div className="map-visual" role="img" aria-label="Illustrated sample coverage area with four field device locations">
        <div className="contour contour-one" /><div className="contour contour-two" /><div className="contour contour-three" />
        <div className="coverage-ring" /><div className="coverage-ring ring-inner" />
        <span className="map-label label-ridge">NORTH RIDGE</span><span className="map-label label-creek">PINE CREEK</span><span className="map-label label-trail">EAST TRAIL</span>
        <span className="map-road road-one" /><span className="map-road road-two" />
        <span className="map-marker marker-base">⌁<small>BASE</small></span>
        <span className="map-marker marker-one">JD</span><span className="map-marker marker-two">MK</span>
        <span className="map-marker marker-three">AL</span><span className="map-marker marker-four offline-marker">+</span>
        <div className="map-legend"><span><i className="legend-available" />Available</span><span><i className="legend-offline" />Offline</span></div>
        <span className="map-disclaimer">SAMPLE LOCATIONS · NOT LIVE GPS</span>
      </div>
    </section>
  )
}

function InfoDialog({ info, onClose }) {
  useEffect(() => {
    if (!info) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [info, onClose])

  if (!info) return null
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="info-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-kicker"><Dot />ABOUT THIS PREVIEW</div>
        <button className="dialog-close" onClick={onClose} aria-label="Close">×</button>
        <h2 id="dialog-title">{info.title}</h2>
        {info.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <button className="primary-button" onClick={onClose}>Got it</button>
      </section>
    </div>
  )
}

function App() {
  const saved = useMemo(() => readDemoState(), [])
  const [messages, setMessages] = useState(saved?.messages ?? STARTER_MESSAGES)
  const [devices, setDevices] = useState(saved?.devices ?? STARTER_DEVICES)
  const [screen, setScreen] = useState('overview')
  const [draft, setDraft] = useState('')
  const [recipientId, setRecipientId] = useState(saved?.recipientId ?? STARTER_DEVICES[0].id)
  const [info, setInfo] = useState(null)
  const [newDevice, setNewDevice] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [notice, setNotice] = useState('')
  const [clock, setClock] = useState(formatTime)
  const isLiveConfigured = Boolean(API_BASE_URL)

  useEffect(() => {
    const timer = window.setInterval(() => setClock(formatTime()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isLiveConfigured) return undefined
    let active = true
    async function refreshNetworkState() {
      try {
        const [messageResponse, deviceResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/messages`, { credentials: 'include' }),
          fetch(`${API_BASE_URL}/api/devices`, { credentials: 'include' }),
        ])
        const [messagePayload, devicePayload] = await Promise.all([
          messageResponse.json(),
          deviceResponse.json(),
        ])
        if (!messageResponse.ok || !deviceResponse.ok) {
          throw new Error(messagePayload?.error || devicePayload?.error || 'The message service could not be reached.')
        }
        if (!Array.isArray(messagePayload?.messages) || !Array.isArray(devicePayload?.devices)) {
          throw new Error('The API must return messages and devices arrays.')
        }
        if (!active) return
        setMessages(messagePayload.messages)
        setDevices(devicePayload.devices)
        setRecipientId((current) => devicePayload.devices.some((device) => device.id === current && device.status === 'Available')
          ? current
          : devicePayload.devices.find((device) => device.status === 'Available')?.id ?? '')
        setNotice('')
      } catch (error) {
        console.error('Could not refresh LoRaWAN message and device state.', error)
        if (active) setNotice(`Could not refresh network data: ${error.message}`)
      }
    }
    refreshNetworkState()
    const timer = window.setInterval(refreshNetworkState, 10000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [isLiveConfigured])

  function persistDemoState(nextMessages = messages, nextDevices = devices, nextRecipient = recipientId) {
    if (isLiveConfigured) return true
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: nextMessages, devices: nextDevices, recipientId: nextRecipient }))
      return true
    } catch (error) {
      console.error('Unable to save demo state.', error)
      return false
    }
  }

  async function sendMessage(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || text.length > 120 || isSending) return

    const recipient = devices.find((device) => device.id === recipientId)
    if (!recipient || recipient.status === 'Offline') {
      setNotice('Choose an available destination device.')
      return
    }

    if (!isLiveConfigured) {
      const localMessage = {
        id: `demo-${Date.now()}`,
        author: 'Jordan Davis',
        initials: 'JD',
        device: recipientId,
        time: formatTime(),
        text,
        status: 'Saved locally · demo only',
      }
      setMessages((current) => [localMessage, ...current])
      setDraft('')
      const persisted = persistDemoState([localMessage, ...messages])
      setNotice(persisted
        ? 'Saved in this browser only. No LoRaWAN message was sent.'
        : 'Browser storage failed. This message is visible only until the page closes; no LoRaWAN message was sent.')
      return
    }

    setIsSending(true)
    setNotice('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipientDeviceId: recipientId, text }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || `Message API returned HTTP ${response.status}.`)
      }
      if (!payload || typeof payload.id !== 'string' || typeof payload.status !== 'string') {
        throw new Error('Message API returned an invalid response. Expected string id and status fields.')
      }
      const sentMessage = {
        id: payload.id,
        author: 'Jordan Davis',
        initials: 'JD',
        device: recipientId,
        time: payload.createdAt ? formatTime(new Date(payload.createdAt)) : formatTime(),
        text,
        status: payload.status,
      }
      setMessages((current) => [sentMessage, ...current])
      setDraft('')
      setNotice(`Server response: ${payload.status}. Confirm delivery on the receiving device.`)
    } catch (error) {
      console.error('LoRaWAN message submission failed.', error)
      setNotice(`Message was not confirmed by the server: ${error.message}`)
    } finally {
      setIsSending(false)
    }
  }

  function addDevice(event) {
    event.preventDefault()
    const name = newDevice.trim()
    if (!name) return
    const id = `NR-DEMO-${String(devices.length + 1).padStart(2, '0')}`
    const updatedDevices = [...devices, { id, name: name.slice(0, 40), detail: 'Demo device', status: 'Available', initials: name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() }]
    setDevices(updatedDevices)
    const persisted = persistDemoState(messages, updatedDevices)
    setNewDevice('')
    setNotice(persisted
      ? 'Demo device added locally. It is not registered on a LoRaWAN network.'
      : 'Browser storage failed. The demo device is visible only until the page closes.')
  }

  const availableCount = devices.filter((device) => device.status === 'Available').length
  const messageCount = 12 + Math.max(0, messages.length - STARTER_MESSAGES.length)

  function renderComposer() {
    return (
      <div className="composer-wrap">
        <form className="composer" onSubmit={sendMessage}>
          <label className="sr-only" htmlFor="recipient-device">Send to device</label>
          <select id="recipient-device" value={recipientId} onChange={(event) => setRecipientId(event.target.value)} aria-label="Recipient device">
            {devices.filter((device) => device.status === 'Available').map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
          </select>
          <label className="sr-only" htmlFor="message-input">Write a message</label>
          <input id="message-input" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={120} placeholder="Write a message to the team…" />
          <span className="char-count">{draft.length}/120</span>
          <button className="send-button" disabled={isSending || !draft.trim()} aria-label={isSending ? 'Sending message' : 'Send message'}>{isSending ? '…' : '↑'}</button>
        </form>
        <p className="compose-note"><span>⌁</span> 120-character demo limit <i>·</i> {isLiveConfigured ? 'Backend connected' : 'Local preview only'}</p>
        {notice && <p className="notice" role="status">{notice}</p>}
      </div>
    )
  }

  function renderMessages(limit) {
    const list = limit ? messages.slice(0, limit) : messages
    return (
      <section className="panel">
        <div className="panel-heading">
          <div><h2>Recent messages</h2><p>Team communications <span className="sample-tag">PREVIEW</span></p></div>
          {limit && <button className="text-link" onClick={() => setScreen('messages')}>View all <span>→</span></button>}
        </div>
        <div className="message-list">
          {list.map((message) => <Message key={message.id} message={message} />)}
          {!list.length && <p className="empty-state">No messages yet. Send a check-in to get started.</p>}
        </div>
        {renderComposer()}
      </section>
    )
  }

  function renderDevices(limit) {
    const list = limit ? devices.slice(0, limit) : devices
    return (
      <section className="panel">
        <div className="panel-heading">
          <div><h2>Field devices</h2><p>Team check-in status <span className="sample-tag">SAMPLE DATA</span></p></div>
          <span className="device-count">{availableCount} available</span>
        </div>
        <div className="device-list">{list.map((device) => <Device key={device.id} device={device} />)}</div>
        {limit && <button className="panel-footer" onClick={() => setScreen('devices')}>Manage devices <span>→</span></button>}
        {!isLiveConfigured && <p className="sample-footnote">Device status is illustrative; no gateway telemetry is connected.</p>}
        {screen === 'devices' && <form className="add-device-form" onSubmit={addDevice}><input value={newDevice} onChange={(event) => setNewDevice(event.target.value)} maxLength={40} placeholder="New demo device name" aria-label="New demo device name" /><button className="outline-button">Add demo device</button></form>}
      </section>
    )
  }

  function renderContent() {
    if (screen === 'messages') return <>{renderMessages()}<div className="inline-disclaimer"><Dot />Messages go through the configured backend only. Confirm receipt on the destination device.</div></>
    if (screen === 'devices') return renderDevices()
    if (screen === 'map') return <CoverageMap onInfo={() => setInfo(INFO.coverage)} />
    return (
      <>
        <section className="page-heading">
          <div className="eyebrow"><span />FIELD COMMUNICATIONS</div>
          <h1>Stay connected,<br />when it matters.</h1>
          <p>A clear line between your team and the field, even when everything else is down.</p>
        </section>
        <button className={`status-banner${isLiveConfigured ? ' configured' : ''}`} onClick={() => setInfo(INFO[isLiveConfigured ? 'setup' : 'demo'])}>
          <span className="status-symbol">⌁</span>
          <span className="status-copy"><strong>{isLiveConfigured ? 'Backend configured' : 'Network is in preview mode'}</strong><small>{isLiveConfigured ? 'Messages will be submitted to your backend.' : 'No LoRaWAN radio is connected. Messages stay in this browser.'}</small></span>
          <span className="status-badge">{isLiveConfigured ? 'API CONFIGURED' : 'DEMO ONLY'}</span>
          <span className="status-arrow">↗</span>
        </button>
        <div className="section-heading glance-heading"><div><h2>At a glance</h2><p>Your team’s field readiness</p></div><span className="updated-label"><Dot />UPDATED JUST NOW</span></div>
        <div className="metrics-grid">
          <article className="metric-card"><div className="metric-top"><span>FIELD DEVICES</span><b>⌁</b></div><strong className="metric-value">{String(availableCount).padStart(2, '0')}<small> / {String(devices.length).padStart(2, '0')}</small></strong><p className="metric-foot"><span>● {availableCount} available</span> · {devices.length - availableCount} offline</p><div className="meter"><span style={{ width: `${devices.length ? availableCount / devices.length * 100 : 0}%` }} /></div></article>
          <article className="metric-card"><div className="metric-top"><span>MESSAGES TODAY</span><b>↗</b></div><strong className="metric-value">{messageCount}</strong><p className="metric-foot"><span>↑ 3</span> from yesterday</p><div className="sparkline">{[8, 13, 10, 17, 14, 22, 18, 25].map((height, index) => <i key={index} style={{ height }} />)}</div></article>
          <article className="metric-card health-card"><div className="metric-top"><span>NETWORK HEALTH</span><b>⌁</b></div><strong className="health-value"><Dot />{isLiveConfigured ? 'Connected' : 'Preview'}</strong><p className="metric-foot">{isLiveConfigured ? 'Backend endpoint configured' : 'No live radio telemetry'}</p><div className="health-bars">{Array.from({ length: 12 }, (_, index) => <i key={index} className={index > 9 ? 'dim' : ''} />)}</div></article>
        </div>
        <div className="content-grid"><div>{renderMessages(4)}</div><div>{renderDevices(4)}</div></div>
        <CoverageMap onInfo={() => setInfo(INFO.coverage)} />
      </>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={(event) => { event.preventDefault(); setScreen('overview') }}><span className="brand-mark"><i /><i /><i /></span>relay<span>.</span></a>
        <p className="side-label">WORKSPACE</p>
        <div className="workspace-switcher"><span className="workspace-avatar">N</span><span><strong>North Ridge</strong><small>Response team</small></span><b>⌄</b></div>
        <p className="side-label nav-label">OPERATIONS</p>
        <nav className="side-nav">{NAV_ITEMS.map((item) => <button key={item.id} className={`nav-item${screen === item.id ? ' active' : ''}`} onClick={() => setScreen(item.id)}><span>{item.icon}</span>{item.label}{item.id === 'messages' && messages.length > STARTER_MESSAGES.length && <small>{messages.length - STARTER_MESSAGES.length}</small>}</button>)}</nav>
        <div className="side-spacer" />
        <div className="connection-card"><div><Dot />{isLiveConfigured ? 'BACKEND CONFIGURED' : 'DEMO NETWORK'}</div><p>{isLiveConfigured ? 'LoRaWAN delivery depends on your server integration.' : 'Local preview only. No LoRaWAN radio is connected.'}</p><button onClick={() => setInfo(INFO.setup)}>Connectivity setup ↗</button></div>
        <div className="profile-card"><span className="profile-avatar">JD</span><span><strong>Jordan Davis</strong><small>Incident lead</small></span><b>···</b></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div>North Ridge <span>/</span> <strong>{NAV_ITEMS.find((item) => item.id === screen)?.label}</strong></div><div className="topbar-right"><span><Dot />{isLiveConfigured ? 'API mode' : 'Demo mode'}</span><i />{clock}<button aria-label="Help" onClick={() => setInfo(INFO.setup)}>?</button></div></header>
        <div className="page-content">
          {screen !== 'overview' && <div className="subpage-heading"><div className="eyebrow"><span />FIELD COMMUNICATIONS</div><h1>{NAV_ITEMS.find((item) => item.id === screen)?.label}</h1><p>{DATE_LABEL}</p></div>}
          {renderContent()}
          <footer className="page-footer"><span>RELAY · EMERGENCY COMMUNICATIONS</span><span>Designed for the moments that matter.</span></footer>
        </div>
      </main>
      <InfoDialog info={info} onClose={() => setInfo(null)} />
    </div>
  )
}

export default App
