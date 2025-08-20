import './src/utils/console'
import { PREFIX, TAB, rng, generateId, chat, error, line, dialog } from './src/utils'
import settings from './src/utils/settings'
import metadata from './src/utils/metadata'
import WebSocket from './src/net/WebSocket'

try {
  let client = null

  // Command: /cs help
  register('command', (command, ...args) => {
    try {
      if (typeof command !== 'string') command = 'help'
      else command = command.toLowerCase()

      switch (command) {
        case 'settings':
        case 'sett':
          settings.openGUI()
          break

        case 'connection':
        case 'conn':
          dialog('WebSocket connection:', [
            'URI &7 ' + ws.url,
            'Status &7 ' + ['&e&lCONNECTING', '&a&lOPEN', '&c&lCLOSING', '&4&lCLOSED'][ws.readyState],
          ])
          break

        case 'open':
          console.debug('open start', settings.wsURI)
          client = new WebSocket(settings.wsURI)
          console.debug('open end')
          break

        case 'close':
          console.debug('close')
          break

        case 'version':
        case 'ver':
          metadata.printVersionStatus()
          break

        default:
          dialog('Commands:', [
            '&e/cs &6sett&eings &7 Opens the settings GUI.',
            '&e/cs &6conn&eection &7 Prints info about the &fWebSocket&7 connection.',
            '&e/cs open &7 Opens the &fWebSocket&7 connection.',
            '&e/cs close &7 Closes the &fWebSocket&7 connection.',
            '&e/cs &6ver&esion &7 Prints the &aversion&7 status of &6ChatSocket&7.',
            '&e/cs &7 Prints this dialog.',
          ])
          break
      }
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })
    .setName('cs')
    .setAliases('chatsocket')

  // On load success
  chat('&eModule loaded. Type "/cs" for help.')
  metadata.printVersionStatus()
} catch (err) {
  error(err, settings.printStackTrace)
}
