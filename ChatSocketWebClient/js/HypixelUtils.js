// Helper functions for Hypixel Housing (copy this folder to another location later)

class HypixelUtils {
  static selectPos1([x1, y1, z1]) {
    if (!Number.isInteger(x1) || !Number.isInteger(y1) || !Number.isInteger(z1))
      throw new TypeError(`pos1 is not of type {x: int, y: int, z: int}`)

    return [`tp ${x1 + 0.5} ${y1 + 0.5} ${z1 + 0.5}`, 'posa']
  }

  static selectPos2([x2, y2, z2]) {
    if (!Number.isInteger(x2) || !Number.isInteger(y2) || !Number.isInteger(z2))
      throw new TypeError(`pos2 is not of type {x: int, y: int, z: int}`)

    return [`tp ${x2 + 0.5} ${y2 + 0.5} ${z2 + 0.5}`, 'posb']
  }

  static selectRegion([x1, y1, z1], [x2, y2, z2]) {
    return this.selectPos1([x1, y1, z1]).concat(this.selectPos2([x2, y2, z2]))
  }

  static proTool(tool, args = null) {
    const tools = ['set', 'fill', 'replace', 'walls', 'wireframe', 'cut', 'copy', 'paste', 'undo']
    if (!tools.includes(tool)) throw new TypeError(`tool is not one of: ${tools.split(', ')}`)
    if (args && typeof args !== 'string') throw new TypeError(`args is defined but is not a string`)

    return `${tool} ${args ?? ''}`
  }
}
