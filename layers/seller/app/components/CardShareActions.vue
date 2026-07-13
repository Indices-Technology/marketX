<template>
  <div class="space-y-3">
    <div class="grid grid-cols-2 gap-2.5">
      <BaseButton variant="primary" class="w-full" @click="share">
        <Icon name="solar:share-bold" size="16" />
        Share
      </BaseButton>
      <BaseButton
        variant="secondary"
        class="w-full"
        :loading="downloading"
        @click="downloadCard"
      >
        <Icon name="solar:download-minimalistic-linear" size="16" />
        Download card
      </BaseButton>
    </div>

    <!-- One row: each button shares the card image + link for that platform. -->
    <div class="flex items-center justify-center gap-3 pt-1">
      <button
        v-for="t in shareTargets"
        :key="t.id"
        :title="`Share to ${t.label}`"
        :disabled="downloading"
        class="flex h-11 w-11 items-center justify-center rounded-full text-white transition-transform hover:scale-105 disabled:opacity-50"
        :style="{ background: t.bg }"
        @click="onShareTarget?.(t)"
      >
        <Icon :name="t.icon" size="19" />
      </button>
    </div>

    <div
      class="flex items-center justify-center gap-4 pt-0.5 text-[12px] font-semibold text-gray-500 dark:text-neutral-400"
    >
      <button
        v-if="downloadTemplate && printTemplate"
        class="flex items-center gap-1.5 hover:text-brand"
        :disabled="downloading"
        @click="downloadTemplate(printTemplate)"
      >
        <Icon name="solar:printer-linear" size="14" />
        Printable A5
      </button>
      <button class="flex items-center gap-1.5 hover:text-brand" @click="downloadQr">
        <Icon name="solar:qr-code-linear" size="14" />
        Save QR only
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import {
  SHARE_TEMPLATES,
  type ShareTemplate,
} from '~~/layers/core/app/utils/cardTemplate'

interface ShareTarget {
  id: string
  label: string
  icon: string
  bg: string
  tpl?: ShareTemplate
  href?: string
}

defineProps<{
  share: () => void
  downloadQr: () => void
  downloadCard: () => void
  onShareTarget?: (t: ShareTarget) => void
  downloadTemplate?: (tpl: ShareTemplate) => void
  downloading?: boolean
  shareTargets: ShareTarget[]
}>()

const printTemplate = SHARE_TEMPLATES.find((t) => t.id === 'print')
</script>
