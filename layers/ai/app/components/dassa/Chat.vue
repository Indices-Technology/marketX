<template>
  <div class="flex h-full flex-col overflow-hidden bg-gray-50 dark:bg-neutral-950">

    <!-- Header -->
    <div class="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
      <!-- Mode toggle -->
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500">Mode</span>
        <div class="flex items-center rounded-full bg-gray-100 p-0.5 dark:bg-neutral-800">
          <button
            v-for="mode in ['buyer', 'seller'] as const"
            :key="mode"
            :class="[
              'rounded-full px-3 py-1 text-[11px] font-semibold capitalize transition-all',
              sessionMode === mode
                ? 'bg-white text-gray-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
                : 'text-gray-400 hover:text-gray-600 dark:text-neutral-500',
            ]"
            @click="switchMode(mode)"
          >
            {{ mode }}
          </button>
        </div>
      </div>

      <!-- Connection status -->
      <div class="flex items-center gap-1.5">
        <span :class="['h-2 w-2 rounded-full transition-colors', isConnected ? 'bg-emerald-500' : 'bg-gray-300 animate-pulse']" />
        <span class="text-[10px] text-gray-400 dark:text-neutral-500">
          {{ isConnected ? 'Online' : 'Connecting…' }}
        </span>
      </div>
    </div>

    <!-- Messages -->
    <div ref="scrollEl" class="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">

      <!-- Welcome state -->
      <div v-if="!messages.length" class="flex h-full flex-col items-center justify-center py-8 text-center">
        <div class="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e52033] to-[#c01020] shadow-lg shadow-brand/30">
          <span class="text-[18px] font-black tracking-tight text-white">DA</span>
        </div>
        <p class="text-[15px] font-bold text-gray-900 dark:text-neutral-100">Dasah</p>
        <p class="mt-1 max-w-[210px] text-[12px] leading-relaxed text-gray-400 dark:text-neutral-500">
          Your personal shopping assistant. Ask me anything about products, orders, or your cart.
        </p>

        <div class="mt-5 flex flex-wrap justify-center gap-2">
          <button
            v-for="s in starters"
            :key="s"
            class="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-gray-700 shadow-sm transition-all hover:border-brand/40 hover:text-brand active:scale-95 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            @click="send(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <DassaMessageBubble
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        @add-to-cart="handleAddToCart"
        @quick-reply="send"
      />

      <!-- Typing indicator -->
      <div v-if="isTyping" class="mb-2 ml-10 flex items-center">
        <div class="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-gray-100 bg-white px-3.5 py-2.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style="animation-delay:0s" />
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style="animation-delay:0.15s" />
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style="animation-delay:0.3s" />
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="flex shrink-0 items-center gap-2 border-t border-gray-100 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900">
      <input
        v-model="draft"
        type="text"
        placeholder="Ask Dasah…"
        :disabled="!isConnected"
        class="flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
        @keydown.enter.prevent="submit"
      />
      <button
        :disabled="!draft.trim() || !isConnected"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm shadow-brand/30 transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
        @click="submit"
      >
        <Icon name="mdi:send" size="17" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useDassaChat } from '../../composables/useDassaChat'
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'
import { useDassaSocket } from '../../composables/useDassaSocket'
import type { DassaProductItem } from '../../composables/useDassaChat'
import DassaMessageBubble from './MessageBubble.vue'

const props = defineProps<{ token: string; defaultMode?: 'buyer' | 'seller' }>()

const { messages, isTyping, isConnected, isInitialized, init, send: chatSend } = useDassaChat()

const scrollEl   = ref<HTMLElement | null>(null)
const draft      = ref('')
const sessionMode = ref<'buyer' | 'seller'>(props.defaultMode ?? 'buyer')

const starters = [
  `Shoes under ${useCurrency().currencySymbol.value}5,000`,
  'View my cart',
  "What's trending?",
  'Track my order',
]

function submit() {
  const text = draft.value.trim()
  if (!text) return
  draft.value = ''
  chatSend(text)
}

function send(text: string) {
  chatSend(text)
}

function handleAddToCart(product: DassaProductItem) {
  chatSend(`Add "${product.name}" to my cart. productId: ${product.id}`)
}

function switchMode(mode: 'buyer' | 'seller') {
  sessionMode.value = mode
  const { socket } = useDassaSocket()
  socket.value?.emit('session:type', mode)
}

watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  },
)

onMounted(() => {
  if (!isInitialized.value) {
    init(props.token, sessionMode.value)
  }
})
</script>
