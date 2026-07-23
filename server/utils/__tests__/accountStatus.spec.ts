import { describe, it, expect } from 'vitest'
import { getAccountRestriction } from '../auth/accountStatus'

describe('getAccountRestriction', () => {
  it('allows an account in good standing', () => {
    expect(getAccountRestriction({})).toBeNull()
    expect(
      getAccountRestriction({ bannedAt: null, suspendedUntil: null }),
    ).toBeNull()
  })

  it('blocks a permanently banned account', () => {
    const reason = getAccountRestriction({ bannedAt: new Date() })
    expect(reason).toContain('banned')
  })

  it('blocks a disabled account', () => {
    const reason = getAccountRestriction({ isActive: false })
    expect(reason).toContain('disabled')
  })

  it('does not lock out a record that omits isActive', () => {
    // Partial records reach this gate; a missing flag must read as "fine",
    // never as "disabled", or every such caller 403s.
    expect(getAccountRestriction({ isActive: undefined })).toBeNull()
    expect(getAccountRestriction({ isActive: true })).toBeNull()
  })

  it('blocks an account whose suspension is still running', () => {
    const reason = getAccountRestriction({
      suspendedUntil: new Date(Date.now() + 86_400_000),
    })
    expect(reason).toContain('suspended')
  })

  it('releases a suspension once its end date has passed', () => {
    // Nothing sweeps expired suspensions, so lapsing has to be a read-time
    // decision — otherwise a time-boxed suspension silently becomes permanent.
    expect(
      getAccountRestriction({ suspendedUntil: new Date(Date.now() - 1000) }),
    ).toBeNull()
  })

  it('keeps a ban in force even after an old suspension has lapsed', () => {
    const reason = getAccountRestriction({
      bannedAt: new Date(),
      suspendedUntil: new Date(Date.now() - 86_400_000),
    })
    expect(reason).toContain('banned')
  })
})
