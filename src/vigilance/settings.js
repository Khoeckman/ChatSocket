import { @Vigilant, @ButtonProperty, @CheckboxProperty, @ColorProperty, @NumberProperty, @ParagraphProperty, @SelectorProperty, @SliderProperty, @SwitchProperty, @TextProperty } from './'
import { PREFIX, rng } from '../utils'

const Long = Java.type('java.lang.Long')

@Vigilant('ChatSocket', PREFIX.replaceAll('&', '§') + 'Settings', {
  getCategoryComparator: () => (a, b) => {
    const categories = ['General', 'WebSocket', 'Debug']
    return categories.indexOf(a.name) - categories.indexOf(b.name)
  },
  getSubcategoryComparator: () => (a, b) => {
    const subcategories = ['General', 'WebSocket', 'Logger', 'Errors']
    return (
      subcategories.indexOf(a.getValue()[0].attributesExt.subcategory) -
      subcategories.indexOf(b.getValue()[0].attributesExt.subcategory)
    )
  },
  getPropertyComparator: () => (a, b) => {
    const names = [
      'Check Latest Version',
      'URI',
      'Autoconnect',
      'Secret Key',
      'Chat Filter',
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
    name: 'Secret Key',
    description: 'The ChatSocket server uses this to authenticate every connection.',
    category: 'WebSocket',
    subcategory: 'Security',
    protected: true,
  })
  wsSecret = Long.toHexString(rng.nextLong()) + Long.toHexString(rng.nextLong())

  @ParagraphProperty({
    name: 'Chat Filter',
    description: 'Only send §6§lCHAT§r events that match this RegEx. Use & for color formatting.',
    category: 'WebSocket',
    subcategory: 'Security',
    placeholder: 'RegEx',
  })
  wsChatEventFilter = '^&8\\*\\s'

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

    this.registerListener('Secret Key', wsSecret => {
      this.wsSecret = wsSecret.replaceAll(' ', '')
    }) */

    this.addDependency('Chat Event Filter RegEx', 'Chat Event Filter')
    // this.addDependency('File Logger Directory', 'File Logger')
  }
}

export default settings = new Settings()
