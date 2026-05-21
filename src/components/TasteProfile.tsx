import type { SpotifyProfile } from '../types'

interface Props {
  profile: SpotifyProfile
}

const COLORS = [
  { bar: 'bg-purple-500', dot: 'bg-purple-500' },
  { bar: 'bg-blue-500',   dot: 'bg-blue-500' },
  { bar: 'bg-green-500',  dot: 'bg-green-500' },
  { bar: 'bg-yellow-500', dot: 'bg-yellow-500' },
  { bar: 'bg-red-500',    dot: 'bg-red-500' },
  { bar: 'bg-pink-500',   dot: 'bg-pink-500' },
  { bar: 'bg-indigo-400', dot: 'bg-indigo-400' },
  { bar: 'bg-teal-500',   dot: 'bg-teal-500' },
]

function AudioBar({ label, value, display }: { label: string; value: number; display: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">{display}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-spotify rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        />
      </div>
    </div>
  )
}

export default function TasteProfile({ profile }: Props) {
  const topGenres = Object.entries(profile.genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  const total = topGenres.reduce((sum, [, c]) => sum + c, 0)
  const hasGenres = topGenres.length > 0 && total > 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
        Your Taste Profile
      </h3>

      {hasGenres ? (
        <div>
          {/* Stacked genre bar */}
          <div className="flex h-5 rounded-full overflow-hidden gap-px">
            {topGenres.map(([genre, count], i) => (
              <div
                key={genre}
                className={`${COLORS[i].bar} transition-all duration-500`}
                style={{ width: `${(count / total) * 100}%` }}
                title={`${genre}: ${Math.round((count / total) * 100)}%`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2.5">
            {topGenres.map(([genre], i) => (
              <div key={genre} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${COLORS[i].dot}`} />
                <span className="text-xs text-gray-600 capitalize">{genre}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          No genre data found. Play more music on Spotify and try again.
        </p>
      )}

      {/* Audio feature bars */}
      <div className="space-y-2 pt-2 border-t border-gray-50">
        <AudioBar
          label="Energy"
          value={profile.avgEnergy}
          display={`${Math.round(profile.avgEnergy * 100)}%`}
        />
        <AudioBar
          label="Mood"
          value={profile.avgValence}
          display={`${Math.round(profile.avgValence * 100)}%`}
        />
        <AudioBar
          label="Danceability"
          value={profile.avgDanceability}
          display={`${Math.round(profile.avgDanceability * 100)}%`}
        />
        <AudioBar
          label="Tempo"
          value={profile.avgTempo / 200}
          display={`${Math.round(profile.avgTempo)} BPM`}
        />
      </div>

      {profile.topArtists.length > 0 && (
        <div className="pt-2 border-t border-gray-50">
          <p className="text-xs text-gray-400 font-medium mb-1.5">Top Artists</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            {profile.topArtists.slice(0, 5).join(' · ')}
          </p>
        </div>
      )}
    </div>
  )
}
