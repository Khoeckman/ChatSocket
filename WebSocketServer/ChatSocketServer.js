import { WebSocketServer } from 'ws'

export default class ChatSocketServer extends WebSocketServer {
  constructor(port, secretKey) {
    super({ port })

    this.port = port
    this.secretKey = secretKey.replaceAll(' ', '')
  }

  static mcToAnsi(str) {
    const codes = {
      0: '\x1b[38;5;0m', // black
      1: '\x1b[38;5;4m', // dark blue
      2: '\x1b[38;5;2m', // dark green
      3: '\x1b[38;5;6m', // dark aqua
      4: '\x1b[38;5;1m', // dark red
      5: '\x1b[38;5;5m', // dark purple
      6: '\x1b[38;5;3m', // gold
      7: '\x1b[38;5;7m', // gray
      8: '\x1b[38;5;8m', // dark gray
      9: '\x1b[38;5;12m', // blue
      a: '\x1b[38;5;10m', // green
      b: '\x1b[38;5;14m', // aqua
      c: '\x1b[38;5;9m', // red
      d: '\x1b[38;5;13m', // light purple
      e: '\x1b[38;5;11m', // yellow
      f: '\x1b[38;5;15m', // white
      l: '\x1b[1m', // bold
      m: '\x1b[9m', // strikethrough
      n: '\x1b[4m', // underline
      o: '\x1b[3m', // italic
      r: '\x1b[0m', // reset
    }
    return str.replace(/[&§]([0-9a-fklmnor])/g, (_, code) => codes[code] || '') + '\x1b[0m'
  }

  static removeMcFormatting(str) {
    return String(str).replace(/[&§][0-9a-fklmnor]/g, '')
  }

  // Prepare to send to ChatSocket
  static encodeMessage(secretKey, type, value) {
    return secretKey + ' ' + type.toUpperCase() + ' ' + value
  }

  // Parse message from ChatSocket
  static decodeMessage(message) {
    let [, secretKey, type, value] = String(message).split(/^(\S+)\s+(\S+)\s+([\s\S]*)$/) || []
    return { secretKey, type: type.toUpperCase(), value }
  }

  receive(client, data, stripFormatting = false) {
    let { secretKey, type, value } = ChatSocketServer.decodeMessage(data)
    const isAuth = this.secretKey === secretKey

    console.log(
      ChatSocketServer.mcToAnsi(`&2-> &e${client.ip} &7[&${isAuth ? 'a' : 'c'}${secretKey}&7] &r&l\x1b[48;5;11m&l ${type} &r &a${value}`)
    )
    if (stripFormatting) value = ChatSocketServer.removeMcFormatting(value)
    return { isAuth, type, value }
  }

  send(client, type, value) {
    if (client.readyState !== client.OPEN) return

    const message = ChatSocketServer.encodeMessage(this.secretKey, type, value)
    client.send(message)
    console.log(
      ChatSocketServer.mcToAnsi(`&4<- &e${client.ip} &7[&a${this.secretKey}&7]&r&l\x1b[48;5;11m&l ${type.toUpperCase()} &r &c${value}`)
    )
  }

  broadcast(type, value) {
    for (const client of this.clients) this.send(client, type, value)
  }
}
