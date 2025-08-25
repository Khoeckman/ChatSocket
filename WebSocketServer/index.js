import 'dotenv/config'
import ChatSocketServer from './ChatSocketServer.js'

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
  console.log(ChatSocketServer.mcToAnsi(`&2&l+&r &e${client.ip}&a connected`))

  client.on('message', data => {
    const { type, value } = wss.receive(client, data)

    if (!client.isAuth) {
      wss.send(client, 'AUTH', "Secret keys don't match")
      return
    }

    switch (type) {
      // Its not mandatory for the client to send an AUTH message but it allows them to receive messages before sending any
      case 'AUTH':
        client.uuid = value
        wss.send(client, 'AUTH', 'ACK')
        break
      case 'CHAT':
        wss.send(client, 'CHAT', 'ACK')
        break
      case 'SAY':
        wss.send(client, 'SAY', 'ACK')
        break
      case 'COMMAND':
        wss.send(client, 'COMMAND', 'ACK')
        break
      case 'BC:CHAT':
        wss.broadcast('CHAT', value)
        break
    }
  })

  client.on('error', console.error)

  client.on('close', () => {
    console.log(ChatSocketServer.mcToAnsi(`&4&l-&r &e${client.ip}&c disconnected`))
  })
})

console.log(ChatSocketServer.mcToAnsi(`&6ChatSocket&r server running on &f&nws://localhost:${wss.port}`))
