export default class Utils {
  static mcToHTML(str) {
    if (typeof str !== 'string') throw new TypeError('str is not a string')

    const colors = {
      0: '#000000', // black
      1: '#0000aa', // dark blue
      2: '#00aa00', // dark green
      3: '#00aaaa', // dark aqua
      4: '#aa0000', // dark red
      5: '#aa00aa', // dark purple
      6: '#ffaa00', // gold
      7: '#aaaaaa', // gray
      8: '#555555', // dark gray
      9: '#5555ff', // blue
      a: '#55ff55', // green
      b: '#55ffff', // aqua
      c: '#ff5555', // red
      d: '#ff55ff', // light purple
      e: '#ffff55', // yellow
      f: '#ffffff', // white
    }

    const styles = {
      l: 'font-weight: bold',
      m: 'text-decoration: line-through',
      n: 'text-decoration: underline',
      o: 'font-style: italic',
    }

    // Create root container
    const container = document.createElement('span')

    let current = document.createElement('span')
    let currentColor = 'f'
    container.appendChild(current)

    str.split(/([&§][0-9a-fk-or])/).forEach((part) => {
      const match = part.match(/[&§]([0-9a-fk-or])/)

      if (match) {
        // Remove empty elements
        if (!current.innerHTML.length) container.lastChild.remove()

        const code = match[1]

        if (code === 'r') {
          current = document.createElement('span')
          container.appendChild(current)
        } else if (colors[code]) {
          currentColor = colors[code]

          current = document.createElement('span')
          current.style.color = currentColor
          container.appendChild(current)
        } else if (styles[code]) {
          current = document.createElement('span')
          current.style.color = currentColor
          current.style.cssText += ';' + styles[code]
          container.appendChild(current)
        }
      } else {
        current.innerHTML += part
      }
    })

    return container
  }

  static removeMcFormatting(str) {
    if (typeof str !== 'string') throw new TypeError('str is not a string')
    return String(str).replace(/[&§][0-9a-fk-or]/g, '')
  }

  static shortenInnerHTML(str, maxLength) {
    if (typeof str !== 'string') throw new TypeError('str is not a string')
    if (!(Number.isInteger(maxLength) && maxLength > 0)) throw new TypeError('maxLength is not a number greater than 0')
    return str.length > maxLength ? `<span title="${str}">${str.slice(0, maxLength - 1)}…</span>` : str
  }
}
