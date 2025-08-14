import { ChatSocket, PREFIX, TAB } from './const.js'
import { chat, line, dialog } from './utils.js'
import { printVersionStatus } from './version.js'

// import { register, Chat } from 'core'
// import WebSocket from 'WebSocket'

// const ws = new WebSocket('ws://localhost:47576')

// register('chat', (msg, event) => {
//   ws.send(JSON.stringify({ type: 'chat', message: msg }))
// })

// ws.onmessage = event => {
//   let data = JSON.parse(event.data)
//   if (data.type === 'send_chat') {
//     Chat.say(data.message)
//   }
// }

// Command: /cs help
register('command', (command, ...args) => {
  try {
    if (typeof command !== 'string') command = 'help'
    else command = command.toLowerCase()

    chat('command: ' + command)

    switch (command) {
      case 'config':
        chat('&lTODO &fOpen configuration menu (GUI)')
        break

      case 'version':
        printVersionStatus()
        break

      default:
        dialog('Help dialog', [
          '&e/cs config &7 Opens the configuration GUI.',
          '&e/cs conn &7 Prints info about the current connection.',
          '&e/cs open &7 Opens the &fWebSocket&7 connection.',
          '&e/cs close &7 Closes the &fWebSocket&7 connection.',
          '&e/cs version &7 Prints the &aversion&7 status of &6ChatSocket&7.',
          '&e/cs &7 Prints this help dialog.',
        ])
        break
    }
  } catch (err) {
    chat('&c' + err)
  }
})
  .setName('cs')
  .setAliases('chatsocket')

// On load success
chat('&eModule loaded. Type "/cs" for help.')
printVersionStatus()
