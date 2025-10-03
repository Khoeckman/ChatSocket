export default class FallingChars {
  #container
  #chars
  #color
  #spawnDensityPerSecond
  #spawnsPerInterval
  #spawnIntervalId

  constructor(container, chars, color, options = {}) {
    const { spawnDensityPerSecond = 25, spawnsPerInterval = 1 } = options

    this.container = container
    this.chars = chars
    this.color = color
    this.spawnDensityPerSecond = spawnDensityPerSecond
    this.spawnsPerInterval = spawnsPerInterval

    this.spawnFn = function () {
      return {
        x: Math.random() * window.innerWidth,
        y:
          -(2 * parseFloat(window.getComputedStyle(this.container).fontSize)) -
          Math.random() * 0.25 * window.innerHeight,
        scale: 0.25 + Math.random(),
        direction: -10 + Math.random() * 20,
        rotation: -25 + Math.random() * 50,
      }
    }

    this.container.innerHTML = ''

    this.startSpawning()
    window.addEventListener('resize', () => this.restartSpawning())
  }

  set container(container) {
    if (!(container instanceof HTMLElement)) throw new TypeError('container is not an HTMLElement')
    this.#container = container
  }
  get container() {
    return this.#container
  }

  set chars(chars) {
    if ((typeof chars !== 'string' && !Array.isArray(chars)) || !chars.length)
      throw new TypeError('chars is not a string or array')
    this.#chars = chars
  }
  get chars() {
    return this.#chars
  }

  set color(color) {
    if (typeof color !== 'string') throw new TypeError('color is not a string')
    this.#color = color

    // Apply color to container
    this.container.style.color = this.#color
  }
  get color() {
    return this.#color
  }

  set spawnDensityPerSecond(spawnDensityPerSecond) {
    if (!Number.isFinite(spawnDensityPerSecond)) throw new TypeError('spawnDensityPerSecond is not a finite number')
    this.#spawnDensityPerSecond = spawnDensityPerSecond
  }
  get spawnDensityPerSecond() {
    return this.#spawnDensityPerSecond
  }

  set spawnsPerInterval(spawnsPerInterval) {
    if (!Number.isFinite(spawnsPerInterval)) throw new TypeError('spawnsPerInterval is not a finite number')
    this.#spawnsPerInterval = spawnsPerInterval
  }
  get spawnsPerInterval() {
    return this.#spawnsPerInterval
  }

  startSpawning() {
    const delay = 1e6 / (this.#spawnDensityPerSecond * window.innerWidth)
    this.#spawnIntervalId = setInterval(() => {
      for (let i = 0; i < this.#spawnsPerInterval; i++) this.summonEntity(this.spawnFn.call(this))
    }, delay)
  }

  restartSpawning() {
    clearInterval(this.#spawnIntervalId)
    this.startSpawning()
  }

  summonEntity({ x, y, scale, direction, rotation }) {
    const li = document.createElement('li')

    li.style.setProperty('--x', `${x.toPrecision(4)}px`)
    li.style.setProperty('--y', `${y.toPrecision(4)}px`)
    li.style.setProperty('--scale', scale.toPrecision(4))
    li.style.setProperty('--dir', `${direction.toPrecision(4)}deg`)
    li.style.setProperty('--rot', `${rotation.toPrecision(4)}deg`)
    li.innerText = this.#chars[~~(Math.random() * this.#chars.length)]

    li.addEventListener('animationend', () => li.remove())

    this.#container.appendChild(li)
  }
}
