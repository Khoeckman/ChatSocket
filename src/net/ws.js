import { PREFIX, TAB, rng, generateId, chat, error, line, dialog } from './'
import settings from '../settings'
import WebSocket from './WebSocket'
import ChatSocketClient from './ChatSocketClient'

/*settings.wsURI || */
export let ws = new WebSocket('ws://localhost:47576')

ws.onMessage = msg => {
  chat('Message: ' + msg)
}

ws.onError = exception => {
  chat('Error: ' + exception)
}

ws.onOpen = () => {
  chat('Socket Opened')
  ws.send('Hello Server!')
}

ws.onClose = () => {
  chat('Socket Closed')
}

ws.connect()

/**
 * Connects (or reconnects) the WebSocket to the given URI
 */
/* export function openSocket(newURI) {
  // Close old socket if open
  if (ws) {
    try {
      ws.close()
    } catch (err) {
      error('Error closing old socket: ' + err, settings.checkLatestVersion)
    }
    ws = null
  }

  const wsURI = newURI || settings.wsURI || 'ws://localhost:8080'
  ws = new WebSocket(wsURI)

  ws.onMessage = msg => {
    if (msg.startsWith('/')) {
      ChatLib.command(msg.substring(1), true)
    } else {
      ChatLib.say(msg)
    }
  }

  ws.onError = exception => {
    error('WebSocket error: ' + exception, settings.checkLatestVersion)
  }

  ws.onOpen = () => {
    chat('Connected to ' + wsURI)
  }

  ws.onClose = () => {
    chat('Disconnected from ' + wsURI)
  }

  ws.connect()
}

// === CHAT LISTENER ===
register('chat', event => {
  const message = ChatLib.getChatMessage(event, false)

  if (PREFIX_REGEX.test(message)) {
    if (ws && ws.isOpen()) {
      ws.send(message)
    } else {
      Cerror(new Error('Not connected to WebSocket.'), settings.checkLatestVersion)
    }
  }
})
 */
