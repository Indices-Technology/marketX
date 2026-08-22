<template>
  <HomeLayout :narrow-feed="false">
    <div class="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 sm:py-14 lg:px-8">
      <!-- ─── HEADER ─────────────────────────────────────────────────────── -->
      <header class="mb-12">
        <p class="t-eyebrow mb-2">Partners</p>
        <h1 class="t-display mb-3">Build on the trust rail</h1>
        <p class="t-body ink-soft max-w-2xl">
          {{ siteName }} settles money between strangers — escrow on every
          order, a reputation record behind every seller. If you move goods,
          move money, or represent a group of sellers, that rail is worth
          plugging into.
        </p>
      </header>

      <!-- ─── TRACKS ─────────────────────────────────────────────────────── -->
      <section class="mb-16">
        <h2 class="t-title mb-1">Where partnerships fit</h2>
        <p class="t-body ink-soft mb-6">
          Four routes in. Pick the closest — we will redirect you if it is the
          wrong desk.
        </p>

        <div class="grid gap-4 sm:grid-cols-2">
          <div
            v-for="track in tracks"
            :key="track.title"
            class="rounded-2xl border border-gray-100 p-5 dark:border-neutral-800"
          >
            <Icon
              :name="track.icon"
              size="22"
              class="mb-3 text-gray-400 dark:text-neutral-500"
            />
            <h3 class="t-heading mb-1.5">{{ track.title }}</h3>
            <p class="t-body ink-soft">{{ track.description }}</p>
          </div>
        </div>
      </section>

      <!-- ─── API WAITLIST ───────────────────────────────────────────────── -->
      <section id="api" class="mb-12 scroll-mt-24">
        <div
          class="rounded-2xl border border-gray-100 bg-gray-50/60 p-6 sm:p-8 dark:border-neutral-800 dark:bg-neutral-900/40"
        >
          <div class="mb-2 flex flex-wrap items-center gap-3">
            <h2 class="t-title">The {{ siteName }} API</h2>
            <span
              class="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-gray-600 dark:bg-neutral-800 dark:text-neutral-400"
              >Waitlist</span
            >
          </div>
          <p class="t-body ink-soft mb-6 max-w-2xl">
            The public API is not open yet, and we would rather say so than take
            signups against a date we cannot hold. Join the waitlist and you
            will hear from us before general availability — earlier if your use
            case shapes what we build first.
          </p>

          <div class="grid gap-3 sm:grid-cols-3">
            <div
              v-for="item in apiSurface"
              :key="item.title"
              class="rounded-xl border border-gray-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p class="t-subheading mb-1">{{ item.title }}</p>
              <p class="t-body ink-soft">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── FORM ───────────────────────────────────────────────────────── -->
      <section id="apply" class="scroll-mt-24">
        <!-- Success -->
        <div
          v-if="submitted"
          class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8 dark:border-emerald-500/20 dark:bg-emerald-500/10"
        >
          <div class="mb-3 flex items-center gap-2">
            <Icon
              name="solar:check-circle-bold"
              size="22"
              class="text-emerald-500"
            />
            <h2 class="t-title">You are on the list</h2>
          </div>
          <p class="t-body ink-soft mb-5 max-w-xl">
            We sent a confirmation to
            <strong class="ink-strong">{{ submittedEmail }}</strong
            >. The team reviews requests in the order they arrive and replies to
            that address.
          </p>
          <BaseButton variant="secondary" @click="resetForm">
            Submit another
          </BaseButton>
        </div>

        <!-- Form -->
        <template v-else>
          <h2 class="t-title mb-1">Apply</h2>
          <p class="t-body ink-soft mb-6">
            One form for both. Tell us which you are after.
          </p>

          <form class="max-w-2xl space-y-4" @submit.prevent="submit">
            <BaseTabs
              v-model="form.type"
              variant="segmented"
              aria-label="Request type"
              :tabs="typeTabs"
            />

            <div class="grid gap-4 sm:grid-cols-2">
              <BaseInput
                v-model="form.contactName"
                label="Your name"
                placeholder="Ada Obi"
                required
                :error="errors.contactName"
              />
              <BaseInput
                v-model="form.role"
                label="Your role"
                placeholder="Head of Partnerships"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <BaseInput
                v-model="form.email"
                label="Work email"
                type="email"
                placeholder="you@company.com"
                required
                :error="errors.email"
              />
              <BaseInput
                v-model="form.phone"
                label="Phone"
                type="tel"
                placeholder="+234 800 000 0000"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <BaseInput
                v-model="form.company"
                label="Company or association"
                placeholder="Registered name"
                required
                :error="errors.company"
              />
              <BaseInput
                v-model="form.website"
                label="Website"
                type="url"
                placeholder="https://example.com"
                :error="errors.website"
              />
            </div>

            <BaseSelect
              v-model="form.expectedVolume"
              label="Expected volume"
              placeholder="Pick the closest"
              :options="volumeOptions"
            />

            <BaseTextarea
              v-model="form.useCase"
              :label="
                form.type === 'API'
                  ? 'What do you want to build?'
                  : 'What do you have in mind?'
              "
              :placeholder="
                form.type === 'API'
                  ? 'The integration, the systems it touches, and what a good outcome looks like.'
                  : 'What you do today, who you serve, and where you think we fit.'
              "
              :rows="6"
              required
              :error="errors.useCase"
              hint="Specifics get a faster reply than a pitch."
            />

            <!-- Honeypot: hidden from real users, catches naive bots. -->
            <input
              v-model="form.companyFax"
              type="text"
              tabindex="-1"
              autocomplete="off"
              aria-hidden="true"
              class="hidden"
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
              {{
                form.type === 'API' ? 'Join the API waitlist' : 'Send request'
              }}
            </BaseButton>

            <p class="t-meta">
              We use these details only to assess and answer your request. See
              our
              <NuxtLink
                to="/privacy"
                class="font-semibold text-brand hover:underline"
                >Privacy Policy</NuxtLink
              >. Prefer email?
              <a
                :href="mailto(partnersEmail)"
                class="font-semibold text-brand hover:underline"
                >{{ partnersEmail }}</a
              >
            </p>
          </form>
        </template>
      </section>
    </div>

    <SiteFooter />

    <template #right-sidebar>
      <RightSideNavLinks />
    </template>
  </HomeLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRuntimeConfig } from '#imports'
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import RightSideNavLinks from '~~/layers/core/app/layouts/children/RightSideNavLinks.vue'
import SiteFooter from '~~/layers/core/app/components/SiteFooter.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseSelect from '~~/layers/ui/app/components/BaseSelect.vue'
import BaseTabs from '~~/layers/ui/app/components/BaseTabs.vue'
import BaseTextarea from '~~/layers/ui/app/components/BaseTextarea.vue'
import {
  usePartnerLeads,
  VOLUME_BANDS,
  type PartnerLeadType,
} from '~~/layers/growth/app/composables/usePartnerLeads'
import { useSeo } from '~~/layers/core/app/composables/useSeo'

