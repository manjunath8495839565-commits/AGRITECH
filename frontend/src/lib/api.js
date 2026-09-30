/* API client – all fetch calls go through here */

const BASE = '/api'

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.json()
}

export const api = {
  health: () => apiFetch('/health'),
  weather: {
    current: (lat, lon) => apiFetch(`/weather/current?lat=${lat}&lon=${lon}`),
    forecast: (lat, lon, days = 7) => apiFetch(`/weather/forecast?lat=${lat}&lon=${lon}&days=${days}`),
  },
  soil: {
    report: (lat, lon) => apiFetch(`/soil/report?lat=${lat}&lon=${lon}`),
  },
  satellite: {
    ndvi: (lat, lon, days = 60) => apiFetch(`/satellite/ndvi?lat=${lat}&lon=${lon}&days=${days}`),
    thumbnail: (lat, lon) => apiFetch(`/satellite/thumbnail?lat=${lat}&lon=${lon}`),
  },
  prices: {
    crop: (crop, country = 'India', market = 'local') =>
      apiFetch(`/prices/crop?crop=${crop}&country=${country}&market=${market}`),
  },
  advisory: {
    ask: (farm_id, question, language = 'en') =>
      apiFetch('/advisory/ask', {
        method: 'POST',
        body: JSON.stringify({ farm_id, question, language }),
      }),
  },
  interop: {
    newPacket: () => apiFetch('/interop/new-packet'),
    sign: (packet) => apiFetch('/interop/sign', { method: 'POST', body: JSON.stringify(packet) }),
    send: (packet) => apiFetch('/interop/send', { method: 'POST', body: JSON.stringify(packet) }),
  },
}
