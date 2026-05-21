import type { RawStation } from '../types'

const NOMINATIM = 'https://nominatim.openstreetmap.org'
const RADIO_BROWSER = 'https://de1.api.radio-browser.info'

interface NominatimResult {
  lat: string
  lon: string
  address: { state?: string }
}

interface RadioBrowserStation {
  stationuuid: string
  name: string
  tags: string
  state: string
  countrycode: string
  votes: number
  lastcheckok: number
  geo_lat: number | null
  geo_long: number | null
}

function extractCallSign(name: string): string {
  const match = name.match(/\b([KW][A-Z]{2,3})\b/i)
  return match ? match[1].toUpperCase() : name.split(/[\s–-]/)[0].slice(0, 12)
}

function extractFreqBand(name: string): { frequency: string; band: 'AM' | 'FM' } {
  const fm = name.match(/(\d{2,3}\.\d)\s*FM/i)
  if (fm) return { frequency: fm[1], band: 'FM' }
  const am = name.match(/(\d{3,4})\s*AM/i)
  if (am) return { frequency: am[1], band: 'AM' }
  const bare = name.match(/\b(\d{2,3}\.\d)\b/)
  if (bare) return { frequency: bare[1], band: 'FM' }
  return { frequency: '', band: 'FM' }
}

function tagsToFormat(tags: string): string {
  if (!tags.trim()) return 'Unknown'
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(' / ')
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function geocodeZip(zip: string): Promise<{ lat: number; lon: number; state: string }> {
  const url = `${NOMINATIM}/search?postalcode=${zip}&country=US&format=json&limit=1&addressdetails=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`)

  const data = (await res.json()) as NominatimResult[]
  if (!data.length) throw new Error(`ZIP ${zip} not found — double-check it and try again.`)

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    state: data[0].address?.state ?? '',
  }
}

export async function fetchStationsByZip(zip: string): Promise<RawStation[]> {
  const { lat, lon, state } = await geocodeZip(zip)

  if (!state) throw new Error(`Could not resolve a US state for ZIP ${zip}.`)

  const params = new URLSearchParams({
    countrycodeexact: 'US',
    state,
    hidebroken: 'true',
    order: 'votes',
    limit: '150',
  })

  const res = await fetch(`${RADIO_BROWSER}/json/stations/search?${params}`)
  if (!res.ok) throw new Error(`Station lookup failed (${res.status}). Try again in a moment.`)

  const raw = (await res.json()) as RadioBrowserStation[]

  return raw
    .filter((s) => s.lastcheckok === 1 && s.countrycode === 'US' && s.tags.trim())
    .map((s) => {
      const { frequency, band } = extractFreqBand(s.name)
      const distance =
        s.geo_lat != null && s.geo_long != null
          ? haversine(lat, lon, s.geo_lat, s.geo_long)
          : 999

      return {
        callSign: extractCallSign(s.name),
        frequency,
        band,
        format: tagsToFormat(s.tags),
        city: s.state,
        state: s.state,
        distance,
        slogan: s.name,
      }
    })
}
