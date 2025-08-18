import WebSocket from 'WebSocket'

let ws = new WebSocket('ws://localhost:8080')

ws.onMessage = msg => {
  console.log('Message: ' + msg)
}

ws.onError = exception => {
  console.log('Error: ' + exception)
}

ws.onOpen = () => {
  console.log('Socket Opened')
  ws.send('Hello Server!')
}

ws.onClose = () => {
  console.log('Socket Closed')
}

ws.connect()
