import { WebSocketServer } from 'ws'

export default class ChatSocketServer extends WebSocketServer {
  constructor(port, secretKey) {
    super({ port })

    this.port = port
    this.secretKey = secretKey
  }

  static removeMcFormatting(str) {
    return String(str).replace(/[&§][0-9a-fklmnor]/g, '')
  }

  static mcToAnsi(str) {
    const codes = {
      0: '\x1b[30m', // black
      1: '\x1b[34m', // dark blue
      2: '\x1b[32m', // dark green
      3: '\x1b[36m', // dark aqua (cyan)
      4: '\x1b[31m', // dark red
      5: '\x1b[35m', // dark purple (magenta)
      6: '\x1b[33m', // gold (yellow-ish)
      7: '\x1b[37m', // gray
      8: '\x1b[90m', // dark gray
      9: '\x1b[94m', // blue
      a: '\x1b[92m', // green
      b: '\x1b[96m', // aqua (bright cyan)
      c: '\x1b[91m', // red
      d: '\x1b[95m', // light purple
      e: '\x1b[93m', // yellow
      f: '\x1b[97m', // white
      l: '\x1b[1m', // bold
      m: '\x1b[9m', // strikethrough
      n: '\x1b[4m', // underline
      o: '\x1b[3m', // italic
      r: '\x1b[0m', // reset
    }
    return str.replace(/[&§]([0-9a-fklmnor])/gi, (_, code) => codes[code.toLowerCase()] || '')
  }

  static encodeMessage(secretKey, type, value) {
    secretKey = secretKey.replaceAll(' ', '')
    type = type.toUpperCase()
    value = value.trim()
    return String((secretKey ? secretKey : '') + ' ' + type + ' ' + value)
  }

  static decodeMessage(message) {
    let [, secretKey, type, value] =
      String(message)
        .trim()
        .split(/^(\S+)\s+(\S+)\s+([\s\S]*)$/) || []

    return { secretKey, type: type.toUpperCase(), value }
  }

  receive(client, data, stripFormatting = true) {
    let { secretKey, type, value } = ChatSocketServer.decodeMessage(data)

    console.log(
      ChatSocketServer.mcToAnsi(
        `\x1b[38;5;1m⬅ \x1b[38;5;11m${client.ip} \x1b[38;5;15m[\x1b[38;5;11m${type}\x1b[38;5;15m] \x1b[38;5;9m${value}\x1b[0m`
      )
    )

    if (stripFormatting) value = ChatSocketServer.removeMcFormatting(value)

    return { secretKey, type, value }
  }

  send(client, type, value) {
    if (client.readyState !== client.OPEN) return

    type = type.toUpperCase()
    value = value.trim()

    const message = ChatSocketServer.encodeMessage(this.secretKey, type, value)
    client.send(message)
    console.log(
      ChatSocketServer.mcToAnsi(
        `§c➡ \x1b[38;5;11m${client.ip} \x1b[38;5;15m[\x1b[38;5;11m${type}\x1b[38;5;15m] \x1b[38;5;10m${value}\x1b[0m`
      )
    )
  }

  broadcast(type, value) {
    for (const client of this.clients) this.send(client, type, value)
  }
}
