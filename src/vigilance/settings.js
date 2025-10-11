import { @Vigilant, @ButtonProperty, @CheckboxProperty, @ColorProperty, @DecimalSliderProperty, @NumberProperty, @ParagraphProperty, @PercentSliderProperty, @SelectorProperty, @SliderProperty, @SwitchProperty, @TextProperty } from './'
import { rng } from '../utils'

const Long = Java.type('java.lang.Long')

@Vigilant('ChatSocket', '§6ChatSocket §eSettings', {
  getCategoryComparator: () => (a, b) => {
    const categories = ['General', 'WebSocket', 'Command Queue', 'Debug']
    return categories.indexOf(a.name) - categories.indexOf(b.name)
  },
  getSubcategoryComparator: () => (a, b) => {
    const subcategories = ['General', 'Connection', 'Security', 'Events', 'Heat Manager', 'Logger', 'Errors']
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
      'Print CHANNEL Events',
      'Enable CHAT Event RegEx Capture',
      'CHAT Event RegEx Capture',
      'Send CLIENT_SAY Events',
      'Send SERVER_SAY Events',
      'Send CLIENT_CMD Events',
      'Send SERVER_CMD Events',
      'Execute EXEC Events',
      'Enable Heat Manager',
      'Heat Limit',
      'Command Heat',
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

  // General > Version

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

  // WebSocket > Security

  @TextProperty({
    name: 'Name',
    description: `The name for this ChatSocket client. Defaults to "${Player.getName()}".`,
    category: 'WebSocket',
    subcategory: 'Security',
  })
  wsName = ''

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

  // WebSocket > Events

  @CheckboxProperty({
    name: 'Print CHANNEL Events',
    description: 'Print when someone join/leaves your channel.',
    category: 'WebSocket',
    subcategory: 'Events',
  })
  wsPrintChannelEvent = true

  @SwitchProperty({
    name: 'Enable CHAT Event RegEx Capture',
    description: 'Only send a CHAT event when the message matches a RegEx pattern.',
    category: 'WebSocket',
    subcategory: 'Events',
  })
  wsEnableChatEventFilter = true

  @ParagraphProperty({
    name: 'CHAT Event RegEx Capture',
    description:
      'Only send a CHAT event when the message matches this RegEx. Exclude the open and close slash. Use & for color formatting. &9&nhttps://regexr.com/',
    category: 'WebSocket',
    subcategory: 'Events',
    placeholder: '^&r&7\\*\\s&r([sS]*)',
  })
  wsChatEventFilter = '^&r&7*s&r&f[ChatSocket]'

  @CheckboxProperty({
    name: 'Send CLIENT_SAY Events',
    description: 'Send a CLIENT_SAY event for every chat you receive. This includes chats of yourself.',
    category: 'WebSocket',
    subcategory: 'Events',
  })
  wsDoClientSayEvent = true

  @CheckboxProperty({
    name: 'Send SERVER_SAY Events',
    description: 'Send a SERVER_SAY event for every chat you send to a server.',
    category: 'WebSocket',
    subcategory: 'Events',
  })
  wsDoServerSayEvent = false

  @CheckboxProperty({
    name: 'Send CLIENT_CMD Events',
    description: 'Send a CLIENT_CMD event for every client-side command you execute that is intercepted by a mod.',
    category: 'WebSocket',
    subcategory: 'Events',
  })
  wsDoClientCmdEvent = true

  @CheckboxProperty({
    name: 'Send SERVER_CMD Events',
    description: 'Send a SERVER_CMD event for every server-side command you execute.',
    category: 'WebSocket',
    subcategory: 'Events',
  })
  wsDoServerCmdEvent = true

  @CheckboxProperty({
    name: 'Execute EXEC Events',
    description: 'EXEC events allow other clients to invoke methods on your Minecraft instance.',
    category: 'WebSocket',
    subcategory: 'Events',
  })
  wsDoExecEvent = false

  // Command Queue

  // Command Queue > Heat Manager

  @SwitchProperty({
    name: 'Enable Heat Manager',
    description: 'Prevent getting kicked for sending too many commands.',
    category: 'Command Queue',
    subcategory: 'Heat Manager',
  })
  enableCmdHeat = true

  @NumberProperty({
    name: 'Heat Limit',
    description: 'Maximum amount of heat before commands start getting queued.',
    category: 'Command Queue',
    subcategory: 'Heat Manager',
    min: 0,
    max: 1000,
    increment: 10,
  })
  cmdHeatLimit = '200'

  @NumberProperty({
    name: 'Command Heat',
    description: 'Amount of heat generated each time a command is executed.',
    category: 'Command Queue',
    subcategory: 'Heat Manager',
    min: 1,
    max: 100,
  })
  cmdHeatGeneration = '20'

  // Debug

  // Debug > Logger

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

  // Debug > Errors

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

    // this.registerListener('URL', (wsURL) => {
    //   this.wsURL = wsURL.trim()
    //   this.save()

    //   // if (!new_wsURL.match(/^(ws|wss):\/\/([a-zA-Z0-9.-]+|\[[0-9a-fA-F:]+\])(:\d{1,5})?(\/.*)?$/)) {
    //   //   this.wsURL = 'ws://localhost:47576'
    //   //   return error(new Error(`&f${new_wsURL}&c is an invalid WebSocket URL`), this.printStackTrace)
    //   // }
    // })

    this.setSubcategoryDescription(
      'Command Queue',
      'Heat Manager',
      'Queue commands that would exceed the command heat limit to avoid disconnection.\nHeat increases when executing commands and decreases by 1 each tick.'
    )

    this.addDependency('Enable CHAT Event RegEx Capture', 'CHAT Event RegEx Capture')

    this.addDependency('Enable Heat Manager', 'Heat Limit')
    this.addDependency('Enable Heat Manager', 'Command Heat')

    // this.addDependency('File Logger Directory', 'File Logger')
  }
}

export default settings = new Settings()
