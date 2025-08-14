import { ChatSocket, PREFIX, TAB } from './const.js'

export const printVersionStatus = async () => {
  const current = ChatSocket.version
  let latest

  await new Promise().then(() => {
    latest = '1.0.1'
  })

  let versionStatus = latest > current ? '&c✘ Latest ' + latest : '&2✔ Latest'

  ChatLib.chat(
    new TextComponent(PREFIX + `&aVersion ${current} ${versionStatus} &7[&8&lGitHub&7]`)
      .setClick('open_url', 'https://github.com/Khoeckman')
      .setHover('show_text', '&fClick to view &6ChatSocket&f on &8&lGitHub')
  )
}
