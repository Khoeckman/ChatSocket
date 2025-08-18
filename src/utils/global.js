const Random = Java.type('java.util.Random')

// General
global.PREFIX = '&7[&6ChatSocket&7] &e'
global.TAB = '    '

global.rng = new Random()

// ChatTriggers
global.randomId = () => rng.nextInt(2 ** 31 - 1)

global.chat = (message, id = null) => {
  if (!message || typeof message !== 'string') message = ''
  if (!id) return ChatLib.chat(PREFIX + message)
  new Message(message).setChatLineId(id).chat()
}

global.error = message => {
  chat('&c' + message)
  if (settings.printStackTrace) {
    try {
      throw new Error(message)
    } catch (err) {
      err.stack
        .replace(/\t/g, TAB)
        .split(/\r?\n/)
        .forEach(line => ChatLib.chat('&c' + line))
    }
  }
  World.playSound('random.anvil_land', 0.3, 1)
}

global.line = (prefix = '', len = 48) => prefix + '&m' + '-'.repeat(len)

global.dialog = (title, lines) => {
  ChatLib.chat('')
  chat(title)
  ChatLib.chat('')
  for (let line of lines) ChatLib.chat(TAB + line)
  ChatLib.chat('')

  World.playSound('random.click', 0.5, 1)
}
