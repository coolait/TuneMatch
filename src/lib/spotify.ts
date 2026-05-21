import type { SpotifyProfile } from '../types'

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string
const REDIRECT_URI = (import.meta.env.VITE_REDIRECT_URI as string | undefined) ??
  (import.meta.env.PROD
    ? 'https://tune-match-gold.vercel.app/callback'
    : 'http://127.0.0.1:5173/callback')
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

// Artist → genre lookup for when Spotify's top-artists endpoint returns empty genre arrays
// (common with newer app registrations). Covers the top ~200 globally streamed artists.
const ARTIST_GENRE_HINTS: Record<string, string[]> = {
  // Pop
  'taylor swift': ['pop', 'country pop', 'singer-songwriter'],
  'ed sheeran': ['pop', 'singer-songwriter', 'folk pop'],
  'ariana grande': ['pop', 'dance pop', 'r&b'],
  'billie eilish': ['indie pop', 'alternative pop', 'pop'],
  'dua lipa': ['pop', 'dance pop', 'electropop'],
  'harry styles': ['pop', 'indie pop', 'soft rock'],
  'olivia rodrigo': ['pop', 'pop punk', 'alternative'],
  'charlie puth': ['pop', 'dance pop'],
  'shawn mendes': ['pop', 'pop rock', 'singer-songwriter'],
  'selena gomez': ['pop', 'dance pop'],
  'katy perry': ['pop', 'dance pop', 'electropop'],
  'lady gaga': ['pop', 'dance pop', 'electropop'],
  'miley cyrus': ['pop', 'pop rock'],
  'sia': ['pop', 'dance pop', 'electropop'],
  'meghan trainor': ['pop', 'dance pop', 'soul'],
  'jason mraz': ['pop', 'singer-songwriter', 'acoustic'],
  'camila cabello': ['pop', 'latin pop', 'dance pop'],
  'sam smith': ['pop', 'soul', 'adult contemporary'],
  'adele': ['pop', 'soul', 'adult contemporary'],
  'lewis capaldi': ['pop', 'soul', 'adult contemporary'],
  'james blunt': ['pop', 'soft rock', 'adult contemporary'],
  'coldplay': ['pop rock', 'alternative rock', 'indie rock'],
  'maroon 5': ['pop', 'pop rock', 'dance pop'],
  'alex warren': ['pop', 'indie pop'],
  'livingston': ['indie pop', 'singer-songwriter', 'folk'],
  'john michael howell': ['country', 'singer-songwriter'],
  'one direction': ['pop', 'pop rock'],
  'niall horan': ['pop', 'pop rock'],
  'zayn': ['pop', 'r&b'],
  'pink': ['pop', 'pop rock', 'dance pop'],
  'james bay': ['pop rock', 'indie rock', 'folk rock'],
  'jack johnson': ['pop', 'acoustic', 'folk rock'],
  'ben harper': ['folk rock', 'blues', 'soul'],
  'onerepublic': ['pop rock', 'pop', 'alternative'],
  'twenty one pilots': ['alternative pop', 'indie pop', 'pop rock'],
  // R&B / Soul
  'the weeknd': ['r&b', 'pop', 'soul'],
  'bruno mars': ['pop', 'r&b', 'soul', 'funk'],
  'beyonce': ['r&b', 'pop', 'dance pop', 'soul'],
  'usher': ['r&b', 'pop', 'dance pop'],
  'rihanna': ['pop', 'r&b', 'dance pop'],
  'john legend': ['r&b', 'soul', 'pop'],
  'khalid': ['r&b', 'pop', 'soul'],
  'sza': ['r&b', 'soul', 'indie r&b'],
  "h.e.r.": ['r&b', 'soul'],
  'jhene aiko': ['r&b', 'soul', 'indie r&b'],
  'daniel caesar': ['r&b', 'soul', 'indie r&b'],
  'frank ocean': ['r&b', 'soul', 'indie r&b'],
  'justin timberlake': ['pop', 'r&b', 'dance pop'],
  'chris brown': ['r&b', 'pop', 'dance pop'],
  'ne-yo': ['r&b', 'pop', 'soul'],
  'miguel': ['r&b', 'soul', 'pop'],
  'doja cat': ['pop', 'r&b', 'hip hop'],
  'normani': ['r&b', 'pop', 'dance pop'],
  'lizzo': ['pop', 'r&b', 'hip hop'],
  'michael jackson': ['pop', 'r&b', 'soul', 'funk'],
  'stevie wonder': ['r&b', 'soul', 'funk'],
  'janet jackson': ['r&b', 'pop', 'dance pop'],
  'alicia keys': ['r&b', 'soul', 'pop'],
  'mary j. blige': ['r&b', 'soul', 'hip hop'],
  'trey songz': ['r&b', 'soul'],
  'jason derulo': ['pop', 'r&b', 'dance pop'],
  'zara larsson': ['pop', 'dance pop', 'r&b'],
  // Hip-Hop / Rap
  'drake': ['hip hop', 'rap', 'trap'],
  'kendrick lamar': ['hip hop', 'rap'],
  'j. cole': ['hip hop', 'rap'],
  'kanye west': ['hip hop', 'rap'],
  'travis scott': ['hip hop', 'trap'],
  'post malone': ['hip hop', 'pop rap', 'trap'],
  'lil uzi vert': ['hip hop', 'trap'],
  'future': ['hip hop', 'trap'],
  'lil baby': ['hip hop', 'trap'],
  'gunna': ['hip hop', 'trap'],
  'juice wrld': ['hip hop', 'trap', 'emo rap'],
  'xxxtentacion': ['hip hop', 'emo rap', 'alternative hip hop'],
  'nf': ['hip hop', 'rap'],
  'eminem': ['hip hop', 'rap'],
  'lil wayne': ['hip hop', 'rap', 'trap'],
  'nicki minaj': ['hip hop', 'rap', 'dance pop'],
  'cardi b': ['hip hop', 'rap', 'trap'],
  'megan thee stallion': ['hip hop', 'rap', 'trap'],
  'roddy ricch': ['hip hop', 'trap'],
  'polo g': ['hip hop', 'trap'],
  'bad bunny': ['latin', 'reggaeton', 'trap'],
  'youngboy never broke again': ['hip hop', 'trap'],
  'dababy': ['hip hop', 'trap'],
  '21 savage': ['hip hop', 'trap'],
  'tyler, the creator': ['hip hop', 'alternative hip hop'],
  'tyler the creator': ['hip hop', 'alternative hip hop'],
  'a$ap rocky': ['hip hop', 'trap', 'rap'],
  'asap rocky': ['hip hop', 'trap', 'rap'],
  'chance the rapper': ['hip hop', 'rap'],
  'childish gambino': ['hip hop', 'r&b', 'rap'],
  'kid cudi': ['hip hop', 'alternative hip hop'],
  'mac miller': ['hip hop', 'rap'],
  'logic': ['hip hop', 'rap'],
  'wiz khalifa': ['hip hop', 'rap', 'trap'],
  'kevin gates': ['hip hop', 'trap'],
  '42 dugg': ['hip hop', 'trap'],
  // Rock / Alternative
  'imagine dragons': ['pop rock', 'alternative rock', 'indie rock'],
  'linkin park': ['alternative rock', 'nu metal', 'pop rock'],
  'the killers': ['indie rock', 'alternative rock'],
  'green day': ['punk rock', 'pop punk', 'alternative rock'],
  'fall out boy': ['pop punk', 'alternative rock', 'pop rock'],
  'panic! at the disco': ['pop rock', 'alternative rock', 'indie pop'],
  'panic at the disco': ['pop rock', 'alternative rock', 'indie pop'],
  'my chemical romance': ['pop punk', 'alternative rock', 'emo'],
  'paramore': ['pop punk', 'alternative rock'],
  'foo fighters': ['rock', 'alternative rock', 'hard rock'],
  'red hot chili peppers': ['rock', 'alternative rock', 'funk rock'],
  'nirvana': ['grunge', 'alternative rock'],
  'pearl jam': ['grunge', 'alternative rock'],
  'arctic monkeys': ['indie rock', 'alternative rock'],
  'tame impala': ['indie rock', 'psychedelic pop', 'alternative'],
  'radiohead': ['alternative rock', 'indie rock'],
  'muse': ['rock', 'alternative rock'],
  'the 1975': ['indie pop', 'pop rock', 'alternative'],
  'joji': ['indie pop', 'r&b', 'alternative'],
  'lana del rey': ['indie pop', 'dream pop', 'alternative pop'],
  'halsey': ['pop', 'alternative pop', 'indie pop'],
  'avril lavigne': ['pop punk', 'pop rock'],
  'blink-182': ['pop punk', 'punk rock'],
  'weezer': ['alternative rock', 'pop rock'],
  'sum 41': ['pop punk', 'punk rock'],
  'three days grace': ['rock', 'alternative rock', 'hard rock'],
  // Country
  'morgan wallen': ['country', 'country pop'],
  'luke combs': ['country', 'country pop'],
  'zac brown band': ['country', 'country rock', 'americana'],
  'jason aldean': ['country', 'country rock'],
  'carrie underwood': ['country pop', 'country'],
  'kenny chesney': ['country', 'country pop'],
  'garth brooks': ['country', 'classic country'],
  'blake shelton': ['country', 'country pop'],
  'chris stapleton': ['country', 'americana'],
  'sam hunt': ['country pop', 'country'],
  'kane brown': ['country pop', 'country'],
  'luke bryan': ['country pop', 'country'],
  'tim mcgraw': ['country pop', 'country'],
  'brad paisley': ['country', 'country pop'],
  'miranda lambert': ['country', 'country rock'],
  'kelsea ballerini': ['country pop', 'country'],
  'dierks bentley': ['country', 'country rock'],
  // Electronic / EDM
  'zedd': ['electronic', 'edm', 'pop'],
  'marshmello': ['electronic', 'edm'],
  'the chainsmokers': ['pop', 'electronic', 'edm'],
  'david guetta': ['electronic', 'edm', 'pop'],
  'calvin harris': ['electronic', 'edm', 'pop'],
  'kygo': ['electronic', 'tropical house', 'pop'],
  'alan walker': ['electronic', 'edm'],
  'martin garrix': ['electronic', 'edm'],
  'tiesto': ['electronic', 'edm'],
  'diplo': ['electronic', 'edm', 'dance pop'],
}

