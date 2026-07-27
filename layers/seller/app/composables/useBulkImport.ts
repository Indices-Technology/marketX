/**
 * useBulkImport — client state for the offline gallery bulk-import flow.
 *
 * Model: default one photo = one product (a phone camera roll has no meaningful
 * filenames to group on), with an explicit "combine" affordance to merge several
 * photos into a single multi-image product. Photos upload to Cloudinary as they're
 * added (reusing useMediaUpload's client compression); commit sends the staged
 * rows to POST /api/commerce/products/bulk.
 *
 * Data-layer rule: goes through useProductApi (BaseApiClient), never raw $fetch.
 */

import { useMediaUpload } from '~~/layers/core/app/composables/useMediaUpload'
import { useProductApi } from '~~/layers/commerce/app/services/product.api'
import { useAiApi } from '~~/layers/core/app/services/ai.api'

export interface StagedMedia {
  url: string
  public_id: string
  type: 'IMAGE'
}

export type RowStatus = 'uploading' | 'ready' | 'error'
export type AiStatus = 'idle' | 'generating' | 'done'

export interface StagedRow {
  /** Local-only id for list keys and selection. */
  localId: string
  media: StagedMedia[]
  /** Object URLs for instant preview while the real upload is in flight. */
  previews: string[]
  title: string
  description: string
  price: number | null
  status: RowStatus
  /** Whether AI drafting has run for this row (drives the ✨ state). */
  aiStatus: AiStatus
  /** Upload or commit error for this row. */
  error?: string
}

let _idSeq = 0
const localId = () => `row-${Date.now().toString(36)}-${_idSeq++}`

/**
 * Derive a starting title from a filename — but leave it BLANK for camera-roll
 * junk (`9.jpg`, `IMG_4471.jpg`, `WhatsApp Image ….jpg`), so the seller gets a
 * clean "Name this product" prompt instead of a useless pre-filled name.
 */
export function deriveTitle(filename: string): string {
  const base = filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
  const junk =
    !/[a-z]/i.test(base) || // no letters at all (pure numbers/symbols)
    /^(img|dsc|dcim|pxl|photo|image|screenshot|whatsapp)\b/i.test(base)
  return junk ? '' : base
}

/**
 * Why a row can't be imported yet — or null when it's good to go. Drives the
 * per-row hint so "0 ready" is never a silent dead end. Mirrors the server's
 * createProductSchema (title min 2, price > 0).
 */
export function rowIssue(row: StagedRow): string | null {
  if (row.status === 'uploading') return 'Uploading…'
  if (row.status === 'error') return row.error || 'Upload failed'
  if (row.media.length === 0) return 'No image'
  if (row.title.trim().length < 2) return 'Add a name (min 2 characters)'
  if (typeof row.price !== 'number' || row.price <= 0) return 'Set a price'
  return null
}

