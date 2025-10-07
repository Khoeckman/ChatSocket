let connectTimeout

/**
 * Handles incoming WebSocket messages from {@link ChatSocketWebClient}.
 *
 * When registered with `ws.addEventListener("message", onmessage)`,
 * this function is invoked with `this` bound to the active WebSocket
 * client instance.
 *
 * @this {ChatSocketWebClient} The WebSocket client that received the message.
 * @param {string} type - The high-level message type (e.g. "AUTH", "CHAT", "EXEC").
 * @param {string} message - The human-readable message string from the server.
 * @param {Object<string, any>} [data={}] - Structured message data payload.
 *
 * @example
 * ws.addEventListener("message", onmessage)
 *
 * function onmessage(type, message, data) {
 *   this.log(this.url, type, message, data)
 * }
 */
function onmessage(type, message, data = {}) {
  const rawMessage = Utils.removeMcFormatting(message)

  switch (type) {
    case 'DEBUG':
    case 'AUTH':
    case 'CHANNEL':
    case 'CHANNELS':
    case 'CLIENTS':
    case 'SERVER':
    case 'CONNECT':
      connection = true
      break
    case 'DISCONNECT':
      clearTimeout(connectTimeout)
      // Attempt reconnect after 2s
      connectTimeout = setTimeout(() => ws.sendEncoded('CONNECT', 'play.hypixel.net'), 2000)
      break
    case 'WORLD':
    case 'LOAD':
    case 'UNLOAD':
    case 'CLIENT_SAY':
      onchat(rawMessage)
      break
    case 'SERVER_SAY':
    case 'CLIENT_CMD':
    case 'SERVER_CMD':
    case 'EXEC':
      break
    default:
      ws.log(`&cWebSocketError: &fUnsupported message type '${type}'`)
      break
  }
}

function onchat(rawMessage) {
  let regex = /\[CS\]\s+tp\s+(\s\S)+/

  if (regex.test(rawMessage)) {
    const [_, args] = regex.exec(rawMessage)
    ws.sendEncoded('CMD', `tp ${args}`)
    return
  }
}
