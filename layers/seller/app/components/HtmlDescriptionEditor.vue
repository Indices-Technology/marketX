<template>
  <div
    class="html-editor overflow-hidden rounded-lg border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-brand dark:border-neutral-700 dark:bg-neutral-900"
  >
    <!-- Toolbar -->
    <div
      class="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <button
        v-for="btn in toolbarButtons"
        :key="btn.cmd"
        type="button"
        :title="btn.title"
        @mousedown.prevent="exec(btn.cmd)"
        class="flex h-7 w-7 items-center justify-center rounded text-gray-600 transition-colors hover:bg-gray-200 dark:text-neutral-400 dark:hover:bg-neutral-700"
      >
        <Icon :name="btn.icon" size="15" />
      </button>

      <div class="mx-1 h-5 w-px bg-gray-200 dark:bg-neutral-700" />

      <button
        type="button"
        title="Bullet list"
        @mousedown.prevent="exec('insertUnorderedList')"
        class="flex h-7 w-7 items-center justify-center rounded text-gray-600 transition-colors hover:bg-gray-200 dark:text-neutral-400 dark:hover:bg-neutral-700"
      >
        <Icon name="mdi:format-list-bulleted" size="15" />
      </button>
      <button
        type="button"
        title="Numbered list"
        @mousedown.prevent="exec('insertOrderedList')"
        class="flex h-7 w-7 items-center justify-center rounded text-gray-600 transition-colors hover:bg-gray-200 dark:text-neutral-400 dark:hover:bg-neutral-700"
      >
        <Icon name="mdi:format-list-numbered" size="15" />
      </button>

      <div class="mx-1 h-5 w-px bg-gray-200 dark:bg-neutral-700" />

      <button
        type="button"
        title="Insert link"
        @mousedown.prevent="insertLink"
        class="flex h-7 w-7 items-center justify-center rounded text-gray-600 transition-colors hover:bg-gray-200 dark:text-neutral-400 dark:hover:bg-neutral-700"
      >
        <Icon name="mdi:link-variant" size="15" />
      </button>
      <button
        type="button"
        title="Clear formatting"
        @mousedown.prevent="exec('removeFormat')"
        class="flex h-7 w-7 items-center justify-center rounded text-gray-600 transition-colors hover:bg-gray-200 dark:text-neutral-400 dark:hover:bg-neutral-700"
      >
        <Icon name="mdi:format-clear" size="15" />
      </button>
    </div>

    <!-- Editable area -->
    <div
      ref="editorEl"
      contenteditable="true"
      :data-placeholder="placeholder"
      class="editor-content min-h-[120px] px-4 py-3 text-sm text-gray-900 focus:outline-none dark:text-neutral-100"
      style="min-height: 120px"
      @input="onInput"
      @paste.prevent="onPaste"
      @keydown="onKeydown"
    />

    <!-- Bottom bar: AI Enhance button -->
    <div
      class="flex items-center justify-between border-t border-gray-100 px-3 py-2 dark:border-neutral-700/60"
    >
      <p class="text-[11px] text-gray-400 dark:text-neutral-600">
        Paste text from any website — formatting is preserved
      </p>
      <button
        type="button"
        :disabled="enhancing || !hasContent"
        @click="enhanceWithAi"
        class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
        :class="
          enhancing || !hasContent
            ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-neutral-800 dark:text-neutral-600'
            : 'bg-gradient-to-r from-brand to-purple-600 text-white shadow-sm hover:opacity-90 active:scale-95'
        "
      >
        <Icon
          :name="enhancing ? 'mdi:loading' : 'mdi:magic-staff'"
          size="13"
          :class="enhancing ? 'animate-spin' : ''"
        />
        {{ enhancing ? 'Enhancing…' : '✨ Enhance with AI' }}
      </button>
    </div>

    <!-- Error message -->
    <p
      v-if="enhanceError"
      class="border-t border-red-100 bg-red-50 px-3 py-2 text-[11px] text-red-500 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400"
    >
      {{ enhanceError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useAiApi } from '~~/layers/core/app/services/ai.api'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorEl = ref<HTMLDivElement>()
const enhancing = ref(false)
const enhanceError = ref<string | null>(null)
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
  if (editorEl.value) {
    editorEl.value.innerHTML = props.modelValue || ''
  }
})
onUnmounted(() => { isMounted.value = false })

const aiApi = useAiApi()

const toolbarButtons = [
  { cmd: 'bold', icon: 'mdi:format-bold', title: 'Bold' },
  { cmd: 'italic', icon: 'mdi:format-italic', title: 'Italic' },
  { cmd: 'underline', icon: 'mdi:format-underline', title: 'Underline' },
  { cmd: 'strikeThrough', icon: 'mdi:format-strikethrough', title: 'Strikethrough' },
]

const hasContent = computed(() => {
  const text = (props.modelValue || '').replace(/<[^>]*>/g, '').trim()
  return text.length >= 5
})

