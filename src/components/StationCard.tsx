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
  green:  { border: 'bg-green-500',  badge: 'bg-green-100 text-green-700',  text: 'text-green-700' },
  yellow: { border: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700', text: 'text-yellow-700' },
  red:    { border: 'bg-red-400',    badge: 'bg-red-100 text-red-600',        text: 'text-red-600' },
}

export default function StationCard({ station, rank, vibesLoading, couldHaveVibe }: Props) {
  const tier = scoreTier(station.finalScore)
  const styles = tierStyles[tier]
  const isTopPick = rank === 1
  const showShimmer = vibesLoading && couldHaveVibe && !station.vibeText

  // Full station name takes priority; fall back to callSign
  const displayName = station.slogan ?? station.callSign
  // Only show the extracted call sign as a chip if it's meaningfully different from the full name
  const showCallChip =
    station.callSign &&
    station.slogan &&
    !station.slogan.toLowerCase().startsWith(station.callSign.toLowerCase())

  const freqLabel = [station.frequency, station.band].filter(Boolean).join(' ')

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex hover:shadow-md transition-shadow">
      <div className={`w-1 flex-shrink-0 ${styles.border}`} />

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Station name row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900 text-sm leading-snug">{displayName}</span>
              {isTopPick && (
                <span className="text-xs font-semibold bg-spotify text-white px-2 py-0.5 rounded-full shrink-0">
                  Top Pick
                </span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-xs text-gray-500">
              {showCallChip && (
                <span className="font-mono font-semibold text-gray-700">{station.callSign}</span>
              )}
              {freqLabel && (
                <>
                  {showCallChip && <span>·</span>}
                  <span>{freqLabel}</span>
                </>
              )}
              {station.format !== 'Unknown' && (
                <>
                  <span>·</span>
                  <span className="capitalize">{station.format}</span>
                </>
              )}
            </div>

            {/* Location */}
            <p className="text-xs text-gray-400 mt-0.5">{station.state}</p>

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
          {station.distance > 0 && station.distance < 999 && (
            <span>{station.distance.toFixed(0)} mi</span>
          )}
        </div>
      </div>
    </div>
  )
}
