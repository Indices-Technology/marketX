/**
 * "Take me home" signal.
 *
 * Tapping Home (or the logo) while already on `/` is a route no-op, so Vue
 * Router does nothing and the user stays wherever they had scrolled to — three
 * screens deep in the feed, with the button that promised to bring them home
 * apparently broken. Every app with a feed solves this the same way: the home
 * tab, pressed from home, returns you to the top.
 *
 * A counter rather than a boolean so repeated presses each fire; the home feed
 * watches it and scrolls itself back to the first slide.
 */
import { useState } from '#imports'

export const useHomeReset = () => {
  const resetSignal = useState('home-reset-signal', () => 0)
  const requestHomeReset = () => {
    resetSignal.value++
  }
  return { resetSignal, requestHomeReset }
}
