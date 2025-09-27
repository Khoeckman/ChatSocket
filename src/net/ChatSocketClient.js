import ChatSocketProtocol from './ChatSocketProtocol'
import { randomInt, chat, error, dialog } from '../utils'
import settings from '../vigilance/settings'

const URI = Java.type('java.net.URI')
const WebSocketClient = Java.type('org.java_websocket.client.WebSocketClient')

export default class ChatSocketClient {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  constructor(url) {
    if (typeof url !== 'string') {
      error(new TypeError('url is not a string'), settings.printStackTrace)
      return
    }
    this.url = new URI(url)

    this.isAuth = false
    this.channel = 'Default'
    this.name = Player.getName()
    this.uuid = Player.getUUID()

    this.readyState = ChatSocketClient.CLOSED
    this.autoconnect = true
    this.hasConnected = false

    this.connectingMessageId = randomInt(2 ** 15, 2 ** 31 - 1)
    this.disconnectingMessageId = this.connectingMessageId + 1

    this.onmessage = null

    const ws = this

    this.client = new JavaAdapter(
      WebSocketClient,
      {
        onOpen(handshake) {
          ws.readyState = ChatSocketClient.OPEN
          ws.deleteConnectingMessage()

          chat(`&2&l+&a Connected to&f ${ws.url}`)
          if (!settings.wsAutoconnect) World.playSound('random.levelup', 0.7, 1)

          ws.authenticate()
        },
        onMessage(rawData) {
          const { type, message, data } = ChatSocketProtocol.decodeMessage(rawData)

          if (settings.wsLogChat) ChatLib.chat(`&2-> &6&l${type}&a ${message}`)

          if (type === 'AUTH') {
            if ((ws.isAuth = !!data.success)) {
              if (data.channel) ws.channel = data.channel
              if (data.name) ws.name = data.name
              if (data.uuid) ws.uuid = data.uuid
            } else {
              error('WebSocket Error: ' + message, settings.printStackTrace, true)
            }
          } else if (type === 'CHANNEL' && data.success) {
            if (data.channel) ws.channel = data.channel
            else error('WebSocket Error: Missing channel', settings.printStackTrace, true)
          }

          if (typeof ws.onmessage === 'function') ws.onmessage.call(ws, type, message, data)
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

          ws.isAuth = false
          ws.channel = 'Default'

          if (remote) {
            chat(`&4&l-&c Connection closed by&f ${ws.url} &7[&e${code}&7]`)
            World.playSound('dig.glass', 0.7, 1)
          } else if (code === -1) {
            chat(`&4&l-&c Failed to connect to&f ${ws.url} &7[&e${code}&7]`)
            if (!settings.wsAutoconnect) World.playSound('random.anvil_land', 0.3, 1)
          } else {
            chat(`&4&l-&c Disconnected from&f ${ws.url} &7[&e${code}&7]`)
            if (!settings.wsAutoconnect) World.playSound('dig.glass', 0.7, 1)
          }

          if (remote && reason && typeof reason === 'string' && reason.length) chat('&cReason: &f' + reason)
        },
      },
      this.url
    )
  }

  send(message) {
    if (this.readyState !== ChatSocketClient.OPEN) throw new Error('WebSocket is not in OPEN state')
    this.client.send(message)
  }

  sendEncoded(type, message, data = {}) {
    this.send(ChatSocketProtocol.encodeMessage(type, message, data))
    if (settings.wsLogChat) ChatLib.chat(`&3<- &6&l${type.toUpperCase()}&b ${message}`)
  }

  authenticate() {
    this.sendEncoded('AUTH', `Authenticating as ${this.name}`, {
      secret: settings.wsSecret,
      channel: settings.wsChannel,
      name: this.name,
      uuid: this.uuid,
    })
  }

  selectChannel(channel) {
    if (!this.isAuth) throw new Error('WebSocket is not authenticated')
    if (channel === this.channel) return

    this.sendEncoded('CHANNEL', `Selecting channel ${channel}`, { channel })
    if (!settings.wsLogChat) chat(`&e● Selecting channel ${channel}`)
  }

  connect() {
    if (this.readyState === ChatSocketClient.CONNECTING || this.readyState === ChatSocketClient.OPEN) {
      this.deleteConnectingMessage()
      throw new Error('WebSocket is already in CONNECTING or OPEN state')
    }
    if (this.readyState === ChatSocketClient.CLOSING) {
      this.deleteConnectingMessage()
      throw new Error('WebSocket is still in CLOSING state')
    }

    this.printConnectingMessage()
    this.readyState = ChatSocketClient.CONNECTING
    this.client.connect()
  }

  close() {
    this.autoconnect = false

    if (this.readyState === ChatSocketClient.CLOSING || this.readyState === ChatSocketClient.CLOSED) {
      this.deleteDisconnectingMessage()
      throw new Error('WebSocket is already in CLOSING or CLOSED state')
    }

    this.printDisconnectingMessage()
    this.readyState = ChatSocketClient.CLOSING
    this.client.close()
  }

  reconnect() {
    if (this.readyState === ChatSocketClient.CONNECTING || this.readyState === ChatSocketClient.OPEN) {
      this.deleteConnectingMessage()
      throw new Error('WebSocket is already in CONNECTING or OPEN state')
    }
    if (this.readyState === ChatSocketClient.CLOSING) {
      this.deleteConnectingMessage()
      throw new Error('WebSocket is still in CLOSING state')
    }

    this.readyState = ChatSocketClient.CONNECTING
    if (this.hasConnected) this.client.reconnect()
    else this.client.connect()
  }

  printConnectionStatus() {
    dialog('&eWebSocket status', [
      '&eURL &f ' + this.url,
      '&eStatus &7 ' + ['&6&lCONNECTING', '&a&lOPEN', '&c&lCLOSING', '&c&lCLOSED'][this.readyState ?? 3],
      '&eAuthenticated &7 ' + (this.isAuth ? '&a&lYES' : '&c&lNO'),
      '&eChannel &7 ' + this.channel,
      '&eName &7 ' + this.name,
      '&eUUID &7 ' + this.uuid,
    ])
  }

  printConnectingMessage() {
    chat(`&2&l+&a Connecting to&f ${settings.wsURL}&a...`, this.connectingMessageId)
  }

  printDisconnectingMessage() {
    chat(`&4&l-&c Disconnecting from&f ${this.url}&c...`, this.disconnectingMessageId)
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
