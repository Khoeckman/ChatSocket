import { WebSocketServer } from 'ws'

// Utils
const stripFormatting = str => String(str).replace(/&[0-9a-fklmnor]/g, '')

// Make sure this matches ChatSocket's setting
const settings = {
  port: 47576,
  secretKey: 'd05ea80be14130f8387e308121bc18f9',
}

const clients = []
const wss = new WebSocketServer({ port: settings.port })

wss.on('connection', (client, request) => {
  client.ip = request.socket.remoteAddress
  console.log('+ Client connected', client.ip)

  client.on('message', (data, isBinairy) => {
    receive(client, data)
    broadcast(wss, stripFormatting(data), isBinairy)
  })

  client.on('error', console.error)

  client.on('close', () => {
    console.log('- Client disconnected', client.ip)
  })
})

console.log('ChatSocket server running on ws://localhost:' + settings.port)

function broadcast(wss, data, isBinairy) {
  for (const client of wss.clients) send(client, data, isBinairy)
}

function receive(client, data) {
  const message = data.toString()
  console.log('INCOMING <-', client.ip, message)
  return message
}

function send(client, data, isBinairy = false) {
  if (client.readyState !== client.OPEN) return
  client.send(data, { binairy: isBinairy })
  console.log('OUTGOING ->', client.ip, data.toString())
}
