// Waits for this request's queue writes before the response is sent.
//
// See server/utils/queueFlush.ts for why this exists. Short version: on a
// function host the instance freezes the moment the response goes out, so an
// un-awaited queue.add() is a coin flip. This turns it into a guarantee without
// changing a single call site.
//
// `beforeResponse`, NOT `afterResponse` — afterResponse runs once the response
// has been sent, which is exactly when the instance is frozen, so waiting there
// would be waiting in the window we are trying to escape.

import { flushQueueWrites } from '../utils/queueFlush'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', async (event) => {
    await flushQueueWrites(event as { context?: Record<string, unknown> })
  })
})
