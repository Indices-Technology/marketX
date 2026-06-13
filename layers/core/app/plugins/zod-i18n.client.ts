// layers/core/app/plugins/zod-i18n.client.ts
//
// CLIENT-ONLY. Must not run during SSR: this plugin calls z.setErrorMap(), which
// mutates the process-global zod singleton. As a universal plugin it also poisoned
// the Nitro API routes — every server-side validation error surfaced as a raw
// i18n key (e.g. "errors.too_big.string.inclusive") because no zod translation
// namespace is loaded server-side. Keeping it .client ensures API responses use
// zod's readable default messages.
import { z } from 'zod'
import { makeZodI18nMap } from 'zod-i18n-map'

export default defineNuxtPlugin((nuxtApp) => {
  const { $i18n } = nuxtApp

  const errorMap = makeZodI18nMap({
    t: (key, options) => $i18n.t(key, options),
    handlePath: {
      context: 'context',
      ns: ['zod', 'custom'],
    },
  })

  z.setErrorMap(errorMap)
})
