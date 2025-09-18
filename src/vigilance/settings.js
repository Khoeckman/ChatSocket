import { @Vigilant, @ButtonProperty, @CheckboxProperty, @ColorProperty, @NumberProperty, @ParagraphProperty, @SelectorProperty, @SliderProperty, @SwitchProperty, @TextProperty } from './'
import { PREFIX, rng } from '../utils'

const Long = Java.type('java.lang.Long')

@Vigilant('ChatSocket', PREFIX.replaceAll('&', '§') + 'Settings', {
  getCategoryComparator: () => (a, b) => {
    const categories = ['General', 'WebSocket', 'Debug']
    return categories.indexOf(a.name) - categories.indexOf(b.name)
  },
  getSubcategoryComparator: () => (a, b) => {
    const subcategories = ['General', 'Connection', 'Security', 'Events', 'Logger', 'Errors']
    return (
      subcategories.indexOf(a.getValue()[0].attributesExt.subcategory) -
      subcategories.indexOf(b.getValue()[0].attributesExt.subcategory)
    )
  },
  getPropertyComparator: () => (a, b) => {
    const names = [
      'Check Latest Version',
      'URL',
      'Autoconnect',
      'Secret Key',
      'Channel',
      'Chat Event Filter',
      'Command Events',
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
    name: 'URL',
    description: 'Where the WebSocket server is hosted.',
    category: 'WebSocket',
    subcategory: 'Connection',
    placeholder: 'ws://address:port',
  })
  wsURL = 'ws://localhost:47576'
  // wss://chatsocket-a1xp.onrender.com

  @SwitchProperty({
    name: 'Autoconnect',
    description: 'Create a new connection when the WebSocket is in the CLOSING or CLOSED state.',
    category: 'WebSocket',
    subcategory: 'Connection',
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

  @TextProperty({
    name: 'Channel',
    description: 'ChatSocket will only communicate with clients on this channel.',
    category: 'WebSocket',
    subcategory: 'Security',
    protected: true,
  })
  wsChannel = 'Project_' + rng.nextInt().toString(36)

  @ParagraphProperty({
    name: 'Chat Event Filter',
    description:
      'Only send a CHAT event when the message matches this RegEx. Exclude the open and close slash. Use & for color formatting. &9&nhttps://regexr.com/',
    category: 'WebSocket',
    subcategory: 'Events',
    placeholder: 'RegEx',
  })
  wsChatEventFilter = '^&r&7\\*\\s&r'

  @CheckboxProperty({
    name: 'Command Events',
    description: 'Send a CMD event for every command you execute.',
    category: 'WebSocket',
    subcategory: 'Events',
  })
  wsCmdEvent = false

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
    description: 'Print Java exceptions thrown by the WebSocket.',
    category: 'Debug',
    subcategory: 'Errors',
  })
  wsPrintEx = true

  constructor() {
    this.initialize(this)

    /* this.registerListener('URL', new_wsURL => {
      new_wsURL = new_wsURL.trim()

      if (!new_wsURL.match(/^(ws|wss):\/\/([a-zA-Z0-9.-]+|\[[0-9a-fA-F:]+\])(:\d{1,5})?(\/.*)?$/)) {
        // this.wsURL = 'ws://localhost:47576'
        return error(new Error(`&f${new_wsURL}&c is an invalid WebSocket URL`), this.printStackTrace)
      }
    })

    this.registerListener('Secret Key', wsSecret => {
      this.wsSecret = wsSecret.replaceAll(' ', '')
    }) */

    // this.addDependency('File Logger Directory', 'File Logger')
  }
}

export default settings = new Settings()
