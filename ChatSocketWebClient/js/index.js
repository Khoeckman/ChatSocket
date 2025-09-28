import ChatSocketWebClient from './ChatSocketWebClient.js'

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

  ws.addEventListener('open', () => {
    chatSocketForm.dataset.readystate = ws.readyState
    retryCount = 0
  })

  ws.addEventListener('close', () => {
    chatSocketForm.dataset.readystate = ws.readyState
    retryCount++
    const delay = Math.min(32000, 1000 * Math.pow(2, retryCount))
    setTimeout(connect, delay)
  })

  ws.addEventListener('error', () => ws.close())
}

connect()

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
