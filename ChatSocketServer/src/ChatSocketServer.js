import { WebSocketServer } from 'ws'
import Utils from './Utils.js'

export default class ChatSocketServer extends WebSocketServer {
  constructor(port, secretKey) {
    super({ port })

    this.port = port
    this.secretKey = secretKey.replaceAll(' ', '')
  }

  // Prepare to send to ChatSocket
  static encodeMessage(isAuth, type, value) {
    return +!!isAuth + ' ' + type.toUpperCase() + ' ' + (value ?? '')
  }

  // Parse message from ChatSocket
  static decodeMessage(message) {
    let [, secretKey, type, value] = String(message).split(/^(\S+)\s+(\S+)\s+([\s\S]*)$/) || []
    return { secretKey, type: String(type).toUpperCase(), value }
  }

  onmessage(client, data, stripFormatting = false) {
    let { secretKey, type, value } = ChatSocketServer.decodeMessage(data)
    const isAuth = this.secretKey === secretKey
    client.isAuth = isAuth

    console.log(Utils.mcToAnsi(`&2-> &e${client.ip} &7[&${isAuth ? 'a' : 'c'}${secretKey}&7]&r &l\x1b[48;5;11m&l ${type} &r &a${value}`))
    if (stripFormatting) value = ChatSocketServer.removeMcFormatting(value)
    return { secretKey, type, value }
  }

  send(client, type, value) {
    if (client.readyState !== client.OPEN) return

    client.send(ChatSocketServer.encodeMessage(client.isAuth, type, value))
    console.log(
      Utils.mcToAnsi(
        `&4<- &e${client.ip} &7[&${client.isAuth ? 'a' : 'c'}${+!!client.isAuth}&7]&r &l\x1b[48;5;11m&l ${type.toUpperCase()} &r &c${
          value ?? ''
        }`
      )
    )
  }

  forward(client, type, value) {
    for (const currentClient of this.clients) {
      // Only relay between different client types (Controller <-> Minecraft).
      // Prevents sending messages back to the same side (Controller <-> Controller or Minecraft <-> Minecraft).
      if (currentClient.isAuth && client.uuid !== currentClient.uuid) this.send(currentClient, type, value)
    }
  }
}
