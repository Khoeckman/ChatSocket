function awaitChatSocket(ws, { type, message, data = {} }) {
  awaitMessage(ws, ChatSocketProtocol.encodeMessage(type, message, data))
}
// Problem, data is not gonna be the same or predictable coming from MC client
// Allow some callback function to check data keys custom

function awaitMessage(ws, { messageToMatch, timeoutMs = 30_000, decryptFn = (str) => str } = {}) {
  if (!(ws instanceof WebSocket)) throw new TypeError('ws is not an instance of WebSocket')
  if (typeof messageToMatch !== 'string') throw new TypeError('messageToMatch is not a string')
  if (!Number.isFinite(timeoutMs)) throw new TypeError('timeoutMs is not a finite number')
  if (!typeof decryptFn !== 'function') throw new TypeError('decryptFn is not a function')
  decryptFn = decryptFn || ((str) => str)

  return new Promise((res, rej) => {
    ws.addEventListener('message', (event) => {
      const rawData = decryptFn(event.data)
      if (rawData === messageToMatch) {
        clearTimeout(responseTimeoutId)
        res(rawData)
      }
    })

    const responseTimeoutId = setTimeout(() => rej('response timed out'), timeoutMs)
  })
}
