/**
 * POST /api/generate-concepts
 *
 * Calls Google AI Studio — Imagen 3 Fast — to generate 3 concept images.
 * The GOOGLE_API_KEY is kept server-side and never exposed to the client.
 *
 * Request body:  { prompts: [string, string, string] }
 * Response body: { images: ConceptImage[] }
 *   where ConceptImage.url is a data URL (data:image/jpeg;base64,...)
 *   or null if that particular image failed.
 */

const CONCEPT_IDS = ['concept_a', 'concept_b', 'concept_c'] as const
type ConceptId = (typeof CONCEPT_IDS)[number]

interface ConceptImage {
  conceptId: ConceptId
  url: string | null
  error: string | null
}

interface ImagenPrediction {
  bytesBase64Encoded?: string
  mimeType?: string
  raiFilteredReason?: string
}

interface ImagenResponse {
  predictions?: ImagenPrediction[]
  error?: { code: number; message: string }
}

// ── Google Imagen call ────────────────────────────────────────────────────────

const IMAGEN_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-fast-generate-001:predict'

async function generateOne(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(IMAGEN_URL, {
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

  const data = (await res.json()) as ImagenResponse

  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? `HTTP ${res.status}`)
  }

  const prediction = data.predictions?.[0]
  if (!prediction?.bytesBase64Encoded) {
    throw new Error(prediction?.raiFilteredReason ?? 'Empty prediction')
  }

  const mime = prediction.mimeType ?? 'image/jpeg'
  return `data:${mime};base64,${prediction.bytesBase64Encoded}`
}

// ── Request / Response minimal types (Vercel runtime) ────────────────────────

interface Req {
  method: string
  body: { prompts?: unknown }
}

interface Res {
  status(code: number): Res
  json(body: unknown): void
  setHeader(key: string, value: string): void
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: Req, res: Res): Promise<void> {
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

  // Generate all 3 images in parallel; per-image errors produce null URLs
  const images: ConceptImage[] = await Promise.all(
    (prompts as string[]).map(async (prompt, i) => {
      const conceptId = CONCEPT_IDS[i]
      try {
        const url = await generateOne(prompt, apiKey)
        return { conceptId, url, error: null }
      } catch (err) {
        return {
          conceptId,
          url: null,
          error: err instanceof Error ? err.message : 'Generation failed',
        }
      }
    }),
  )

  res.status(200).json({ images })
}
