import { chat, error } from '../utils'
import settings from '../vigilance/settings'

const URI = Java.type('java.net.URI')
const WebSocketClient = Java.type('org.java_websocket.client.WebSocketClient')

export default class ChatSocketClient {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  static PREFIX = '&7[&f&lWS&7] '

  constructor(uri) {
    if (typeof uri !== 'string') return error(new TypeError('uri is not a string'), settings.printStackTrace)
    this.uri = new URI(uri)

    this.readyState = ChatSocketClient.CLOSED
    this.hasConnected = false
    this.manuallyClosed = false

    this.receive = null

    const ws = this

    this.socket = new JavaAdapter(
      WebSocketClient,
      {
        onOpen(handshake) {
          ws.readyState = ChatSocketClient.OPEN

          ws.deleteConnectingMessage()
          Client.scheduleTask(() => {
            if (settings.logChat) chat(`&2&l+ &aConnected to &f${this.uri}`)
          })
          World.playSound('random.levelup', 0.7, 1)
        },
        onMessage(message) {
          if (settings.logChat) ChatLib.chat(ChatSocketClient.PREFIX + '&2➡ &a' + message)
          if (typeof ws.receive === 'function') ws.receive(message)
        },
        onError(exception) {
          error('WebSocket Error: ' + exception, settings.printStackTrace)

          ws.deleteConnectingMessage()
          ws.deleteDisconnectingMessage()

          // Force close
          ws.readyState = ChatSocketClient.CLOSED
          ws.socket.close()
        },
        onClose(code, reason, remote) {
          ws.readyState = ChatSocketClient.CLOSED

          ws.deleteDisconnectingMessage()
          Client.scheduleTask(() => {
            if (settings.logChat) {
              if (remote) chat(`&4&l- &cConnection closed by &f${this.uri} &7[&e${code}&7]`)
              else if (code === -1) chat(`&4&l- &cFailed to connect to &f${this.uri} &7[&e${code}&7]`)
              else chat(`&4&l- &cDisconnected from &f${this.uri} &7[&e${code}&7]`)
            }
          })

          if (code === -1) World.playSound('random.anvil_land', 0.3, 1)
          else World.playSound('dig.glass', 0.7, 1)
        },
      },
      this.uri
    )
  }

  send(message) {
    if (this.readyState !== ChatSocketClient.OPEN) throw new Error('WebSocket is not in OPEN state.')

    this.socket.send(String(message))
    if (settings.logChat) ChatLib.chat(ChatSocketClient.PREFIX + '&4⬅ &a' + String(message))
  }

  connect() {
    if (this.readyState === ChatSocketClient.CONNECTING || this.readyState === ChatSocketClient.OPEN) {
      this.deleteConnectingMessage()
      throw new Error('WebSocket is already in CONNECTING or OPEN state.')
    }
    if (this.readyState === ChatSocketClient.CLOSING) {
      this.deleteConnectingMessage()
      throw new Error('WebSocket is still in CLOSING state.')
    }

    this.readyState = ChatSocketClient.CONNECTING
    this.socket.connect()
    this.hasConnected = true
  }

  close() {
    if (this.readyState === ChatSocketClient.CLOSING || this.readyState === ChatSocketClient.CLOSED) {
      this.deleteDisconnectingMessage()
      throw new Error('WebSocket is already in CLOSING or CLOSED state.')
    }

    this.readyState = ChatSocketClient.CLOSING
    this.socket.close()
    this.manuallyClosed = true
  }

  reconnect() {
    if (this.readyState === ChatSocketClient.CONNECTING || this.readyState === ChatSocketClient.OPEN) {
      this.deleteConnectingMessage()
      throw new Error('WebSocket is already in CONNECTING or OPEN state.')
    }
    if (this.readyState === ChatSocketClient.CLOSING) {
      this.deleteConnectingMessage()
      throw new Error('WebSocket is still in CLOSING state.')
    }

    this.readyState = ChatSocketClient.CONNECTING
    if (this.hasConnected) this.socket.reconnect()
    else this.socket.connect()
  }

  deleteConnectingMessage() {
    Client.scheduleTask(() => {
      ChatLib.deleteChat(47576001)
    })
  }

  deleteDisconnectingMessage() {
    Client.scheduleTask(() => {
      ChatLib.deleteChat(47576002)
    })
  }
}
