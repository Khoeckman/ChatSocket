import 'dotenv/config'
import ChatSocketServer from './src/ChatSocketServer.js'

if (!process.env.SECRET || process.env.SECRET.length < 1) {
  throw new TypeError(`Missing or invalid environment variable

  -> SECRET is not set in your .env file
  -> Please follow the setup instructions in README.md
`)
}

// Make sure this matches ChatSocket's setting
const server = new ChatSocketServer({ port: process.env.PORT || 47576, secret: process.env.SECRET, dataByteLimit: 10000 })

// Implement your own logic here
server.onmessage = function (client, type, message, data) {
  console.log('using this function!')
  this.sendChannel(client, type, message, data)
}
