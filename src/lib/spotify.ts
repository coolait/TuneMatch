import type { SpotifyProfile } from '../types'

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string
const REDIRECT_URI = (import.meta.env.VITE_REDIRECT_URI as string | undefined) ?? 'https://violet-dogs-smash.loca.lt'
const SCOPES = 'user-top-read'

interface SpotifyArtist {
  name: string
  genres: string[]
}

interface SpotifyTrack {
  id: string
}

interface SpotifyAudioFeature {
  energy: number
  valence: number
  danceability: number
  tempo: number
}

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values)
    .map((v) => possible[v % possible.length])
    .join('')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function initiateLogin(): Promise<void> {
  const verifier = generateRandomString(64)
  const challenge = await generateCodeChallenge(verifier)
  localStorage.setItem('pkce_verifier', verifier)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })

  window.location.href = `https://accounts.spotify.com/authorize?${params}`
}

export async function handleCallback(code: string): Promise<void> {
  const verifier = localStorage.getItem('pkce_verifier')
  if (!verifier) throw new Error('No PKCE verifier found — restart the login flow.')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error_description ?? `Token exchange failed (${res.status})`)
  }

  const data = await res.json()
  localStorage.setItem('spotify_token', data.access_token)
  localStorage.setItem('spotify_expiry', String(Date.now() + data.expires_in * 1000))
  localStorage.removeItem('pkce_verifier')
}

export function isAuthenticated(): boolean {
  const token = localStorage.getItem('spotify_token')
  const expiry = localStorage.getItem('spotify_expiry')
  return !!token && !!expiry && Date.now() < Number(expiry)
}

export function logout(): void {
  localStorage.removeItem('spotify_token')
  localStorage.removeItem('spotify_expiry')
}

async function spotifyGet<T>(endpoint: string): Promise<T> {
  const token = localStorage.getItem('spotify_token')
  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    logout()
    throw new Error('Spotify session expired. Please log in again.')
  }
  if (!res.ok) throw new Error(`Spotify API error ${res.status} on ${endpoint}`)
  return res.json() as Promise<T>
}

export async function getSpotifyProfile(): Promise<SpotifyProfile> {
  const [artistsData, tracksData] = await Promise.all([
    spotifyGet<{ items: SpotifyArtist[] }>('/me/top/artists?limit=50&time_range=medium_term'),
    spotifyGet<{ items: SpotifyTrack[] }>('/me/top/tracks?limit=50&time_range=medium_term'),
  ])

  const artists = artistsData.items ?? []
  const tracks = tracksData.items ?? []

  // Aggregate genres weighted by artist rank
  const genreCounts: Record<string, number> = {}
  artists.forEach((artist, idx) => {
    const weight = artists.length - idx // higher rank = more weight
    artist.genres.forEach((genre) => {
      genreCounts[genre] = (genreCounts[genre] ?? 0) + weight
    })
  })

  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([g]) => g)

  const topArtists = artists.slice(0, 10).map((a) => a.name)

  // Fetch audio features in chunks of 100
  const ids = tracks.map((t) => t.id).join(',')
  let features: SpotifyAudioFeature[] = []
  if (ids) {
    const featData = await spotifyGet<{ audio_features: (SpotifyAudioFeature | null)[] }>(
      `/audio-features?ids=${ids}`
    )
    features = (featData.audio_features ?? []).filter(Boolean) as SpotifyAudioFeature[]
  }

  const avg = (key: keyof SpotifyAudioFeature): number => {
    const vals = features.map((f) => f[key] as number)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0.5
  }

  return {
    topGenres,
    genreCounts,
    topArtists,
    avgEnergy: avg('energy'),
    avgValence: avg('valence'),
    avgDanceability: avg('danceability'),
    avgTempo: avg('tempo'),
  }
}