function inferGenresFromArtists(
  artistNames: string[],
  genreCounts: Record<string, number>,
  totalArtists: number
): void {
  artistNames.forEach((name, idx) => {
    const key = name.toLowerCase()
    const genres = ARTIST_GENRE_HINTS[key]
    if (genres) {
      const weight = totalArtists - idx
      genres.forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] ?? 0) + weight
      })
    }
  })
}

// Genre-based audio feature estimation for when Spotify restricts /audio-features (403)
const GENRE_AUDIO_PROFILES: Array<{ keywords: string[]; energy: number; valence: number; danceability: number; tempo: number }> = [
  { keywords: ['hip hop', 'hip-hop', 'rap', 'trap', 'drill', 'urban'], energy: 0.72, valence: 0.50, danceability: 0.78, tempo: 120 },
  { keywords: ['pop', 'dance pop', 'electropop', 'synth pop', 'teen pop'], energy: 0.66, valence: 0.66, danceability: 0.73, tempo: 118 },
  { keywords: ['r&b', 'rnb', 'soul', 'neo soul', 'funk'], energy: 0.62, valence: 0.55, danceability: 0.72, tempo: 105 },
  { keywords: ['rock', 'hard rock', 'arena rock', 'pop rock'], energy: 0.78, valence: 0.44, danceability: 0.52, tempo: 130 },
  { keywords: ['alternative', 'indie rock', 'grunge', 'post-punk', 'shoegaze'], energy: 0.68, valence: 0.40, danceability: 0.50, tempo: 126 },
  { keywords: ['metal', 'heavy metal', 'thrash', 'death metal'], energy: 0.92, valence: 0.32, danceability: 0.40, tempo: 148 },
  { keywords: ['country', 'country pop', 'americana', 'bluegrass'], energy: 0.60, valence: 0.62, danceability: 0.60, tempo: 118 },
  { keywords: ['jazz', 'bebop', 'swing', 'big band', 'smooth jazz'], energy: 0.42, valence: 0.55, danceability: 0.48, tempo: 112 },
  { keywords: ['blues'], energy: 0.52, valence: 0.43, danceability: 0.52, tempo: 108 },
  { keywords: ['classical', 'orchestra', 'symphony', 'opera'], energy: 0.28, valence: 0.50, danceability: 0.22, tempo: 90 },
  { keywords: ['edm', 'house', 'techno', 'trance', 'dubstep', 'drum and bass'], energy: 0.88, valence: 0.58, danceability: 0.84, tempo: 128 },
  { keywords: ['folk', 'singer-songwriter', 'acoustic', 'indie folk'], energy: 0.40, valence: 0.54, danceability: 0.42, tempo: 106 },
  { keywords: ['latin', 'reggaeton', 'salsa', 'cumbia', 'bachata'], energy: 0.74, valence: 0.70, danceability: 0.80, tempo: 120 },
  { keywords: ['reggae', 'dancehall', 'ska'], energy: 0.60, valence: 0.65, danceability: 0.72, tempo: 100 },
  { keywords: ['gospel', 'christian', 'worship'], energy: 0.62, valence: 0.70, danceability: 0.55, tempo: 110 },
]

