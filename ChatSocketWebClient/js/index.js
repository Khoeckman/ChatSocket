import ChatSocketWebClient from './ChatSocketWebClient.js'

const chatSocketStatus = document.getElementById('chatSocketStatus')
const chatSocketForm = document.getElementById('chatSocket')

let ws = null
let retryCount = 0

function connect() {
  ws = new ChatSocketWebClient(
    false ? 'ws://legendarygames.dev:47576' : 'ws://localhost:47576',
    {
      name: 'WebClient',
      secret: atob('ZjM3N2RjNDZmZmFlZWRjMGU4NTZlZGM3NDg1NTFkYQ'),
      userAgent: window.navigator.userAgent,
      channel: 'Hypixel',
    },
    document.getElementById('log')
  )

  ws.addEventListener('message', onmessage)

  updateReadyState(ws.readyState)

  const timeout = setTimeout(() => {
    if (ws.readyState === ChatSocketWebClient.CONNECTING) ws.close()
  }, 500 * Math.pow(1.25, retryCount))

  ws.addEventListener('open', () => {
    clearTimeout(timeout)
    retryCount = 0
    updateReadyState(ws.readyState)
  })

  ws.addEventListener('close', () => {
    clearTimeout(timeout)
    updateReadyState(ws.readyState)

    const delay = Math.min(30000, 500 * Math.pow(1.25, retryCount++))
    setTimeout(connect, delay)
  })

  ws.addEventListener('error', () => {
    if (ws.readyState === ChatSocketWebClient.CONNECTING || ws.readyState === ChatSocketWebClient.OPEN) ws.close()
  })

  document.getElementById('logClear').addEventListener('click', () => ws.logClear())
}

connect()

/**
 * Handles incoming WebSocket messages from {@link ChatSocketWebClient}.
 *
 * When registered with `ws.addEventListener("message", onmessage)`,
 * this function is invoked with `this` bound to the active WebSocket
 * client instance.
 *
 * @this {ChatSocketWebClient} The WebSocket client that received the message.
 * @param {string} type - The high-level message type (e.g. "AUTH", "CHAT", "CMD").
 * @param {string} message - The human-readable message string from the server.
 * @param {Object<string, any>} [data={}] - Structured message data payload.
 *
 * @example
 * ws.addEventListener("message", onmessage)
 *
 * function onmessage(type, message, data) {
 *   console.log(this.url, type, message, data)
 * }
 */
function onmessage(type, message, data = {}) {
  switch (type) {
    case 'DEBUG':
    case 'AUTH':
    case 'CHANNEL':
      break
  }
}

function updateReadyState(readyState) {
  const name = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][+readyState ?? 3]
  chatSocketStatus.innerText = name
  chatSocketStatus.dataset.readyState = +readyState ?? 3
  chatSocketForm.dataset.readyState = +readyState ?? 3
}

// Outgoing

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

    ws.sendEncoded(type, message, data)

    form.elements['data'].classList.remove('error')
    form.elements['data'].value = JSON.stringify(data)
  } catch (err) {
    console.error(err)
    form.elements['data'].classList.add('error')
  }
})

chatSocketForm.elements['data'].addEventListener('input', (e) => e.target.classList.remove('error'))

// Hue rotation effect
let hue = 0
let frame = 0

function loop() {
  if (++frame % 5 === 0) {
    document.documentElement.style.setProperty('--hue', hue)
    hue = (hue + 1) % 360
  }
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
