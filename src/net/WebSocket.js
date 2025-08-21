import settings from '../Vigilance/settings'

const URI = Java.type('java.net.URI')
const WebSocketClient = Java.type('org.java_websocket.client.WebSocketClient')

export default class WebSocket {
  constructor(uri) {
    if (typeof url !== 'string') return error(new TypeError('url is not a string'), settings.printStackTrace)
    this.uri = new URI(this.uri)

    this.onMessage = () => {}
    this.onError = () => {}
    this.onOpen = () => {}
    this.onClose = () => {}

    const _this = this

    this.socket = new JavaAdapter(
      WebSocketClient,
      {
        onMessage(msg) {
          if (settings.logChat) ChatLib.chat('&7[&ews://&7] &2➡&a' + msg)
          _this.onMessage(msg)
        },
        onError(ex) {
          if (settings.logChat) error(ex, settings.printStackTrace)
          _this.onError(ex)
        },
        onOpen(handshake) {
          if (settings.logChat) ChatLib.chat('&7[&ews://&7] &2✔ &aConnection opened. ' + _this.uri.toString())
          _this.onOpen(handshake)
        },
        onClose(code, reason, remote) {
          if (settings.logChat) ChatLib.chat('&7[&ews://&7] &4✖ &cConnection closed. ' + _this.uri.toString())
          _this.onClose(code, reason, remote)
        },
      },
      this.uri
    )
  }

  send(msg) {
    if (settings.logChat) ChatLib.chat('&7[&ews://&7] &4⬅&a' + msg)
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
