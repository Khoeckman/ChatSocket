/**
 * Hook for handling incoming ChatSocket messages.
 *
 * Usage:
 * 1. Add 'ChatSocket' to the 'requires' array in your module.
 * 2. Override this function in your module to implement custom behavior.
 */
global.ChatSocket_onReceive = function receive(type, value, settings) {
  const ws = this

  switch (type) {
    case 'AUTH':
      break
    case 'CHAT':
      if (!settings.wsLogChat) ChatLib.chat(value)
      break
  }
}
