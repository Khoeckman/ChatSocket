let minecraftConnectLoop

class MinecraftApp {
  inServer = false
  inWorld = false
  inHouse = false

  constructor(ws) {
    if (!(ws instanceof ChatSocketWebClient)) throw new TypeError('ws is not an instance of ChatSocketWebClient')
    this.ws = ws

    this.ws.ondecoded = this.onmessage.bind(this)

    this.ws.addEventListener('open', () => {
      this.ws.sendEncoded('SERVER')
      this.ws.sendEncoded('WORLD')

      this.ws.sendEncoded('CLIENT_SAY', '&7[&6&lCS&7]&a Message from &fWebClient&a!')

      // Refill mine every 30 mins
      /* setInterval(() => {
        if (!this.inServer || !this.inWorld) return
        this.ws.sendEncoded(
          'SERVER_CMD',
          'set 14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,1,42,41,133,57,1,42,41,133,57,1,49,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1'
        )
        this.ws.sendEncoded('SERVER_CMD', 'variable global set mine1mined 0', { cooldown: 10 })
        this.ws.sendEncoded('SERVER_CMD', 'variable global inc totalMined 1', { cooldown: 10 })
      }, 30 * 60 * 1000) */
    })

    clearInterval(minecraftConnectLoop)

    minecraftConnectLoop = setInterval(() => {
      if (this.ws.readyState !== this.ws.OPEN || this.inHouse) return

      if (!this.inServer) {
        this.ws.sendEncoded('CONNECT', 'play.hypixel.net')
        return
      }

      if (!this.inWorld) return

      this.ws.sendEncoded('SERVER_CMD', 'lobby housing')
      setTimeout(() => (!this.inHouse ? this.ws.sendEncoded('SERVER_CMD', 'visit Khoeckman') : null), 1500)
      setTimeout(() => (!this.inHouse ? this.ws.sendEncoded('CONTAINER', '', { click: 'LEFT', slot: 12 }) : null), 3000)
    }, 3000)
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
   * this.ws.addEventListener("message", onmessage)
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
        this.inHouse = false
        break
      case 'DISCONNECT':
        this.inServer = false
        this.inHouse = false
        break
      case 'WORLD':
        this.inWorld = message !== 'null'
        this.ws.sendEncoded('SERVER_CMD', 'testplaceholder %house.name%')
        break
      case 'LOAD':
        this.inWorld = true
        this.inHouse = false
        this.ws.sendEncoded('SERVER_CMD', 'testplaceholder %house.name%')
        break
      case 'UNLOAD':
        this.inWorld = false
        this.inHouse = false
        break
      case 'CLIENT_SAY':
        if (this.inServer && this.inWorld) {
          if (!this.inhouse && message === '&r&e&r&b&oDopamine &r&3&oStimulator&r') this.inHouse = true

          // this.welcome(message)
          // this.welcomeBack(message)

          this.refillMine(message)
          break

          if (/^&r&7\*\s&r&f\[CS\]\s/.test(message)) {
            this.teleport(rawMessage)
            this.selectRegion(rawMessage)
            this.proTool(rawMessage)
          }
        }
        break
      case 'SERVER_SAY':
        break
      case 'CLIENT_CMD':
        break
      case 'SERVER_CMD':
        break
      case 'CONTAINER':
        break
      case 'EXEC':
        break
      default:
        this.ws.log(`&cWebSocketError: &fUnsupported message type '${type}'`)
        break
    }
  }

  welcome(message) {
    const regex = /&r&6&l&oWELCOME &r&8\[PRISON\] &r&7\[&r&21&r&7\] &r&2\[[A-Z]\] ([0-9a-zA-Z_]+) &r&7\(&r&b#/
    if (!regex.test(message)) return

    const [_, name] = regex.exec(message)
    this.ws.sendEncoded('SERVER_SAY', `welcome ${name}!`)
  }

  welcomeBack(message) {
    const regex = /&r&a&l&oJOIN &r&8\[PRISON\] &r&7\[&r&21&r&7\] &r&2\[[A-Z]\] ([0-9a-zA-Z_]+) &r&7\(&r&b#/
    if (!regex.test(message)) return

    const [_, name] = regex.exec(message)
    this.ws.sendEncoded('SERVER_SAY', `wb ${name}!`)
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
    const queue = HypixelUtils.selectRegion([x1, y1, z1], [x2, y2, z2])
    this.ws.sendEncoded('SERVER_CMD', '', { queue })
  }

  // -> SERVER_SAY "… [CS] proTool <tool> <args>"
  // <- SERVER_CMD HypixelUtils.proTool
  proTool(rawMessage) {
    const regex = /\[CS\]\s+\/?proTool\s+(\w+)\s+\[([^\]]+)\]/
    if (!regex.test(rawMessage)) return

    const [_, tool, args] = regex.exec(rawMessage)
    const cmd = HypixelUtils.proTool(tool, args.trim().replace(/\s+/g, ' '))
    this.ws.sendEncoded('SERVER_CMD', cmd)
  }

  async refillMine(message) {
    const regex = /^&r&7\*\s&r&f\[CS\]\srefillMine/
    if (!regex.test(message)) return

    const mineBlocks =
      '14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,1,42,41,133,57,1,42,41,133,57,1,49,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1'

    // Cooldown: 30s
    const now = Date.now()
    if (now - this.lastRefillMineUnix < 30000) return
    this.lastRefillMineUnix = now

    let queue = ['variable global set mineLocked 1']
    queue.push(...HypixelUtils.selectRegion([112, 27, -102], [88, 1, -78]))
    queue.push(HypixelUtils.proTool('set', '0'))
    this.ws.sendEncoded('SERVER_CMD', '', { queue })

    await this.ws.awaitMessage((type, message, data) => {
      const rawMessage = Utils.removeMcFormatting(message)
      return rawMessage === 'Teleported to 1, 2, 3'
    })

    setTimeout(() => {
      queue = HypixelUtils.selectPos1([112, 2, -102])
      queue.push(HypixelUtils.proTool('set', '7'))
      queue.push(...HypixelUtils.selectRegion([112, 27, -102], [88, 3, -78]))
      queue.push(HypixelUtils.proTool('set', mineBlocks))
      queue.push('variable global set mine1mined 0')
      queue.push('spawn')
      this.ws.sendEncoded('SERVER_CMD', '', { queue })
      this.lastRefillMineUnix = now
    }, 4000)

    setTimeout(() => {
      this.ws.sendEncoded('SERVER_CMD', 'variable global set mineLocked 0')
    }, 6000)
  }
  // [CS] selectRegion [112 27 -102] [88 3 -78] | proTool set [14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,1,42,41,133,57,1,42,41,133,57,1,49,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  // Only blocks: /set 14,15,16,56,129,41,133,57,41,133,57,49,1
  // Less blocks: /set 14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,15,16,56,129,14,1,42,41,133,57,49,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
}
