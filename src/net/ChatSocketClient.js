import { randomInt, chat, error } from '../utils'
import settings from '../vigilance/settings'

const URI = Java.type('java.net.URI')
const WebSocketClient = Java.type('org.java_websocket.client.WebSocketClient')

export default class ChatSocketClient {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  constructor(uri) {
    if (typeof uri !== 'string') return error(new TypeError('uri is not a string'), settings.printStackTrace)
    this.uri = new URI(uri)

    this.readyState = ChatSocketClient.CLOSED
    this.autoconnect = true
    this.hasConnected = false

    this.connectingMessageId = randomInt(2 ** 15, 2 ** 31 - 1)
    this.disconnectingMessageId = this.connectingMessageId + 1

    this.onmessage = null
    this.isAuth = false

    const ws = this

    this.client = new JavaAdapter(
      WebSocketClient,
      {
        onOpen(handshake) {
          ws.readyState = ChatSocketClient.OPEN
          ws.deleteConnectingMessage()

          chat(`&2&l+&a Connected to&f ${this.uri}`)
          World.playSound('random.levelup', 0.7, 1)

          ws.sendEncoded('AUTH', { key: settings.wsSecret, name: Player.getName(), uuid: Player.getUUID() })
        },
        onMessage(message) {
          const { isAuth, type, value } = ChatSocketClient.decodeMessage(message)
          ws.isAuth = isAuth

          if (settings.wsLogChat) ChatLib.chat(`&2-> &6&l${type}&a ${value}`)
          if (!isAuth && type === 'AUTH') error('WebSocket Error: ' + value, settings.printStackTrace, true)

          if (typeof ws.onmessage === 'function') ws.onmessage(type, value)
        },
        onError(exception) {
          if (settings.wsPrintEx)
            error('WebSocket Exception: ' + exception, settings.printStackTrace, settings.wsAutoconnect)

          ws.deleteConnectingMessage()
          ws.deleteDisconnectingMessage()

          // Force close
          ws.readyState = ChatSocketClient.CLOSED
          ws.client.close()
        },
        onClose(code, reason, remote) {
          ws.readyState = ChatSocketClient.CLOSED
          ws.deleteDisconnectingMessage()

          if (remote) chat(`&4&l-&c Connection closed by&f ${this.uri} &7[&e${code}&7]`)
          else if (code === -1) chat(`&4&l-&c Failed to connect to&f ${this.uri} &7[&e${code}&7]`)
          else chat(`&4&l-&c Disconnected from&f ${this.uri} &7[&e${code}&7]`)

          if (code === -1) {
            if (!settings.wsAutoconnect) World.playSound('random.anvil_land', 0.3, 1)
          } else World.playSound('dig.glass', 0.7, 1)
        },
      },
      this.uri
    )
  }

  static encodeMessage(type, data) {
    if (typeof data !== 'object') data = {}
    return JSON.stringify({ type: type.toUpperCase(), data })
  }

  static decodeMessage(message) {
    let type, data

    try {
      ;({ type, data } = JSON.parse(String(message)))
    } catch (err) {
      // ChatSocket can't do anything with a message if it is not formatted properly
      return { type: 'NONE', data: {} }
    }
    return { type: String(type || 'NONE').toUpperCase(), data: data || {} }
  }

  send(message) {
    if (this.readyState !== ChatSocketClient.OPEN) throw new Error('WebSocket is not in OPEN state.')
    this.client.send(message)
  }

  sendEncoded(type, data) {
    this.send(ChatSocketClient.encodeMessage(type, data))
    if (settings.wsLogChat) ChatLib.chat(`&4<- &6&l${type.toUpperCase()}&c ${value ?? ''}`)
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

    this.printConnectingMessage()
    this.readyState = ChatSocketClient.CONNECTING
    this.client.connect()
  }

  close() {
    if (this.readyState === ChatSocketClient.CLOSING || this.readyState === ChatSocketClient.CLOSED) {
      this.deleteDisconnectingMessage()
      throw new Error('WebSocket is already in CLOSING or CLOSED state.')
    }

    this.printDisconnectingMessage()
    this.readyState = ChatSocketClient.CLOSING
    this.autoconnect = false
    this.client.close()
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
    if (this.hasConnected) this.client.reconnect()
    else this.client.connect()
  }

  printConnectionStatus() {
    chat(
      `&eConnection to&f ${this.uri}&e ● ${
        ['&6&lCONNECTING', '&a&lOPEN', '&c&lCLOSING', '&c&lCLOSED'][this.readyState ?? 3]
      }`
    )
  }

  printConnectingMessage() {
    chat(`&2&l+&a Connecting to&f ${settings.wsURI}&a...`, this.connectingMessageId)
  }

  printDisconnectingMessage() {
    chat(`&4&l-&c Disconnecting from&f ${this.uri}&c...`, this.disconnectingMessageId)
  }

  deleteConnectingMessage() {
    try {
      ChatLib.clearChat(this.connectingMessageId)
    } catch (err) {
      if (settings.wsErr) error(err, settings.printStackTrace)
    }
  }

  deleteDisconnectingMessage() {
    try {
      ChatLib.clearChat(this.disconnectingMessageId)
    } catch (err) {
      if (settings.wsErr) error(err, settings.printStackTrace)
    }
  }
}
