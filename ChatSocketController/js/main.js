import ChatSocketController from './ChatSocketController.js'

let ws = null

// Autoconnect
setInterval(() => {
  if (ws && (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED)) return
  ws = new ChatSocketController('ws://localhost:47576', '2721c210b42f652f56f6f95c156f2b5b')
}, 2000)
