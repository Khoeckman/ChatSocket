const Random = Java.type('java.util.Random')

export const PREFIX = '&7[&6ChatSocket&7] '
export const TAB = '    '

// Java
export const isJavaClass = (obj, className) => {
  return obj && typeof obj.getClass === 'function' && obj.getClass().getName() === className
}

export const rng = new Random()

export const randomInt = (inclMin, exclMax) => {
  return inclMin + rng.nextInt(exclMax - inclMin)
}

// ChatTriggers
export const chat = (message, id = null) => {
  if (typeof message === 'string') {
    message = new Message(PREFIX, message)
  } else if (isJavaClass(message, 'com.chattriggers.ctjs.minecraft.objects.message.TextComponent')) {
    message = new Message(new TextComponent(PREFIX), message)
  } else if (isJavaClass(message, 'com.chattriggers.ctjs.minecraft.objects.message.Message')) {
    message.addTextComponent(0, new TextComponent(PREFIX))
  } else {
    message = new Message(PREFIX, String(message))
  }

  if (Number.isFinite(id)) message.setChatLineId(+id)
  message.chat()
}

export const error = (message, printStackTrace = false) => {
  // Prefix message with red color
  if (typeof message === 'string') {
    message = new TextComponent(PREFIX + '&c' + message)
  } else if (isJavaClass(message, 'com.chattriggers.ctjs.minecraft.objects.message.TextComponent')) {
    message.setText(PREFIX + '&c' + message.getText())
  } else if (isJavaClass(message, 'com.chattriggers.ctjs.minecraft.objects.message.Message')) {
    // Prefix the Message object with {PREFIX} and prefix every line with '&c'
    const messageParts = message.getMessageParts()

    for (let i in messageParts) {
      const textComponent = messageParts[i]
      textComponent.setText('&c' + textComponent.getText())
      message.setTextComponent(i, textComponent)
    }
    message.addTextComponent(0, PREFIX)
  } else {
    message = new TextComponent(PREFIX + String(message))
  }
  ChatLib.chat(message)

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
