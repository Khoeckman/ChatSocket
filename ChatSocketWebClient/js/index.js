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

  ws.onmessage = onmessage

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
}

connect()

// @this ws
function onmessage(type, message, data = {}) {
  console.log(this, type, message, data)
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
    data = JSON.parse(form.elements['data'].value)
    form.elements['data'].classList.remove('error')
  } catch (err) {
    console.error(err)
    form.elements['data'].classList.add('error')
  }

  ws.sendEncoded(type, message, data)
})

chatSocketForm.elements['data'].addEventListener('input', (e) => e.target.classList.remove('error'))