// Sync external value changes (e.g. from AI magic lister) into the editor
watch(
  () => props.modelValue,
  (val) => {
    if (editorEl.value && editorEl.value.innerHTML !== val) {
      editorEl.value.innerHTML = val || ''
    }
  },
)

const onInput = () => {
  emit('update:modelValue', editorEl.value?.innerHTML || '')
}

const exec = (command: string, value?: string) => {
  document.execCommand(command, false, value)
  nextTick(() => {
    if (!isMounted.value) return
    editorEl.value?.focus()
    onInput()
  })
}

const insertLink = () => {
  const url = prompt('Enter URL (e.g. https://example.com):')
  if (url && url.trim()) {
    exec('createLink', url.trim())
  }
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    e.preventDefault()
    exec('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;')
  }
}

// ── AI Enhance ────────────────────────────────────────────────────────────────
const enhanceWithAi = async () => {
  if (enhancing.value || !hasContent.value) return
  enhanceError.value = null
  enhancing.value = true

  try {
    const result = await aiApi.enhanceDescription(props.modelValue)
    if (!isMounted.value) return
    if (result.success && result.html) {
      emit('update:modelValue', result.html)
      await nextTick()
      if (isMounted.value && editorEl.value) {
        editorEl.value.innerHTML = result.html
      }
    }
  } catch (err: any) {
    if (!isMounted.value) return
    enhanceError.value =
      err?.data?.statusMessage || err?.message || 'Enhancement failed. Try again.'
  } finally {
    if (isMounted.value) enhancing.value = false
  }
}

// ── HTML sanitizer ─────────────────────────────────────────────────────────────
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'strike',
  'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'code', 'span',
])

function cleanNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) return node.cloneNode()
  if (node.nodeType !== Node.ELEMENT_NODE) return null

  const el = node as Element
  const tag = el.tagName.toLowerCase()

  if (!ALLOWED_TAGS.has(tag)) {
    const frag = document.createDocumentFragment()
    for (const child of Array.from(el.childNodes)) {
      const cleaned = cleanNode(child)
      if (cleaned) frag.appendChild(cleaned)
    }
    const blockTags = new Set([
      'div', 'section', 'article', 'header', 'footer',
      'main', 'nav', 'aside', 'figure', 'figcaption',
      'table', 'tbody', 'tr', 'td', 'th',
    ])
    if (blockTags.has(tag)) {
      const wrapper = document.createElement('p')
      wrapper.appendChild(frag)
      return wrapper
    }
    return frag
  }

  const newEl = document.createElement(tag)

  if (tag === 'a') {
    const href = el.getAttribute('href')
    if (href && !href.trim().toLowerCase().startsWith('javascript:')) {
      newEl.setAttribute('href', href)
      newEl.setAttribute('target', '_blank')
      newEl.setAttribute('rel', 'noopener noreferrer')
    }
  }

  for (const child of Array.from(el.childNodes)) {
    const cleaned = cleanNode(child)
    if (cleaned) newEl.appendChild(cleaned)
  }

  return newEl
}

function sanitizeHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  const out = document.createElement('div')
  for (const child of Array.from(tmp.childNodes)) {
    const cleaned = cleanNode(child)
    if (cleaned) out.appendChild(cleaned)
  }
  return out.innerHTML
}

const onPaste = (e: ClipboardEvent) => {
  const html = e.clipboardData?.getData('text/html')
  const text = e.clipboardData?.getData('text/plain')

  let insert = ''
  if (html && html.trim()) {
    insert = sanitizeHtml(html)
  } else if (text) {
    insert = text
      .split(/\n{2,}/)
      .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
      .join('')
  }

  if (insert) {
    document.execCommand('insertHTML', false, insert)
    onInput()
  }
}
</script>

<style scoped>
/* Placeholder */
.editor-content:empty::before {
  content: attr(data-placeholder);
  color: #9ca3af;
  pointer-events: none;
}

.editor-content :deep(p) { margin-bottom: 0.5em; }
.editor-content :deep(ul) {
  list-style: disc;
  padding-left: 1.25em;
  margin-bottom: 0.5em;
}
.editor-content :deep(ol) {
  list-style: decimal;
  padding-left: 1.25em;
  margin-bottom: 0.5em;
}
.editor-content :deep(li) { margin-bottom: 0.15em; }
.editor-content :deep(a) { color: #f43f5e; text-decoration: underline; }
.editor-content :deep(h1),
.editor-content :deep(h2),
.editor-content :deep(h3),
.editor-content :deep(h4) { font-weight: 600; margin-bottom: 0.25em; }
.editor-content :deep(h1) { font-size: 1.2em; }
.editor-content :deep(h2) { font-size: 1.1em; }
.editor-content :deep(h3) { font-size: 1.05em; }
.editor-content :deep(blockquote) {
  border-left: 3px solid #e5e7eb;
  padding-left: 0.75em;
  color: #6b7280;
  margin: 0.5em 0;
}
.editor-content :deep(pre),
.editor-content :deep(code) {
  font-family: monospace;
  background: #f3f4f6;
  border-radius: 4px;
  padding: 0.15em 0.3em;
  font-size: 0.9em;
}
</style>
