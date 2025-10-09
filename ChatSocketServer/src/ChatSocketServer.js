import { WebSocket, WebSocketServer } from 'ws'
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import ChatSocketProtocol from './ChatSocketProtocol.js'
import TRA from './TRA/TRA.js'
import Utils from './Utils.js'

export default class ChatSocketServer extends WebSocketServer {
  constructor({ port, secret, jsonReadWriteSecret, traReadSecret, dataByteLimit }) {
    // Initialize WebSocketServer
    super({ port })

    port = +port
    if (!Number.isInteger(port) || port < 80 || port >= 65536)
      throw new TypeError('Invalid port: expected an integer between 80 and 65535, got "${port}".')
    this.port = port

    if (typeof secret !== 'string' || !secret.trim().length)
      throw new TypeError('Invalid secret: expected a non-empty string.')
    this.secret = secret.trim().replace(/\s+/g, ' ')

    if (jsonReadWriteSecret && (typeof jsonReadWriteSecret !== 'string' || !jsonReadWriteSecret.trim().length))
      throw new TypeError('Invalid jsonReadWriteSecret: expected undefined or a non-empty string.')
    if (jsonReadWriteSecret) this.jsonReadWriteSecret = jsonReadWriteSecret.trim().replace(/\s+/g, ' ')

    if (traReadSecret && (typeof traReadSecret !== 'string' || !traReadSecret.trim().length))
      throw new TypeError('Invalid traReadSecret: expected undefined or a non-empty string.')
    if (traReadSecret) this.traReadSecret = traReadSecret.trim().replace(/\s+/g, ' ')

    // Optional
    this.dataByteLimit = +(dataByteLimit || Infinity)
    if (!Number.isInteger(dataByteLimit) || this.dataByteLimit < 0)
      throw new TypeError('Invalid dataByteLimit: expected a positive integer.')

    this.on('connection', (client, request) => {
      client.ip = request.socket.remoteAddress || 'unknown'
      client.auth = { isAuth: false, type: 'TRA', permissions: ['receive'] }
      client.name = 'client_' + ~~(Math.random() * 2 ** 31)
      client.userAgent = 'Unknown'

      console.log(
        Utils.mcToAnsi(
          `&2&l+&r &e${client.ip} &7[&c${client.name}&7] [&e${client.auth.type}&7] [&e${client.auth.permissions.join(
            ', '
          )}&7] &a connected`
        )
      )

      client.on('message', (rawData) => {
        try {
          // Close the connection if the client sends a message that is too large
          if (new TextEncoder().encode(rawData).byteLength > this.dataByteLimit)
            client.close(1009, `Message cannot be over ${this.dataByteLimit} bytes.`)

          const { type, message, data } = this.#onmessage(client, String(rawData))

          if (type === 'AUTH') {
            this.authenticate(client, data)
            return
          }

          if (!client.auth.isAuth) {
            this.send(client, 'AUTH', 'Unauthenticated', { success: false })
            return
          }

          if (type === 'CHANNEL') {
            if (data.channel && typeof data.channel === 'string') {
              // Leave the previous channel if client selected a new one
              if (data.channel !== client.channel)
                this.sendChannel(client, 'CHANNEL', `${client.name} left the channel`, { action: 'leave' })

              client.channel = data.channel
              this.send(client, 'CHANNEL', 'Selected channel ' + client.channel, {
                success: true,
                channel: client.channel,
              })
            } else {
              this.send(client, 'CHANNEL', 'Missing data.channel', { success: false })
            }
            return
          }

          // Client does not have read permissions
          if (!client.auth.permissions.includes('read') && (type === 'CHANNELS' || type === 'CLIENTS')) {
            this.send(client, 'AUTH', 'Missing permission: read', { success: false })
            return
          }

          if (type === 'CHANNELS') {
            const channels = this.listChannels()
            this.send(client, 'CHANNELS', channels.join(', '), { channels })
            return
          }

          if (type === 'CLIENTS') {
            const clients = this.listClients(data.channel)
            this.send(client, 'CLIENTS', clients.map((c) => c.name).join(', '), { clients })
            return
          }

          // Client does not have send permissions
          if (!client.auth.permissions.includes('send')) {
            this.send(client, 'AUTH', 'Missing permission: send', { success: false })
            return
          }

          // Allows developers to implement their own logic
          if (typeof this.onmessage === 'function') this.onmessage.call(this, client, type, message, data)
          // Default behavior
          else this.sendChannel(client, type, message, data)
        } catch (err) {
          console.error(err)
        }
      })

      client.on('error', (err) => {
        console.error(err)
        this.close()
      })

      client.on('close', () => {
        console.log(
          Utils.mcToAnsi(
            `&4&l-&r &e${client.ip} &7[${client.auth.isAuth ? '&a' : '&c'}${client.name || '?'}&7] [&e${
              client.auth.type
            }&7] [&e${client.auth.permissions.join(', ')}&7]&c disconnected`
          )
        )
        this.sendChannel(client, 'CHANNEL', `${client.name} left the channel`, { action: 'leave' })
      })
    })

    console.log(Utils.mcToAnsi(`&6ChatSocket&r server is running on port &f${this.port}`))
  }

  #onmessage(client, rawData) {
    // Only allow raw json without permission if the client is not yet authenticated
    let isJson = client.auth.type === 'json'

    if (!isJson && !client.auth.isAuth) {
      try {
        JSON.parse(rawData)
        isJson = true
      } catch {}
    }

    // Don't use TRA encryption if the authType is plain
    const { type, message, data } = ChatSocketProtocol.decodeMessage(isJson ? rawData : TRA.decrypt(rawData, 64))

    // Mask secret
    const maskedData = {
      ...data,
      secret: data.secret !== undefined ? '*' : undefined,
    }

