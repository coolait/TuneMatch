import { useState } from 'react'

interface Props {
  onSearch: (zip: string) => void
  loading: boolean
}

export default function ZipInput({ onSearch, loading }: Props) {
  const [zip, setZip] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = zip.trim()
    if (!/^\d{5}$/.test(trimmed)) {
      setError('Enter a valid 5-digit US ZIP code')
      return
    }
    setError('')
    onSearch(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">
        Input your ZIP code
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={zip}
          onChange={(e) => {
            setZip(e.target.value.replace(/\D/g, '').slice(0, 5))
            setError('')
          }}
          placeholder="e.g. 90210"
          maxLength={5}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-spotify focus:border-transparent text-sm"
        />
        <button
          type="submit"
          disabled={loading || zip.length !== 5}
          className="px-5 py-2.5 bg-spotify text-white rounded-xl font-semibold text-sm
            hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Searching…
            </span>
          ) : (
            'Search'
          )}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </form>
  )
}
