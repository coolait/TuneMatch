import type { SpotifyProfile } from '../types'

interface Props {
  profile: SpotifyProfile
}

const GENRE_COLORS = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-spotify',
  'bg-yellow-500',
  'bg-red-500',
  'bg-pink-500',
  'bg-indigo-400',
  'bg-teal-500',
]

const LEGEND_COLORS = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-pink-500',
  'bg-indigo-400',
  'bg-teal-500',
]

function AudioBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-spotify rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
        Your Taste Profile
      </h3>

      {/* Genre stacked bar */}
      <div>
        <div className="flex h-5 rounded-full overflow-hidden gap-px">
          {topGenres.map(([genre, count], i) => (
            <div
              key={genre}
              className={`${GENRE_COLORS[i]} transition-all duration-500`}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${genre}: ${Math.round((count / total) * 100)}%`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2.5">
          {topGenres.map(([genre], i) => (
            <div key={genre} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${LEGEND_COLORS[i]}`} />
              <span className="text-xs text-gray-600 capitalize">{genre}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Audio feature bars */}
      <div className="space-y-2 pt-2 border-t border-gray-50">
        <AudioBar label="Energy" value={profile.avgEnergy} />
        <AudioBar label="Mood" value={profile.avgValence} />
        <AudioBar label="Danceability" value={profile.avgDanceability} />
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span className="font-medium">Tempo</span>
            <span className="tabular-nums">{Math.round(profile.avgTempo)} BPM</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-spotify rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (profile.avgTempo / 200) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top artists */}
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
