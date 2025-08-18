// import { fetchOptions } from './utils/fetch.js'

export default class Metadata {
  constructor(moduleName, fileName, remoteURL = '') {
    try {
      this.local = JSON.parse(FileLib.read(moduleName, fileName))
    } catch (err) {
      this.local = null
      return error(err)
    }

    if (typeof remoteURL !== 'string') return error(new TypeError('remoteURL is not a string'))
    this.remoteURL = remoteURL
    this.remote = null
  }

  fetchRemote() {
    return new Promise(resolve => resolve({ version: '1.0.1' }))
    // return fetch(this.remoteURL, fetchOptions('GET'))
    //   .then(res => res.json())
    //   .then(json => (this.remote = json))
    //   .catch(error)
  }

  printVersion() {
    if (!this.local || typeof this.local.version !== 'string')
      return error(new TypeError(`Cannot read properties of ${this.local} (reading 'version')`))

    if (!settings.checkVersion) {
      ChatLib.chat(
        new TextComponent(PREFIX + `&aVersion ${this.local.version} &7[&8&lGitHub&7]`)
          .setClick('open_url', this.local.homepage)
          .setHover('show_text', '&fClick to view &6ChatSocket&f on &8&lGitHub')
      )
      return
    }

    const messageId = randomId()
    chat(PREFIX + `&aVersion ${this.local.version} &7Fetching latest...`, messageId)

    // this.remote = await this.fetchRemote(this.remoteURL)
    let latestVersion = ''

    if (this.remote && typeof this.remote.version === 'string') {
      latestVersion = this.remote.version > this.local.version ? ' &c✘ Latest ' + this.remote.version : ' &2✔ Latest'
    } else {
      error(new Error('Could not fetch latest version.'))
    }

    ChatLib.chat('hi 1')

    ChatLib.editChat(
      messageId,
      new Message(
        new TextComponent(PREFIX + `&aVersion ${this.local.version}${latestVersion} &7[&8&lGitHub&7]`)
          .setClick('open_url', this.local.homepage)
          .setHover('show_text', '&fClick to view &6ChatSocket&f on &8&lGitHub')
      )
    )

    ChatLib.chat('hi 2')

    ChatLib.chat(ChatLib.getChatBreak('-'))
  }
}
