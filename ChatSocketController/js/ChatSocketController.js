export default class ChatSocketController extends WebSocket {
  constructor(url, secretKey, logElement) {
    super(url)

    // Todo: validate
    console.log(this.url)
    this.secretKey = secretKey.replaceAll(' ', '')
    this.log = logElement
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
    log.innerHTML += `<p style="color: lime">+ Connected to ${ev.target.url}</p`
    this.send(this.secretKey + ' AUTH')
  }

  onmessage(ev) {
    let { secretKey, type, value } = ChatSocketController.decodeMessage(ev.data)
    const isAuth = this.secretKey === secretKey

    log.innerHTML += `<p><b style="color: lime">-&#x3E;</b> ${ev.data}</p>`

    if (!isAuth) {
      if (type === 'AUTH') {
        console.error('WebSocket error:', err)
        error('WebSocket Error: ' + value, settings.printStackTrace, settings.wsAutoconnect)
      }
      return
    }

    if (typeof ws.onReceive === 'function') ws.onReceive(type, value, settings)
  }

  send(type, value) {
    if (this.readyState !== WebSocket.OPEN) return

    const secretKey = this.isAuth ? this.secretKey : '*'
    const message = ChatSocketController.encodeMessage(secretKey, type, value)
    super.send(message)
    log.innerHTML += `<p><b style="color: red">&#x3C;-</b> ${value}</p>`
  }

  onerror(err) {
    console.error('WebSocket error:', err)
    log.innerHTML += `<p style="color: red">WebSocket Error: ${err}</p>`
  }

  onclose() {
    log.innerHTML += `<p style="color: red">+ Disconnected from ${ev.target.url}</p`
  }

  logClear() {
    log = ''
  }
}
