import { @Vigilant, @ButtonProperty, @CheckboxProperty, @ColorProperty, @NumberProperty, @ParagraphProperty, @SelectorProperty, @SliderProperty, @SwitchProperty, @TextProperty } from './'
import { PREFIX, rng } from '../utils'

const Long = Java.type('java.lang.Long')

@Vigilant('ChatSocket', PREFIX.replaceAll('&', '§') + 'Settings', {
  getCategoryComparator: () => (a, b) => {
    const categories = ['WebSocket', 'Version', 'Debug']
    return categories.indexOf(a.name) - categories.indexOf(b.name)
  },
  getSubcategoryComparator: () => (a, b) => {
    const subcategories = ['General', 'WebSocket', 'Authentication', 'Logger', 'Errors']
    return (
      subcategories.indexOf(a.getValue()[0].attributesExt.subcategory) - subcategories.indexOf(b.getValue()[0].attributesExt.subcategory)
    )
  },
  getPropertyComparator: () => (a, b) => {
    const names = [
      'Check Latest Version',
      'URI',
      'Autoconnect',
      'Channel Key',
      'Regenerate Channel Key',
      'Chat Logger',
      'File Logger',
      'File Logger Directory',
      'Stack Trace',
      'WebSocket Exceptions',
    ]
    return names.indexOf(a.attributesExt.name) - names.indexOf(b.attributesExt.name)
  },
})
class Settings {
  // WebSocket

  @ParagraphProperty({
    name: 'URI',
    description: 'Where the WebSocket server is hosted.',
    category: 'WebSocket',
    subcategory: 'WebSocket',
    placeholder: 'ws://',
    triggerActionOnInitialization: true,
  })
  wsURI = 'wss://chatsocket-a1xp.onrender.com/'

  @CheckboxProperty({
    name: 'Autoconnect',
    description: 'Connect when WebSocket is in CLOSING or CLOSED state.',
    category: 'WebSocket',
    subcategory: 'WebSocket',
  })
  wsAutoconnect = true

  @TextProperty({
    name: 'Channel Key',
    description: 'Every ChatSocket message starts with this key, allowing the server to route them to the controller with the same key.',
    category: 'WebSocket',
    subcategory: 'Authentication',
    protected: true,
    triggerActionOnInitialization: true,
  })
  wsChannel = Long.toHexString(rng.nextLong()) + Long.toHexString(rng.nextLong())

  @ButtonProperty({
    name: 'Regenerate Channel Key',
    description: 'You can also edit the field and choose your own key.',
    category: 'WebSocket',
    subcategory: 'Authentication',
    placeholder: '§cRegenerate',
  })
  wsRegenKey() {
    this.wsChannel = Long.toHexString(rng.nextLong()) + Long.toHexString(rng.nextLong())
    this.openGUI()
  }

  // Version

  @CheckboxProperty({
    name: 'Check Latest Version',
    description: 'Keep track of whether you have the latest version of ChatSocket.',
    category: 'Version',
    subcategory: 'Version',
  })
  checkLatestVersion = true

  // Debug

  @SwitchProperty({
    name: 'Chat Logger',
    description: 'Log WebSocket traffic in chat.',
    category: 'Debug',
    subcategory: 'Logger',
  })
  wsLogChat = true

  /* @SwitchProperty({
    name: 'File Logger',
    description: 'Log WebSocket traffic in a file.',
    category: 'Debug',
    subcategory: 'Logger',
  })
  wsLogFile = false

  @ParagraphProperty({
    name: 'File Logger Directory',
    description: 'Location of the logs.',
    category: 'Debug',
    subcategory: 'Logger',
  })
  logFileDir = './config/ChatTriggers/modules/ChatSocket/log/' */

  @CheckboxProperty({
    name: 'Stack Trace',
    description: 'Print the stack trace of errors.',
    category: 'Debug',
    subcategory: 'Errors',
  })
  printStackTrace = false

  @CheckboxProperty({
    name: 'WebSocket Exceptions',
    description: 'Print java exceptions thrown by the WebSocket.',
    category: 'Debug',
    subcategory: 'Errors',
  })
  wsPrintEx = true

  constructor() {
    this.initialize(this)

    /* this.registerListener('URI', new_wsURI => {
      new_wsURI = new_wsURI.trim()

      if (!new_wsURI.match(/^(ws|wss):\/\/([a-zA-Z0-9.-]+|\[[0-9a-fA-F:]+\])(:\d{1,5})?(\/.*)?$/)) {
        // this.wsURI = 'ws://localhost:47576'
        return error(new Error(`&f${new_wsURI}&c is an invalid WebSocket URI`), this.printStackTrace)
      }
    })

    this.registerListener('Channel Key', wsChannel => {
      this.wsChannel = wsChannel.replaceAll(' ', '')
    }) */

    // this.addDependency('File Logger Directory', 'File Logger')
  }
}

export default settings = new Settings()
