import ChatSocketWebClient from './ChatSocketWebClient.js'

// WebSocket
let ws = null

// Autoconnect
setInterval(() => {
  if (ws && (ws.readyState === ChatSocketWebClient.CONNECTING || ws.readyState === ChatSocketWebClient.OPEN)) return

  ws = new ChatSocketWebClient(
    false ? 'ws://legendarygames.dev:47576' : 'ws://localhost:47576',
    { name: 'WebClient', secret: atob('ZjM3N2RjNDZmZmFlZWRjMGU4NTZlZGM3NDg1NTFkYQ'), channel: 'Hypixel' },
    document.getElementById('log')
  )
}, 2000)

// Outgoing
const ChatSocketForm = document.getElementById('ChatSocket')

ChatSocketForm.addEventListener('submit', (e) => {
  e.preventDefault()

  if (!ws || ws.readyState !== ChatSocketWebClient.OPEN) return

  const form = e.target
  const type = form.elements['type'].value
  const message = form.elements['message'].value
  const data = form.elements['data'].value

  ws.sendEncoded(type, message, data)
})