export function useBulkImport(storeSlug: string) {
  const rows = ref<StagedRow[]>([])
  const isCommitting = ref(false)
  const { uploadMedia } = useMediaUpload()
  const productApi = useProductApi()
  const aiApi = useAiApi()

  const uploadingCount = computed(
    () => rows.value.filter((r) => r.status === 'uploading').length,
  )
  const readyCount = computed(
    () => rows.value.filter((r) => r.status === 'ready').length,
  )
  /** Can commit once at least one row is ready and nothing is still uploading. */
  const canCommit = computed(
    () => readyCount.value > 0 && uploadingCount.value === 0 && !isCommitting.value,
  )

  /** Add files from the device — one draft row per file, uploaded in parallel. */
  async function addFiles(files: File[] | FileList) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    for (const file of list) {
      const id = localId()
      rows.value.push({
        localId: id,
        media: [],
        previews: [URL.createObjectURL(file)],
        // Blank for junk filenames — see deriveTitle.
        title: deriveTitle(file.name),
        description: '',
        price: null,
        status: 'uploading',
        aiStatus: 'idle',
      })

      // Upload without blocking the loop, so many photos upload concurrently.
      // IMPORTANT: mutate the row THROUGH rows.value (the reactive proxy), not the
      // pushed literal — mutating the raw object never triggers a re-render, so the
      // spinner would hang even though the upload finished.
      uploadMedia(file)
        .then((res) => {
          const r = rows.value.find((x) => x.localId === id)
          if (!r) return
          r.media = [{ url: res.url, public_id: res.public_id, type: 'IMAGE' }]
          r.status = 'ready'
        })
        .catch((e: unknown) => {
          const r = rows.value.find((x) => x.localId === id)
          if (!r) return
          r.status = 'error'
          r.error = e instanceof Error ? e.message : 'Upload failed'
        })
    }
  }

  function removeRow(id: string) {
    const i = rows.value.findIndex((r) => r.localId === id)
    if (i !== -1) {
      rows.value[i]!.previews.forEach((u) => URL.revokeObjectURL(u))
      rows.value.splice(i, 1)
    }
  }

  /**
   * Merge several rows into the first-selected one (multiple angles of a single
   * product). Media and previews concatenate; the merged row keeps the first's
   * title/price. Only fully-uploaded rows can be combined.
   */
  function combineRows(ids: string[]) {
    if (ids.length < 2) return
    const targets = ids
      .map((id) => rows.value.find((r) => r.localId === id))
      .filter((r): r is StagedRow => !!r)
    if (targets.some((r) => r.status !== 'ready')) return

    const [keep, ...merged] = targets
    if (!keep) return
    for (const m of merged) {
      keep.media.push(...m.media)
      keep.previews.push(...m.previews)
    }
    rows.value = rows.value.filter(
      (r) => r.localId === keep.localId || !ids.includes(r.localId),
    )
  }

  function updateRow(
    id: string,
    patch: Partial<Pick<StagedRow, 'title' | 'price' | 'description'>>,
  ) {
    const row = rows.value.find((r) => r.localId === id)
    if (row) Object.assign(row, patch)
  }

  const aiGeneratingCount = computed(
    () => rows.value.filter((r) => r.aiStatus === 'generating').length,
  )

  /**
   * AI-draft one row from its cover image: fills name, description, and price —
   * but only BLANK fields, so it never clobbers what the seller already typed.
   * Each call is one paid vision request (the premium cost centre).
   */
  async function generateForRow(id: string) {
    const r = rows.value.find((x) => x.localId === id)
    if (!r || r.status !== 'ready' || r.media.length === 0) return
    if (r.aiStatus === 'generating') return
    r.aiStatus = 'generating'
    try {
      const { data } = await aiApi.generateListingFromUrl(r.media[0]!.url)
      if (!r.title.trim() && data.title) r.title = data.title
      if (!r.description.trim() && data.description) r.description = data.description
      if (
        (r.price == null || r.price <= 0) &&
        typeof data.suggestedPrice === 'number'
      ) {
        r.price = data.suggestedPrice
      }
      r.aiStatus = 'done'
    } catch {
      r.aiStatus = 'idle' // leave it retryable
    }
  }

  /**
   * Generate for every ready row that still needs a name. Cost-aware: skips rows
   * already named or already AI-drafted (no double-billing) and caps concurrency.
   */
  async function generateAll() {
    const targets = rows.value.filter(
      (r) => r.status === 'ready' && r.aiStatus === 'idle' && !r.title.trim(),
    )
    const CONCURRENCY = 3
    for (let i = 0; i < targets.length; i += CONCURRENCY) {
      await Promise.all(
        targets.slice(i, i + CONCURRENCY).map((r) => generateForRow(r.localId)),
      )
    }
  }

  /** Rows that are structurally valid to send (ready, titled, priced, has media). */
  const validRows = computed(() => rows.value.filter((r) => rowIssue(r) === null))

  /**
   * Commit valid rows. Returns the server summary; on partial failure, marks the
   * offending rows with their error so the seller can fix and retry just those.
   */
  async function commit() {
    if (!canCommit.value) return null
    isCommitting.value = true
    try {
      const sending = validRows.value
      const payload = sending.map((r) => {
        const desc = r.description.trim()
        return {
          title: r.title.trim(),
          price: r.price,
          // Server requires description ≥ 10 chars when present; omit if shorter.
          ...(desc.length >= 10 ? { description: desc } : {}),
          mediaItems: r.media,
        }
      })
      const res = await productApi.bulkImportProducts(payload, storeSlug)

      // Map server per-row errors (indexed against `sending`) back to rows.
      const failedIdx = new Set(res.data.errors.map((e) => e.index))
      const createdLocalIds = new Set<string>()
      sending.forEach((r, i) => {
        if (failedIdx.has(i)) {
          r.status = 'error'
          r.error = res.data.errors.find((e) => e.index === i)?.error
        } else {
          createdLocalIds.add(r.localId)
        }
      })
      // Drop successfully-created rows from the tray.
      rows.value = rows.value.filter((r) => !createdLocalIds.has(r.localId))
      return res.data.summary
    } finally {
      isCommitting.value = false
    }
  }

  return {
    rows,
    isCommitting,
    uploadingCount,
    readyCount,
    validRows,
    canCommit,
    aiGeneratingCount,
    addFiles,
    removeRow,
    combineRows,
    updateRow,
    generateForRow,
    generateAll,
    commit,
  }
}
