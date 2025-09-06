import ChatSocketController from './ChatSocketController.js'

const WEBSOCKET_SERVER_URL = 'wss://chatsocket-a1xp.onrender.com/'
const WEBSOCKET_SECRET_KEY = '2721c210b42f652f56f6f95c156f2b5b'

let ws = null
const secretKeyInput = document.getElementById('secretKey')
const log = document.getElementById('log')

secretKeyInput.addEventListener('input', function () {
  this.value
})

// Autoconnect
setInterval(() => {
  if (ws && (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED)) return
  ws = new ChatSocketController(WEBSOCKET_URL, SECRET_KEY, log)
}, 2000)
