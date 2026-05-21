<template>
  <div
    class="flex h-full flex-col overflow-hidden bg-gray-50 dark:bg-neutral-950"
  >
    <!-- Mode toggle strip -->
    <div
      class="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div class="flex items-center gap-2">
        <span
          class="text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-neutral-400"
          >Mode</span
        >
        <div
          class="flex items-center rounded-full bg-gray-100 p-0.5 dark:bg-neutral-800"
        >
          <button
            v-for="mode in ['buyer', 'seller'] as const"
            :key="mode"
            :class="[
              'rounded-full px-3 py-1 text-[11px] font-semibold capitalize transition-all',
              sessionMode === mode
                ? 'bg-white text-gray-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
                : 'text-gray-500 hover:text-gray-700 dark:text-neutral-400',
            ]"
            @click="switchMode(mode)"
          >
            {{ mode }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-1.5">
        <span
          :class="[
            'h-2 w-2 rounded-full',
            isConnected ? 'bg-emerald-500' : 'bg-gray-300',
          ]"
        />
        <span class="text-[10px] text-gray-400 dark:text-neutral-500">{{
          isConnected ? 'Online' : 'Connecting…'
        }}</span>
      </div>
    </div>

    <!-- Messages -->
    <div ref="scrollEl" class="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
      <!-- Welcome state -->
      <div
        v-if="!messages.length"
        class="flex h-full flex-col items-center justify-center py-8 text-center"
      >
        <div
          class="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e52033] shadow-md"
        >
          <span class="text-xl font-black tracking-tight text-white">DA</span>
        </div>
        <p class="text-[15px] font-bold text-gray-900 dark:text-neutral-100">
          DassaAI
        </p>
        <p
          class="mt-1 max-w-[200px] text-[12px] text-gray-400 dark:text-neutral-500"
        >
          Ask me to find products, check your cart, or track an order.
        </p>
        <!-- Starter chips -->
        <div class="mt-4 flex flex-wrap justify-center gap-2">
          <button
            v-for="s in starters"
            :key="s"
            class="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 transition-colors hover:border-brand/40 hover:text-brand dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
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
      <div v-if="isTyping" class="mb-2 ml-9 flex items-center gap-1.5">
        <div
          class="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-gray-100 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
          <span
            class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
            style="animation-delay: 0.1s"
          />
          <span
            class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
            style="animation-delay: 0.2s"
          />
        </div>
      </div>
    </div>

    <!-- Input -->
    <div
      class="flex shrink-0 items-center gap-2 border-t border-gray-100 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <input
        v-model="draft"
        type="text"
        placeholder="Ask DassaAI…"
        :disabled="!isConnected"
        class="flex-1 rounded-full bg-gray-100 px-4 py-2 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
        @keydown.enter.prevent="submit"
      />
      <button
        :disabled="!draft.trim() || !isConnected"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        @click="submit"
      >
        <Icon name="mdi:send" size="18" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useDassaChat } from '../../composables/useDassaChat'
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'
import { useDassaSocket } from '../../composables/useDassaSocket'
import type { DassaProductItem } from '../../composables/useDassaChat'
import DassaMessageBubble from './MessageBubble.vue'

const props = defineProps<{ token: string; defaultMode?: 'buyer' | 'seller' }>()

const {
  messages,
  isTyping,
  isConnected,
  isInitialized,
  init,
  send: chatSend,
  reset,
} = useDassaChat()

const scrollEl = ref<HTMLElement | null>(null)
const draft = ref('')
const sessionMode = ref<'buyer' | 'seller'>(props.defaultMode ?? 'buyer')

const starters = [
  `Find me shoes under ${useCurrency().currencySymbol.value} 5000`,
  'View my cart',
  'Track my order',
  "What's trending?",
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
  // Re-emit session type to socket
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

onUnmounted(() => {
  // Don't reset — keep history alive while bottom sheet is toggled
})
</script>
