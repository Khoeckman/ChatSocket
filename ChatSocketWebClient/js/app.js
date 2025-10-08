class MinecraftApp {
  inServer = false
  inWorld = false
  connectTimeout = 0

  constructor(ws) {
    if (!(ws instanceof ChatSocketWebClient)) throw new TypeError('ws is not an instance of ChatSocketWebClient')
    this.ws = ws

    this.ws.ondecoded = this.onmessage.bind(this)

    this.ws.addEventListener('open', () => {
      this.ws.sendEncoded('SERVER')
      this.ws.sendEncoded('WORLD')
    })
  }

  /**
   * Handles incoming WebSocket messages from {@link ChatSocketWebClient}.
   *
   * When registered with `ws.ondecoded = onmessage`,
   * this function is invoked with `this` bound to the active WebSocket
   * client instance.
   *
   * @this {ChatSocketWebClient} The WebSocket client that received the message.
   * @param {string} type - The high-level message type (e.g. "AUTH", "CHAT", "EXEC").
   * @param {string} message - The human-readable message string from the server.
   * @param {Object<string, any>} [data] - Structured message data payload.
   *
   * @example
   * ws.addEventListener("message", onmessage)
   *
   * function onmessage(type, message, data) {
   *   this.log(this.url, type, message, data)
   * }
   */
  onmessage(type, message, data) {
    const rawMessage = Utils.removeMcFormatting(message)

    switch (type) {
      case 'DEBUG':
        break
      case 'AUTH':
        break
      case 'CHANNEL':
        if (data.action === 'leave') {
          this.inServer = false
          this.inWorld = false
          break
        }

        if (data.action === 'join') {
          this.ws.sendEncoded('SERVER')
          this.ws.sendEncoded('WORLD')
        }
        break
      case 'CHANNELS':
        break
      case 'CLIENTS':
        break
      case 'SERVER':
        this.inServer = !!data.server?.ip?.length
        break
      case 'CONNECT':
        this.inServer = !!data.server?.ip?.length
        break
      case 'DISCONNECT':
        this.inServer = false

        clearTimeout(this.connectTimeout)
        // Attempt reconnect after 2s
        this.connectTimeout = setTimeout(() => (!inServer ? ws.sendEncoded('CONNECT', 'play.hypixel.net') : null), 2000)
        break
      case 'WORLD':
        this.inWorld = message !== 'null'
      case 'LOAD':
        break
      case 'UNLOAD':
        break
      case 'CLIENT_SAY':
        this.teleporter(rawMessage)
        break
      case 'SERVER_SAY':
        break
      case 'CLIENT_CMD':
        break
      case 'SERVER_CMD':
        break
      case 'EXEC':
        break
      default:
        ws.log(`&cWebSocketError: &fUnsupported message type '${type}'`)
        break
    }
  }

  // -> SERVER_SAY "... [CS] tp {args}"
  // <- SERVER_CMD "tp {args}"
  teleporter(rawMessage) {
    const regex = /\[CS\]\s+\/*tp\s+([\s\S]+)/

    if (regex.test(rawMessage)) {
      const [_, args] = regex.exec(rawMessage)
      this.ws.sendEncoded('SERVER_CMD', `tp ${args.trim()}`)
      return
    }
  }
}
