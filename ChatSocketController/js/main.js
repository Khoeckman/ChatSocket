import ChatSocketController from './ChatSocketController.js'

const WEBSOCKET_URL = 'ws://localhost:47576' //'wss://chatsocket-a1xp.onrender.com/'
const WEBSOCKET_SECRET = '15f5ccd5987f59418bbc534a02a6e36'

let ws = null
const secretKeyInput = document.getElementById('secret')
const log = document.getElementById('log')

secretKeyInput.addEventListener('input', function () {
  this.value
})

// Autoconnect
setInterval(() => {
  if (ws && (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED)) return
  ws = new ChatSocketController(WEBSOCKET_URL, WEBSOCKET_SECRET, log)
}, 2000)
