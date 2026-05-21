export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const zip = url.searchParams.get('zip') ?? ''

  if (!/^\d{5}$/.test(zip)) {
    return new Response(JSON.stringify({ error: 'Invalid ZIP' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const target = `https://radio-locator.com/cgi-bin/pat?pat=${zip}&nse=1&format=json`

  const res = await fetch(target, {
    headers: { 'User-Agent': 'TuneMatch/1.0' },
  })

  const body = await res.arrayBuffer()

  return new Response(body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'text/plain',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