    console.log(
      Utils.mcToAnsi(
        `&2-> &e${client.ip} &7[${client.auth.isAuth ? '&a' : '&c'}${client.name ?? data.name ?? '?'}&7] [&e${
          client.auth.type
        }&7] [&e${client.auth.permissions.join(', ')}&7] &l\x1b[48;5;11m&l ${type} &r &a${message} &7 ${JSON.stringify(
          maskedData
        )}`
      )
    )
    return { type, message, data }
  }

  authenticate(client, data) {
    if (!(client instanceof WebSocket)) throw TypeError('client is not an instance of WebSocket')
    if (!data || data.constructor !== Object) throw TypeError('data is not an Object')

    let from = data?._from

    if (!from || from.constructor !== Object) {
      this.send(client, 'AUTH', 'Missing data._from', { success: false })
      return
    }

    if (
      !(
        data.secret === this.secret ||
        (this.jsonReadWriteSecret && data.secret === this.jsonReadWriteSecret) ||
        (this.traReadSecret && data.secret === this.traReadSecret)
      )
    ) {
      this.send(client, 'AUTH', 'Incorrect secret key', { success: false })
      return
    }

    client.auth.isAuth = true

    // Determine auth type based on which secret key the client used
    if (data.secret === this.secret) {
      client.auth.type = 'TRA'
      client.auth.permissions = ['receive', 'send', 'read']
    } else if (data.secret === this.jsonReadWriteSecret) {
      client.auth.type = 'json'
      client.auth.permissions = ['receive', 'send', 'read']
    }

    const fromChannel = client.channel

    if (typeof data.channel !== 'string') data.channel = ''
    data.channel = data.channel.trim().replace(/\s+/g, ' ')

    // Leave the previous channel if client selected a new one
    if (data.channel && data.channel !== fromChannel)
      this.sendChannel(client, 'CHANNEL', `${client.name} left the channel`, { action: 'leave' })

    if (typeof from.name !== 'string') from.name = ''
    if (typeof from.uuid !== 'string') from.uuid = ''
    if (typeof from.userAgent !== 'string') from.userAgent = ''

    from.name = from.name.trim().replace(/\s+/g, ' ')
    from.uuid = from.uuid.trim().replace(/\s+/g, ' ')
    from.userAgent = from.userAgent.trim().replace(/\s+/g, ' ')

    client.channel = data.channel ?? client.channel ?? 'Default'
    client.name = from.name ?? client.name
    client.uuid = uuidValidate(from.uuid) ? from.uuid : client.uuid ?? uuidv4()
    client.userAgent = from.userAgent ?? 'Unknown'

    const { name, uuid, userAgent } = client
    from = { name, uuid, userAgent }

    this.send(client, 'AUTH', `Authenticated as ${client.name}`, {
      success: true,
      channel: client.channel,
      _to: from,
    })

    if (data.channel) {
      this.send(client, 'CHANNEL', 'Selected channel ' + client.channel, {
        success: true,
        channel: client.channel,
      })
    }

    if (client.channel !== fromChannel)
      this.sendChannel(client, 'CHANNEL', `${client.name} joined the channel`, { action: 'join' })
  }

  send(client, type, message, data = {}) {
    if (!(client instanceof WebSocket)) throw TypeError('client is not an instance of WebSocket')
    if (client.readyState !== client.OPEN) console.error('WebSocket is not in OPEN state')

    if (!data?._from) data._from = 'server'

    const encoded = ChatSocketProtocol.encodeMessage(type, message, data)
    // Don't use TRA encryption if the authType is plain
    client.send(client.auth.type === 'json' ? encoded : TRA.encrypt(encoded, 64))

    console.log(
      Utils.mcToAnsi(
        `&3<- &e${client.ip} &7[${client.auth.isAuth ? '&a' : '&c'}${client.name}&7] [&e${
          client.auth.type
        }&7] [&e${client.auth.permissions.join(', ')}&7] &l\x1b[48;5;11m&l ${String(
          type
        ).toUpperCase()} &r &b${message} &7 ${JSON.stringify(data)}`
      )
    )
  }

  listChannels() {
    const channels = new Set(['Default'])

    Array.from(this.clients)
      .filter((client) => true || (client.auth.isAuth && client.readyState === client.OPEN))
      .forEach((client) => channels.add(client.channel))

    return Array.from(channels)
  }

  listClients(channel = null) {
    const clients = []

    Array.from(this.clients)
      .filter((client) => client.auth.isAuth && client.readyState === client.OPEN)
      .forEach((client) => {
        const { name, uuid, userAgent } = client
        if (!channel || channel === client.channel) clients.push({ name, uuid, userAgent })
      })

    return clients
  }

  sendChannel(fromClient, type, message, data = {}) {
    if (!(fromClient instanceof WebSocket)) throw TypeError('fromClient is not an instance of WebSocket')

    data._from = {
      name: fromClient.name,
      uuid: fromClient.uuid,
      userAgent: fromClient.userAgent,
    }

    Array.from(this.clients)
      .filter(
        (client) =>
          client.auth.isAuth &&
          client.readyState === client.OPEN &&
          client.channel === fromClient.channel &&
          client.uuid !== fromClient.uuid
      )
      .forEach((client) => this.send(client, type, message, data))
  }

  selectChannel(client, channel) {
    if (!(client instanceof WebSocket)) throw TypeError('client is not an instance of WebSocket')

    // Leave the previous channel if client selected a new one
    if ((channel ?? 'default') !== client.channel) {
      this.sendChannel(client, 'CHANNEL', `${client.name} left the channel`, { action: 'leave' })
    }
    client.channel = channel ?? 'Default'
  }
}
