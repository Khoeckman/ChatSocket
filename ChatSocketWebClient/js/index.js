// Theres no need to modify this file, instead look into app.js

console.log(
  '%cChatSocket%c\nConfigure and open a WebSocket connection to send and receive ChatTrigger events in real-time.%c\nwss://chatsocket-a1xp.onrender.com',
  'color: #fff; background: #f9ba1a; border-radius: 4px; font-size: 24px; font-weight: bold; color: #000; padding: 4px 16px;',
  'font-size: 14px; color: #999; margin-top: 8px;',
  'font-size: 14px; color: #999;'
)

// WebSocket
let ws = null
let retryCount = 0

window.onload = connect

function connect(reconnect = false) {
  const settings = localStorageSettings.value

  if (!reconnect && ws && ws.readyState === ws.OPEN) return

  ws?.close()

  ws = new ChatSocketWebClient(settings.url, {
    name: settings.name,
    secret: settings.secret,
    userAgent: window.navigator.userAgent,
    channel: settings.channel ?? 'Default',
    onlog,
  })

  // Custom field for easy access
  ws.settings = settings

  // Custom logic
  new MinecraftApp(ws)

  updateReadyState(ws.readyState)

  const timeout = setTimeout(() => {
    if (ws.readyState === ChatSocketWebClient.CONNECTING) ws.close()
  }, 5000)

  ws.addEventListener('open', () => {
    clearTimeout(timeout)
    retryCount = 0
    updateReadyState(ws.readyState)
  })

  ws.addEventListener('close', () => {
    clearTimeout(timeout)
    updateReadyState(ws.readyState)
    setTimeout(connect, Math.min(30000, 2000 * Math.pow(1.25, retryCount++)))
  })

  ws.addEventListener('error', () => {
    clearTimeout(timeout)
  })
}

// Log
function onlog({ detail: { line, direction, type, message, data } }) {
  let maskedData = { ...data }
  if (!this.settings.logFromField) delete maskedData?._from

  const logEl = document.getElementById('log')

  if (logEl === null) {
    line += `${type} ${message} \t${JSON.stringify(maskedData)}`
    console.log(Utils.removeMcFormatting(line))
    return
  }

  if (typeof type === 'string') {
    line += `&6&l${type}${direction === 'incoming' ? '&a' : '&b'} ${Utils.shortenInnerHTML(message, 128)}`

    if (localStorageSettings.value)
      line += ` \t&7${JSON.stringify(maskedData, (_, value) => (typeof value === 'string' ? value + '&7' : value))}`
  }

  const lineEl = Utils.mcToHTML(line)
  lineEl.title = new Date().toLocaleString('nl-BE')

  if (typeof type === 'string') {
    lineEl.dataset.json = JSON.stringify({ type, message, data })
    lineEl.style.cursor = 'copy'

    lineEl.addEventListener('click', () => {
      const json = lineEl.dataset.json
      if (!json) return

      const { type, message, data } = JSON.parse(json)

      // If `type` is an option of <select> `chatSocketForm.fields.type`
      if ([...chatSocketForm.fields.type.querySelectorAll('option')].some((option) => option.textContent === type)) {
        chatSocketForm.fields.type.value = type
      }
      chatSocketForm.fields.message.value = message
      chatSocketForm.fields.data.value = JSON.stringify(data)
    })
  }

  logEl.prepend(document.createElement('br'))
  logEl.prepend(lineEl)

  // Remove both `lineEl` and <br>
  if (logEl.children.length > 256 * 2) {
    logEl.removeChild(logEl.lastChild)
    logEl.removeChild(logEl.lastChild)
  }
}

const chatSocketStatus = document.getElementById('chatSocketStatus')

function updateReadyState(readyState) {
  const name = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][+readyState ?? 3]
  chatSocketStatus.innerText = name
  chatSocketStatus.dataset.readyState = +readyState ?? 3
  chatSocketForm.dataset.readyState = +readyState ?? 3
}

// Falling chars animation
const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

new FallingChars(document.getElementById('falling-chars'), chars, '', {
  spawnDensityPerSecond: 15,
})

// Hue rotation effect
/* let hue = 40
let frame = 0

function loop() {
  if (++frame % 8 === 0) {
    document.documentElement.style.setProperty('--hue', hue)
    hue = (hue + 1) % 360
  }
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop) */
