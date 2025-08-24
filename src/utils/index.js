const Random = Java.type('java.util.Random')

export const PREFIX = '&7[&6ChatSocket&7] &e'
export const TAB = '    '

export const rng = new Random()

export const randomId = () => rng.nextInt(2 ** 31 - 1)

export const chat = (message, id = null) => {
  if (!message || typeof message !== 'string') message = ''
  if (!id) return ChatLib.chat(PREFIX + message)
  new Message(PREFIX + message).setChatLineId(id).chat()
}

export const error = (message, printStackTrace = false) => {
  chat('&c' + message)

  if (printStackTrace) {
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

export const line = (prefix = '', len = 48) => prefix + '&m' + '-'.repeat(len)

export const dialog = (title, lines) => {
  ChatLib.chat('')
  chat(title)
  ChatLib.chat('')
  for (let line of lines) ChatLib.chat(TAB + line)
  ChatLib.chat('')

  World.playSound('random.click', 0.7, 1)
}
