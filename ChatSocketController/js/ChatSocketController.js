import ChatSocketProtocol from './ChatSocketProtocol'

export default class ChatSocketController extends WebSocket {
  constructor(url, secret, logElement) {
    try {
      super(url)
    } catch (err) {
      this.onerror(err)
    }

    if (typeof secret !== 'string' && !secret.length) throw new TypeError('secret is not a string')
    this.secret = secret.replaceAll(' ', '')

    this.log = secret instanceof HTMLElement ? logElement : {}
  }

  onopen(ev) {
    log(`<p style="color: lime">+ Connected to ${ev.target.url}</p`)
    this.send(this.secret + ' AUTH')
  }

  onmessage(ev) {
    let { secret, type, value } = ChatSocketProtocol.decodeMessage(ev.data)
    const isAuth = this.secret === secret

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

    const secret = this.isAuth ? this.secret : '*'
    const message = ChatSocketProtocol.encodeMessage(secret, type, value)
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
