<!--
  Help centre articles. One route for all four, because they differ only in
  copy — four near-identical .vue files would drift apart the first time
  someone edited one of them.

  Unknown slugs 404 rather than rendering an empty shell, so a stale link is
  visible as a broken link instead of an article that says nothing.
-->
<template>
  <HomeLayout :narrow-feed="false">
    <div class="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 sm:py-14 lg:px-8">
      <NuxtLink
        to="/help"
        class="t-meta mb-6 inline-flex items-center gap-1.5 transition-colors hover:text-brand"
      >
        <Icon name="solar:arrow-left-linear" size="16" />
        Help centre
      </NuxtLink>

      <header class="mb-10">
        <p class="t-eyebrow mb-2">{{ article.eyebrow }}</p>
        <h1 class="t-display mb-3">{{ article.title }}</h1>
        <p class="t-body ink-soft">{{ article.intro }}</p>
      </header>

      <div class="space-y-8">
        <section v-for="section in article.sections" :key="section.heading">
          <h2 class="t-title mb-3">{{ section.heading }}</h2>
          <p v-for="(p, i) in section.body" :key="i" class="t-body mb-3">
            {{ p }}
          </p>
          <ul v-if="section.steps" class="mt-2 space-y-3">
            <li
              v-for="(step, i) in section.steps"
              :key="step"
              class="flex gap-3"
            >
              <span
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-neutral-800 dark:text-neutral-400"
                >{{ i + 1 }}</span
              >
              <p class="t-body">{{ step }}</p>
            </li>
          </ul>
        </section>
      </div>

      <!-- Still stuck -->
      <div
        class="mt-12 rounded-2xl border border-gray-100 bg-gray-50/60 p-6 dark:border-neutral-800 dark:bg-neutral-900/40"
      >
        <h2 class="t-heading mb-1.5">Still stuck?</h2>
        <p class="t-body ink-soft mb-4">
          Open a ticket and a person will pick it up — usually within 24 hours.
        </p>
        <div class="flex flex-wrap gap-3">
          <BaseButton variant="primary" @click="goContact">
            Contact support
          </BaseButton>
          <BaseButton variant="secondary" @click="goHelp">
            Browse all topics
          </BaseButton>
        </div>
      </div>

      <!-- Related -->
      <nav class="mt-10">
        <p class="t-label mb-3 uppercase tracking-wider">Related</p>
        <ul class="space-y-2">
          <li v-for="other in related" :key="other.slug">
            <NuxtLink
              :to="`/help/${other.slug}`"
              class="t-body group flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3 transition-colors hover:border-gray-300 dark:border-neutral-800 dark:hover:border-neutral-600"
            >
              <span class="ink-strong font-semibold">{{ other.title }}</span>
              <Icon
                name="solar:arrow-right-linear"
                size="16"
                class="shrink-0 text-gray-400 transition-colors group-hover:text-brand"
              />
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>

    <SiteFooter />

    <template #right-sidebar>
      <RightSideNavLinks />
    </template>
  </HomeLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { createError, navigateTo, useRoute } from '#imports'
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import RightSideNavLinks from '~~/layers/core/app/layouts/children/RightSideNavLinks.vue'
import SiteFooter from '~~/layers/core/app/components/SiteFooter.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import { useSeo } from '~~/layers/core/app/composables/useSeo'
import { HELP_ARTICLES } from '~~/layers/core/app/utils/helpArticles'

const route = useRoute()
const slug = route.params.slug as string

const article = HELP_ARTICLES[slug]
if (!article) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Help article not found',
    fatal: true,
  })
}

useSeo().setHelpArticlePage(article.title, article.intro, slug)

const related = computed(() =>
  Object.entries(HELP_ARTICLES)
    .filter(([s]) => s !== slug)
    .map(([s, a]) => ({ slug: s, title: a.title })),
)

const goContact = () => navigateTo('/contact')
const goHelp = () => navigateTo('/help')
</script>
