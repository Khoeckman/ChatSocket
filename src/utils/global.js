import { chat } from './'

/**
 * Hook for handling incoming ChatSocket messages.
 *
 * Usage:
 * 1. Add 'ChatSocket' to the 'requires' array in your module.
 * 2. Override this function in your module to implement custom behavior.
 */
global.ChatSocket_onReceive = function onReceive(type, value) {
  chat('type: ' + type)
  switch (type) {
    case 'AUTH':
      break
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
      if (settings.wsErr) error('WebSocket Error: Unknown type: ' + type, settings.printStackTrace, settings.wsAutoconnect)
      break
  }
}
