// Run "/ct import CTAutocomplete" in Minecraft to use this devdependency
/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import { chat, error, dialog } from './src/utils'
import settings from './src/vigilance/settings'
import metadata from './src/utils/metadata'
import ChatSocketClient from './src/net/ChatSocketClient'

let ws = new ChatSocketClient(settings.wsURI)

try {
  register('command', (command, ...args) => {
    try {
      if (typeof command !== 'string') command = ''
      else command = command.toLowerCase()

      switch (command) {
        case '':
        case 'help':
          dialog('Commands', [
            '&e/cs &6sett&eings &7 Opens the settings GUI.',
            '&e/cs &6sett&eings load &7 Loads the config.toml&7 into settings.',
            '&e/cs status &7 Prints the status of the &fWebSocket&7.',
            '&e/cs open &7 Connects to the &fWebSocket&7.',
            '&e/cs close &7 Disconnects from &fWebSocket&7.',
            '&e/cs &6ver&esion &7 Prints the &aversion&7 status of &6ChatSocket&7.',
            '&e/cs &7 Prints this dialog.',
          ])
          break

        case 'settings':
        case 'sett':
          if (args && Array.isArray(args)) {
            if (args[0] === 'load') {
              settings.config.loadData()
              chat('Loaded config.toml&e into settings.')
              World.playSound('random.orb', 0.7, 1)
            }
            break
          }
          settings.openGUI()
          break

        case 'status':
          chat(
            `Connection to &f${ws ? ws.uri : settings.wsURI}&e ● ${
              ['&6&lCONNECTING', '&a&lOPEN', '&c&lCLOSING', '&c&lCLOSED'][ws ? ws.readyState ?? 3 : 3]
            }`
          )
          break

        case 'open':
        case 'o':
          chat(`&2&l+ &aConnecting to &f${settings.wsURI}&a...`, 47576001)
          if (ws.readyState !== ChatSocketClient.OPEN) ws = new ChatSocketClient(settings.wsURI)
          ws.connect()

          ws.receive = message => {
            chat('TODO handle received message: ' + message)
          }
          break

        case 'close':
        case 'x':
          chat(`&4&l-&c Disconnecting from &f${ws.uri}&c...`, 47576002)
          ws.close()
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

  register('chat', event => {
    try {
      const message = ChatLib.getChatMessage(event, false)
      if (ws) ws.send(message)
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })

  // Close WebSocket when unloading the module
  register('gameUnload', () => {
    try {
      ws.close()
    } catch (err) {}
  })

  chat('&eModule loaded. Type "/cs" for help.')
  metadata.printVersionStatus()
} catch (err) {
  error(err, settings.printStackTrace)
}
