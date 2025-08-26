class Utils {
  static mcToAnsi(str) {
    const codes = {
      0: '\x1b[38;5;0m', // black
      1: '\x1b[38;5;4m', // dark blue
      2: '\x1b[38;5;2m', // dark green
      3: '\x1b[38;5;6m', // dark aqua
      4: '\x1b[38;5;1m', // dark red
      5: '\x1b[38;5;5m', // dark purple
      6: '\x1b[38;5;3m', // gold
      7: '\x1b[38;5;7m', // gray
      8: '\x1b[38;5;8m', // dark gray
      9: '\x1b[38;5;12m', // blue
      a: '\x1b[38;5;10m', // green
      b: '\x1b[38;5;14m', // aqua
      c: '\x1b[38;5;9m', // red
      d: '\x1b[38;5;13m', // light purple
      e: '\x1b[38;5;11m', // yellow
      f: '\x1b[38;5;15m', // white
      l: '\x1b[1m', // bold
      m: '\x1b[9m', // strikethrough
      n: '\x1b[4m', // underline
      o: '\x1b[3m', // italic
      r: '\x1b[0m', // reset
    }
    return str.replace(/[&§]([0-9a-fklmnor])/g, (_, code) => codes[code] || '') + '\x1b[0m'
  }

  static removeMcFormatting(str) {
    return String(str).replace(/[&§][0-9a-fklmnor]/g, '')
  }

  static isUUID(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(str)
  }
}

export default Utils
