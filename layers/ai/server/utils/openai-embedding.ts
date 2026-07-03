// Single source of truth for turning text into an OpenAI embedding vector.
//
// Used by BOTH sides of the vector index so the model and dimensions can
// never drift apart:
//   • write path  — entity-embedder.service.ts (product/seller/square upserts)
//   • read path   — /api/ai/search (semantic query at conversation time)
//
// This is the ONLY place embeddings are generated. Keyword / attribute search
// (`/api/commerce/products?search=`, `/api/search`) never touches this file.

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIM = 1536

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`OpenAI embeddings API error ${res.status}: ${err}`)
  }

  const data = (await res.json()) as { data: Array<{ embedding: number[] }> }
  const vec = data.data[0]?.embedding
  if (!vec || vec.length !== EMBEDDING_DIM)
    throw new Error(`Unexpected vector length: ${vec?.length}`)
  return vec
}
