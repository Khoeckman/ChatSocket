import 'dotenv/config'
import { v4 as uuidv4 } from 'uuid'
import Utils from './src/Utils.js'
import WebSocketChannelServer from './src/WebSocketChannelServer.js'

if (!process.env.SECRET_KEY || process.env.SECRET_KEY.length < 1) {
  throw new TypeError(`Missing or invalid environment variable

  -> SECRET_KEY is not set in your .env file
  -> Please follow the setup instructions in README.md
`)
}

// Make sure this matches ChatSocket's setting
const server = new WebSocketChannelServer(process.env.PORT || 47576, process.env.SECRET_KEY, { dataByteLimit: 10000 })

server.on('connection', (client, request) => {
  client.ip = request.socket.remoteAddress
  client.isAuth = false
  client.channel = 'default'
  console.log(Utils.mcToAnsi(`&2&l+&r &e${client.ip}&a connected`))

  client.on('message', rawData => {
    // Close the connection if the client sends a message that is too large
    if (rawData.byteLength > server.dataByteLimit) client.close(1009, `Message cannot be over ${server.dataByteLimit} bytes`)

    const { type, message, data } = server.onmessage(client, rawData)

    if (type === 'AUTH') {
      // todo assign generated UUID instead of null
      client.uuid = Utils.isUUID(value) ? value : null

      if (data.secret === server.secretKey) {
        server.send(client, 'AUTH', `Authenticated as ${client.name} (${client.uuid})`, {
          success: true,
          name: client.name,
          uuid: client.uuid,
        })
      } else {
        server.send(client, 'AUTH', 'Secret key does not match', { success: false })
      }

      return
    }

    if (!client.isAuth) {
      server.send(client, 'AUTH', 'Unauthenticated', { success: false })
      return
    }

    server.sendChannel(client, type, message, data)
  })

  client.on('error', console.error)

  client.on('close', () => {
    console.log(Utils.mcToAnsi(`&4&l-&r &e${client.ip}&c disconnected`))
  })
})

console.log(Utils.mcToAnsi(`&6ChatSocket&r server running on &f&nws://localhost:${server.port}`))
