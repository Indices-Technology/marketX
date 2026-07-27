<!--
  /trust-home — SPIKE page for the trust-first homepage direction.

  A throwaway preview so we can look at the trust-led structure live, side by
  side with the current MarketHome, without touching the real index.vue.
  Delete (this file + TrustMarketHome.vue) once we've decided.
-->
<template>
  <HomeLayout mode="market">
    <ClientOnly>
      <TrustMarketHome @sign-in="router.push('/user-login')" />
      <template #fallback>
        <TrustMarketHome @sign-in="router.push('/user-login')" />
      </template>
    </ClientOnly>
  </HomeLayout>
</template>

<script setup lang="ts">
import { useRouter } from '#imports'
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import TrustMarketHome from '~~/layers/feed/app/components/TrustMarketHome.vue'

defineOptions({ name: 'TrustHomeSpikePage' })

const router = useRouter()
</script>
