import ChatSocketWebClient from './ChatSocketWebClient.js'

const chatSocketStatus = document.getElementById('chatSocketStatus')
const chatSocketForm = document.getElementById('chatSocket')

let ws = null
let retryCount = 0

function connect() {
  if (ws && (ws.readyState === ChatSocketWebClient.CONNECTING || ws.readyState === ChatSocketWebClient.OPEN)) return

  ws = new ChatSocketWebClient(
    false ? 'ws://legendarygames.dev:47576' : 'ws://localhost:47576',
    { name: 'WebClient', secret: atob('ZjM3N2RjNDZmZmFlZWRjMGU4NTZlZGM3NDg1NTFkYQ'), channel: 'Hypixel' },
    document.getElementById('log')
  )

  updateReadyState(ws.readyState)

  ws.addEventListener('open', () => {
    updateReadyState(ws.readyState)
    retryCount = 0
  })

  ws.addEventListener('close', () => {
    updateReadyState(ws.readyState)
    retryCount++
    const delay = Math.min(32000, 1000 * Math.pow(2, retryCount))
    setTimeout(connect, delay)
  })

  ws.addEventListener('error', () => ws.close())
}

connect()

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
  const data = form.elements['data'].value

  ws.sendEncoded(type, message, data)
})
