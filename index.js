// Run `/ct import CTAutocomplete` in Minecraft to be able to use this devdependency
/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import { PREFIX, chat, error, dialog, runCall } from './src/utils'
import settings from './src/vigilance/Settings'
import metadata from './src/utils/Metadata'
import ChatSocketClient, { trustAllSSL } from './src/net/ChatSocketClient'
import { cmdQueue } from './src/utils/heatManager'

// const C13PacketPlayerAbilities = Java.type('net.minecraft.network.play.client.C13PacketPlayerAbilities')

let isWorldLoadedOnGameLoad = null
let cmdHeat = 0

let ws = new ChatSocketClient(settings.wsURL)
ws.autoconnect = true

try {
  function wsConnect({ newInstance = true } = {}) {
    if (newInstance || ws.readyState !== ChatSocketClient.OPEN) ws = new ChatSocketClient(settings.wsURL)
    // ws.setSocketFactory(trustAllSSL().getSocketFactory())
    if (typeof onmessage === 'function') ws.onmessage = onmessage
    ws.connect()
  }

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
            '&e/cs &6conn&eect &7 Connects to the &fWebSocket&7.',
            '&e/cs &6c&elose &7 Disconnects from &fWebSocket&7.',
            '&e/cs &6r&eeconnect &7 Reconnects to the &fWebSocket&7.',
            '&e/cs &6st&eatus &7 Prints info of the &fWebSocket&7.',
            '&e/cs &6cl&eear &7 Clear the command queue.',
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

        case 'connect':
        case 'conn':
        case 'o':
          if (!ws.autoconnect && settings.wsAutoconnect) chat('&eAutoconnect resumed')

          wsConnect({ newInstance: false })
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
          wsConnect()
          break

        case 'status':
        case 'st':
          ws.printConnectionStatus()
          break

        case 'clear':
        case 'cl':
          cmdQueue.clear()
          chat('&eCleared the command queue.')
          World.playSound('dig.glass', 0.7, 1)
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

  register('gameLoad', () => {
    isWorldLoadedOnGameLoad = World.isLoaded()
  })

  register('gameUnload', () => {
    // Close WebSocket when unloading the module
    try {
      ws.close()
    } catch (err) {}
  })

  const firstWorldLoad = register('worldLoad', () => {
    try {
      chat('&eModule loaded. Type "/cs" for help.')
      metadata.printVersionStatus()

      if (!isWorldLoadedOnGameLoad) ws.printConnectionStatus()
    } catch (err) {
      error(err, settings.printStackTrace)
    } finally {
      firstWorldLoad.unregister()
    }
  })

  registerWebSocketTriggers()
  registerHeatManagementTriggers()

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

      wsConnect()
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
        ping: Server.getPing(),
      }
      ws.sendEncoded('CONNECT', `${ws.name} connected to ${server && server.ip ? server.ip : 'unknown'}`, {
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
        ping: Server.getPing(),
      }
      ws.sendEncoded('DISCONNECT', `${ws.name} disconnected from ${server && server.ip ? server.ip : 'unknown'}`, {
        server,
      })
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })

  register('worldLoad', () => {
    try {
      if (cmdQueue.length) {
        chat('&eCleared the command queue.')
        World.playSound('dig.glass', 0.7, 1)
      }
      cmdQueue.clear()

      if (ws.readyState !== ChatSocketClient.OPEN) return

      const world = World.getWorld()
      ws.sendEncoded('LOAD', String(world), { world: String(world) })
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })

  register('worldUnload', () => {
    try {
      if (cmdQueue.length) {
        chat('&eCleared the command queue.')
        World.playSound('dig.glass', 0.7, 1)
      }
      cmdQueue.clear()

      if (ws.readyState !== ChatSocketClient.OPEN) return

      const world = World.getWorld()
      ws.sendEncoded('UNLOAD', String(world), { world: String(world) })
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })

  register('chat', (event) => {
    try {
      if (!settings.wsDoClientSayEvent || ws.readyState !== ChatSocketClient.OPEN) return

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
        ws.sendEncoded('CLIENT_SAY', message, { json, match })
      } else {
        ws.sendEncoded('CLIENT_SAY', message, { json })
      }

      // `ws.sendEncoded` already prints the message if `settings.wsLogChat` is true, so prevent double printing it
      if (settings.wsLogChat) cancel(event)
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })

  /* register('command', (command, ...args) => {
    try {
      if (!settings.wsDoClientCmdEvent || ws.readyState !== ChatSocketClient.OPEN) return

      ws.sendEncoded('CLIENT_CMD', command, { command, args: [...args] })
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  }) */

  register('messageSent', (message) => {
    try {
      // Hypixel polls this command
      if (ws.readyState !== ChatSocketClient.OPEN || message === '/locraw') return

      const isCommand = message.startsWith('/')
      const type = isCommand ? 'SERVER_CMD' : 'SERVER_SAY'

      if ((!isCommand && !settings.wsDoServerSayEvent) || (isCommand && settings.wsDoServerCmdEvent)) return

      ws.sendEncoded(type, message)
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })
}

function registerHeatManagementTriggers() {
  // Reduce heat every tick and execute commands from queue is heat is low enough
  register('tick', () => {
    try {
      // Cooldown
      if (cmdHeat > 0) cmdHeat -= 1

      // WebSocket must be open so it can receive feedback from commands
      // AND heat must be low enough
      if (
        !(
          ws.readyState === ChatSocketClient.OPEN &&
          cmdHeat + Number(settings.cmdHeatGeneration) < Number(settings.cmdHeatLimit)
        )
      )
        return

      const cmd = cmdQueue.dequeueOldest()
      if (!cmd) return

      ChatLib.command(cmd)
      ws.sendEncoded('SERVER_CMD', cmd)
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })

  // Queue commands if they would exceed the heat limit
  register('messageSent', (cmd, event) => {
    try {
      // Don't queue
      // IF disabled in settings
      // OR `cmd` does not have a leading slash (then it's a regular message)
      // OR `cmd` is /locraw (doesn't count towards heat limit)
      if (!settings.enableCmdHeat || !cmd.startsWith('/') || cmd === '/locraw') return

      // Execute command and increase heat if heat is low enough
      if (cmdHeat + Number(settings.cmdHeatGeneration) < Number(settings.cmdHeatLimit)) {
        cmdHeat += Number(settings.cmdHeatGeneration)
        return
      }

      // Queue command after slicing off leading slash
      cmdQueue.enqueue(cmd.slice(1))
      cancel(event)
    } catch (err) {
      error(err, settings.printStackTrace)
    }
  })

  // Render how many commands are left in the queue
  register('renderOverlay', () => {
    const size = cmdQueue.length
    if (!size) return

    const text = PREFIX + ` &eCommand queue &7(&e${size}&7)`

    const screen = Renderer.screen
    const screenWidth = screen.getWidth()
    const screenHeight = screen.getHeight()

    // Center horizontally
    const textWidth = Renderer.getStringWidth(text)
    const x = (screenWidth - textWidth) / 2

    const offset = 35
    const y = screenHeight - offset

    Renderer.drawStringWithShadow(text, x, y)
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
 *   Uppercase message type (e.g., "AUTH", "CHANNEL", "EXEC").
 *
 * @param {string} message
 *   The main payload of the message. Often a chat message, server IP, or command.
 *
 * @param {Object} data
 *   Structured data object sent with the message. Contents depend on `type`.
 *   For example, "CONNECT" may include `{ ip: string }`.
 *
 * @example
 * ws.onmessage = function (type, message, data) {
 *   if (type === "CHAT") {
 *     ChatLib.chat("[Server] " + message)
 *   }
 * }
 */
function onmessage(type, message, data) {
  // Prevent executing events from other Minecraft clients
  const from = data._from
  if (type !== 'CHANNEl' && typeof from?.userAgent === 'string' && from.userAgent.split(' ')[0] === 'Minecraft') return

  const ws = this
  const id = data?.id

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
    case 'SERVER':
      const server = {
        ip: Server.getIP(),
        name: Server.getName(),
        motd: Server.getMOTD(),
        ping: Server.getPing(),
      }
      ws.sendEncoded(
        type,
        `${ws.name} is ${server && server.ip ? 'connected to ' + server.ip : 'not connected to any server'}`,
        { server, id }
      )
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
    case 'WORLD':
      const world = World.getWorld()
      ws.sendEncoded(type, String(world))
      break
    case 'LOAD':
      ws.sendEncoded(type, 'Not implemented yet')
      break
    case 'UNLOAD':
      ws.sendEncoded(type, 'Not implemented yet')
      break
    case 'CLIENT_SAY':
      if (!settings.wsLogChat) ChatLib.chat(message)
      break
    case 'SERVER_SAY':
      ChatLib.say(message)
      break
    case 'CLIENT_CMD':
      ChatLib.command(message, true)
      break
    case 'SERVER_CMD':
      if (!Array.isArray(data.queue)) {
        ChatLib.command(message)
        break
      }
      data.queue.forEach((command) => ChatLib.command(command))
      break
    case 'CONTAINER':
      if (!Number.isInteger(+data.slot)) ws.sendEncoded(type, new TypeError('data.slot is not an integer'))

      const container = Player.getContainer()

      if (data.click === 'LEFT' || data.click === 'RIGHT') {
        ws.sendEncoded(type, container.click(data.slot, !!data.shift, data.click))
        break
      }
      ws.sendEncoded(type, 'Success', { items: container.getItems() })
      break
    case 'EXEC':
      if (!settings.wsDoExecEvent) break

      try {
        const result = runCall(message, data.global !== false)
        ws.sendEncoded(type, result ?? 'Success', { success: true, result })
      } catch (err) {
        error('Error while executing &6&lEXEC&c event.')
        if (settings.wsPrintEx) error(`WebSocket Exception:&f ${err}`, settings.printStackTrace, true)
        ws.sendEncoded(type, err, { success: false })
      }
      break
    default:
      error(`WebSocketError: Unsupported message type '${type}'`, settings.printStackTrace, true)
      ws.sendEncoded(type, 'Unsupported message type')
      break
  }
}

register('command', () => {
  ChatLib.say(' ')
}).setName('empty')
