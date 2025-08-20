import { @Vigilant, @ButtonProperty, @CheckboxProperty, @ColorProperty, @NumberProperty, @ParagraphProperty, @SelectorProperty, @SliderProperty, @SwitchProperty, @TextProperty } from 'Vigilance'
import { PREFIX, TAB, rng, generateId, chat, error, line, dialog } from './'

@Vigilant('ChatSocket', `ChatSocket Settings`, {
  getCategoryComparator: () => (a, b) => {
    const categories = ['General', 'WebSocket', 'Debug']
    return categories.indexOf(a.name) - categories.indexOf(b.name)
  },
  getSubcategoryComparator: () => (a, b) => {
    const subcategories = ['General', 'WebSocket', 'Logger', 'Errors']
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
  @CheckboxProperty({
    name: 'Check Latest Version',
    description: 'Keep track of whether you have the latest version of ChatSocket.',
    category: 'General',
    subcategory: 'Version',
  })
  checkLatestVersion = true

  @ParagraphProperty({
    name: 'WebSocket URI',
    description: 'Where the WebSocket server is hosted.',
    category: 'WebSocket',
    subcategory: 'WebSocket',
    placeholder: 'ws://',
    triggerActionOnInitialization: false,
  })
  wsURI = 'ws://localhost:47576'

  @TextProperty({
    name: 'WebSocket Secret Key',
    description: 'Key for authenticating messages from ChatSocket.',
    category: 'WebSocket',
    subcategory: 'WebSocket',
    protected: true,
  })
  wsSecret = rng.nextLong().toString(36) + rng.nextLong().toString(36)

  /* @ParagraphProperty({
    name: 'Hostname',
    description: 'Enter the address the WebSocket.',
    category: 'General',
    subcategory: 'WebSocket',
    placeholder: 'myhostname.com',
  })
  wsHostname = 'localhost' */

  /* @NumberProperty({
    name: 'Port',
    description: 'Enter the port number for the WebSocket (0 - 65535).',
    category: 'General',
    subcategory: 'WebSocket',
    min: 0,
    max: 65535,
  })
  wsPort = 47576 */

  /* @TextProperty({
    name: 'Port',
    description: 'Enter the port number for the WebSocket (0 - 65535).',
    category: 'General',
    subcategory: 'WebSocket',
  })
  wsPort = '47576' */

  @SwitchProperty({
    name: 'Chat Logger',
    description: 'Log WebSocket traffic in chat.',
    category: 'Debug',
    subcategory: 'Logger',
  })
  logChat = false

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
  // fun read(fileLocation: String): String?
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

    /* this.registerListener('WebSocket URI', (wsURI) => {
      this.wsURI = wsURI.trim()
      const wsPattern = /^(ws|wss):\/\/([a-zA-Z0-9.-]+|\[[0-9a-fA-F:]+\])(:\d{1,5})?(\/.*)?$/

      if (!wsPattern.test(this.wsURI)) {
        this.wsURI = 'ws://localhost:47576'
        return error(`&f${this.wsURI}&c is not a valid WebSocket URI.`, this.printStackTrace)
      }
    }) */

    /* this.registerListener('Hostname', () => {
      this.wsHostname ||= 'localhost'
    })

    this.registerListener('Port', () => {
      this.wsPort = +this.wsPort
      if (!Number.isFinite(+this.wsPort) || +this.wsPort < 0 || +this.wsPort > 65535) this.wsPort = '47576'
    }) */
  }
}

const settings = new Settings()
export default settings
