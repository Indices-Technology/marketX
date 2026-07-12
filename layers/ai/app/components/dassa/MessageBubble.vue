<template>
  <div :class="['mb-2.5 flex w-full', message.role === 'user' ? 'justify-end' : 'justify-start']">

    <!-- Bot avatar -->
    <div
      v-if="message.role === 'bot'"
      class="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e52033] to-[#c01020] shadow-sm"
    >
      <span class="text-[9px] font-black text-white">DA</span>
    </div>

    <div
      :class="[
        'rounded-2xl px-3 py-2.5 shadow-sm',
        message.role === 'user'
          ? 'max-w-[78%] rounded-br-sm bg-brand text-white'
          : message.role === 'system'
            ? 'mx-auto max-w-full rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
            : message.metadata?.products?.length
              ? 'w-full max-w-[97%] rounded-bl-sm border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
              : 'max-w-[82%] rounded-bl-sm border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900',
      ]"
    >
      <!-- Text -->
      <DassaMarkdown
        v-if="message.role !== 'system'"
        :content="message.content"
        :class="message.role === 'user' ? 'text-white [&_strong]:text-white' : 'text-gray-800 dark:text-neutral-100'"
      />
      <span v-else class="text-xs">{{ message.content }}</span>

      <!-- Product cards -->
      <div v-if="message.metadata?.products?.length" class="mt-2.5">
        <p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-neutral-500">
          {{ message.metadata.products.length }} result{{ message.metadata.products.length === 1 ? '' : 's' }}
        </p>
        <div class="flex snap-x gap-2.5 overflow-x-auto pb-1" style="scrollbar-width:none">
          <DassaProductCard
            v-for="p in message.metadata.products"
            :key="p.id"
            :product="p"
            class="snap-start"
            @add-to-cart="$emit('addToCart', $event)"
          />
        </div>
      </div>

      <!-- Cart feedback -->
      <div
        v-if="message.metadata?.cartUpdate"
        :class="[
          'mt-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium',
          message.metadata.cartUpdate.success
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
            : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400',
        ]"
      >
        <Icon
          :name="message.metadata.cartUpdate.success ? 'solar:check-circle-bold' : 'solar:danger-circle-bold'"
          size="14"
        />
        {{ message.metadata.cartUpdate.message }}
      </div>

      <!-- Quick replies -->
      <DassaQuickReplies
        v-if="message.metadata?.quickReplies?.length && message.role === 'bot'"
        :replies="message.metadata.quickReplies"
        @select="$emit('quickReply', $event)"
      />

      <!-- Timestamp -->
      <p
        :class="[
          'mt-1.5 text-right text-[9px] opacity-50',
          message.role === 'user' ? 'text-blue-100' : 'text-gray-400 dark:text-neutral-500',
        ]"
      >
        {{ time }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DassaMessage, DassaProductItem } from '../../composables/useDassaChat'
import DassaMarkdown from './Markdown.vue'
import DassaProductCard from './ProductCard.vue'
import DassaQuickReplies from './QuickReplies.vue'

const props = defineProps<{ message: DassaMessage }>()
defineEmits<{ addToCart: [product: DassaProductItem]; quickReply: [text: string] }>()

const time = computed(() =>
  new Date(props.message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
)
</script>
