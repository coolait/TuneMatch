import type { RawStation, ScoredStation, SpotifyProfile } from '../types'

// Maps Spotify genre keywords → likely Radio-Locator format strings
// Each entry: keywords to match against genre name, formats to match against station format
const FORMAT_CLUSTERS: Array<{ keywords: string[]; formats: string[] }> = [
  {
    keywords: ['hip hop', 'hip-hop', 'rap', 'trap', 'drill', 'gangsta', 'mumble', 'crunk', 'bounce', 'hyphy', 'grime', 'uk rap'],
    formats: ['hip-hop', 'hip hop', 'urban', 'rhythmic', 'rap', 'urban contemporary'],
  },
  {
    keywords: ['r&b', 'rnb', 'rhythm and blues', 'neo soul', 'quiet storm', 'new jack swing'],
    formats: ['urban contemporary', 'r&b', 'rhythmic oldies', 'smooth r&b', 'urban adult contemporary'],
  },
  {
    keywords: ['soul', 'funk', 'motown', 'disco'],
    formats: ['urban contemporary', 'rhythmic oldies', 'soul', 'urban adult contemporary'],
  },
  {
    keywords: ['pop', 'dance pop', 'electropop', 'synth pop', 'k-pop', 'teen pop', 'bubblegum', 'pop rock'],
    formats: ['top-40', 'top 40', 'top40', 'chr', 'hot ac', 'adult contemporary', 'pop'],
  },
  {
    keywords: ['adult contemporary', 'soft rock', 'easy listening', 'mellow gold'],
    formats: ['adult contemporary', 'soft ac', 'hot ac', 'lite ac'],
  },
  {
    keywords: ['rock', 'hard rock', 'arena rock', 'heartland rock', 'glam rock'],
    formats: ['classic rock', 'active rock', 'rock', 'adult album alternative'],
  },
  {
    keywords: ['alternative', 'indie rock', 'post-punk', 'shoegaze', 'dream pop', 'lo-fi'],
    formats: ['alternative', 'alternative rock', 'indie', 'adult album alternative'],
  },
  {
    keywords: ['grunge', 'post-grunge', 'nu metal', 'emo', 'punk', 'hardcore'],
    formats: ['active rock', 'alternative', '90\'s rock'],
  },
  {
    keywords: ['metal', 'heavy metal', 'death metal', 'black metal', 'thrash'],
    formats: ['active rock', 'hard rock'],
  },
  {
    keywords: ['classic rock', '70s rock', '80s rock', 'album rock', 'classic hits'],
    formats: ['classic rock', '80\'s rock', '90\'s rock', 'classic hits'],
  },
  {
    keywords: ['country', 'country pop', 'bro country', 'nashville'],
    formats: ['country', 'new country', 'hot country'],
  },
  {
    keywords: ['classic country', 'outlaw country', 'traditional country', 'honky tonk'],
    formats: ['classic country', 'country', 'traditional country'],
  },
  {
    keywords: ['americana', 'bluegrass', 'roots', 'country folk'],
    formats: ['americana', 'bluegrass', 'country', 'roots'],
  },
  {
    keywords: ['jazz', 'bebop', 'big band', 'swing', 'hard bop', 'cool jazz'],
    formats: ['jazz', 'big band', 'standards'],
  },
  {
    keywords: ['smooth jazz', 'contemporary jazz', 'quiet storm'],
    formats: ['smooth jazz', 'jazz', 'quiet storm'],
  },
  {
    keywords: ['blues', 'electric blues', 'chicago blues', 'delta blues'],
    formats: ['blues', 'jazz'],
  },
  {
    keywords: ['classical', 'orchestra', 'symphony', 'chamber', 'baroque', 'opera', 'choral'],
    formats: ['classical', 'classical music'],
  },
  {
    keywords: ['edm', 'house', 'techno', 'dubstep', 'trance', 'drum and bass', 'electronic dance', 'club'],
    formats: ['dance', 'electronic', 'club'],
  },
  {
    keywords: ['electronic', 'electronica', 'idm', 'ambient electronic'],
    formats: ['dance', 'electronic', 'alternative'],
  },
  {
    keywords: ['folk', 'folk rock', 'traditional folk', 'celtic', 'acoustic folk'],
    formats: ['folk', 'americana', 'adult standards'],
  },
  {
    keywords: ['singer-songwriter', 'acoustic', 'indie folk', 'chamber pop'],
    formats: ['adult contemporary', 'soft ac', 'folk', 'adult album alternative'],
  },
  {
    keywords: ['latin', 'reggaeton', 'salsa', 'cumbia', 'bachata', 'merengue', 'latin pop'],
    formats: ['spanish contemporary', 'latin', 'regional mexican', 'tropical'],
  },
  {
    keywords: ['reggae', 'dancehall', 'ska', 'dub'],
    formats: ['reggae', 'urban contemporary'],
  },
  {
    keywords: ['gospel', 'christian', 'worship', 'ccm', 'contemporary christian', 'inspirational'],
    formats: ['gospel', 'christian contemporary', 'inspirational'],
  },
  {
    keywords: ['oldies', 'doo wop', '50s', '60s pop', 'early rock'],
    formats: ['oldies', '50s & 60s', 'adult standards'],
  },
  {
    keywords: ['standards', 'crooners', 'rat pack', 'broadway', 'show tunes'],
    formats: ['adult standards', 'nostalgia', 'big band', 'standards'],
  },
  {
    keywords: ['new age', 'meditation', 'ambient', 'space music'],
    formats: ['new age', 'smooth jazz', 'classical'],
  },
  {
    keywords: ['indie', 'indie pop', 'bedroom pop', 'art pop', 'indie r&b'],
    formats: ['adult album alternative', 'alternative', 'indie', 'top-40'],
  },
  {
    keywords: ['hip hop oldies', 'old school hip hop', 'golden age hip hop'],
    formats: ['classic hip-hop', 'urban oldies', 'rhythmic oldies'],
  },
  {
    keywords: ['afrobeats', 'afropop', 'highlife'],
    formats: ['urban contemporary', 'world music'],
  },
]

