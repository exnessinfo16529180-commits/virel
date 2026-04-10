/**
 * POST /api/generate-concepts
 *
 * Calls Google AI Studio — Imagen 3 Fast — to generate 3 concept images.
 * The GOOGLE_API_KEY is kept server-side and never exposed to the client.
 *
 * Request body:  { prompts: [string, string, string] }
 * Response body: {
 *   images: ConceptImage[],
 *   debug: { model, statuses, reasons, timestamp },
 *   debugSummary?: string   ← present only when all images failed
 * }
 */

const MODEL = 'imagen-3.0-generate-002'
const CONCEPT_IDS = ['concept_a', 'concept_b', 'concept_c']
const IMAGEN_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict`

/** Produce a single human-readable cause line from collected statuses/reasons. */
function buildDebugSummary(statuses, reasons) {
  const status  = statuses[0]
  const reason  = reasons.find(r => r && r !== 'ok') ?? reasons[0] ?? 'unknown'
  if (status === 403) return `Permission denied (403) — check API key or Imagen access`
  if (status === 401) return `Unauthorized (401) — API key missing or invalid`
  if (status === 400) return `Bad request (400) — ${reason}`
  if (status === 404) return `Model not found (404) — ${reason}`
  if (status === 429) return `Quota exceeded (429) — rate limit reached`
  if (status === 500) return `Google internal error (500) — ${reason}`
  if (status === 'fetch-error') return `Network error — ${reason}`
  return `HTTP ${status} — ${reason}`
}

/** @returns {{ url: string, upstreamStatus: number, reason: string }} */
async function generateOne(prompt, apiKey) {
  const upstream = await fetch(IMAGEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '16:9',
        safetySetting: 'block_some',
      },
    }),
  })

  const upstreamStatus = upstream.status
  const rawText = await upstream.text()

  let data
  try {
    data = JSON.parse(rawText)
  } catch {
    const snippet = rawText.slice(0, 300)
    console.error(`[generate-concepts] non-JSON from Google (${upstreamStatus}): ${snippet}`)
    throw Object.assign(new Error(`Non-JSON response: ${snippet}`), { upstreamStatus })
  }

  const hasPredictions = Array.isArray(data.predictions) && data.predictions.length > 0
  const hasBytes = hasPredictions && Boolean(data.predictions[0]?.bytesBase64Encoded)
  console.log(
    `[generate-concepts] upstream=${upstreamStatus} hasPredictions=${hasPredictions} hasBytes=${hasBytes}`,
  )

  if (!upstream.ok || data.error) {
    const snippet = JSON.stringify(data).slice(0, 300)
    console.error(`[generate-concepts] API error body: ${snippet}`)
    throw Object.assign(
      new Error(data.error?.message ?? `HTTP ${upstreamStatus}`),
      { upstreamStatus },
    )
  }

  const prediction = data.predictions?.[0]
  if (!prediction?.bytesBase64Encoded) {
    const reason = prediction?.raiFilteredReason ?? 'bytesBase64Encoded missing'
    console.error(`[generate-concepts] no bytes — reason: ${reason}`)
    console.error(`[generate-concepts] prediction keys: ${Object.keys(prediction ?? {}).join(', ')}`)
    throw Object.assign(new Error(reason), { upstreamStatus })
  }

  const mime = prediction.mimeType ?? 'image/jpeg'
  console.log(`[generate-concepts] OK mime=${mime} len=${prediction.bytesBase64Encoded.length}`)
  return { url: `data:${mime};base64,${prediction.bytesBase64Encoded}`, upstreamStatus, reason: 'ok' }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'GOOGLE_API_KEY is not configured' })
    return
  }

  const { prompts } = req.body
  if (!Array.isArray(prompts) || prompts.length !== 3) {
    res.status(400).json({ error: 'Expected body.prompts to be an array of 3 strings' })
    return
  }

  const debugStatuses = []
  const debugReasons  = []

  const images = await Promise.all(
    prompts.map(async (prompt, i) => {
      const conceptId = CONCEPT_IDS[i]
      try {
        const { url, upstreamStatus, reason } = await generateOne(prompt, apiKey)
        debugStatuses.push(upstreamStatus)
        debugReasons.push(reason)
        return { conceptId, url, error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Generation failed'
        debugStatuses.push(err.upstreamStatus ?? 'fetch-error')
        debugReasons.push(message)
        return { conceptId, url: null, error: message }
      }
    }),
  )

  const allFailed = images.every(img => img.url === null)
  const debug = {
    model:     MODEL,
    statuses:  debugStatuses,
    reasons:   debugReasons,
    timestamp: new Date().toISOString(),
  }

  res.status(200).json({
    images,
    debug,
    ...(allFailed ? { debugSummary: buildDebugSummary(debugStatuses, debugReasons) } : {}),
  })
}
