<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <div class="flex gap-3">
      <!-- Avatar -->
      <div class="shrink-0">
        <div
          class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand/10 to-violet-100 text-sm font-black text-brand dark:from-brand/20 dark:to-violet-900/30"
        >
          <img
            v-if="profileStore.me?.avatar"
            :src="imgAvatar(profileStore.me.avatar)"
            class="h-full w-full rounded-xl object-cover"
          />
          <span v-else>{{ (profileStore.me?.username ?? 'U')[0].toUpperCase() }}</span>
        </div>
      </div>

      <!-- Input area -->
      <div class="flex-1">
        <textarea
          v-model="text"
          :rows="expanded ? 3 : 1"
          :placeholder="placeholder"
          maxlength="1000"
          class="w-full resize-none rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand/20 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
          @focus="expanded = true"
          @input="onInput"
        />

        <Transition name="composer-expand">
          <div v-if="expanded" class="mt-2 flex items-center justify-between">
            <span class="text-xs text-gray-400">{{ text.length }}/1000</span>
            <div class="flex gap-2">
              <button
                class="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 dark:hover:bg-neutral-800"
                @click="cancel"
              >
                Cancel
              </button>
              <button
                :disabled="!text.trim() || submitting"
                class="flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm shadow-brand/20 transition active:scale-95 disabled:opacity-40"
                @click="submit"
              >
                <Icon v-if="submitting" name="eos-icons:loading" size="14" class="animate-spin" />
                <Icon v-else name="mdi:send" size="14" />
                {{ submitting ? 'Posting…' : 'Post' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { notify } from '@kyvg/vue3-notification'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useWallApi, type WallType } from '~~/layers/social/app/services/wall.api'
import { imgAvatar } from '~~/layers/core/app/utils/cloudinary'

const props = defineProps<{
  type: WallType
  slug: string
  placeholder?: string
}>()

const emit = defineEmits<{
  posted: [post: any]
}>()

const profileStore = useProfileStore()
const text = ref('')
const expanded = ref(false)
const submitting = ref(false)

const onInput = () => {
  if (text.value.length > 0 && !expanded.value) expanded.value = true
}

const cancel = () => {
  text.value = ''
  expanded.value = false
}

const submit = async () => {
  if (!text.value.trim() || submitting.value) return
  submitting.value = true
  try {
    const res = await useWallApi().postShoutout(props.type, props.slug, text.value.trim())
    emit('posted', res.data)
    text.value = ''
    expanded.value = false
    notify({ type: 'success', text: 'Shoutout posted!' })
  } catch {
    // BaseApiClient shows toast
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.composer-expand-enter-active,
.composer-expand-leave-active {
  transition: all 0.18s ease;
  overflow: hidden;
}
.composer-expand-enter-from,
.composer-expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.composer-expand-enter-to,
.composer-expand-leave-from {
  opacity: 1;
  max-height: 60px;
}
</style>
