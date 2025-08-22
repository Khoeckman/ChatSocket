import { PREFIX, generateId, chat, error } from './'
import settings from '../vigilance/settings'

class Metadata {
  constructor(moduleName, fileName, remoteURL = 'null') {
    try {
      this.local = JSON.parse(FileLib.read(moduleName, fileName))
    } catch (err) {
      this.local = null
      return error(err, settings.printStackTrace)
    }

    if (typeof remoteURL !== 'string') return error(new TypeError('remoteURL is not a string'), settings.printStackTrace)
    this.remoteURL = remoteURL
  }

  getRemote(onFinally, onFinallyArgs) {
    new Thread(() => {
      try {
        const remote = FileLib.getUrlContent(this.remoteURL)
        this.remote = JSON.parse(remote ?? null)
      } catch (err) {
        error(err)
      } finally {
        Client.scheduleTask(() => onFinally(...onFinallyArgs))
      }
    }).start()
  }

  printVersionStatus() {
    if (!this.local || typeof this.local.version !== 'string')
      return error(new TypeError(`Cannot read properties of ${this.local} (reading 'version')`), settings.printStackTrace)

    if (!settings.checkLatestVersion) {
      ChatLib.chat(
        new Message(
          PREFIX + `&aVersion ${this.local.version} `,
          new TextComponent('&7[&8&lGitHub&7]')
            .setClick('open_url', this.local.homepage)
            .setHover('show_text', '&fClick to view &6ChatSocket&f on &8&lGitHub')
        )
      )
      return
    }

    const messageId = generateId()
    chat(`&aVersion ${this.local.version} &7● Getting latest...`, messageId)

    this.getRemote(this.#updateVersionStatus, [messageId])
    World.playSound('random.orb', 0.7, 1)
  }

  #updateVersionStatus = messageId => {
    const latestVersion =
      this.remote && typeof this.remote.version === 'string'
        ? this.remote.version > this.local.version
          ? '&c✖ Latest ' + this.remote.version
          : '&2✔ Latest'
        : '&c✖ Latest unknown'

    ChatLib.editChat(
      messageId,
      new Message(
        PREFIX + `&aVersion ${this.local.version} ${latestVersion} `,
        new TextComponent('&7[&8&lGitHub&7]')
          .setClick('open_url', this.local.homepage)
          .setHover('show_text', '&fClick to view &6ChatSocket&f on &8&lGitHub')
      )
    )
    // World.playSound('mob.villager.' + (latestVersion.includes('.') ? 'yes' : 'no'), 0.7, 1)
  }
}

export default new Metadata('ChatSocket', 'metadata.json', 'https://raw.githubusercontent.com/Khoeckman/ChatSocket/main/metadata.json')
