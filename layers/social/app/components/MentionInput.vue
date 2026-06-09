<!--
  MentionInput — textarea with @mention autocomplete.
  Emits:
    update:modelValue  (text string)
    update:mentions    (array of MentionData)
-->
<template>
  <div class="mention-wrap">
    <textarea
      ref="textareaRef"
      :value="modelValue"
      v-bind="$attrs"
      @input="onInput"
      @keydown="onKeydown"
      @blur="closeSoon"
    />

    <!-- Autocomplete dropdown -->
    <Transition name="mention-fade">
      <div
        v-if="showDropdown"
        class="mention-dropdown"
      >
        <div v-if="searching" class="mention-searching">
          <Icon name="mdi:loading" size="14" class="animate-spin text-gray-400" />
          <span>Searching…</span>
        </div>
        <template v-else-if="suggestions.length">
          <button
            v-for="(item, i) in suggestions"
            :key="item.id + item.type"
            class="mention-item"
            :class="{ 'mention-item--active': i === activeIdx }"
            @mousedown.prevent="pick(item)"
          >
            <div class="mention-avatar">
              <img v-if="item.avatar" :src="imgAvatar(item.avatar)" :alt="item.username || 'User'" class="mention-img" />
              <span v-else class="mention-initials">{{ item.displayName.slice(0, 2).toUpperCase() }}</span>
            </div>
            <div class="mention-meta">
              <span class="mention-name">{{ item.displayName }}</span>
              <span class="mention-handle">@{{ item.handle }}</span>
            </div>
            <span
              class="mention-type-badge"
              :class="item.type === 'seller' ? 'mention-type-badge--store' : 'mention-type-badge--user'"
            >{{ item.type === 'seller' ? 'Store' : 'User' }}</span>
          </button>
        </template>
        <div v-else class="mention-empty">No results</div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSearchApi } from '~~/layers/core/app/services/search.api'
import { imgAvatar } from '~~/layers/core/app/utils/cloudinary'

export interface MentionData {
  type: 'user' | 'seller'
  id: string
  handle: string
  displayName: string
  avatar: string | null
}

const props = defineProps<{
  modelValue: string
  mentions: MentionData[]
}>()

const emit = defineEmits<{
  'update:modelValue': [v: string]
  'update:mentions': [v: MentionData[]]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const suggestions = ref<MentionData[]>([])
const showDropdown = ref(false)
const searching = ref(false)
const activeIdx = ref(0)

// The @partial the user is currently typing (e.g. "ada" when they typed "@ada")
let currentQuery = ''
// Start index of the @partial in the full text (index of the '@')
let triggerStart = -1

let searchTimer: ReturnType<typeof setTimeout> | null = null

// ── Input handler ─────────────────────────────────────────────────────────────
function onInput(e: Event) {
  const ta = e.target as HTMLTextAreaElement
  emit('update:modelValue', ta.value)
  checkForMention(ta)
}

function checkForMention(ta: HTMLTextAreaElement) {
  const text = ta.value
  const cursor = ta.selectionStart ?? text.length

  // Walk backwards from cursor to find an @ not preceded by word char
  let i = cursor - 1
  let partial = ''
  while (i >= 0 && text[i] !== '@') {
    if (/\s/.test(text[i]!)) { i = -1; break }
    partial = text[i] + partial
    i--
  }

  if (i >= 0 && text[i] === '@') {
    triggerStart = i
    currentQuery = partial
    if (partial.length >= 1) {
      debouncedSearch(partial)
    } else {
      closeDrop()
    }
  } else {
    closeDrop()
  }
}

function debouncedSearch(q: string) {
  if (searchTimer) clearTimeout(searchTimer)
  showDropdown.value = true
  searching.value = true
  searchTimer = setTimeout(async () => {
    try {
      const res: any = await useSearchApi().searchMentions(q)
      suggestions.value = res.data ?? []
      activeIdx.value = 0
    } catch {
      suggestions.value = []
    } finally {
      searching.value = false
    }
  }, 250)
}

// ── Keyboard navigation ───────────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  if (!showDropdown.value) return
  if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx.value = Math.min(activeIdx.value + 1, suggestions.value.length - 1) }
  if (e.key === 'ArrowUp')   { e.preventDefault(); activeIdx.value = Math.max(activeIdx.value - 1, 0) }
  if (e.key === 'Enter' && suggestions.value.length) { e.preventDefault(); pick(suggestions.value[activeIdx.value]!) }
  if (e.key === 'Escape') closeDrop()
}

