import { describe, it, expect, vi, beforeEach } from 'vitest'

let pixelId = ''
vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({ public: { metaPixelId: pixelId } }),
}))

// Fresh module per test — the composable holds the choice at module level so one
// answer is shared by the banner, the pixel and the privacy page.
const load = async () => {
  vi.resetModules()
  return (await import('../useCookieConsent')).useCookieConsent
}

describe('useCookieConsent', () => {
  beforeEach(() => {
    localStorage.clear()
    pixelId = '123456'
  })

  it('permits nothing until an answer is given — silence is not consent', async () => {
    const useCookieConsent = await load()
    const { status, trackingAllowed, needsChoice } = useCookieConsent()
    expect(status.value).toBe('unset')
    expect(trackingAllowed.value).toBe(false)
    expect(needsChoice.value).toBe(true)
  })

  it('permits tracking only after accepting', async () => {
    const useCookieConsent = await load()
    const { accept, trackingAllowed, needsChoice } = useCookieConsent()
    accept()
    expect(trackingAllowed.value).toBe(true)
    expect(needsChoice.value).toBe(false)
  })

  it('keeps declining as a durable no', async () => {
    const useCookieConsent = await load()
    useCookieConsent().reject()

    const again = await load()
    const { status, trackingAllowed, needsChoice } = again()
    expect(status.value).toBe('rejected')
    expect(trackingAllowed.value).toBe(false)
    // Answered already — don't ask again on every visit.
    expect(needsChoice.value).toBe(false)
  })

  it('remembers an acceptance across visits', async () => {
    const useCookieConsent = await load()
    useCookieConsent().accept()

    const again = await load()
    expect(again().trackingAllowed.value).toBe(true)
  })

  // Removing the tracker must revoke permission on its own — a stored "yes"
  // from a previous campaign should not authorise a future one.
  it('permits nothing when no tracker is configured, even if accepted before', async () => {
    let useCookieConsent = await load()
    useCookieConsent().accept()

    pixelId = ''
    useCookieConsent = await load()
    const { trackingAllowed, needsChoice } = useCookieConsent()
    expect(trackingAllowed.value).toBe(false)
    expect(needsChoice.value).toBe(false)
  })

  it('lets someone change their mind', async () => {
    const useCookieConsent = await load()
    const c = useCookieConsent()
    c.accept()
    c.reset()
    expect(c.status.value).toBe('unset')
    expect(c.needsChoice.value).toBe(true)
  })

  it('survives storage being unavailable by permitting nothing', async () => {
    const spy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('denied')
      })
    const useCookieConsent = await load()
    expect(useCookieConsent().trackingAllowed.value).toBe(false)
    spy.mockRestore()
  })
})
