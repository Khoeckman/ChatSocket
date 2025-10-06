import { chat, error } from './'

const Timer = Java.type('java.util.Timer')
const TimerTask = Java.type('java.util.TimerTask')

export default class FIFO {
  _cooldown = 0
  _timer = null
  _executeFn = null
  fifo = []

  constructor(cooldown, executeFn) {
    this._cooldown = cooldown
    this.executeFn = executeFn
    this.resume()
  }

  // --- Cooldown ---
  set cooldown(cd) {
    if (typeof cd !== 'number' || cd < 0) throw new TypeError('cooldown is not a positive number')
    this._cooldown = cd
    this.resume()
  }

  get cooldown() {
    return this._cooldown
  }

  set executeFn(fn) {
    if (typeof fn !== 'function') throw new TypeError('executeFn must be a function')
    this._executeFn = fn
  }

  get executeFn() {
    return this._executeFn
  }

  queue(entry) {
    chat('queue: ' + entry + ' / ' + this._timer)
    this.fifo.push(entry)

    this.pause()
    this.resume()
  }

  clear() {
    this.fifo = []
  }

  pause() {
    if (this._timer) {
      this._timer.cancel()
      this._timer = null
    }
  }

  resume() {
    this.pause()

    const timer = new Timer()
    const run = () => {
      try {
        chat('tick')

        const entry = this.fifo.shift()

        if (!entry) {
          this.pause()
          return
        }

        if (typeof entry !== 'string') return

        Client.scheduleTask(() => {
          try {
            this._executeFn(entry)
          } catch (err) {
            error(err, settings.printStackTrace)
          }
        })
      } catch (err) {
        error(err, settings.printStackTrace)
        this.pause()
      }
    }

    timer.schedule(new TimerTask({ run }), 0, this._cooldown)
    this._timer = timer
  }
}
