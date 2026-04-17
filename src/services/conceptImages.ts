/**
 * Concept Image Generation Service
 *
 * Calls the Vercel serverless function at /api/generate-concepts.
 * Falls back gracefully if the API is unavailable or returns errors.
 */

import type { ConceptImage, FlowState, Atmosphere, Palette, InteriorStyle } from '../types/flow'

// ── Prompt building ───────────────────────────────────────────────────────────

const ATMOSPHERE_PROMPT: Record<Atmosphere, string> = {
  calm:     'serene and peaceful, neutral tones, soft natural light',
  warm:     'warm and cozy, amber glow, inviting atmosphere',
  minimal:  'clean and minimalist, abundant white space, precise lines',
  contrast: 'dramatic contrast, bold shadows, high visual tension',
}

const PALETTE_PROMPT: Record<Palette, string> = {
  neutral:  'beige, greige and milk white color scheme',
  warm:     'sandy, terracotta and amber palette',
  cool:     'grey-blue, graphite and smoky tones',
  contrast: 'deep charcoal and rich gold accent palette',
}

const STYLE_PROMPT: Record<InteriorStyle, string> = {
  modern:     'contemporary modern style',
  scandi:     'Scandinavian style with birch and linen',
  minimal:    'pure minimalist style',
  neoclassic: 'neoclassical style with crown moldings and antique gold',
}

// Slight camera/mood divergence per concept to ensure visual variety
const CONCEPT_MODIFIERS = [
  'wide angle interior shot, natural daylight from large windows',
  'medium shot, evening mood, warm artificial lighting',
  'close detail shot, texture focus, architectural photography',
] as const

function buildPrompts(state: FlowState): string[] {
  const atmosphere = state.atmosphere ?? 'calm'
  const palette    = state.palette    ?? 'neutral'
  const style      = state.style      ?? 'modern'

  const base = [
    'luxury interior design visualization',
    STYLE_PROMPT[style],
    ATMOSPHERE_PROMPT[atmosphere],
    PALETTE_PROMPT[palette],
    'photorealistic render, 8K resolution, professional interior photography',
  ].join(', ')

  return CONCEPT_MODIFIERS.map(mod => `${base}, ${mod}`)
}

// ── API call ──────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 30_000

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface GenerationDebug {
  model: string
  statuses: (number | string)[]
  reasons: string[]
  timestamp?: string
  debugSummary?: string
}

export interface GenerationResult {
  images: ConceptImage[]
  allFailed: boolean
  debug?: GenerationDebug
}

/**
 * Generate 3 concept images based on the user's flow choices.
 * Retries once on network error. Returns fallback images on total failure.
 */
export async function generateConceptImages(
  state: FlowState,
  retryCount = 0,
): Promise<GenerationResult> {
  const prompts = buildPrompts(state)

  const payload = {
    atmosphere:  state.atmosphere,
    palette:     state.palette,
    style:       state.style,
    projectType: state.projectType,
    budgetRange: state.budgetRange,
    prompts,
  }

  try {
    const res = await fetchWithTimeout(
      '/api/generate-concepts',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      TIMEOUT_MS,
    )

    if (!res.ok) {
      throw new Error(`API responded ${res.status}`)
    }

    const data = await res.json() as {
      images: ConceptImage[]
      debug?: GenerationDebug
      debugSummary?: string
    }
    const allFailed = data.images.every(img => img.url === null)
    const debug: GenerationDebug | undefined = data.debug
      ? { ...data.debug, debugSummary: data.debugSummary }
      : undefined

    return { images: data.images, allFailed, debug }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'

    // No retry for auth/quota errors — they won't resolve on retry
    const statusMatch = message.match(/API responded (\d+)/)
    const httpStatus = statusMatch ? parseInt(statusMatch[1], 10) : null
    const noRetryStatuses = [401, 403, 429]
    const shouldRetry = retryCount < 1 && (httpStatus === null || !noRetryStatuses.includes(httpStatus))

    if (shouldRetry) {
      const backoff = retryCount === 0 ? 1500 : 3000
      await new Promise(r => setTimeout(r, backoff))
      return generateConceptImages(state, retryCount + 1)
    }

    // Total failure — return structure with null URLs (fallback to gradients)
    const ids = ['concept_a', 'concept_b', 'concept_c'] as const
    return {
      images: ids.map(conceptId => ({
        conceptId,
        url: null,
        error: message,
      })),
      allFailed: true,
    }
  }
}
