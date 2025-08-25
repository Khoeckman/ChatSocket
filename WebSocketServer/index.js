import ChatSocketServer from './ChatSocketServer.js'

// Make sure this matches ChatSocket's setting
const wss = new ChatSocketServer(47576, 'd05ea80be14130f8387e308121bc18f9')

wss.on('connection', (client, request) => {
  client.ip = request.socket.remoteAddress
  console.log('+ Client connected', client.ip)

  client.on('message', (data, isBinairy) => {
    const { type, value } = wss.receive(client, data)
    wss.broadcast(type, value)
  })

  client.on('error', console.error)

  client.on('close', () => {
    console.log('- Client disconnected', client.ip)
  })
})

console.log('ChatSocket server running on ws://localhost:' + wss.port)
