import { ChatSocket, PREFIX, TAB } from './const.js'

export function chat(message) {
  return ChatLib.chat(PREFIX + (message ?? ''))
}

export function line(prefix = '', len = 48) {
  return prefix + '&m' + '-'.repeat(len)
}

export function dialog(title, lines) {
  ChatLib.chat('\n' + PREFIX + title + '\n')
  for (let line of lines) ChatLib.chat(TAB + line)
  ChatLib.chat('')

  World.playSound('mob.villager.no', 0.7, 1)
}
