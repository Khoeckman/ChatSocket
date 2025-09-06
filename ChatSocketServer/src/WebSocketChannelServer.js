import { WebSocketServer } from 'ws'
import Utils from './Utils.js'

export default class WebSocketChannelServer extends WebSocketServer {
  constructor(port, secret, { dataByteLimit } = {}) {
    // Initialize WebSocketServer
    super({ port })

    this.port = port
    this.secret = secret.replaceAll(' ', '')

    // Options
    this.dataByteLimit = dataByteLimit
  }

  // Prepare to send to ChatSocket
  static encodeMessage(type, message, data = {}) {
    if (!data || data.constructor !== Object) data = {}
    return JSON.stringify({ type: String(type).toUpperCase(), message: String(message ?? ''), data })
  }

  // Parse message from ChatSocket
  static decodeMessage(message) {
    // Returns `false` if the message is not valid JSON and thus unusable.
    try {
      ;({ type, message, data } = JSON.parse(String(message)))
    } catch (err) {
      return false
    }

    // Message must have a type
    if (!type || typeof type !== 'string') return false

    return {
      type: type.toUpperCase(),
      message: String(message ?? ''),
      data: data && data.constructor === Object ? data : {},
    }
  }

  onmessage(client, rawData) {
    let { type, message, data } = ChatSocketServer.decodeMessage(rawData)
    console.log(
      Utils.mcToAnsi(`&2-> &e${client.ip} &7[${client.isAuth ? '&a' : '&c'}${client.name}&7] &l\x1b[48;5;11m&l ${type} &r &a${message}`)
    )
    return { type, message, data }
  }

  send(client, type, message, data = {}) {
    if (client.readyState !== client.OPEN) return

    client.send(ChatSocketServer.encodeMessage(type, message, data))
    console.log(
      Utils.mcToAnsi(
        `&4<- &e${client.ip} &7[${client.isAuth ? '&a' : '&c'}${client.name}&7] &l\x1b[48;5;11m&l ${String(
          type
        ).toUpperCase()} &r &c${message}`
      )
    )
  }

  sendChannel(fromClient, type, message, data = {}) {
    this.clients
      .filter(client => client.isAuth && client.channel === fromClient.channel && client.uuid !== fromClient.uuid)
      .forEach(client => this.send(client, type, message, data))
  }
}
