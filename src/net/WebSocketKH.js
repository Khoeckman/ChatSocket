const URI = Java.type('java.net.URI')
const WebSocketClient = Java.type('org.java_websocket.client.WebSocketClient')

export default class WebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  constructor(url) {
    this.url = url

    // Browser-like event handlers
    this.onopen = null
    this.onmessage = null
    this.onerror = null
    this.onclose = null

    this.readyState = WebSocket.CONNECTING

    this.socket = new JavaAdapter(
      WebSocketClient,
      {
        onOpen: handshake => {
          this.readyState = WebSocket.OPEN
          if (typeof this.onopen === 'function') this.onopen({ type: 'open', handshake })
        },
        onMessage: message => {
          if (typeof this.onmessage === 'function') this.onmessage({ type: 'message', data: message })
        },
        onError: exception => {
          if (typeof this.onerror === 'function') this.onerror({ type: 'error', error: exception })
        },
        onClose: (code, reason, remote) => {
          this.readyState = WebSocket.CLOSED
          if (typeof this.onclose === 'function') this.onclose({ type: 'close', code, reason, remote })
        },
      },
      new URI(this.url)
    )

    this.socket.connect()
  }

  send(data) {
    if (this.readyState === WebSocket.CONNECTING) throw new Error("Failed to execute 'send' on 'WebSocket': Still in CONNECTING state.")
    if (this.readyState === WebSocket.CLOSING || this.readyState === WebSocket.CLOSED)
      throw new Error('WebSocket is already in CLOSING or CLOSED state.')

    this.socket.send(String(data))
  }

  close() {
    if (this.readyState === WebSocket.CLOSING || this.readyState === WebSocket.CLOSED)
      throw new Error('WebSocket is already in CLOSING or CLOSED state.')

    this.readyState = WebSocket.CLOSING
    this.socket.close()
  }
}
