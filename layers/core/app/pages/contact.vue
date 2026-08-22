<template>
  <HomeLayout :narrow-feed="false">
    <div class="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 sm:py-14 lg:px-8">
      <!-- ─── HEADER ─────────────────────────────────────────────────────── -->
      <header class="mb-10">
        <p class="t-eyebrow mb-2">Contact</p>
        <h1 class="t-display mb-3">Talk to a human</h1>
        <p class="t-body ink-soft max-w-2xl">
          Every message below reaches the same team that handles orders, refunds
          and disputes. We reply in under 24 hours on working days.
        </p>
      </header>

      <div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <!-- ─── FORM ─────────────────────────────────────────────────────── -->
        <section>
          <h2 class="t-title mb-1">Send us a message</h2>
          <p class="t-body ink-soft mb-6">
            This opens a real support ticket you can track — not an email into
            the void.
          </p>

          <!-- Success -->
          <div
            v-if="createdTicketId"
            class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 dark:border-emerald-500/20 dark:bg-emerald-500/10"
          >
            <div class="mb-3 flex items-center gap-2">
              <Icon
                name="solar:check-circle-bold"
                size="22"
                class="text-emerald-500"
              />
              <h3 class="t-heading">Message received</h3>
            </div>
            <p class="t-body ink-soft mb-5">
              We have opened a ticket and sent a copy to
              <strong class="ink-strong">{{ submittedEmail }}</strong
              >. You will get a reply there.
            </p>
            <div class="flex flex-wrap gap-3">
              <BaseButton
                v-if="isLoggedIn && createdTicketId !== 'sent'"
                variant="primary"
                @click="goToTicket"
              >
                Track this ticket
              </BaseButton>
              <BaseButton variant="secondary" @click="resetForm">
                Send another
              </BaseButton>
            </div>
          </div>

          <!-- Form -->
          <form v-else class="space-y-4" @submit.prevent="submit">
            <BaseInput
              v-if="!isLoggedIn"
              v-model="form.email"
              label="Your email"
              type="email"
              placeholder="you@example.com"
              required
              :error="errors.email"
              hint="We reply here — double-check it."
            />

            <BaseSelect
              v-model="form.category"
              label="What is this about?"
              :options="categoryOptions"
              required
            />

            <BaseInput
              v-model="form.subject"
              label="Subject"
              placeholder="Short summary"
              required
              :error="errors.subject"
            />

            <BaseTextarea
              v-model="form.message"
              label="Message"
              placeholder="Order number, what happened, and what you would like us to do."
              :rows="6"
              required
              :error="errors.message"
            />

            <p
              v-if="serverError"
              class="t-body rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
            >
              {{ serverError }}
            </p>

            <BaseButton
              type="submit"
              variant="primary"
              size="lg"
              :loading="submitting"
            >
              Send message
            </BaseButton>

            <p class="t-meta">
              Prefer email? Write to
              <a
                :href="mailto(supportEmail)"
                class="font-semibold text-brand hover:underline"
                >{{ supportEmail }}</a
              >.
            </p>
          </form>
        </section>

        <!-- ─── DIRECTORY ────────────────────────────────────────────────── -->
        <aside class="space-y-6">
          <div>
            <h2 class="t-title mb-1">Other desks</h2>
            <p class="t-body ink-soft mb-4">
              Reaching the right one first saves a round trip.
            </p>
            <ul class="space-y-2">
              <li v-for="desk in desks" :key="desk.title">
                <!-- Partnerships routes to a page; the rest are mailboxes. -->
                <NuxtLink
                  v-if="desk.to"
                  :to="desk.to"
                  class="group flex gap-3 rounded-xl border border-gray-100 p-3 transition-colors hover:border-gray-300 dark:border-neutral-800 dark:hover:border-neutral-600"
                >
                  <Icon
                    :name="desk.icon"
                    size="20"
                    class="mt-0.5 shrink-0 text-gray-400 transition-colors group-hover:text-brand dark:text-neutral-500"
                  />
                  <div class="min-w-0">
                    <p class="t-subheading">{{ desk.title }}</p>
                    <p class="t-body ink-soft">{{ desk.description }}</p>
                    <p class="t-meta mt-0.5 truncate">{{ desk.linkLabel }}</p>
                  </div>
                </NuxtLink>
                <a
                  v-else
                  :href="mailto(desk.email)"
                  class="group flex gap-3 rounded-xl border border-gray-100 p-3 transition-colors hover:border-gray-300 dark:border-neutral-800 dark:hover:border-neutral-600"
                >
                  <Icon
                    :name="desk.icon"
                    size="20"
                    class="mt-0.5 shrink-0 text-gray-400 transition-colors group-hover:text-brand dark:text-neutral-500"
                  />
                  <div class="min-w-0">
                    <p class="t-subheading">{{ desk.title }}</p>
                    <p class="t-body ink-soft">{{ desk.description }}</p>
                    <p class="t-meta mt-0.5 truncate">{{ desk.email }}</p>
                  </div>
                </a>
              </li>
            </ul>
          </div>

          <!-- Registered entity -->
          <div
            class="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 dark:border-neutral-800 dark:bg-neutral-900/40"
          >
            <p class="t-label mb-3 uppercase tracking-wider">
              Registered entity
            </p>
            <p class="t-subheading mb-2">{{ companyName }}</p>
            <dl class="space-y-1.5">
              <div v-if="companyRc" class="flex gap-2">
                <dt class="t-meta w-28 shrink-0">RC number</dt>
                <dd class="t-body ink-soft">{{ companyRc }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="t-meta w-28 shrink-0">Type</dt>
                <dd class="t-body ink-soft">
                  Private company limited by shares
                </dd>
              </div>
              <div v-if="companyAddress" class="flex gap-2">
                <dt class="t-meta w-28 shrink-0">Registered office</dt>
                <dd class="t-body ink-soft">{{ companyAddress }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="t-meta w-28 shrink-0">Web</dt>
                <dd class="t-body">
                  <a
                    :href="companyUrl"
                    target="_blank"
                    rel="noopener"
                    class="font-semibold text-brand hover:underline"
                    >{{ companyUrlLabel }}</a
                  >
                </dd>
              </div>
            </dl>
            <p class="t-meta mt-4">
              {{ siteName }} is a product of {{ companyName }}.
            </p>
          </div>
        </aside>
      </div>
    </div>

    <SiteFooter />

    <template #right-sidebar>
      <RightSideNavLinks />
    </template>
  </HomeLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { navigateTo, useRuntimeConfig } from '#imports'
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import RightSideNavLinks from '~~/layers/core/app/layouts/children/RightSideNavLinks.vue'
import SiteFooter from '~~/layers/core/app/components/SiteFooter.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseSelect from '~~/layers/ui/app/components/BaseSelect.vue'
import BaseTextarea from '~~/layers/ui/app/components/BaseTextarea.vue'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import {
  useSupport,
  type SupportCategory,
} from '~~/layers/support/app/composables/useSupport'
import { useSeo } from '~~/layers/core/app/composables/useSeo'

useSeo().setContactPage()

const config = useRuntimeConfig()
const siteName = (config.public.siteName as string) || 'MarketX'
const supportEmail = config.public.supportEmail as string
const partnersEmail = config.public.partnersEmail as string
const pressEmail = config.public.pressEmail as string
const securityEmail = config.public.securityEmail as string
const privacyEmail = config.public.privacyEmail as string
const companyName = config.public.companyName as string
const companyUrl = config.public.companyUrl as string
const companyRc = config.public.companyRc as string
const companyAddress = config.public.companyAddress as string
const companyUrlLabel = companyUrl.replace(/^https?:\/\//, '')

const mailto = (address: string) => 'mailto:' + address

const support = useSupport()
const profileStore = useProfileStore()
const isLoggedIn = computed(() => profileStore.isLoggedIn)

// Partnerships points at the page, not the mailbox — the form there captures
// the company and use-case detail an unstructured email never does.
const desks = [
  {
    title: 'Partnerships & API',
    description: 'Integrations, logistics, and platform partnerships.',
    icon: 'solar:link-circle-linear',
    to: '/partners',
    linkLabel: 'Apply on the partners page',
    email: partnersEmail,
  },
  {
    title: 'Press & media',
    description: 'Interviews, brand assets, company statements.',
    icon: 'solar:microphone-2-linear',
    to: '',
    linkLabel: '',
    email: pressEmail,
  },
  {
    title: 'Security',
    description: 'Report a vulnerability. We read these first.',
    icon: 'solar:shield-keyhole-linear',
    to: '',
    linkLabel: '',
    email: securityEmail,
  },
  {
    title: 'Privacy & data',
    description: 'Access, correction, or deletion of your data.',
    icon: 'solar:document-text-linear',
    to: '',
    linkLabel: '',
    email: privacyEmail,
  },
]

const categoryOptions = [
  { label: 'My order', value: 'ORDER' },
  { label: 'Payment', value: 'PAYMENT' },
  { label: 'Delivery', value: 'DELIVERY' },
  { label: 'Account & security', value: 'ACCOUNT' },
  { label: 'A seller', value: 'SELLER' },
  { label: 'A product', value: 'PRODUCT' },
  { label: 'Refund', value: 'REFUND' },
  { label: 'Something else', value: 'OTHER' },
]

const form = reactive({
  email: (profileStore.me?.email as string) || '',
  category: 'OTHER' as SupportCategory,
  subject: '',
  message: '',
})

const errors = reactive<{
  email?: string
  subject?: string
  message?: string
}>({})
const serverError = ref('')
const submitting = ref(false)
const createdTicketId = ref('')
const submittedEmail = ref('')

function validate(): boolean {
  errors.email = errors.subject = errors.message = undefined
  let ok = true
  if (!isLoggedIn.value && !/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'A valid email is required'
    ok = false
  }
  if (form.subject.trim().length < 3) {
    errors.subject = 'Add a short subject'
    ok = false
  }
  if (form.message.trim().length < 5) {
    errors.message = 'Please add more detail'
    ok = false
  }
  return ok
}

function goToTicket() {
  navigateTo('/support/' + createdTicketId.value)
}

function resetForm() {
  createdTicketId.value = ''
  serverError.value = ''
  form.subject = ''
  form.message = ''
  form.category = 'OTHER'
}

async function submit() {
  serverError.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    const res = (await support.createTicket({
      subject: form.subject.trim(),
      message: form.message.trim(),
      category: form.category,
      ...(isLoggedIn.value ? {} : { email: form.email.trim() }),
      source: 'WEB',
    })) as { data?: { id: string } }

    submittedEmail.value = isLoggedIn.value
      ? (profileStore.me?.email as string)
      : form.email.trim()
    createdTicketId.value = res?.data?.id || 'sent'
  } catch (e: unknown) {
    serverError.value =
      (e as { statusMessage?: string })?.statusMessage ||
      'Could not send your message. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>
