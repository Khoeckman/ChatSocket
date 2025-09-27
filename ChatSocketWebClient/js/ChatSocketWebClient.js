import ChatSocketProtocol from './ChatSocketProtocol.js'

export default class ChatSocketWebClient extends WebSocket {
  #name
  #uuid
  #secret
  #channel
  #logElement

  constructor(url, { name, uuid, secret, channel = 'Default' } = {}, logElement = null) {
    super(url)

    super.onopen = this.onopen
    super.onmessage = this.onmessage
    super.onerror = this.onerror
    super.onclose = this.onclose

    this.name = name
    this.uuid = uuid
    this.secret = secret
    this.channel = channel
    this.logElement = logElement

    this.log(`<p style="color: orange">+ Connecting to <a href="javascript:void(0)">${this.url}</a>…</p>`)
  }

  set name(name) {
    if (typeof name !== 'string' || !name.trim().length) this.#name = 'WebClient'
    else this.#name = name
  }

  get name() {
    return this.#name
  }

  set uuid(uuid) {
    if (typeof uuid !== 'string' || !uuid.trim().length) this.#uuid = null
    else this.#uuid = uuid.replaceAll(' ', '')
  }

  get uuid() {
    return this.#uuid
  }

  set secret(secret) {
    if (typeof secret !== 'string' || !secret.trim().length) throw new TypeError('secret is not a string')
    this.#secret = secret.replaceAll(' ', '')
  }

  set channel(channel) {
    if (typeof channel !== 'string' || !channel.trim().length) throw new TypeError('channel is not a string')
    this.#channel = channel
  }

  get channel() {
    return this.#channel
  }

  set logElement(logElement) {
    if (!(logElement instanceof HTMLElement)) this.#logElement = null
    else this.#logElement = logElement
  }

  get logElement() {
    return this.#logElement
  }

  onopen(event) {
    this.log(`<p style="color: lime">+ Connected to <a href="javascript:void()">${this.url}</a></p>`)

    this.sendEncoded('AUTH', `Authenticating as ${this.name}`, {
      secret: this.#secret,
      channel: this.channel,
      name: this.name,
    })
  }

  // onmessage(event) {
  //   const { type, message, data } = ChatSocketProtocol.decodeMessage(event.data)
  //   this.log(`<p style="color: aqua"><strong>-&#x3E;</strong> ${type} ${message} ${JSON.stringify(data)}</p>`)
  // }

  // send(message) {
  //   super.send(message)
  // }

  sendEncoded(type, message, data = {}) {
    this.send(ChatSocketProtocol.encodeMessage(type, message, data))
    this.log(`<p style="color: lime"><strong>&#x3C;-</strong> ${type} ${message} ${JSON.stringify(data)}</p>`)
  }

  // onerror(event) {
  //   console.error('WebSocket Error:', event)
  //   this.log(`<p style="color: red">WebSocket Error: ${event}</p>`)
  // }

  // onclose({ code, reason, wasClean }) {
  //   this.log(`<p style="color: red">- Disconnected from ${this.url} [${code}]</p>`)
  // }

  log(html) {
    // Create a wrapper element for `html` so it is always an HTMLElement
    const el = document.createElement('div')
    el.title = new Date().toLocaleString()
    el.innerHTML = html

    if (this.logElement === null) console.log(el.textContent)
    else this.logElement.innerHTML += el.innerHTML
  }

  logClear() {
    if (this.logElement !== null) this.logElement.innerHTML = ''
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
}
