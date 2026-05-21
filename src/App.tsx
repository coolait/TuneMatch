import { useEffect, useState } from 'react'
import {
  initiateLogin,
  handleCallback,
  isAuthenticated,
  logout,
  getSpotifyProfile,
} from './lib/spotify'
import { fetchStationsByZip } from './lib/radioLocator'
import { scoreStations } from './lib/matcher'
import { generateVibeDescriptions } from './lib/vibeDescriber'
import type { ScoredStation, SpotifyProfile } from './types'
import ZipInput from './components/ZipInput'
import StationList from './components/StationList'
import TasteProfile from './components/TasteProfile'

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

const EMPTY_PROFILE: SpotifyProfile = {
  topGenres: [],
  genreCounts: {},
  topArtists: [],
  avgEnergy: 0.5,
  avgValence: 0.5,
  avgDanceability: 0.5,
  avgTempo: 120,
}

const DEMO_PROFILE: SpotifyProfile = {
  topGenres: ['pop', 'rock', 'hip-hop', 'country', 'r&b'],
  genreCounts: { pop: 30, rock: 25, 'hip-hop': 20, country: 15, 'r&b': 10 },
  topArtists: ['Taylor Swift', 'Drake', 'The Weeknd', 'Kendrick Lamar', 'Morgan Wallen'],
  avgEnergy: 0.65,
  avgValence: 0.6,
  avgDanceability: 0.65,
  avgTempo: 118,
}

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [demoMode, setDemoMode] = useState(false)
  const [profile, setProfile] = useState<SpotifyProfile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [stations, setStations] = useState<ScoredStation[]>([])
  const [stationsLoading, setStationsLoading] = useState(false)
  const [vibesLoading, setVibesLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [lastZip, setLastZip] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const errorParam = params.get('error')
    const isCallback = window.location.pathname === '/callback'

    if (isCallback) {
      if (errorParam || !code) {
        window.history.replaceState({}, '', '/')
        setAuthState('unauthenticated')
        return
      }

      handleCallback(code)
        .then(() => {
          window.history.replaceState({}, '', '/')
          setAuthState('authenticated')
          return loadProfile()
        })
        .catch((err: unknown) => {
          console.error('Callback error:', err)
          window.history.replaceState({}, '', '/')
          setAuthState('unauthenticated')
        })
      return
    }

    if (isAuthenticated()) {
      setAuthState('authenticated')
      void loadProfile()
    } else {
      setAuthState('unauthenticated')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProfile() {
    setProfileError(null)
    try {
      const data = await getSpotifyProfile()
      setProfile(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load Spotify profile'
      setProfileError(msg)
      if (msg.includes('expired')) {
        setAuthState('unauthenticated')
      }
    }
  }

  async function handleSearch(zip: string) {
    if (!profile) return
    setLastZip(zip)
    setStationsLoading(true)
    setStations([])
    setSearchError(null)
    setVibesLoading(false)

    // Stage 1: fetch and score stations
    let scored: ScoredStation[] = []
    try {
      const raw = await fetchStationsByZip(zip)
      scored = scoreStations(raw, profile)
      setStations(scored)
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Something went wrong fetching stations')
      setStationsLoading(false)
      return
    }
    setStationsLoading(false)

    if (scored.length === 0) return

    // Stage 2: vibe descriptions — optional, never block or break the results
    setVibesLoading(true)
    try {
      const vibes = await generateVibeDescriptions(profile, scored.slice(0, 5))
      setStations((prev) =>
        prev.map((s) => ({
          ...s,
          vibeText: vibes[s.callSign] ?? vibes[s.callSign.toUpperCase()] ?? s.vibeText,
        }))
      )
    } catch {
      // Vibe descriptions are decorative — silently skip on failure
    } finally {
      setVibesLoading(false)
    }
  }

  function activateDemo() {
    setDemoMode(true)
    setProfile(DEMO_PROFILE)
    setAuthState('authenticated')
  }

  function handleLogout() {
    setDemoMode(false)
    logout()
    setProfile(null)
    setStations([])
    setSearchError(null)
    setAuthState('unauthenticated')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight text-gray-900">
            Tune<span className="text-spotify">Match</span>
          </span>

          {authState === 'authenticated' && (
            <div className="flex items-center gap-2">
              {demoMode && (
                <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  DEMO
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {demoMode ? 'Exit Demo' : 'Disconnect Spotify'}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {authState === 'loading' && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-spotify border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {authState === 'unauthenticated' && (
          <div className="text-center py-16 space-y-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">
                Tune<span className="text-spotify">Match</span>
              </h1>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                Connect your Spotify account to find radio stations that match your taste.
              </p>
            </div>

            <button
              onClick={() => void initiateLogin()}
              className="inline-flex items-center gap-3 bg-spotify hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-full transition-colors shadow-md"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Connect with Spotify
            </button>

            <button
              onClick={activateDemo}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Try without Spotify
            </button>

            {profileError && <p className="text-red-500 text-sm">{profileError}</p>}
          </div>
        )}

        {authState === 'authenticated' && (
          <>
            {/* Taste profile skeleton while loading */}
            {profile ? (
              <TasteProfile profile={profile} />
            ) : !profileError ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-28" />
                <div className="h-5 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            ) : null}

            {profileError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
                <span>⚠️</span>
                <div>
                  <p>{profileError}</p>
                  <button
                    onClick={() => void initiateLogin()}
                    className="mt-2 text-red-600 underline font-medium text-xs"
                  >
                    Re-connect with Spotify
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <ZipInput onSearch={handleSearch} loading={stationsLoading} />
            </div>

            {searchError && !stationsLoading && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                ⚠️ {searchError}
              </div>
            )}

            {(stationsLoading || stations.length > 0 || (!stationsLoading && lastZip)) && (
              <StationList
                stations={stations}
                profile={profile ?? EMPTY_PROFILE}
                loading={stationsLoading}
                vibesLoading={vibesLoading}
                zip={lastZip}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
