import { WebSocketServer } from 'ws'
import ChatSocketProtocol from './ChatSocketProtocol.js'
import Utils from './Utils.js'

export default class ChatSocketServer extends WebSocketServer {
  constructor({ port, secret, dataByteLimit } = {}) {
    // Initialize WebSocketServer
    super({ port })

    this.port = port
    this.secret = secret.replaceAll(' ', '')

    // Options
    this.dataByteLimit = dataByteLimit
  }

  onmessage(client, rawData) {
    let { type, message, data } = ChatSocketProtocol.decodeMessage(rawData)
    console.log(
      Utils.mcToAnsi(
        `&2-> &e${client.ip} &7[${client.isAuth ? '&a' : '&c'}${
          client.name
        }&7] &l\x1b[48;5;11m&l ${type} &r &a${message} &7 ${JSON.stringify(data)}`
      )
    )
    return { type, message, data }
  }

  send(client, type, message, data = {}) {
    if (client.readyState !== client.OPEN) return

    client.send(ChatSocketProtocol.encodeMessage(type, message, data))
    console.log(
      Utils.mcToAnsi(
        `&4<- &e${client.ip} &7[${client.isAuth ? '&a' : '&c'}${client.name}&7] &l\x1b[48;5;11m&l ${String(
          type
        ).toUpperCase()} &r &c${message} &7 ${JSON.stringify(data)}`
      )
    )
  }

  sendChannel(fromClient, type, message, data = {}) {
    ;[...this.clients]
      .filter(client => client.isAuth && client.channel === fromClient.channel && client.uuid !== fromClient.uuid)
      .forEach(client => this.send(client, type, message, data))
  }

  selectChannel(client, channel) {
    // Leave the previous channel if client selected a new one
    if ((channel ?? 'default') !== client.channel)
      this.sendChannel(client, 'CHANNEL', `${client.name} left the channel.`, { name: client.name, uuid: client.uuid })

    client.channel = channel ?? 'default'
  }
}
