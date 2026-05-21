export interface SpotifyProfile {
  topGenres: string[]
  genreCounts: Record<string, number>
  topArtists: string[]
  avgEnergy: number
  avgValence: number
  avgDanceability: number
  avgTempo: number
}

export interface RawStation {
  callSign: string
  frequency: string
  band: 'AM' | 'FM' | string
  format: string
  city: string
  state: string
  distance: number
  slogan?: string
}

export interface ScoredStation extends RawStation {
  formatScore: number
  audioScore: number
  finalScore: number
  vibeText?: string
}
