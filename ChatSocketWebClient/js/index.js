import ChatSocketWebClient from './ChatSocketWebClient.js'

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
