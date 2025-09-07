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
server.onmessage = onmessageCustom

/**
 * Handles incoming messages from connected WebSocket clients.
 *
 * This callback is executed after a client is authenticated and has sent a message.
 * You can override this function to implement custom message handling logic.
 *
 * @this {server}
 * @param {import('ws').WebSocket} client - The WebSocket connection object of the sender.
 * @param {string} type - The message type, as decoded from the protocol (e.g., "CHAT", "CMD").
 * @param {string} message - The main message payload, usually a short text or command.
 * @param {Object} data - Additional structured data sent with the message.
 *
 * @example
 * server.onmessage = function (client, type, message, data) {
 *   // Echo the message to all clients in the same channel, except the source
 *   this.sendChannel(client, type, message, data);
 * }
 */
function onmessageCustom(client, type, message, data) {
  this.sendChannel(client, type, message, data)
}
