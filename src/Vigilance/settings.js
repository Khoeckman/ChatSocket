import { @Vigilant, @ButtonProperty, @CheckboxProperty, @ColorProperty, @NumberProperty, @ParagraphProperty, @SelectorProperty, @SliderProperty, @SwitchProperty, @TextProperty } from './'
import { PREFIX, rng } from '../utils'

const Long = Java.type('java.lang.Long')

@Vigilant('ChatSocket', PREFIX.replaceAll('&', '§') + 'Settings', {
  getCategoryComparator: () => (a, b) => {
    const categories = ['General', 'WebSocket', 'Debug']
    return categories.indexOf(a.name) - categories.indexOf(b.name)
  },
  getSubcategoryComparator: () => (a, b) => {
    const subcategories = ['General', 'WebSocket', 'Connection', 'Logger', 'Errors']
    return (
      subcategories.indexOf(a.getValue()[0].attributesExt.subcategory) - subcategories.indexOf(b.getValue()[0].attributesExt.subcategory)
    )
  },
  getPropertyComparator: () => (a, b) => {
    const names = [
      'Check Version',
      'WebSocket URI',
      'WebSocket Secret Key',
      'Chat Logger',
      'File Logger',
      'File Logger Directory',
      'Stack Trace',
    ]
    return names.indexOf(a.attributesExt.name) - names.indexOf(b.attributesExt.name)
  },
})
class Settings {
  // General

  @CheckboxProperty({
    name: 'Check Latest Version',
    description: 'Keep track of whether you have the latest version of ChatSocket.',
    category: 'General',
    subcategory: 'Version',
  })
  checkLatestVersion = true

  // WebSocket

  @ParagraphProperty({
    name: 'URI',
    description: 'Where the WebSocket server is hosted.',
    category: 'WebSocket',
    subcategory: 'WebSocket',
    placeholder: 'ws://',
    triggerActionOnInitialization: false,
  })
  wsURI = 'ws://localhost:47576'

  @TextProperty({
    name: 'Secret Key',
    description: 'Key included in every WebSocket message from ChatSocket. The WebSocket server should use this to authenticate messages.',
    category: 'WebSocket',
    subcategory: 'WebSocket',
    protected: true,
  })
  wsSecret = Long.toHexString(rng.nextLong()) + Long.toHexString(rng.nextLong())

  @ButtonProperty({
    name: 'Regenerate Secret Key',
    description: 'You can also edit the field and choose your own key.',
    category: 'WebSocket',
    subcategory: 'WebSocket',
    placeholder: '§cRegenerate',
  })
  wsRegenSecret() {
    this.wsSecret = Long.toHexString(rng.nextLong()) + Long.toHexString(rng.nextLong())
    this.openGUI()
  }

  @CheckboxProperty({
    name: 'Autoreconnect',
    description: 'Reconnecting with the WebSocket when the connection closes.',
    category: 'WebSocket',
    subcategory: 'Connection',
  })
  wsAuto = true

  // Debug

  @SwitchProperty({
    name: 'Chat Logger',
    description: 'Log WebSocket traffic in chat.',
    category: 'Debug',
    subcategory: 'Logger',
  })
  logChat = true

  @SwitchProperty({
    name: 'File Logger',
    description: 'Log WebSocket traffic in a file.',
    category: 'Debug',
    subcategory: 'Logger',
  })
  logFile = false

  @ParagraphProperty({
    name: 'File Logger Directory',
    description: 'Location of the logs.',
    category: 'Debug',
    subcategory: 'Logger',
  })
  logFileDir = './config/ChatTriggers/modules/ChatSocket/log/'

  @SwitchProperty({
    name: 'Stack Trace',
    description: 'Print the stack trace of errors.',
    category: 'Debug',
    subcategory: 'Errors',
  })
  printStackTrace = false

  constructor() {
    this.initialize(this)

    this.addDependency('File Logger Directory', 'File Logger')

    /* this.registerListener('URI', (wsURI) => {
      this.wsURI = wsURI.trim()
      const wsPattern = /^(ws|wss):\/\/([a-zA-Z0-9.-]+|\[[0-9a-fA-F:]+\])(:\d{1,5})?(\/.*)?$/

      if (!wsPattern.test(this.wsURI)) {
        this.wsURI = 'ws://localhost:47576'
        return error(`&f${this.wsURI}&c is not a valid WebSocket URI.`, this.printStackTrace)
      }
    }) */
  }
}

const settings = new Settings()
export default settings
