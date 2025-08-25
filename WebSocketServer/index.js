import ChatSocketServer from './ChatSocketServer.js'

// Make sure this matches ChatSocket's setting
const wss = new ChatSocketServer(47576, '3b9e06e2db0ba8327d6584e5c2cd1f2e')

wss.on('connection', (client, request) => {
  client.ip = request.socket.remoteAddress
  console.log(ChatSocketServer.mcToAnsi(`&2&l+&r &e${client.ip}&a connected`))

  client.on('message', data => {
    const { type, value } = wss.receive(client, data, false)
    wss.broadcast(type, value)
  })

  client.on('error', console.error)

  client.on('close', () => {
    console.log(ChatSocketServer.mcToAnsi(`&4&l-&r &e${client.ip}&c disconnected`))
  })
})

console.log(ChatSocketServer.mcToAnsi(`&6ChatSocket&r server running on &f&nws://localhost:${wss.port}`))
