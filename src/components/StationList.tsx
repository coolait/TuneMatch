import { useState } from 'react'
import type { ScoredStation, SpotifyProfile } from '../types'
import { getMatchingGenres } from '../lib/matcher'
import StationCard from './StationCard'
import SkeletonCard from './SkeletonCard'

interface Props {
  stations: ScoredStation[]
  profile: SpotifyProfile
  loading: boolean
  vibesLoading: boolean
  zip: string
}

export default function StationList({ stations, profile, loading, vibesLoading, zip }: Props) {
  const [sortMode, setSortMode] = useState<'score' | 'signal'>('score')

  const sorted = [...stations].sort((a, b) =>
    sortMode === 'score'
      ? b.finalScore - a.finalScore
      : a.distance - b.distance
  )

  const topStation = sorted[0]
  const drivingGenres = topStation ? getMatchingGenres(topStation, profile) : []

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (!loading && stations.length === 0 && zip) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-4xl mb-3">📻</div>
        <p className="text-gray-700 font-medium">No stations found near {zip}</p>
        <p className="text-gray-500 text-sm mt-1">
          Try a nearby major city's ZIP code — e.g. 10001 (NYC), 90001 (LA), 60601 (Chicago)
        </p>
      </div>
    )
  }

  if (stations.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {stations.length} station{stations.length !== 1 ? 's' : ''} matched
        </p>

        {/* Sort toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
          <button
            onClick={() => setSortMode('score')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              sortMode === 'score'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            By match
          </button>
          <button
            onClick={() => setSortMode('signal')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              sortMode === 'signal'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            By signal
          </button>
        </div>
      </div>

      {/* Genre match legend */}
      {drivingGenres.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">How we matched you:</span>
          {drivingGenres.slice(0, 5).map((g) => (
            <span
              key={g}
              className="text-xs bg-spotify/10 text-green-800 px-2 py-0.5 rounded-full font-medium capitalize"
            >
              {g}
            </span>
          ))}
        </div>
      )}

      {/* Cards */}
      <div className="space-y-3">
        {sorted.map((station, idx) => (
          <StationCard
            key={station.callSign}
            station={station}
            rank={sortMode === 'score' ? idx + 1 : 999}
            vibesLoading={vibesLoading}
          />
        ))}
      </div>
    </div>
  )
}
