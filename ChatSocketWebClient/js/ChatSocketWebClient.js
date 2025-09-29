import ChatSocketProtocol from './ChatSocketProtocol.js'
import Utils from './Utils.js'

export default class ChatSocketWebClient extends WebSocket {
  #secret
  #channel
  #logElement

  constructor(url, { name, uuid, secret, userAgent = 'WebClient', channel = 'Default' } = {}, logElement = null) {
    super(url)

    super.addEventListener('open', this.#onopen)
    super.addEventListener('message', this.#onmessage)
    super.addEventListener('error', this.#onerror)
    super.addEventListener('close', this.#onclose)

    if (typeof name !== 'string' || !name.trim().length) throw new TypeError('name is not a string')
    this.name = name

    if (uuid === undefined) this.uuid = null
    else if (typeof uuid !== 'string' || !uuid.replaceAll(/\s/, '').length)
      throw new TypeError('uuid is defined but is not a string')
    else this.uuid = uuid.replaceAll(/\s/, '')

    this.#secret = secret

    if (typeof userAgent !== 'string' || !userAgent.trim().length) throw new TypeError('userAgent is not a string')
    this.userAgent = userAgent

    this.channel = channel
    this.logElement = logElement

    this.isAuth = false
    this.onmessage = null

    this.log(`&6&l+&6 Connecting to &f&n${this.url}&6…`)
  }

  set secret(secret) {
    if (typeof secret !== 'string' || !secret.trim().length) throw new TypeError('secret is not a string')
    this.#secret = secret.trim()
    if (this.readyState === this.OPEN) this.authenticate(this.channel)
  }

  set channel(channel) {
    if (typeof channel !== 'string' || !channel.trim().length) throw new TypeError('channel is not a string')
    if (this.readyState === this.OPEN) this.selectChannel(channel)
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

  #onopen(event) {
    this.log(`&a&l+&a Connected to &f&n${this.url}`)
    this.authenticate(this.channel)
  }

  #onmessage(event) {
    const { type, message, data } = ChatSocketProtocol.decodeMessage(event.data)
    this.log(`&3➔ &6&l${type}&b ${message} &8${JSON.stringify(data)}`)

    if (type === 'AUTH') {
      if ((this.isAuth = !!data.success)) {
        if (data.channel) this.#channel = data.channel
        if (data.name) this.name = data.name
        if (data.uuid) this.uuid = data.uuid
      } else {
        throw new Error('WebSocket Error: ' + message)
      }
    } else if (type === 'CHANNEL' && data.success) {
      if (data.channel) this.#channel = data.channel
      else throw new Error('WebSocket Error: Missing channel')
    }
  }

  send(message) {
    super.send(message)
  }

  sendEncoded(type, message, data = {}) {
    this.send(ChatSocketProtocol.encodeMessage(type, message, data))
    if (!data || data.constructor !== Object) data = {}

    // Do not log the secret
    if (data.secret) data.secret = '*'
    this.log(`&a<span style="transform: rotate(180deg);">➔</span> &6&l${type}&b ${message} &8${JSON.stringify(data)}`)
  }

  #onerror(event) {
    console.error('WebSocket error:', event)
  }

  #onclose({ code, reason, wasClean }) {
    this.log(`&c&l-&c Disconnected from &f&n${this.url}&c &7[&e${code}&7]`)
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
    if (this.logElement === null) return

    this.logElement.innerHTML = '<button id="logClear" aria-label="Clear log">Clear</button>'
    document.getElementById('logClear').addEventListener('click', () => this.logClear())
  }

  authenticate(channel = null) {
    this.log(`&e&l●&e Authenticating as &f${this.name}`)

    if (typeof channel === 'string') {
      this.log(`&e&l●&e Selecting channel &f${channel}`)
      this.#channel = channel
    } else {
      this.log(`&c&l●&c Cannot select channel &f${channel}`)
    }

    this.sendEncoded('AUTH', `Authenticating as ${this.name}`, {
      secret: this.#secret,
      channel: this.#channel,
      name: this.name,
      uuid: this.uuid,
      userAgent: this.userAgent,
    })
  }

  selectChannel(channel) {
    if (!this.isAuth) throw new Error('WebSocket is not authenticated')
    if (channel === this.channel) return

    this.log(`&e&l●&e Selecting channel &f${channel}`)
    this.sendEncoded('CHANNEL', `Selecting channel ${channel}`, { channel })
  }
}
