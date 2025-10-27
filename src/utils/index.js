/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />

const Random = Java.type('java.util.Random')

export const NAME = '&6&lCS'
export const PREFIX = `&7[${NAME}&7]&r `
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
  if (
    typeof message === 'string' ||
    isJavaClass(message, 'com.chattriggers.ctjs.minecraft.objects.message.TextComponent')
  ) {
    message = new Message(PREFIX, message)
  } else if (isJavaClass(message, 'com.chattriggers.ctjs.minecraft.objects.message.Message')) {
    message.addTextComponent(0, PREFIX)
  } else {
    message = new Message(PREFIX, String(message))
  }
  if (Number.isInteger(id)) message = message.setChatLineId(id & 0x7fffffff)
  message.chat()
}

export const error = (message, printStackTrace = false, silent = false) => {
  // Prefix message with red color
  if (typeof message === 'string') {
    message = new Message(PREFIX, '&c' + message)
  } else if (isJavaClass(message, 'com.chattriggers.ctjs.minecraft.objects.message.TextComponent')) {
    message.setText('&c' + message.getText())
    message = new Message(PREFIX, message)
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
    message = new Message(PREFIX, '&c' + message)
  }
  message.chat()

  if (printStackTrace) {
    try {
      throw new Error(message)
    } catch (err) {
      err.stack
        .replace(/\t/g, TAB)
        .split(/\r?\n/)
        .forEach((line) => ChatLib.chat('&c' + line))
    }
  }

  if (!silent) World.playSound('random.anvil_land', 0.3, 1)
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

export const runCall = (expr, useGlobal = true) => {
  const match = expr.match(/^([^(]+)\((.*)\)$/)
  if (!match) throw new Error('Invalid expression: ' + expr)

  const path = match[1].split('.')
  let args = match[2].trim()

  // Split on commas that are not inside quotes
  const parts = []
  let current = ''
  let inQuotes = false
  let quoteChar = null

  for (let c of args) {
    if (c === '"' || c === "'") {
      if (inQuotes && c === quoteChar) {
        inQuotes = false
        quoteChar = null
      } else if (!inQuotes) {
        inQuotes = true
        quoteChar = c
      }
    }

    if (c === ',' && !inQuotes) {
      parts.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  if (current.trim()) parts.push(current.trim())

  args = parts.map((arg) => {
    if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'")))
      return arg.slice(1, -1)
    if (!isNaN(arg)) return Number(arg)
    if (arg === 'true') return true
    if (arg === 'false') return false
    return arg
  })

  // Resolve function
  let fn = useGlobal ? global : exports
  for (let i = 0; i < path.length; i++) {
    fn = fn[path[i]]
    if (!fn) throw new Error('Function not found: ' + path.join('.'))
  }

  if (typeof fn !== 'function') throw new Error('Target is not a function: ' + path.join('.'))
  return fn(...args)
}

/**
 * Reflects over a Java object to extract its fields and getter values,
 * returning a plain JavaScript object that can be serialized to JSON.
 *
 * @param {JavaObject} obj - The Java object to inspect.
 * @returns {{ fields: Array<{name: string, value: string}>, getters: Array<{name: string, value: string}> }}
 *
 * @example
 * register('serverConnect', (event) => {
 *   const info = reflectJavaObject(event)
 *   ws.sendEncoded('DEBUG', JSON.stringify(info))
 * })
 */
export const reflectJavaObject = (obj) => {
  const javaClass = obj.getClass()

  const result = {
    fields: [],
    getters: [],
  }

  // Collect fields
  for (const field of javaClass.getDeclaredFields()) {
    try {
      field.setAccessible(true)
      const name = field.getName()
      const value = String(field.get(obj))
      result.fields.push({ name, value })
    } catch (err) {
      result.fields.push({ name: 'FieldError', value: String(err) })
    }
  }

  // Collect no-arg getters
  for (const method of javaClass.getMethods()) {
    const name = method.getName()

    if (name.startsWith('get') && method.getParameterCount() === 0) {
      try {
        const value = String(method.invoke(obj))
        result.getters.push({ name, value })
      } catch (err) {
        result.getters.push({ name, value: 'MethodError: ' + err })
      }
    }
  }

  return result
}
