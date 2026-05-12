import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import DealCountdown from '../DealCountdown.vue'

const stubs = { Icon: { template: '<span />' } }

describe('DealCountdown', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('shows countdown text when deal has not expired', () => {
    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    const wrapper = mount(DealCountdown, { props: { endsAt: future }, global: { stubs } })
    expect(wrapper.text()).toContain('left')
  })

  it('shows "Deal ended" when endsAt is in the past', () => {
    const past = new Date(Date.now() - 1000).toISOString()
    const wrapper = mount(DealCountdown, { props: { endsAt: past }, global: { stubs } })
    expect(wrapper.text()).toBe('Deal ended')
  })

  it('formats as "Xd Xh left" for deals more than 24 h away', () => {
    const future = new Date(Date.now() + (2 * 86400 + 3 * 3600) * 1000).toISOString()
    const wrapper = mount(DealCountdown, { props: { endsAt: future }, global: { stubs } })
    expect(wrapper.text()).toMatch(/\dd \dh left/)
  })

  it('formats as "Xh Xm left" for deals between 1 h and 24 h away', () => {
    const future = new Date(Date.now() + (3 * 3600 + 15 * 60) * 1000).toISOString()
    const wrapper = mount(DealCountdown, { props: { endsAt: future }, global: { stubs } })
    expect(wrapper.text()).toMatch(/\dh \d+m left/)
  })

  it('formats as "Xm Xs left" for deals between 1 min and 1 h away', () => {
    const future = new Date(Date.now() + (2 * 60 + 45) * 1000).toISOString()
    const wrapper = mount(DealCountdown, { props: { endsAt: future }, global: { stubs } })
    expect(wrapper.text()).toMatch(/\dm \d+s left/)
  })

  it('formats as "Xs left" for deals under 60 s away', () => {
    const future = new Date(Date.now() + 45 * 1000).toISOString()
    const wrapper = mount(DealCountdown, { props: { endsAt: future }, global: { stubs } })
    expect(wrapper.text()).toMatch(/\d+s left/)
  })

  it('updates the display after each timer tick', async () => {
    const future = new Date(Date.now() + 90 * 1000).toISOString()
    const wrapper = mount(DealCountdown, { props: { endsAt: future }, global: { stubs } })
    const before = wrapper.text()

    vi.advanceTimersByTime(5000)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('left')
    expect(wrapper.text()).not.toBe(before)
  })

  it('clears the interval when unmounted', () => {
    const spy = vi.spyOn(global, 'clearInterval')
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const wrapper = mount(DealCountdown, { props: { endsAt: future }, global: { stubs } })
    wrapper.unmount()
    expect(spy).toHaveBeenCalled()
  })
})
