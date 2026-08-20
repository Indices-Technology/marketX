import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CookieConsent from '../CookieConsent.vue'

// Runtime config is the switch for whether there is anything to consent TO.
let pixelId = ''
vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({ public: { metaPixelId: pixelId } }),
}))

vi.mock('~~/layers/ui/app/utils/zIndex', () => ({ Z: { toast: 60 } }))

const stubs = {
  BaseButton: {
    props: ['variant'],
    template:
      '<button :data-variant="variant" @click="$emit(\'click\')"><slot /></button>',
  },
  NuxtLink: { template: '<a><slot /></a>' },
  Transition: false,
}

const mountBanner = () => mount(CookieConsent, { global: { stubs } })

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  // A banner asking permission for tracking that isn't configured is theatre,
  // and it teaches people to dismiss the real one without reading.
  it('stays out of the way when nothing optional is configured', async () => {
    pixelId = ''
    const wrapper = mountBanner()
    expect(wrapper.text()).toBe('')
  })

  it('asks once a tracker is configured', async () => {
    pixelId = '123456'
    const wrapper = mountBanner()
    expect(wrapper.text()).toContain('Can we measure our ads')
  })

  // Declining must be exactly as easy as accepting — same element, same weight.
  it('gives declining equal prominence', async () => {
    pixelId = '123456'
    const wrapper = mountBanner()
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].text()).toMatch(/no thanks/i)
    expect(buttons[1].text()).toMatch(/allow/i)
  })

  it('does not describe sign-in cookies as optional', async () => {
    pixelId = '123456'
    const wrapper = mountBanner()
    expect(wrapper.text()).toMatch(/aren't optional/i)
  })
})
