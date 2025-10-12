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

    setInterval(() => {
      if (!this.inServer || !this.inWorld) return
      this.ws.sendEncoded(
        'SERVER_CMD',
        'set 14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,1,42,41,133,57,1,42,41,133,57,1,49,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1'
      )
      this.ws.sendEncoded('SERVER_CMD', 'variable global set mine1mined 0')
    }, 10 * 60 * 1000)
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
        break // @todo put back

        clearTimeout(this.connectTimeout)
        // Attempt reconnect after 2s
        this.connectTimeout = setTimeout(
          () => (!this.inServer ? ws.sendEncoded('CONNECT', 'play.hypixel.net') : null),
          2000
        )
        break
      case 'WORLD':
        this.inWorld = message !== 'null'
      case 'LOAD':
        break
      case 'UNLOAD':
        break
      case 'CLIENT_SAY':
        if (this.inServer && this.inWorld) {
          // Message must contain " [CS] "
          if (!/\s+\[CS\]\s+/.test(rawMessage)) return

          break

          this.teleport(rawMessage)
          this.selectRegion(rawMessage)
          this.proTool(rawMessage)
        }
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

  // -> SERVER_SAY "… [CS] tp {args}"
  // <- SERVER_CMD "tp {args}"
  teleport(rawMessage) {
    const regex = /\[CS\]\s+\/?tp\s+([\s\S]+)/
    if (!regex.test(rawMessage)) return

    const [_, args] = regex.exec(rawMessage)
    this.ws.sendEncoded('SERVER_CMD', `tp ${args.trim()}`)
  }

  // -> SERVER_SAY "… [CS] selectRegion [<x1> <y1> <z1>] [<x2> <y2> <z2>]"
  // <- SERVER_CMD HypixelUtils.selectRegion(ws, [<x1>, <y1>, <z1>], [<x2>, <y2>, <z2>])
  selectRegion(rawMessage) {
    const regex =
      /\[CS\]\s+\/?selectRegion\s+\[\s*(-?\d+)\s+(-?\d+)\s+(-?\d+)\s*\]\s+\[\s*(-?\d+)\s+(-?\d+)\s+(-?\d+)\s*\[/
    if (!regex.test(rawMessage)) return

    const [_, x1, y1, z1, x2, y2, z2] = regex.exec(rawMessage).map(Number)
    const queue = HypixelUtils.selectRegion(this.ws, [x1, y1, z1], [x2, y2, z2])
    ws.sendEncoded('SERVER_CMD', '', { queue })
  }

  // -> SERVER_SAY "… [CS] proTool <tool> <args>"
  // <- SERVER_CMD HypixelUtils.proTool
  proTool(rawMessage) {
    const regex = /\[CS\]\s+\/?(\w+)\s+(\s\S+)/
    if (!regex.test(rawMessage)) return

    const [_, tool, args] = regex.exec(rawMessage).map(Number)
    const cmd = HypixelUtils.proTool(this.ws, tool, args.trim().replace(/\s+/g, ' '))
    ws.sendEncoded('SERVER_CMD', cmd)
  }
  // [CS] selectRegion [112 27 -102] [88 3 -78] | proTool set [14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,1,42,41,133,57,1,42,41,133,57,1,49,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  // Only blocks: /set 14,15,16,56,129,41,133,57,41,133,57,49,1
  // Less blocks: /set 14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,1,42,41,133,57,49,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
}
