import ChatSocketProtocol from './ChatSocketProtocol.js'
import Utils from './Utils.js'

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

    this.log(`&6+ Connecting to &f&n${this.url}…\n`)
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
    this.log(`&a+ Connected to &f&n${this.url}`)

    this.sendEncoded('AUTH', `Authenticating as ${this.name}`, {
      secret: this.#secret,
      channel: this.channel,
      name: this.name,
      userAgent: window.navigator.userAgent,
    })
  }

  onmessage(event) {
    const { type, message, data } = ChatSocketProtocol.decodeMessage(event.data)
    this.log(`&3-&#x3E; &6&l${type}&b ${message} &8${JSON.stringify(data)}`)
  }

  send(message) {
    super.send(message)
  }

  sendEncoded(type, message, data = {}) {
    this.send(ChatSocketProtocol.encodeMessage(type, message, data))
    this.log(`&a&#x3C;- &6&l${type}&b ${message} &8${JSON.stringify(data)}`)
  }

  onerror(event) {
    console.error('WebSocket error:', event)
  }

  onclose({ code, reason, wasClean }) {
    this.log(`&c- Disconnected from &f&n${this.url}&c &7[&e${code}&7]`)
  }

  log(message) {
    if (this.logElement === null) console.log(Utils.removeMcFormatting(message))
    else {
      const line = Utils.mcToHTML(message)
      line.title = new Date().toLocaleString()
      this.logElement.prepend(document.createElement('br'))
      this.logElement.prepend(line)

      if (this.logElement.children.length > 256) this.logElement.removeChild(this.logElement.lastChild)
    }
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
