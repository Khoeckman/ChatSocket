// Run `/ct import CTAutocomplete` in Minecraft to be able to use this devdependency
/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import { chat, error, dialog, reflectJavaObject } from './src/utils'
import settings from './src/vigilance/settings'
import metadata from './src/utils/metadata'
import ChatSocketClient from './src/net/ChatSocketClient'

const C13PacketPlayerAbilities = Java.type('net.minecraft.network.play.client.C13PacketPlayerAbilities')

let ws = new ChatSocketClient(settings.wsURL)
ws.autoconnect = true

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
            '&e/cs &6sett&eings sync &7 Syncs the config.toml&7 with the settings GUI.',
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
          if (args.length && args[0] === 'sync') {
            settings.config.loadData()
            chat('&eLoaded config.toml&e into settings.')
            World.playSound('note.pling', 0.7, 1)
            break
          }
          settings.openGUI()
          break

        case 'open':
        case 'o':
          if (!ws.autoconnect && settings.wsAutoconnect) chat('&eAutoconnect resumed')

          if (ws.readyState !== ChatSocketClient.OPEN) ws = new ChatSocketClient(settings.wsURL)
          if (typeof onmessage === 'function') ws.onmessage = onmessage
          ws.connect()
          break

        case 'close':
        case 'c':
        case 'x':
          if (ws.autoconnect && settings.wsAutoconnect) chat('&eAutoconnect paused')
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

  registerWebSocketTriggers()

  // Autoreconnect
  register('step', () => {
    try {
      // Keep the channel in sync with settings
      if (ws.readyState === ChatSocketClient.OPEN && ws.isAuth && ws.channel !== settings.wsChannel)
        ws.selectChannel(settings.wsChannel)

      if (!ws.autoconnect || !settings.wsAutoconnect || ws.readyState === ChatSocketClient.CONNECTING) return

      if (ws.readyState === ChatSocketClient.OPEN) {
        // Attempt AUTH if the connection is OPEN but the client is not yet authenticated
        if (!ws.isAuth) ws.authenticate()
        return
      }

      // Close previous WebSocket before creating a new instance
      try {
        ws.close()
      } catch (err) {}

      ws = new ChatSocketClient(settings.wsURL)
      if (typeof onmessage === 'function') ws.onmessage = onmessage
      ws.connect()
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  }).setDelay(2)
} catch (err) {
  error(err, settings.printStackTrace)
}

function registerWebSocketTriggers() {
  register('serverConnect', (event) => {
    try {
      if (ws.readyState !== ChatSocketClient.OPEN) return

      ws.sendEncoded('CONNECT', 'Connected to server', {
        isLocal: event.isLocal,
        connectionType: event.connectionType,
      })
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

  register('messageSent', (message) => {
    try {
      if (!settings.wsSentEvent || ws.readyState !== ChatSocketClient.OPEN) return

      // Hypixel polls this command
      if (message === '/locraw') return

      ws.sendEncoded('SENT', message)
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })

  register('chat', (event) => {
    try {
      if (ws.readyState !== ChatSocketClient.OPEN) return

      const message = ChatLib.getChatMessage(event, true)
      let json

      try {
        json = JSON.parse(message)
      } catch (err) {}

      if (!new RegExp(settings.wsChatEventFilter).test(message) && !json) return

      ws.sendEncoded('CHAT', message, json || {})

      // Prevent printing the message twice
      if (settings.wsLogChat) cancel(event)
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })
}

/**
 * Handles incoming messages from the ChatSocket WebSocket server.
 *
 * This function is called for every message the client receives from the
 * server after authentication. It interprets the message type and performs
 * client-side actions (such as sending chat messages, executing commands,
 * or connecting/disconnecting from a server).
 *
 * Developers can override this callback to implement custom behavior for
 * handling specific message types. By default, it performs the following:
 *
 * - Ignores AUTH/CHANNEL messages (these are handled internally).
 * - Connects/disconnects the Minecraft client when instructed.
 * - Displays or suppresses incoming chat messages depending on settings.
 * - Sends chat messages or executes commands on behalf of the user.
 *
 * @this {ChatSocketClient}
 *
 * @param {string} type
 *   Uppercase message type (e.g., "CHAT", "CMD", "SAY", "CONNECT").
 *
 * @param {string} message
 *   The main payload of the message. Often a chat message, server IP, or command.
 *
 * @param {Object} data
 *   Structured data object sent with the message. Contents depend on `type`.
 *   For example, "CONNECT" may include `{ serverIP: string }`.
 *
 * @example
 * ws.onmessage = function (type, message, data) {
 *   if (type === "CHAT") {
 *     ChatLib.chat("[Server] " + message)
 *   }
 * }
 */
function onmessage(type, message, data) {
  switch (type) {
    case 'DEBUG':
    case 'AUTH':
    case 'CHANNEL':
      break
    case 'SERVER':
      const server = {
        name: Server.getName(),
        motd: Server.getMOTD(),
        ip: Server.getIP(),
      }
      this.sendEncoded('SERVER', this.name + ' is connected to ' + server.ip, server)
      break
    case 'CONNECT':
      Client.connect(data.serverAddress)
      break
    case 'DISCONNECT':
      Client.disconnect()
      break
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
