import { PREFIX, TAB } from './'

const logToChat = (type, typeColor, messageColor, ...args) => {
  ChatLib.chat(PREFIX + `&${typeColor}[${type}]&${messageColor} ${args.join(' ')}`)
}

console.log = (...args) => {
  logToChat('LOG', '7', 'f', ...args)
}
console.info = (...args) => {
  logToChat('INFO', '9', 'b', ...args)
}
console.warn = (...args) => {
  logToChat('WARN', '6', 'e', ...args)
}
console.error = (...args) => {
  logToChat('ERROR', '4', 'c', ...args)
}
console.debug = (...args) => {
  logToChat('DEBUG', '8', 'f', ...args)
}
