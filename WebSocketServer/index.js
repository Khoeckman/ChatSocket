import 'dotenv/config'
import Utils from './src/Utils.js'
import ChatSocketServer from './src/ChatSocketServer.js'

if (typeof process.env.SECRET_KEY !== 'string' || process.env.SECRET_KEY.length < 1) {
  throw new TypeError(`Missing or invalid environment variable

  -> SECRET_KEY is not set in your .env file
  -> Please follow the setup instructions in README.md
`)
}

// Make sure this matches ChatSocket's setting
const wss = new ChatSocketServer(47576, process.env.SECRET_KEY)

wss.on('connection', (client, request) => {
  client.ip = request.socket.remoteAddress
  client.isAuth = false
  console.log(Utils.mcToAnsi(`&2&l+&r &e${client.ip}&a connected`))

  client.on('message', data => {
    const { type, value } = wss.receive(client, data)

    if (!client.isAuth) {
      wss.send(client, 'AUTH', "Secret keys don't match")
      return
    }

    if (client.uuid === undefined) {
      client.isAuth = false
      wss.send(client, 'AUTH', 'Unauthenticated')
      return
    }

    if (type === 'AUTH') {
      client.uuid = Utils.isUUID(value) ? value : null
      wss.send(client, 'AUTH', 'Authenticated as' + (client.uuid ? 'Minecraft' : 'Controller'))
    }

    wss.forward(client, type, value)
  })

  client.on('error', console.error)

  client.on('close', () => {
    console.log(Utils.mcToAnsi(`&4&l-&r &e${client.ip}&c disconnected`))
  })
})

console.log(Utils.mcToAnsi(`&6ChatSocket&r server running on &f&nws://localhost:${wss.port}`))
