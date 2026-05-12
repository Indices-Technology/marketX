// Stamps every API request with a unique ID.
// - Sets event.context.requestId for use in handlers and the error plugin
// - Echoes it back as X-Request-Id so clients can report it when filing bugs

export default defineEventHandler((event) => {
  if (!event.node.req.url?.startsWith('/api')) return

  const requestId = crypto.randomUUID()
  event.context.requestId = requestId
  setResponseHeader(event, 'X-Request-Id', requestId)
})
