import { chat, error } from './'

/**
 * Hook for handling incoming ChatSocket messages.
 *
 * Usage:
 * 1. Add 'ChatSocket' to the 'requires' array in your module.
 * 2. Override this function in your module to implement custom behavior.
 */
global.ChatSocket_onWebSocketReceive = function (type, value, settings) {
  switch (type) {
    case 'AUTH':
      break
    case 'CONNECT':
      Client.connect(value)
    case 'DISCONNECT':
      Client.disconnect()
    case 'CHAT':
      if (!settings.wsLogChat) ChatLib.chat(value)
      break
    case 'SAY':
      ChatLib.say(value)
      break
    case 'CMD':
      ChatLib.command(value)
      break
    default:
      error(`WebSocket Error: Unsupported message type '${type}'`, settings.printStackTrace, true)
      break
  }
}