function getFormatsForGenre(genre: string): string[] {
  const g = genre.toLowerCase()
  const matched = new Set<string>()

  for (const cluster of FORMAT_CLUSTERS) {
    if (cluster.keywords.some((kw) => g.includes(kw) || kw.includes(g))) {
      cluster.formats.forEach((f) => matched.add(f.toLowerCase()))
    }
  }

  return Array.from(matched)
}

function formatMatches(stationFormat: string, targetFormats: string[]): boolean {
  const sf = stationFormat.toLowerCase()
  return targetFormats.some((tf) => sf.includes(tf) || tf.includes(sf))
}

function calculateFormatScore(stationFormat: string, genreCounts: Record<string, number>): number {
  const total = Object.values(genreCounts).reduce((a, b) => a + b, 0)
  if (total === 0) return 0

  let matchedWeight = 0
  for (const [genre, count] of Object.entries(genreCounts)) {
    const weight = count / total
    const targetFormats = getFormatsForGenre(genre)
    if (targetFormats.length > 0 && formatMatches(stationFormat, targetFormats)) {
      matchedWeight += weight
    }
  }

  if (matchedWeight === 0) return 0
  // sqrt scaling: 25% genre match → 50 score, 50% → 71, 100% → 100
  return Math.round(Math.sqrt(matchedWeight) * 100)
}

function calculateAudioScore(
  stationFormat: string,
  profile: Pick<SpotifyProfile, 'avgEnergy' | 'avgValence' | 'avgDanceability' | 'avgTempo'>
): number {
  const f = stationFormat.toLowerCase()
  const { avgEnergy, avgValence, avgDanceability } = profile
  const hits = (...formats: string[]) => formats.some((fmt) => f.includes(fmt))

  let score = 0

  // Upbeat + danceable profile → confirms Top-40 / Pop / Hip-Hop / Urban / Dance stations
  // (Only those station types benefit — rock/country stations don't fire this check)
  if (avgDanceability >= 0.65 && avgEnergy >= 0.60) {
    if (hits('top-40', 'top 40', 'top40', 'chr', 'hip-hop', 'hip hop', 'urban', 'rhythmic', 'dance', 'pop', 'hits', 'hot ac')) {
      score += 45
    }
  }

  // Positive / happy mood + somewhat danceable → Pop, AC, Country, Hits formats
  if (avgValence >= 0.55 && avgDanceability >= 0.55) {
    if (hits('top-40', 'top 40', 'top40', 'pop', 'hits', 'adult contemporary', 'hot ac', 'country', 'lite', 'soft ac', 'adult hits')) {
      score += 30
    }
  }

  // Chill / low-energy profile → confirms Jazz, Classical, Folk, Smooth, AC
  if (avgEnergy <= 0.45) {
    if (hits('jazz', 'smooth jazz', 'classical', 'folk', 'americana', 'soft ac', 'new age', 'adult standards', 'lite', 'quiet storm')) {
      score += 45
    }
  }

  // High energy + LOW danceability = rock profile → confirms Rock / Alternative stations
  // Key gate: danceability <= 0.58 prevents hip-hop/pop listeners from triggering this
  if (avgEnergy >= 0.62 && avgDanceability <= 0.58) {
    if (hits('rock', 'alternative', 'active rock', 'classic rock', 'classic hits', 'alternative rock', 'hard rock', 'metal', 'grunge', 'punk', '90s')) {
      score += 40
    }
  }

  // Low valence + moderate energy = moody/dark profile → extra confirm for Rock / Alternative
  if (avgValence <= 0.45 && avgEnergy >= 0.50) {
    if (hits('rock', 'alternative', 'active rock', 'classic rock', 'alternative rock', 'grunge', 'metal', 'punk', '90s')) {
      score += 25
    }
  }

  // Country / Americana profile: moderate energy + positive + not overly danceable
  // danceability cap <= 0.70 distinguishes country from pop (pop dancers score higher)
  if (avgEnergy >= 0.45 && avgEnergy <= 0.72 && avgValence >= 0.55 && avgDanceability >= 0.50 && avgDanceability <= 0.70) {
    if (hits('country', 'americana', 'bluegrass', 'folk', 'adult contemporary', 'hot country', 'new country', 'classic country', 'traditional country')) {
      score += 35
    }
  }

  return Math.min(100, Math.max(0, score))
}

export function scoreStations(stations: RawStation[], profile: SpotifyProfile): ScoredStation[] {
  return stations
    .map((station) => {
      const formatScore = calculateFormatScore(station.format, profile.genreCounts)
      const audioScore = calculateAudioScore(station.format, profile)
      const finalScore = Math.round(formatScore * 0.65 + audioScore * 0.35)
      return { ...station, formatScore, audioScore, finalScore }
    })
    .sort((a, b) => b.finalScore - a.finalScore)
}

// Returns the top genre clusters that drove a station's match score
export function getMatchingGenres(station: ScoredStation, profile: SpotifyProfile): string[] {
  const top = Object.entries(profile.genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([g]) => g)

  return top.filter((genre) => {
    const targetFormats = getFormatsForGenre(genre)
    return targetFormats.length > 0 && formatMatches(station.format, targetFormats)
  })
}
