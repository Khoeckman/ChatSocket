import { TAB, randomInt, chat, error } from '../utils'
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

    // Overrideable function
    this.onReceive = null

    const ws = this

    this.client = new JavaAdapter(
      WebSocketClient,
      {
        onOpen(handshake) {
          ws.readyState = ChatSocketClient.OPEN
          ws.deleteConnectingMessage()

          if (settings.wsLogChat) chat(`&2&l+&a Connected to &f${this.uri}`)
          World.playSound('random.levelup', 0.7, 1)

          ws.sendEncoded('AUTH')
        },
        onMessage(message) {
          const { secretKey, type, value } = ChatSocketClient.decodeMessage(message)
          const localSecretKey = settings.wsSecret.replaceAll(' ', '')
          const isAuth = localSecretKey === secretKey

          if (!isAuth) {
            if (settings.wsErr)
              error(
                new Message(
                  "WebSocket Error: Secret keys don't match",
                  `\n&e${TAB}Remote &4● `,
                  new TextComponent('&7[&cHover to view&7]').setHoverValue('&c' + secretKey),
                  `\n&e${TAB}Local &2● `,
                  new TextComponent('&7[&aHover to view&7]').setHoverValue('&a' + localSecretKey)
                ),
                settings.printStackTrace,
                settings.wsAutoconnect
              )
            return
          }

          if (settings.wsLogChat) ChatLib.chat(`&2-> &6&l${type}&a ${value}`)
          if (typeof ws.onReceive === 'function') ws.onReceive(ws, type, value)
        },
        onError(exception) {
          if (settings.wsErr) error('WebSocket Error: ' + exception, settings.printStackTrace, settings.wsAutoconnect)

          ws.deleteConnectingMessage()
          ws.deleteDisconnectingMessage()

          // Force close
          ws.readyState = ChatSocketClient.CLOSED
          ws.client.close()
        },
        onClose(code, reason, remote) {
          ws.readyState = ChatSocketClient.CLOSED
          ws.deleteDisconnectingMessage()

          if (settings.wsLogChat) {
            if (remote) chat(`&4&l-&c Connection closed by &f${this.uri} &7[&e${code}&7]`)
            else if (code === -1) chat(`&4&l-&c Failed to connect to &f${this.uri} &7[&e${code}&7]`)
            else chat(`&4&l-&c Disconnected from &f${this.uri} &7[&e${code}&7]`)
          }

          if (code === -1) {
            if (!settings.wsAutoconnect) World.playSound('random.anvil_land', 0.3, 1)
          } else World.playSound('dig.glass', 0.7, 1)
        },
      },
      this.uri
    )
  }

  static encodeMessage(secretKey, type, value) {
    return String(secretKey || '').replaceAll(' ', '') + ' ' + type.toUpperCase() + ' ' + (value ?? '')
  }

  static decodeMessage(message) {
    let [, secretKey, type, value] = String(message).split(/^(\S+)\s+(\S+)\s+([\s\S]*)$/) || []
    return { secretKey, type: type.toUpperCase(), value }
  }

  send(message) {
    if (this.readyState !== ChatSocketClient.OPEN) throw new Error('WebSocket is not in OPEN state.')
    this.client.send(message)
  }

  /**
   * Sends an encoded message over the WebSocket, including the secret key and a type.
   *
   * @param {string} type - The type/category of the message (e.g. "CHAT", "COMMAND").
   * @param {string} value - The message content.
   * @throws {Error} Throws if the WebSocket is not in the OPEN state.
   */
  sendEncoded(type, value) {
    if (this.readyState !== ChatSocketClient.OPEN) throw new Error('WebSocket is not in OPEN state.')

    this.client.send(ChatSocketClient.encodeMessage(settings.wsSecret, type, value))
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
    this.client.close()
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
    if (this.hasConnected) this.client.reconnect()
    else this.client.connect()
  }

  printConnectionStatus() {
    chat(`&eConnection to &f${this.uri}&e ● ${['&6&lCONNECTING', '&a&lOPEN', '&c&lCLOSING', '&c&lCLOSED'][this.readyState ?? 3]}`)
  }

  printConnectingMessage() {
    chat(`&2&l+&a Connecting to &f${settings.wsURI}&a...`, this.connectingMessageId)
  }

  printDisconnectingMessage() {
    chat(`&4&l-&c Disconnecting from &f${this.uri}&c...`, this.disconnectingMessageId)
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
