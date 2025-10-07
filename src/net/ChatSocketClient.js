/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />

import ChatSocketProtocol from './ChatSocketProtocol'
import { randomInt, chat, error, dialog } from '../utils'
import settings from '../vigilance/Settings'

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
    this.url = new URI(url.trim())

    this.isAuth = false
    this.channel = 'Default'
    this.name = settings.wsName.trim() ? settings.wsName.trim() : Player.getName()
    this.uuid = Player.getUUID()
    this.userAgent = 'Minecraft ' + Client.getVersion()

    this.readyState = ChatSocketClient.CLOSED
    this.autoconnect = true
    this.hasConnected = false

    this.connectingMessageId = randomInt(2 ** 15, 2 ** 31 - 2)
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

          const { name, uuid, userAgent } = data?._from

          if (data?._from !== 'server' && (!name || !uuid || !userAgent)) {
            error('WebSocketError:&f Invalid data._from', settings.printStackTrace, settings.wsAutoconnect)
            return
          }

          if (type === 'AUTH' && data?._from === 'server') {
            if ((ws.isAuth = !!data.success) && typeof data.channel === 'string') {
              const to = data?._to ?? {}

              ws.channel = data.channel.trim()
              ws.name = to.name
              ws.uuid = to.uuid
              ws.userAgent = to.userAgent
            } else {
              error('WebSocketError:&f ' + message, settings.printStackTrace, settings.wsAutoconnect)
            }
          } else if (type === 'CHANNEL' && data.success && typeof data.channel === 'string') {
            ws.channel = data.channel.trim()
          }

          if (typeof ws.onmessage === 'function') ws.onmessage.call(ws, type, message, data)
        },
        onError(exception) {
          if (settings.wsPrintEx)
            error('WebSocket Exception:&f ' + exception, settings.printStackTrace, settings.wsAutoconnect)

          ws.deleteConnectingMessage()
          ws.deleteDisconnectingMessage()
        },
        onClose(code, reason, remote) {
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

          if (ws.readyState !== ChatSocketClient.CLOSED) ws.readyState = ChatSocketClient.CLOSED
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
    if (!data || data.constructor !== Object) data = {}

    data._from = {
      name: this.name,
      uuid: this.uuid,
      userAgent: this.userAgent,
    }
    this.send(ChatSocketProtocol.encodeMessage(type, message, data))
    if (settings.wsLogChat) ChatLib.chat(`&3<- &6&l${type.toUpperCase()}&b ${message}`)
  }

  authenticate() {
    chat(`&e● Authenticating as &f${this.name}`)
    chat(`&e● Selecting channel &f${settings.wsChannel}`)

    this.sendEncoded('AUTH', `Authenticating as ${this.name}`, {
      secret: settings.wsSecret.trim(),
      channel: settings.wsChannel.trim(),
    })
  }

  selectChannel(channel) {
    if (typeof channel !== 'string') throw new TypeError('channel is not a string')
    if (!this.isAuth) throw new Error('WebSocket is not authenticated')

    channel = channel.trim()
    if (channel === this.channel) return

    chat(`&e● Selecting channel &f${channel}`)
    this.sendEncoded('CHANNEL', `Selecting channel ${channel}`, { channel })
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
    dialog('&eWebSocket connection', [
      '&eURL &f ' + this.url,
      '&eStatus &7 ' + ['&6&lCONNECTING', '&a&lOPEN', '&c&lCLOSING', '&c&lCLOSED'][this.readyState ?? 3],
      '&eAuthenticated &7 ' + (this.isAuth ? '&a&lYES' : '&c&lNO'),
      '&eChannel &7 ' + this.channel,
      '&eName &7 ' + this.name,
      '&eUUID &7 ' + this.uuid,
      '&eUser Agent &7 ' + this.userAgent,
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
