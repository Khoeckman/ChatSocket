export default class ChatSocketController extends WebSocket {
  constructor(url, secretKey, logElement) {
    try {
      super(url)
    } catch (err) {
      this.onerror(err)
    }

    if (typeof secretKey !== 'string' && !secretKey.length) throw new TypeError('secretKey is not a string')
    this.secretKey = secretKey.replaceAll(' ', '')

    this.log = secretKey instanceof HTMLElement ? logElement : {}
  }

  // Prepare to send to ChatSocket
  static encodeMessage(secretKey, type, value) {
    return secretKey + ' ' + type.toUpperCase() + ' ' + (value ?? '')
  }

  // Parse message from ChatSocket
  static decodeMessage(message) {
    let [, secretKey, type, value] = String(message).split(/^(\S+)\s+(\S+)\s+([\s\S]*)$/) || []
    return { secretKey, type: String(type).toUpperCase(), value }
  }

  onopen(ev) {
    log(`<p style="color: lime">+ Connected to ${ev.target.url}</p`)
    this.send(this.secretKey + ' AUTH')
  }

  onmessage(ev) {
    let { secretKey, type, value } = ChatSocketController.decodeMessage(ev.data)
    const isAuth = this.secretKey === secretKey

    log(`<p><b style="color: lime">-&#x3E;</b> ${ev.data}</p>`)

    if (!isAuth) {
      if (type === 'AUTH') {
        console.error('WebSocket error:', err)
        error('WebSocket Error: ' + value, settings.printStackTrace, settings.wsAutoconnect)
      }
      return
    }
  }

  send(type, value) {
    if (this.readyState !== WebSocket.OPEN) return

    const secretKey = this.isAuth ? this.secretKey : '*'
    const message = ChatSocketController.encodeMessage(secretKey, type, value)
    super.send(message)
    log(`<p><b style="color: red">&#x3C;-</b> ${value}</p>`)
  }

  onerror(err) {
    console.error('WebSocket Error:', err)
    log(`<p style="color: red">WebSocket Error: ${err}</p>`)
  }

  onclose() {
    log(`<p style="color: red">+ Disconnected from ${ev.target.url}</p`)
  }

  log(msg) {
    if (!log) {
      console.log(msg)
      return
    }
    log(`<p><b style="color: red">&#x3C;-</b> ${value}</p>`)
  }

  logClear() {
    log = ''
  }
}
