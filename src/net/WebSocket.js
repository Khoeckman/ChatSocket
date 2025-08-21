import { PREFIX, TAB, rng, generateId, chat, error, line, dialog } from '../utils'
import settings from '../vigilance/settings'

const URI = Java.type('java.net.URI')
const WebSocketClient = Java.type('org.java_websocket.client.WebSocketClient')

export default class WebSocket {
  constructor(uri) {
    if (typeof uri !== 'string') return error(new TypeError('uri is not a string'), settings.printStackTrace)
    this.uri = new URI(uri)

    this.onMessage = () => {}
    this.onError = () => {}
    this.onOpen = () => {}
    this.onClose = () => {}

    const thiz = this

    this.socket = new JavaAdapter(
      WebSocketClient,
      {
        onMessage(msg) {
          if (settings.logChat) ChatLib.chat('&7[&ews://&7] &2➡ &a' + msg)
          thiz.onMessage(msg)
        },
        onError(ex) {
          if (settings.logChat) error(ex, settings.printStackTrace)
          thiz.onError(ex)
        },
        onOpen(handshake) {
          if (settings.logChat) ChatLib.chat('&7[&ews://&7] &2✔ &aConnection opened. &f' + thiz.uri.toString())
          thiz.onOpen(handshake)
        },
        onClose(code, reason, remote) {
          if (settings.logChat) ChatLib.chat('&7[&ews://&7] &4✖ &cConnection closed. &f' + thiz.uri.toString())
          thiz.onClose(code, reason, remote)
        },
      },
      this.uri
    )
  }

  send(msg) {
    if (settings.logChat) ChatLib.chat('&7[&ews://&7] &4⬅ &a' + msg)
    this.socket.send(msg)
  }

  connect() {
    this.socket.connect()
  }

  close() {
    this.socket.close()
  }

  reconnect() {
    this.socket.reconnect()
  }
}
