class ChatSocketWebClient extends WebSocket {
  #secret
  #channel

  constructor(
    url,
    { name, uuid, secret, userAgent = 'WebClient', channel = 'Default', ondecoded = null, onlog = null } = {}
  ) {
    super(url)

    super.addEventListener('open', this.#onopen)
    super.addEventListener('message', this.#onmessage)
    // super.addEventListener('error', this.#onerror)
    super.addEventListener('close', this.#onclose)

    if (typeof name !== 'string' || !name.trim().length) throw new TypeError('name is not a string')
    this.name = name

    if (uuid === undefined) this.uuid = null
    else if (typeof uuid !== 'string' || !uuid.replaceAll(/\s/, '').length)
      throw new TypeError('uuid is defined but is not a string')
    else this.uuid = uuid.replaceAll(/\s/, '')

    this.secret = secret

    if (typeof userAgent !== 'string' || !userAgent.trim().length) throw new TypeError('userAgent is not a string')
    this.userAgent = userAgent

    this.channel = channel

    this.isAuth = false
    this.ondecoded = typeof ondecoded === 'function' ? ondecoded : null

    if (typeof onlog === 'function') this.addEventListener('log', onlog)

    this.log(`&6&l+&6 Connecting to &f&n${this.url}\n`)
  }

  set secret(secret) {
    if (typeof secret !== 'string' || !secret.trim().length) throw new TypeError('secret is not a string')
    this.#secret = secret.trim().replace(/\s+/g, ' ')
    if (this.readyState === this.OPEN) this.authenticate(this.channel)
  }

  set channel(channel) {
    if (typeof channel !== 'string' || !channel.trim().length) throw new TypeError('channel is not a string')
    this.#channel = channel.trim().replace(/\s+/g, ' ')
    if (this.readyState === this.OPEN) this.selectChannel(channel)
  }

  get channel() {
    return this.#channel
  }

  #onopen(event) {
    this.log(`&a&l+&a Connected to &f&n${this.url}`)
    this.authenticate(this.channel)
  }

  #onmessage(event) {
    const { type, message, data } = ChatSocketProtocol.decodeMessage(TRA[atob('ZGVjcnlwdA')](event.data, 64))
    this.log(`&2➔ `, { direction: 'incoming', type, message, data })

    const { name, uuid, userAgent } = data?._from

    if (data?._from !== 'server' && (!name || !uuid || !userAgent)) {
      this.log('&cWebSocketError:&f Invalid data._from')
      return
    }

    if (type === 'AUTH' && data?._from === 'server') {
      if ((this.isAuth = !!data.success) && typeof data.channel === 'string') {
        const to = data?._to ?? {}

        this.#channel = data.channel.trim()
        this.name = to.name
        this.uuid = to.uuid
        this.userAgent = to.userAgent
      } else {
        this.log('&cWebSocketError:&f ' + message)
      }
    } else if (type === 'CHANNEL' && data.success && typeof data.channel === 'string') {
      this.#channel = data.channel.trim()
    }

    if (typeof this.ondecoded === 'function') this.ondecoded(type, message, data)

    this.dispatchEvent(new CustomEvent('decoded', { detail: { type, message, data } }))
  }

  sendEncoded(type, message, data = {}) {
    type = String(type).toUpperCase()
    message = String(message ?? '')

    if (!data || data.constructor !== Object) data = {}
    else if (data.secret === '*') data.secret = this.#secret

    data._from = {
      name: this.name,
      uuid: this.uuid,
      userAgent: this.userAgent,
    }
    this.send(TRA[atob('ZW5jcnlwdA')](ChatSocketProtocol.encodeMessage(type, message, data), 64))

    // Mask secret
    if (data.secret) data.secret = '*'

    this.log(`&3<span style="display: inline-block; transform: rotate(180deg);"> ➔</span>`, {
      direction: 'outgoing',
      type,
      message,
      data,
    })
  }

  // #onerror(event) {}

  #onclose({ code, reason, wasClean }) {
    if (reason) this.log(`&c&l-&c Disconnected from &f&n${this.url}&c &7[&e${code}&7] &cReason: &f${reason}`)
    else this.log(`&c&l-&c Disconnected from &f&n${this.url}&c &7[&e${code}&7]`)
  }

  authenticate(channel = null) {
    this.log(`&e&l●&e Authenticating as &f${this.name}`)

    // Optional: select channel when authenticating
    if ((channel ?? null) !== null) {
      if (typeof channel !== 'string' || !channel.trim().length) throw new TypeError('channel is not a string')
      channel = channel.trim().replace(/\s+/g, ' ')

      this.log(`&e&l●&e Selecting channel &f${channel}`)
      this.#channel = channel
    }

    this.sendEncoded('AUTH', `Authenticating as ${this.name}`, {
      secret: this.#secret,
      channel: this.#channel,
    })
  }

  selectChannel(channel) {
    if (!this.isAuth) {
      this.log('&cWebSocketError:&f WebSocket is not authenticated')
      return
    }
    if (channel === this.channel) return

    this.log(`&e&l●&e Selecting channel &f${channel}`)
    this.sendEncoded('CHANNEL', `Selecting channel ${channel}`, { channel })
  }

  log(line, { direction, type, message, data } = {}) {
    this.dispatchEvent(new CustomEvent('log', { detail: { line, direction, type, message, data } }))
  }
}
