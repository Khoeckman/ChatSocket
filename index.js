// Run `/ct import CTAutocomplete` in Minecraft to be able to use this devdependency
/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import { chat, error, dialog, runCall } from './src/utils'
import settings from './src/vigilance/settings'
import metadata from './src/utils/metadata'
import ChatSocketClient from './src/net/ChatSocketClient'
import FIFO from './src/utils/FIFO'

// const C13PacketPlayerAbilities = Java.type('net.minecraft.network.play.client.C13PacketPlayerAbilities')

let ws = new ChatSocketClient(settings.wsURL)
ws.autoconnect = true

const cmdQueue = new FIFO(settings.wsCmdEventCooldown | 0, (cmd) => {
  ChatLib.command(cmd)
  // if (!settings.wsDoCmdEvent || ws.readyState !== ChatSocketClient.OPEN) return
  // ws.sendEncoded('CMD', cmd)
})

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
            '&e/cs &6s&eettings &7 Opens the settings GUI.',
            '&e/cs &6s&eettings sync &7 Syncs the config.toml&7 with the GUI.',
            '&e/cs &6o&epen &7 Connects to the &fWebSocket&7.',
            '&e/cs &6c&elose &7 Disconnects from &fWebSocket&7.',
            '&e/cs &6r&eeconnect &7 Reconnects to the &fWebSocket&7.',
            '&e/cs &6st&eatus &7 Prints info of the &fWebSocket&7.',
            // '&e/cs fly [on|off] &7 Change your flying state.',
            '&e/cs &6ver&esion &7 Prints the &aversion&7 status of &6ChatSocket&7.',
          ])
          break

        case 'settings':
        case 's':
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

        case 'reconnect':
        case 'r':
          ws.close()
          ws = new ChatSocketClient(settings.wsURL)
          if (typeof onmessage === 'function') ws.onmessage = onmessage
          ws.connect()
          break

        case 'status':
        case 'st':
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
          error('Unknown command. Type "/cs" for help.')
          break
      }
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })
    .setName('cs')
    .setAliases('chatsocket')

  // Queue commands
  register('messageSent', (cmd, event) => {
    try {
      if (!settings.wsEnableCmdEventCooldown || !cmd.startsWith('/') || cmd === '/locraw') return

      if (cmdQueue.cooldown !== settings.wsCmdEventCooldown) {
        cmdQueue.cooldown = settings.wsCmdEventCooldown
      }
      cmdQueue.queue(cmd)
      cancel(event)
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })

  register('gameUnload', () => {
    // Close WebSocket when unloading the module
    try {
      ws.close()
    } catch (err) {}
  })

  const firstWorldLoad = register('worldLoad', (event) => {
    try {
      chat('&eModule loaded. Type "/cs" for help.')
      metadata.printVersionStatus()

      ws.printConnectionStatus()
    } catch (err) {
      error(err, settings.printStackTrace)
    } finally {
      firstWorldLoad.unregister()
    }
  })

  registerWebSocketTriggers()

  // Autoreconnect
  register('step', () => {
    try {
      // Reconnect if settings don't match
      if (String(ws.url).trim() === settings.wsURL.trim() && ws.name === (settings.wsName.trim() || Player.getName())) {
        // Keep the channel in sync with settings
        if (ws.readyState === ChatSocketClient.OPEN && ws.isAuth && ws.channel !== settings.wsChannel.trim())
          ws.selectChannel(settings.wsChannel)

        // Should not reconnect
        if (!ws.autoconnect || !settings.wsAutoconnect || ws.readyState === ChatSocketClient.CONNECTING) return

        // Attempt AUTH if the connection is OPEN but the client is not yet authenticated
        if (ws.readyState === ChatSocketClient.OPEN) {
          if (!ws.isAuth) ws.authenticate()
          return
        }
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

      const server = {
        name: Server.getName(),
        motd: Server.getMOTD(),
        ip: Server.getIP(),
      }

      ws.sendEncoded('CONNECT', `${ws.name} connected to ${server.ip}`, {
        server,
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

      const server = {
        name: Server.getName(),
        motd: Server.getMOTD(),
        ip: Server.getIP(),
      }

      ws.sendEncoded('DISCONNECT', `${ws.name} disconnected from ${server.ip}`, { server })
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })

  register('chat', (event) => {
    try {
      if (ws.readyState !== ChatSocketClient.OPEN) return

      const rawMessage = ChatLib.getChatMessage(event)
      const message = ChatLib.getChatMessage(event, true)

      let json

      try {
        json = JSON.parse(message)
      } catch (err) {}

      if (!json || json.constructor !== Object) json = undefined

      if (settings.wsEnableChatEventFilter) {
        const regex = new RegExp(settings.wsChatEventFilter)

        // Ignore if RegEx filter fails on both color coded and raw message
        if (!regex.test(message) && !regex.test(rawMessage)) return

        const match = regex.exec(message)
        ws.sendEncoded('CHAT', message, { json, match })
      } else {
        ws.sendEncoded('CHAT', message, { json })
      }

      // `ws.sendEncoded` already prints the message if `settings.wsLogChat` is true, so prevent double printing it
      if (settings.wsLogChat) cancel(event)
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })

  register('messageSent', (message) => {
    try {
      // Hypixel polls this command
      if (message === '/locraw') return

      const type = message.startsWith('/') ? 'CMD' : 'SAY'

      if ((!settings.wsDoSayEvent && type === 'SAY') || type === 'CMD' || ws.readyState !== ChatSocketClient.OPEN)
        return

      ws.sendEncoded(type, message)
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
  // Prevent executing events from another Minecraft client
  const from = data._from

  if (type !== 'CHANNEl' && typeof from?.userAgent === 'string' && from.userAgent.split(' ')[0] === 'Minecraft') return

  switch (type) {
    case 'DEBUG':
    case 'AUTH':
      break
    case 'CHANNEL':
      if (!settings.wsLogChat && settings.wsPrintChannelEvent) {
        if (data.action === 'join') chat(`&e● &f${from.name}&e joined the channel.`)
        else if (data.action === 'leave') chat(`&e● &f${from.name}&e left the channel.`)
      }
      break
    case 'CLIENTS':
      break
    case 'CONN':
      const server = {
        name: Server.getName(),
        motd: Server.getMOTD(),
        ip: Server.getIP(),
      }
      this.sendEncoded('CONN', `${this.name} is ${server.ip ? 'connected to ' + server.ip : 'disconnected'}`, {
        server,
      })
      break
    case 'CONNECT':
      Client.connect(
        typeof data.ip === 'string'
          ? data.ip
          : data.server && data.server.constructor === Object && typeof data.server.ip === 'string'
          ? data.server.ip
          : message
      )
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
      ChatLib.command(message, data.clientSide === true || data.clientSide === 'true')
      break
    case 'EXEC':
      if (!settings.wsDoExecEvent) break

      try {
        const result = runCall(message)
        this.sendEncoded('EXEC', result ?? 'Success', { success: true, result })
      } catch (err) {
        error('Error while executing &6&lEXEC&c event.')
        if (settings.wsPrintEx) error(`WebSocket Exception:&f ${err}`, settings.printStackTrace, true)
        this.sendEncoded('EXEC', err, { success: false })
      }
      break
    default:
      error(`WebSocketError: Unsupported message type '${type}'`, settings.printStackTrace, true)
      break
  }
}
