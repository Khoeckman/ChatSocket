// Run `/ct import CTAutocomplete` in Minecraft to be able to use this devdependency
/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import { chat, error, dialog } from './src/utils'
import settings from './src/vigilance/settings'
import metadata from './src/utils/metadata'
import ChatSocketClient from './src/net/ChatSocketClient'

const C13PacketPlayerAbilities = Java.type('net.minecraft.network.play.client.C13PacketPlayerAbilities')

let ws = new ChatSocketClient(settings.wsURI)

try {
  register('command', (command, ...args) => {
    try {
      if (typeof command !== 'string') command = ''
      else command = command.toLowerCase()

      if (!Array.isArray(args)) args = []

      switch (command) {
        case '':
        case 'help':
          dialog('&eCommands', [
            '&e/cs &6sett&eings &7 Opens the settings GUI.',
            '&e/cs &6sett&eings load &7 Loads the config.toml&7 into settings.',
            '&e/cs &6o&epen &7 Connects to the &fWebSocket&7.',
            '&e/cs &6c&elose &7 Disconnects from &fWebSocket&7.',
            '&e/cs &6s&etatus &7 Prints the status of the &fWebSocket&7.',
            // '&e/cs fly [on|off] &7 Change your flying state.',
            '&e/cs &6ver&esion &7 Prints the &aversion&7 status of &6ChatSocket&7.',
            '&e/cs &7 Prints this dialog.',
          ])
          break

        case 'settings':
        case 'sett':
          if (args.length) {
            if (args[0] !== 'load') {
              error(`Unknown command. Type "/cs" for help. `)
              break
            }
            settings.config.loadData()
            chat('&eLoaded config.toml&e into settings.')
            World.playSound('note.pling', 0.7, 1)
            break
          }
          settings.openGUI()
          break

        case 'open':
        case 'o':
          if (ws.readyState !== ChatSocketClient.OPEN) ws = new ChatSocketClient(settings.wsURI)
          ws.onmessage = OnWebSocketMessage
          ws.connect()
          break

        case 'close':
        case 'c':
        case 'x':
          ws.close()
          break

        case 'status':
        case 's':
          ws.printConnectionStatus()
          break

        /* case "fly":
          const player = Player.getPlayer();
          const capabilities = player.func_71075_bZ();
          // On except when { args[0] === 'off' }
          capabilities.isFlying = !args.length || args[0] !== "off";
          Client.sendPacket(new C13PacketPlayerAbilities(capabilities));
          break; */

        case 'version':
        case 'ver':
          metadata.printVersionStatus()
          break

        default:
          error(`Unknown command. Type "/cs" for help. `)
          break
      }
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })
    .setName('cs')
    .setAliases('chatsocket')

  register('gameLoad', () => {
    chat('&eModule loaded. Type "/cs" for help.')
    metadata.printVersionStatus()
  })

  register('gameUnload', () => {
    // Close WebSocket when unloading the module
    try {
      ws.close()
    } catch (err) {}
  })

  register('worldLoad', () => {
    try {
      ws.autoconnect = true
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })

  register('worldUnload', () => {
    try {
      ws.close()
    } catch (err) {}
  })

  registerWebSocketTriggers()

  // Autoreconnect
  register('step', () => {
    try {
      // Keep the channel in sync with settings
      if (ws.readyState === ChatSocketClient.OPEN && ws.isAuth && ws.channel !== settings.wsChannel) ws.selectChannel(settings.wsChannel)

      if (!ws.autoconnect || !settings.wsAutoconnect || ws.readyState === ChatSocketClient.CONNECTING) return

      if (ws.readyState === ChatSocketClient.OPEN) {
        // Attempt AUTH if connection is OPEN
        if (!ws.isAuth) ws.authenticate()
        return
      }

      // Close previous WebSocket before creating a new instance
      try {
        ws.close()
      } catch (err) {}

      ws = new ChatSocketClient(settings.wsURI)
      ws.onmessage = OnWebSocketMessage
      ws.connect()
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  }).setDelay(2)
} catch (err) {
  error(err, settings.printStackTrace)
}

function registerWebSocketTriggers() {
  register('serverConnect', event => {
    try {
      if (ws.readyState !== ChatSocketClient.OPEN) return

      ws.sendEncoded('CONNECT', 'Connected to ' + event.serverIP, { serverIP: event.serverIP })
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })

  register('serverDisconnect', () => {
    try {
      if (ws.readyState !== ChatSocketClient.OPEN) return

      ws.sendEncoded('DISCONNECT', 'Disconnected from server')
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })

  register('messageSent', message => {
    try {
      if (!settings.wsCmdEvent || ws.readyState !== ChatSocketClient.OPEN) return

      ws.sendEncoded('SAY', message)
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })

  register('chat', event => {
    try {
      if (ws.readyState !== ChatSocketClient.OPEN) return

      const message = ChatLib.getChatMessage(event, true)
      if (new RegExp(settings.wsChatEventFilter).test(message)) return

      ws.sendEncoded('CHAT', message)

      // Prevent printing the message twice
      if (settings.wsLogChat) cancel(event)
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })
}

function OnWebSocketMessage(type, message, data) {
  switch (type) {
    case 'AUTH':
    case 'CHANNEL':
      break
    case 'CONNECT':
      Client.connect(data.serverIP)
    case 'DISCONNECT':
      Client.disconnect()
    case 'CHAT':
      if (!settings.wsLogChat) ChatLib.chat(message)
      break
    case 'SAY':
      ChatLib.say(message)
      break
    case 'CMD':
      ChatLib.command(message)
      break
    default:
      error(`WebSocket Error: Unsupported message type '${type}'`, settings.printStackTrace, true)
      break
  }
}
