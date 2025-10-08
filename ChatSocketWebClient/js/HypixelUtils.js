// Helper functions for Hypixel Housing (copy this folder to another location later)

class HypixelUtils {
  static selectRegion(ws, [x1, y1, z1], [x2, y2, z2]) {
    if (!(ws instanceof ChatSocketWebClient)) throw new TypeError('ws is not an instance of ChatSocketWebClient')
    if (!Number.isInteger(x1) || !Number.isInteger(y1) || !Number.isInteger(z1))
      throw new TypeError(`pos1 is not of type {x: int, y: int, z: int}`)
    if (!Number.isInteger(x2) || !Number.isInteger(y2) || !Number.isInteger(z2))
      throw new TypeError(`pos2 is not of type {x: int, y: int, z: int}`)

    return [`tp ${x1 + 0.5} ${y1 + 0.5} ${z1 + 0.5}`, 'posa', `tp ${x2 + 0.5} ${y2 + 0.5} ${z2 + 0.5}`, 'posb']
  }

  static proTool(ws, tool, args = null) {
    if (!(ws instanceof ChatSocketWebClient)) throw new TypeError('ws is not an instance of ChatSocketWebClient')
    const tools = ['set', 'fill', 'walls', 'wireframe', 'cut', 'copy', 'paste', 'undo']
    if (!tools.includes(tool)) throw new TypeError(`tool is not one of: ${tools.split(', ')}`)
    if (args && typeof args !== 'string') throw new TypeError(`args is defined but is not a string`)

    return `${tool} ${args ?? ''}`
  }
}
