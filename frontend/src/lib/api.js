/* API client – all fetch calls go through here */

const BASE = '/api'

async function apiFetch(path, opts = {}) {
  const isMultipart = opts.body instanceof FormData
  const headers = isMultipart ? { ...opts.headers } : { 'Content-Type': 'application/json', ...opts.headers }
  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...opts,
  })
  if (!res.ok) {
    let errDetail = `${res.status}`
    try {
      const errJson = await res.json()
      if (errJson.detail) {
        errDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
      }
    } catch {}
    throw new Error(`API ${path} → ${errDetail}`)
  }
  return res.json()
}

export const api = {
  health: () => apiFetch('/health'),
  regions: {
    list: (country) => apiFetch(`/regions${country ? `?country=${encodeURIComponent(country)}` : ''}`),
    get: (id) => apiFetch(`/regions/${id}`),
  },
  crops: {
    list: (lang = 'en') => apiFetch(`/crops?lang=${lang}`),
  },
  farms: {
    adhoc: (farmData) => apiFetch('/farms/adhoc', {
      method: 'POST',
      body: JSON.stringify(farmData),
    }),
  },
  weather: {
    current: (lat, lon) => apiFetch(`/weather/current?lat=${lat}&lon=${lon}`),
    forecast: (lat, lon, days = 7) => apiFetch(`/weather/forecast?lat=${lat}&lon=${lon}&days=${days}`),
    batch: (coordsStr) => apiFetch(`/weather/batch?coords=${encodeURIComponent(coordsStr)}`),
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
    cropSuitability: (payload) =>
      apiFetch('/advisory/crop-suitability', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    status: () => apiFetch('/advisory/engine-status'),
  },
  plantScan: {
    scan: (formData) => apiFetch('/plant-scan', {
      method: 'POST',
      body: formData,
    }),
  },
  interop: {
    newPacket: () => apiFetch('/interop/new-packet'),
    sign: (packet) => apiFetch('/interop/sign', { method: 'POST', body: JSON.stringify(packet) }),
    send: (packet) => apiFetch('/interop/send', { method: 'POST', body: JSON.stringify(packet) }),
  },
}
