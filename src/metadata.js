import axios from 'axios'
import { requestOptions } from './network/http'

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

    const always = () => {
      const latestVersion =
        this.remote && typeof this.remote.version === 'string'
          ? this.remote.version > this.local.version
            ? ' &c✘ Latest ' + this.remote.version
            : ' &2✔ Latest'
          : ''

      ChatLib.editChat(
        messageId,
        new Message(
          new TextComponent(PREFIX + `&aVersion ${this.local.version}${latestVersion} &7[&8&lGitHub&7]`)
            .setClick('open_url', this.local.homepage)
            .setHover('show_text', '&fClick to view &6ChatSocket&f on &8&lGitHub')
        )
      )

      if (!latestVersion) {
        error(new Error('Could not fetch latest version.'))
      }
    }

    this.remote = axios
      .get(this.remoteURL)
      .then(res => {
        this.remote = res.data
        always()
      })
      .catch(() => always())
  }
}
