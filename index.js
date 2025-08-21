import { PREFIX, TAB, rng, generateId, chat, error, line, dialog } from './src/utils'
import settings from './src/vigilance/settings'
import metadata from './src/utils/metadata'
import WebSocket from './src/net/WebSocket'

try {
  let client = null

  register('command', (command, ...args) => {
    try {
      if (typeof command !== 'string') command = ''
      else command = command.toLowerCase()

      switch (command) {
        case '':
        case 'help':
          dialog('Commands', [
            '&e/cs &6sett&eings &7 Opens the settings GUI.',
            '&e/cs &6sett&eings load &7 Loads the config.toml&7 data into settings.',
            '&e/cs &6conn&eection &7 Prints info about the &fWebSocket&7 connection.',
            '&e/cs open &7 Opens the &fWebSocket&7 connection.',
            '&e/cs close &7 Closes the &fWebSocket&7 connection.',
            '&e/cs &6ver&esion &7 Prints the &aversion&7 status of &6ChatSocket&7.',
            '&e/cs &7 Prints this dialog.',
          ])
          break

        case 'settings':
        case 'sett':
          if (args && Array.isArray(args)) {
            if (args[0] === 'load') settings.config.loadData()
            break
          }
          settings.openGUI()
          break

        case 'connection':
        case 'conn':
          if (!client) {
            chat('&cNo connection')
            break
          }
          dialog('WebSocket connection:', [
            'URI &7 ' + client.uri,
            // 'Status &7 ' + ['&e&lCONNECTING', '&a&lOPEN', '&c&lCLOSING', '&4&lCLOSED'][client.readyState],
          ])
          break

        case 'open':
          if (client) {
            error('Already open')
            break
          }
          client = new WebSocket(settings.wsURI)
          client.connect()
          break

        case 'close':
          if (!client) {
            error('No open connection')
            break
          }
          client.close()
          client = null
          chat('Closed')
          break

        case 'version':
        case 'ver':
          metadata.printVersionStatus()
          break

        default:
          error(`Unknown command. Type "/cs" for help. ('${command}')`)
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
