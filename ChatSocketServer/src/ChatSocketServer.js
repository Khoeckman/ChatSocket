import { WebSocket, WebSocketServer } from 'ws'
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import ChatSocketProtocol from './ChatSocketProtocol.js'
import Utils from './Utils.js'

export default class ChatSocketServer extends WebSocketServer {
  constructor({ port, secret, dataByteLimit }) {
    // Initialize WebSocketServer
    super({ port })

    port = +port
    if (!Number.isInteger(port) || port < 80 || port >= 65536)
      throw new TypeError('Invalid port: expected an integer between 80 and 65535, got "${port}".')
    this.port = port

    if (typeof secret !== 'string' || !secret.trim().length)
      throw new TypeError('Invalid secret: expected a non-empty string.')
    this.secret = secret.trim()

    // Optional
    this.dataByteLimit = +(dataByteLimit || Infinity)
    if (!Number.isInteger(dataByteLimit) || this.dataByteLimit < 0)
      throw new TypeError('Invalid dataByteLimit: expected a positive integer.')

    this.on('connection', (client, request) => {
      client.ip = request.socket.remoteAddress || 'unknown'
      client.isAuth = false
      client.name = 'client_' + ~~(Math.random() * 2 ** 31)
      console.log(Utils.mcToAnsi(`&2&l+&r &e${client.ip} &7[&c${client.name}&7]&a connected`))

      client.on('message', (rawData) => {
        // Close the connection if the client sends a message that is too large
        if (new TextEncoder().encode(rawData).byteLength > this.dataByteLimit)
          client.close(1009, `Message cannot be over ${this.dataByteLimit} bytes`)

        const { type, message, data } = this.#onmessage(client, rawData)

        if (type === 'AUTH') {
          if (data.secret !== this.secret) {
            this.send(client, 'AUTH', 'Incorrect secret key', { success: false })
            return
          }

          const fromChannel = client.channel

          // Leave the previous channel if client selected a new one
          if (data.channel && data.channel !== fromChannel)
            this.sendChannel(client, 'CHANNEL', `${client.name} left the channel.`, {
              name: client.name,
              uuid: client.uuid,
            })

          if (typeof data.channel !== 'string') data.channel = ''
          if (typeof data.name !== 'string') data.name = ''
          if (typeof data.uuid !== 'string') data.uuid = ''

          client.isAuth = true
          client.channel = data.channel ?? client.channel ?? 'Default'
          client.name = data.name ?? client.name
          client.uuid = uuidValidate(data.uuid) ? data.uuid : uuidv4()

          this.send(client, 'AUTH', `Authenticated as ${client.name}`, {
            success: true,
            channel: client.channel,
            name: client.name,
            uuid: client.uuid,
          })

          if (data.channel)
            this.send(client, 'CHANNEL', 'Selected channel ' + client.channel, {
              success: true,
              channel: client.channel,
            })

          if (client.channel !== fromChannel)
            this.sendChannel(client, 'CHANNEL', `${client.name} joined the channel.`, {
              name: client.name,
              uuid: client.uuid,
            })

          return
        }

        if (!client.isAuth) {
          this.send(client, 'AUTH', 'Unauthenticated', { success: false })
          return
        }

        if (type === 'CHANNEL') {
          if (data.channel && typeof data.channel === 'string') {
            // Leave the previous channel if client selected a new one
            if (data.channel !== client.channel)
              this.sendChannel(client, 'CHANNEL', `${client.name} left the channel.`, {
                name: client.name,
                uuid: client.uuid,
              })

            client.channel = data.channel
            this.send(client, 'CHANNEL', 'Selected channel ' + client.channel, {
              success: true,
              channel: client.channel,
            })
          } else {
            this.send(client, 'CHANNEL', 'Missing channel', { success: false })
          }
          return
        }

        if (type === 'CHANNELS') {
          this.send(client, 'CHANNELS', 'Channels: ' + this.listChannels().join(', '), {
            channels: this.listChannels(),
          })
          return
        }

        // Allows developers to implement their own logic
        if (typeof this.onmessage === 'function') this.onmessage.call(this, client, type, message, data)
        // Default behavior
        else this.sendChannel(client, type, message, data)
      })

      client.on('error', console.error)

      client.on('close', () => {
        console.log(
          Utils.mcToAnsi(
            `&4&l-&r &e${client.ip} &7[${client.isAuth ? '&a' : '&c'}${client.name || '?'}&7]&c disconnected`
          )
        )
        this.sendChannel(client, 'CHANNEL', `${client.name} left the channel.`, {
          name: client.name,
          uuid: client.uuid,
        })
      })
    })

    console.log(Utils.mcToAnsi(`&6ChatSocket&r server is running on port ${this.port}`))
  }

  #onmessage(client, rawData) {
    const { type, message, data } = ChatSocketProtocol.decodeMessage(rawData)
    console.log(
      Utils.mcToAnsi(
        `&2-> &e${client.ip} &7[${client.isAuth ? '&a' : '&c'}${
          client.name ?? data.name ?? '?'
        }&7] &l\x1b[48;5;11m&l ${type} &r &a${message} &7 ${JSON.stringify(data)}`
      )
    )
    return { type, message, data }
  }

  send(client, type, message, data = {}) {
    if (!(client instanceof WebSocket)) throw TypeError('client is not an instance of WebSocket')
    if (client.readyState !== client.OPEN) throw new Error('WebSocket is not in OPEN state')

    client.send(ChatSocketProtocol.encodeMessage(type, message, data))
    console.log(
      Utils.mcToAnsi(
        `&3<- &e${client.ip} &7[${client.isAuth ? '&a' : '&c'}${client.name}&7] &l\x1b[48;5;11m&l ${String(
          type
        ).toUpperCase()} &r &b${message} &7 ${JSON.stringify(data)}`
      )
    )
  }

  listChannels() {
    const channels = new Set(['Default'])

    Array.from(this.clients)
      .filter((client) => client.isAuth)
      .forEach((client) => channels.add(client.channel))

    return Array.from(channels)
  }

  sendChannel(fromClient, type, message, data = {}) {
    if (!(fromClient instanceof WebSocket)) throw TypeError('fromClient is not an instance of WebSocket')

    Array.from(this.clients)
      .filter((client) => client.isAuth && client.channel === fromClient.channel && client.uuid !== fromClient.uuid)
      .forEach((client) => this.send(client, type, message, data))
  }

  selectChannel(client, channel) {
    if (!(client instanceof WebSocket)) throw TypeError('client is not an instance of WebSocket')

    // Leave the previous channel if client selected a new one
    if ((channel ?? 'default') !== client.channel)
      this.sendChannel(client, 'CHANNEL', `${client.name} left the channel.`, { name: client.name, uuid: client.uuid })

    client.channel = channel ?? 'Default'
  }
}
