import type { ScoredStation } from '../types'

interface Props {
  station: ScoredStation
  rank: number
  vibesLoading: boolean
  couldHaveVibe: boolean
}

function scoreTier(score: number): 'green' | 'yellow' | 'red' {
  if (score > 75) return 'green'
  if (score >= 50) return 'yellow'
  return 'red'
}

const tierStyles = {
  green:  { border: 'bg-green-500',  badge: 'bg-green-100 text-green-700',   text: 'text-green-700' },
  yellow: { border: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700',  text: 'text-yellow-700' },
  red:    { border: 'bg-red-400',    badge: 'bg-red-100 text-red-600',         text: 'text-red-600' },
}

export default function StationCard({ station, rank, vibesLoading, couldHaveVibe }: Props) {
  const tier = scoreTier(station.finalScore)
  const styles = tierStyles[tier]
  const isTopPick = rank === 1
  const showShimmer = vibesLoading && couldHaveVibe && !station.vibeText

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex hover:shadow-md transition-shadow">
      {/* Colored left border */}
      <div className={`w-1 flex-shrink-0 ${styles.border}`} />

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Station info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900 text-base">{station.callSign}</span>
              <span className="text-sm text-gray-500">{station.frequency} {station.band}</span>
              {isTopPick && (
                <span className="text-xs font-semibold bg-spotify text-white px-2 py-0.5 rounded-full">
                  Top Pick
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-0.5">
              {station.format} · {station.city}, {station.state}
            </p>

            {/* Vibe text / shimmer */}
            <div className="mt-2 min-h-[1rem]">
              {showShimmer ? (
                <div className="h-3 rounded w-3/4 animate-shimmer" />
              ) : station.vibeText ? (
                <p className="text-xs italic text-gray-400">{station.vibeText}</p>
              ) : null}
            </div>
          </div>

          {/* Score badge */}
          <div className={`flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-2 ${styles.badge}`}>
            <span className={`text-2xl font-bold leading-none ${styles.text}`}>
              {station.finalScore}%
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide opacity-70 mt-0.5">
              match
            </span>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
          <span>Format <span className="text-gray-600 font-medium">{station.formatScore}</span></span>
          <span>Audio <span className="text-gray-600 font-medium">{station.audioScore}</span></span>
          {station.distance > 0 && <span>{station.distance.toFixed(1)} mi</span>}
        </div>
      </div>
    </div>
  )
}
