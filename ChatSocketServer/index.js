import 'dotenv/config'
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import ChatSocketServer from './src/ChatSocketServer.js'
import Utils from './src/Utils.js'

if (!process.env.SECRET || process.env.SECRET.length < 1) {
  throw new TypeError(`Missing or invalid environment variable

  -> SECRET is not set in your .env file
  -> Please follow the setup instructions in README.md
`)
}

// Make sure this matches ChatSocket's setting
const server = new ChatSocketServer({ port: process.env.PORT || 47576, secret: process.env.SECRET, dataByteLimit: 10000 })

server.on('connection', (client, request) => {
  client.ip = request.socket.remoteAddress
  client.isAuth = false
  console.log(Utils.mcToAnsi(`&2&l+&r &e${client.ip}&a connected`))

  client.on('message', rawData => {
    // Close the connection if the client sends a message that is too large
    if (rawData.byteLength > server.dataByteLimit) client.close(1009, `Message cannot be over ${server.dataByteLimit} bytes`)

    const { type, message, data } = server.onmessage(client, rawData)

    if (type === 'AUTH') {
      if (data.secret !== server.secret) {
        server.send(client, 'AUTH', 'Incorrect secret key', { success: false })
        return
      }

      client.isAuth = true

      if (data.channel) {
        // Leave the previous channel if client selected a new one
        if (data.channel !== client.channel)
          server.sendChannel(client, 'CHANNEL', `${client.name} left the channel.`, { name: client.name, uuid: client.uuid })

        client.channel = data.channel
      }
      client.name = data.name ?? 'Client_' + (~~(Math.random() * 2 ** 31)).toString(36)
      client.uuid = uuidValidate(data.uuid) ? data.uuid : uuidv4()

      server.send(client, 'AUTH', `Authenticated as ${client.name}`, {
        success: true,
        channel: client.channel,
        name: client.name,
        uuid: client.uuid,
      })
      if (data.channel) server.send(client, 'CHANNEL', 'Selected channel ' + client.channel, { success: true, channel: client.channel })
      server.sendChannel(client, 'CHANNEL', `${client.name} joined the channel.`, { name: client.name, uuid: client.uuid })
      return
    }

    if (!client.isAuth) {
      server.send(client, 'AUTH', 'Unauthenticated', { success: false })
      return
    }

    if (type === 'CHANNEL') {
      if (data.channel) {
        // Leave the previous channel if client selected a new one
        if (data.channel !== client.channel)
          server.sendChannel(client, 'CHANNEL', `${client.name} left the channel.`, { name: client.name, uuid: client.uuid })

        client.channel = data.channel
        server.send(client, 'CHANNEL', 'Selected channel ' + client.channel, { success: true, channel: client.channel })
      } else {
        server.send(client, 'CHANNEL', 'Missing channel', { success: false })
      }
      return
    }

    onmessage?.(client, type, message, data)
    server.sendChannel(client, type, message, data)
  })

  client.on('error', console.error)

  client.on('close', () => {
    console.log(Utils.mcToAnsi(`&4&l-&r &e${client.ip}&c disconnected`))
    server.sendChannel(client, 'CHANNEL', `${client.name} left the channel.`, { name: client.name, uuid: client.uuid })
  })
})

console.log(Utils.mcToAnsi(`&6ChatSocket&r server running on &f&nws://localhost:${server.port}`))

// Implement your own logic here
function onmessage(client, type, message, data) {
  return
}
