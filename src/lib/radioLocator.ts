import type { RawStation } from '../types'

interface RawJsonStation {
  Call?: string
  callSign?: string
  Freq?: string
  frequency?: string
  Band?: string
  band?: string
  Format?: string
  format?: string
  City?: string
  city?: string
  State?: string
  state?: string
  Dist?: string
  distance?: string | number
  Slogan?: string
  slogan?: string
}

function parseJsonStations(data: RawJsonStation[]): RawStation[] {
  return data
    .map((item) => ({
      callSign: (item.Call ?? item.callSign ?? '').trim(),
      frequency: (item.Freq ?? item.frequency ?? '').trim(),
      band: ((item.Band ?? item.band ?? 'FM') as string).trim(),
      format: (item.Format ?? item.format ?? 'Unknown').trim(),
      city: (item.City ?? item.city ?? '').trim(),
      state: (item.State ?? item.state ?? '').trim(),
      distance: parseFloat(String(item.Dist ?? item.distance ?? '0')) || 0,
      slogan: item.Slogan ?? item.slogan,
    }))
    .filter((s) => s.callSign.length > 0 && s.format !== 'Unknown')
}

function parseTextStations(text: string): RawStation[] {
  const lines = text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  return lines
    .map((line) => {
      // Try tab-separated, then pipe-separated, then comma
      const sep = line.includes('\t') ? '\t' : line.includes('|') ? '|' : ','
      const parts = line.split(sep).map((p) => p.trim())
      return {
        callSign: parts[0] ?? '',
        frequency: parts[1] ?? '',
        band: parts[2] ?? 'FM',
        format: parts[3] ?? 'Unknown',
        city: parts[4] ?? '',
        state: parts[5] ?? '',
        distance: parseFloat(parts[6] ?? '0') || 0,
        slogan: parts[7],
      }
    })
    .filter((s) => s.callSign.length > 1 && !/^(Call|CALL|Station)$/i.test(s.callSign))
}

export async function fetchStationsByZip(zip: string): Promise<RawStation[]> {
  const res = await fetch(`/api/stations?zip=${encodeURIComponent(zip)}`)

  if (!res.ok) {
    throw new Error(`Radio-Locator returned ${res.status}. Check your ZIP code or try again.`)
  }

  const contentType = res.headers.get('content-type') ?? ''

  if (contentType.includes('json')) {
    const data = (await res.json()) as RawJsonStation[]
    return parseJsonStations(Array.isArray(data) ? data : [])
  }

  // Fallback: try to parse as text/table
  const text = await res.text()

  // If HTML, try to extract table data
  if (text.trimStart().startsWith('<')) {
    return parseHtmlTable(text)
  }

  return parseTextStations(text)
}

function parseHtmlTable(html: string): RawStation[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const rows = Array.from(doc.querySelectorAll('table tr')).slice(1) // skip header

  return rows
    .map((row) => {
      const cells = Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim() ?? '')
      return {
        callSign: cells[0] ?? '',
        frequency: cells[1] ?? '',
        band: cells[2] ?? 'FM',
        format: cells[3] ?? 'Unknown',
        city: cells[4] ?? '',
        state: cells[5] ?? '',
        distance: parseFloat(cells[6] ?? '0') || 0,
        slogan: cells[7],
      }
    })
    .filter((s) => s.callSign.length > 1)
}