useSeo().setPartnersPage()

const config = useRuntimeConfig()
const route = useRoute()
const siteName = (config.public.siteName as string) || 'MarketX'
const partnersEmail = config.public.partnersEmail as string

const mailto = (address: string) => 'mailto:' + address

const leads = usePartnerLeads()

const tracks = [
  {
    title: 'Logistics',
    icon: 'solar:box-linear',
    description:
      'Carriers and last-mile operators. Quote, book and track inside the checkout our sellers already use.',
  },
  {
    title: 'Payments & payouts',
    icon: 'solar:card-linear',
    description:
      'Collection, disbursement and settlement rails. Escrow means money sits with us between order and delivery — that flow needs partners.',
  },
  {
    title: 'Associations & markets',
    icon: 'solar:users-group-rounded-linear',
    description:
      'Trade groups and market unions onboard members as a Square, take a cut of member orders, and keep their own wallet.',
  },
  {
    title: 'Agencies & resellers',
    icon: 'solar:presentation-graph-linear',
    description:
      'Bring sellers on, manage their storefronts, and earn on the volume you introduce.',
  },
]

const apiSurface = [
  {
    title: 'Catalog',
    description: 'Read and write products, variants, stock and media.',
  },
  {
    title: 'Orders',
    description: 'Create orders, follow status, and reconcile settlement.',
  },
  {
    title: 'Trust',
    description: 'Look up seller verification and reputation signals.',
  },
]

const typeTabs = [
  { label: 'Partnership', value: 'PARTNERSHIP' },
  { label: 'API access', value: 'API' },
]

const volumeOptions = VOLUME_BANDS.map((b) => ({ label: b, value: b }))

// Deep links from the footer and the API card land on #api, so open the form on
// the API tab rather than making the visitor switch it themselves.
const initialType: PartnerLeadType =
  route.hash === '#api' ? 'API' : 'PARTNERSHIP'

const form = reactive({
  type: initialType as PartnerLeadType,
  contactName: '',
  role: '',
  email: '',
  phone: '',
  company: '',
  website: '',
  expectedVolume: '',
  useCase: '',
  companyFax: '',
})

const errors = reactive<{
  contactName?: string
  email?: string
  company?: string
  website?: string
  useCase?: string
}>({})
const serverError = ref('')
const submitting = ref(false)
const submitted = ref(false)
const submittedEmail = ref('')

function validate(): boolean {
  errors.contactName =
    errors.email =
    errors.company =
    errors.website =
    errors.useCase =
      undefined
  let ok = true
  if (form.contactName.trim().length < 2) {
    errors.contactName = 'Tell us who you are'
    ok = false
  }
  if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'A valid email is required'
    ok = false
  }
  if (form.company.trim().length < 2) {
    errors.company = 'Company or association name is required'
    ok = false
  }
  // The server rejects a malformed URL outright, so catch it here rather than
  // bouncing a filled-in form off a 400.
  if (
    form.website.trim() &&
    !/^https?:\/\/\S+\.\S+/.test(form.website.trim())
  ) {
    errors.website = 'Include the full URL, starting with https://'
    ok = false
  }
  if (form.useCase.trim().length < 20) {
    errors.useCase = 'A sentence or two more, please'
    ok = false
  }
  return ok
}

function resetForm() {
  submitted.value = false
  serverError.value = ''
  form.contactName = ''
  form.role = ''
  form.email = ''
  form.phone = ''
  form.company = ''
  form.website = ''
  form.expectedVolume = ''
  form.useCase = ''
}

async function submit() {
  serverError.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    await leads.submit({
      type: form.type,
      contactName: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      company: form.company.trim(),
      website: form.website.trim() || undefined,
      role: form.role.trim() || undefined,
      useCase: form.useCase.trim(),
      expectedVolume: form.expectedVolume || undefined,
      utmSource: (route.query.utm_source as string) || undefined,
      utmMedium: (route.query.utm_medium as string) || undefined,
      utmCampaign: (route.query.utm_campaign as string) || undefined,
      companyFax: form.companyFax,
    })
    submittedEmail.value = form.email.trim()
    submitted.value = true
  } catch (e: unknown) {
    serverError.value =
      (e as { statusMessage?: string })?.statusMessage ||
      'Could not send your request. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>