// ── Pick a mention ────────────────────────────────────────────────────────────
function pick(item: MentionData) {
  const ta = textareaRef.value!
  const text = ta.value
  const cursor = ta.selectionStart ?? text.length

  // Replace @partial with @handle + trailing space
  const before = text.slice(0, triggerStart)
  const after = text.slice(cursor)
  const insertion = `@${item.handle} `
  const newText = before + insertion + after

  emit('update:modelValue', newText)

  // Add to mentions if not already there
  const existing = props.mentions.find(m => m.handle === item.handle && m.type === item.type)
  if (!existing) {
    emit('update:mentions', [...props.mentions, item])
  }

  // Move cursor to end of inserted mention
  nextTick(() => {
    const pos = before.length + insertion.length
    ta.setSelectionRange(pos, pos)
    ta.focus()
  })

  closeDrop()
}

// ── Close dropdown ────────────────────────────────────────────────────────────
function closeDrop() {
  showDropdown.value = false
  suggestions.value = []
  searching.value = false
  currentQuery = ''
  triggerStart = -1
}

let blurTimer: ReturnType<typeof setTimeout> | null = null
function closeSoon() {
  blurTimer = setTimeout(closeDrop, 150)
}

// Clean up stale mentions when the text changes (user deleted a mention)
watch(() => props.modelValue, (text) => {
  if (!text) {
    emit('update:mentions', [])
    return
  }
  const active = props.mentions.filter(m => text.includes(`@${m.handle}`))
  if (active.length !== props.mentions.length) {
    emit('update:mentions', active)
  }
})
</script>

<style scoped>
.mention-wrap {
  position: relative;
  width: 100%;
}

.mention-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
  overflow: hidden;
  max-height: 220px;
  overflow-y: auto;
}
:global(.dark) .mention-dropdown {
  background: #1c1c1e;
  border-color: rgba(255,255,255,0.1);
}

.mention-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  text-align: left;
  transition: background 0.1s;
  cursor: pointer;
}
.mention-item:hover,
.mention-item--active {
  background: #f3f4f6;
}
:global(.dark) .mention-item:hover,
:global(.dark) .mention-item--active {
  background: rgba(255,255,255,0.07);
}

.mention-avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}
:global(.dark) .mention-avatar { background: rgba(255,255,255,0.1); }
.mention-img { width: 100%; height: 100%; object-fit: cover; }
.mention-initials { font-size: 11px; font-weight: 800; color: #6b7280; }

.mention-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.mention-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:global(.dark) .mention-name { color: #f3f4f6; }
.mention-handle {
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mention-type-badge {
  flex-shrink: 0;
  font-size: 9px;
  font-weight: 700;
  border-radius: 9999px;
  padding: 2px 6px;
}
.mention-type-badge--user  { background: #dbeafe; color: #1d4ed8; }
.mention-type-badge--store { background: #fef3c7; color: #b45309; }
:global(.dark) .mention-type-badge--user  { background: rgba(29,78,216,0.2); color: #93c5fd; }
:global(.dark) .mention-type-badge--store { background: rgba(180,83,9,0.2); color: #fcd34d; }

.mention-searching,
.mention-empty {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.mention-fade-enter-active,
.mention-fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.mention-fade-enter-from,
.mention-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
