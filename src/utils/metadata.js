/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />

import { chat, error } from './'
import settings from '../vigilance/Settings'

class Metadata {
  constructor(moduleName, fileName, remoteURL = 'null') {
    try {
      this.local = JSON.parse(FileLib.read(moduleName, fileName))
    } catch (err) {
      this.local = null
      return error(err, settings.printStackTrace)
    }

    if (typeof remoteURL !== 'string')
      return error(new TypeError('remoteURL is not a string'), settings.printStackTrace)
    this.remoteURL = remoteURL
  }

  static compareVersions(v1, v2) {
    const a = v1.split('.').map((n) => Number(n))
    const b = v2.split('.').map((n) => Number(n))

    for (let i = 0, len = Math.max(a.length, b.length); i < len; i++) {
      const x = a[i] || 0
      const y = b[i] || 0
      if (x > y) return 1 // v1 > v2
      if (x < y) return -1 // v1 < v2
    }
    return 0 // equal
  }

  getRemote(onFinally = () => {}) {
    new Thread(() => {
      try {
        this.remote = JSON.parse(FileLib.getUrlContent(this.remoteURL) ?? null)
      } catch (err) {
        error(err)
      } finally {
        onFinally()
      }
    }).start()
  }

  printVersionStatus() {
    if (!World.isLoaded()) return

    if (!this.local || typeof this.local.version !== 'string')
      return error(
        new TypeError(`Cannot read properties of ${this.local} (reading 'version')`),
        settings.printStackTrace
      )

    if (!settings.checkLatestVersion) {
      chat(
        new Message(
          `&aVersion ${this.local.version} `,
          new TextComponent('&7[&8&lGitHub&7]')
            .setClick('open_url', this.local.homepage)
            .setHover('show_text', '&fClick to view &6ChatSocket&f on &8&lGitHub')
        ).setChatLineId(47576000)
      )
      return
    }

    chat(`&aVersion ${this.local.version} &7● Getting latest...`, 47576000)

    this.getRemote(() => this.updateVersionStatus(47576000))
  }

  updateVersionStatus = (messageId) => {
    if (!World.isLoaded()) return

    const latestVersion =
      this.remote && typeof this.remote.version === 'string'
        ? Metadata.compareVersions(this.local.version, this.remote.version) >= 0
          ? '&2✔ Latest'
          : '&c✖ Latest ' + this.remote.version
        : '&c✖ Latest unknown'

    try {
      ChatLib.clearChat(messageId)
      chat(
        new Message(
          `&aVersion ${this.local.version} ${latestVersion} `,
          new TextComponent('&7[&8&lGitHub&7]')
            .setHover('show_text', '&fClick to view &6ChatSocket&f on &8&lGitHub')
            .setClick('open_url', this.local.homepage)
        ).setChatLineId(messageId)
      )
    } catch (err) {
      error(err, settings.printStackTrace)
    }
    World.playSound('mob.villager.' + (latestVersion.includes('✔') ? 'yes' : 'no'), 0.7, 1)
  }
}

export default new Metadata(
  'ChatSocket',
  'metadata.json',
  'https://raw.githubusercontent.com/Khoeckman/ChatSocket/main/metadata.json'
)