function estimateAudioFeaturesFromGenres(genreCounts: Record<string, number>): Pick<SpotifyProfile, 'avgEnergy' | 'avgValence' | 'avgDanceability' | 'avgTempo'> {
  let totalWeight = 0
  let energy = 0, valence = 0, danceability = 0, tempo = 0

  for (const [genre, count] of Object.entries(genreCounts)) {
    const g = genre.toLowerCase()
    const profile = GENRE_AUDIO_PROFILES.find((p) => p.keywords.some((kw) => g.includes(kw)))
    if (profile) {
      energy += profile.energy * count
      valence += profile.valence * count
      danceability += profile.danceability * count
      tempo += profile.tempo * count
      totalWeight += count
    }
  }

  if (totalWeight === 0) {
    return { avgEnergy: 0.55, avgValence: 0.52, avgDanceability: 0.58, avgTempo: 115 }
  }

  return {
    avgEnergy: energy / totalWeight,
    avgValence: valence / totalWeight,
    avgDanceability: danceability / totalWeight,
    avgTempo: tempo / totalWeight,
  }
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
    throw new Error((err as { error_description?: string }).error_description ?? `Token exchange failed (${res.status})`)
  }

  const data = await res.json() as { access_token: string; expires_in: number }
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

  // Aggregate genres weighted by artist rank (higher rank = more weight)
  const genreCounts: Record<string, number> = {}
  artists.forEach((artist, idx) => {
    const weight = artists.length - idx
    ;(artist.genres ?? []).forEach((genre) => {
      genreCounts[genre] = (genreCounts[genre] ?? 0) + weight
    })
  })

  const topArtists = artists.slice(0, 10).map((a) => a.name)

  // Spotify often returns empty genre arrays for newer app registrations.
  // Fall back to inferring genres from artist names via the lookup table.
  if (Object.keys(genreCounts).length === 0) {
    inferGenresFromArtists(topArtists, genreCounts, artists.length)
  }

  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([g]) => g)

  // Try real audio features; Spotify restricts this endpoint for newer apps (403)
  let features: SpotifyAudioFeature[] = []
  const ids = tracks.map((t) => t.id).join(',')
  if (ids) {
    try {
      const featData = await spotifyGet<{ audio_features: (SpotifyAudioFeature | null)[] }>(
        `/audio-features?ids=${ids}`
      )
      features = (featData.audio_features ?? []).filter(Boolean) as SpotifyAudioFeature[]
    } catch {
      // Falls through to genre-based estimation below
    }
  }

  if (features.length > 0) {
    const avg = (key: keyof SpotifyAudioFeature): number => {
      const vals = features.map((f) => f[key] as number)
      return vals.reduce((a, b) => a + b, 0) / vals.length
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

  // Fallback: estimate audio features from genre profile
  const estimated = estimateAudioFeaturesFromGenres(genreCounts)
  return { topGenres, genreCounts, topArtists, ...estimated }
}
