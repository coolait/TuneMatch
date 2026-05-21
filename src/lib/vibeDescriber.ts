import type { ScoredStation, SpotifyProfile } from '../types'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string

export async function generateVibeDescriptions(
  profile: SpotifyProfile,
  top5: ScoredStation[]
): Promise<Record<string, string>> {
  if (!API_KEY) {
    console.warn('VITE_ANTHROPIC_API_KEY not set — skipping vibe descriptions')
    return {}
  }

  const stationList = top5
    .map((s) => `- ${s.callSign} (${s.frequency} ${s.band}): ${s.format} in ${s.city}, ${s.state}`)
    .join('\n')

  const prompt = `A user's Spotify profile shows they listen to: ${profile.topGenres.slice(0, 6).join(', ')}.
Their audio fingerprint: energy=${profile.avgEnergy.toFixed(2)}, valence=${profile.avgValence.toFixed(2)}, danceability=${profile.avgDanceability.toFixed(2)}, tempo=${Math.round(profile.avgTempo)}bpm.
Their top artists: ${profile.topArtists.slice(0, 5).join(', ')}.

For each of these radio stations, write a one-sentence vibe match explanation (max 15 words) explaining why it matches or doesn't match this listener.

Stations:
${stationList}

Respond ONLY with a JSON object, no markdown, no backticks:
{
  "CALLSIGN": "vibe explanation here"
}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Claude API error ${res.status}: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  const text: string = data.content?.[0]?.text?.trim() ?? '{}'

  try {
    return JSON.parse(text) as Record<string, string>
  } catch {
    // If Claude's JSON is slightly malformed, try to extract it
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as Record<string, string>
    return {}
  }
}
