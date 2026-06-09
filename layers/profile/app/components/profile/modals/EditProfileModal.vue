<template>
  <BaseModal
    :model-value="true"
    title="Edit Profile"
    max-width="md"
    @update:model-value="(v) => !v && handleClose()"
  >
    <div class="space-y-6">
      <!-- Avatar -->
      <div class="flex items-center gap-6">
        <img
          :src="
            formData.avatar ||
            `https://avatar.iran.liara.run/public/boy?username=${profile.username}`
          "
          class="h-24 w-24 rounded-full object-cover"
          alt="Profile avatar"
        />
        <div>
          <BaseButton variant="secondary" size="sm" @click="triggerAvatarUpload">
            Change Photo
          </BaseButton>
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleAvatarChange"
          />
        </div>
      </div>

      <!-- Username (Read-only) -->
      <BaseInput :model-value="profile.username ?? ''" label="Username" :disabled="true" />

      <!-- Bio -->
      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-neutral-300">
          Bio
        </label>
        <textarea
          v-model="formData.bio"
          placeholder="Tell us about yourself..."
          rows="4"
          maxlength="150"
          class="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
        ></textarea>
        <p class="mt-1 text-xs text-gray-500 dark:text-neutral-400">
          {{ formData.bio?.length || 0 }}/150
        </p>
      </div>

      <!-- Website -->
      <BaseInput
        v-model="formData.websiteUrl"
        type="url"
        label="Website"
        placeholder="https://example.com"
      />

      <!-- Location -->
      <BaseInput
        v-model="formData.location"
        label="Location"
        placeholder="New York, USA"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton variant="secondary" size="sm" :disabled="isSaving" @click="handleClose">
          Cancel
        </BaseButton>
        <BaseButton
          variant="primary"
          size="sm"
          :loading="isSaving"
          :disabled="isSaving"
          @click="saveChanges"
        >
          Save
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { IProfile } from '~~/layers/profile/app/types/profile.types'
import { useProfile } from '~~/layers/profile/app/composables/useProfile'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'

const props = defineProps<{
  profile: IProfile
}>()

const emit = defineEmits(['close', 'updated'])

const { updateMyProfile } = useProfile()
const { uploadMedia } = useMediaUpload()

const isSaving = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)
const pendingAvatarFile = ref<File | null>(null)

const extractWebsite = (links: any) => {
  if (!links || !Array.isArray(links)) return ''
  return links.find((l: any) => l.type === 'website')?.url ?? ''
}

const formData = reactive({
  avatar: props.profile.avatar,
  bio: props.profile.bio || '',
  websiteUrl:
    extractWebsite(props.profile.links) ||
    (props.profile.profileUrl as string) ||
    '',
  location: props.profile.location || props.profile.stateOfResidence || '',
})

const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const handleAvatarChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    pendingAvatarFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.avatar = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const saveChanges = async () => {
  isSaving.value = true
  try {
    let avatarUrl = formData.avatar
    if (pendingAvatarFile.value) {
      const uploaded = await uploadMedia(pendingAvatarFile.value)
      avatarUrl = uploaded.url
    }
    const links = formData.websiteUrl
      ? [{ type: 'website', url: formData.websiteUrl }]
      : []
    await updateMyProfile({
      bio: formData.bio,
      links,
      location: formData.location,
      avatar: avatarUrl,
    })
    emit('updated')
  } catch (error) {
    console.error('Failed to update profile:', error)
    alert('Failed to update profile. Please try again.')
  } finally {
    isSaving.value = false
  }
}

const handleClose = () => {
  if (isSaving.value) return
  const hasChanges =
    formData.bio !== (props.profile.bio || '') ||
    formData.websiteUrl !== extractWebsite(props.profile.links) ||
    formData.location !==
      (props.profile.location || props.profile.stateOfResidence || '') ||
    formData.avatar !== props.profile.avatar
  if (hasChanges) {
    if (confirm('Discard changes?')) {
      emit('close')
    }
  } else {
    emit('close')
  }
}
</script>
