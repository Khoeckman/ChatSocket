import './src/utils/global.js'
import './src/utils/console.js'
import './src/vigilance/settings.js'
import Metadata from './src/metadata.js'

try {
  global.metadata = new Metadata('ChatSocket', 'metadata.json', 'https://raw.githubusercontent.com/Khoeckman/ChatSocket/main/metadata.json')

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

        case 'version':
        case 'ver':
          metadata.printVersion()
          break

        default:
          dialog('Help dialog:', [
            '&e/cs &6sett&eings &7 Opens the settings GUI.',
            '&e/cs &6conn&eection &7 Prints info about the current connection.',
            '&e/cs open &7 Opens the &fWebSocket&7 connection.',
            '&e/cs close &7 Closes the &fWebSocket&7 connection.',
            '&e/cs &6ver&esion &7 Prints the &aversion&7 status of &6ChatSocket&7.',
            '&e/cs &7 Prints this help dialog.',
          ])
          break
      }
    } catch (err) {
      error(err)
    }
  })
    .setName('cs')
    .setAliases('chatsocket')

  // On load success
  chat('&eModule loaded. Type "/cs" for help.')
  metadata.printVersion()
} catch (err) {
  error(err)
}
