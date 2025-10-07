const chatSocketStatus = document.getElementById('chatSocketStatus')
const chatSocketForm = document.getElementById('chatSocket')

function updateReadyState(readyState) {
  const name = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][+readyState ?? 3]
  chatSocketStatus.innerText = name
  chatSocketStatus.dataset.readyState = +readyState ?? 3
  chatSocketForm.dataset.readyState = +readyState ?? 3
}

// WebSocket
let ws = null
let retryCount = 0

function connect() {
  ws = new ChatSocketWebClient(false ? 'ws://legendarygames.dev:47576' : 'ws://localhost:47576', {
    name: 'WebClient',
    secret: atob('ZjM3N2RjNDZmZmFlZWRjMGU4NTZlZGM3NDg1NTFkYQ'),
    userAgent: window.navigator.userAgent,
    channel: 'Hypixel',
    onmessage,
    onlog,
  })

  // {"secret":"f377dc46ffaeedc0e856edc748551da","_from":{"name":"WebClient","uuid":null,"userAgent":"Khoeckman"},"channel":"Hypixel"}

  updateReadyState(ws.readyState)

  const timeout = setTimeout(() => {
    if (ws.readyState === ChatSocketWebClient.CONNECTING) ws.close()
  }, 2000)

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
}

connect()

// Log
function onlog({ detail: { line, type, message, data } }) {
  const logEl = document.getElementById('log')

  if (logEl === null) {
    console.log(Utils.removeMcFormatting(line))
    return
  }
  const lineEl = Utils.mcToHTML(line)
  lineEl.title = new Date().toLocaleString('nl-BE')

  if (typeof type === 'string') {
    lineEl.dataset.json = JSON.stringify({ type, message, data })
    lineEl.style.cursor = 'copy'

    lineEl.addEventListener('click', (e) => {
      const json = lineEl.dataset.json
      if (!json) return

      const { type, message, data } = JSON.parse(json)
      chatSocketForm.elements['type'].value = type
      chatSocketForm.elements['message'].value = message
      chatSocketForm.elements['data'].value = JSON.stringify(data)
    })
  }

  logEl.prepend(document.createElement('br'))
  logEl.prepend(lineEl)

  if (logEl.children.length > 1024) logEl.removeChild(logEl.lastChild)
}

// Form
const messageBytes = document.querySelector('.message .bytes')
const dataBytes = document.querySelector('.data .bytes')

const updateBytes = (el, value) => (el.innerText = `(${new TextEncoder().encode(value).byteLength} B)`)

updateBytes(messageBytes, chatSocketForm.elements['message'].value)
updateBytes(dataBytes, chatSocketForm.elements['data'].value)

chatSocketForm.elements['message'].addEventListener('input', (e) => {
  updateBytes(messageBytes, e.target.value)
})

chatSocketForm.elements['data'].addEventListener('input', (e) => {
  e.target.classList.remove('error')
  updateBytes(dataBytes, e.target.value)
})

chatSocketForm.addEventListener('submit', (e) => {
  e.preventDefault()

  if (!ws || ws.readyState !== ChatSocketWebClient.OPEN) return

  const form = e.target
  const type = form.elements['type'].value
  const message = form.elements['message'].value
  let data = {}

  try {
    data = JSON.parse(form.elements['data'].value || '{}')
    if (!data || data.constructor !== Object) data = {}

    form.elements['data'].classList.remove('error')
    form.elements['data'].value = JSON.stringify(data)

    ws.sendEncoded(type, message, data)
  } catch (err) {
    console.error(err)
    form.elements['data'].classList.add('error')
  }
})

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
