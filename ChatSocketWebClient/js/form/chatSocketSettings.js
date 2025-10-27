const chatSocketSettingsDialog = document.getElementById('chatSocketSettingsDialog')
const chatSocketSettingsForm = document.getElementById('chatSocketSettings')

const ChatSocketStore = new StorageManager('chatsocket.settings', {
  defaultValue: {
    url: 'wss://chatsocket-a1xp.onrender.com',
    name: 'WebClient',
    secret: '39063e0f5d3604e6bd5e908caa1cf17cb5967cbd1190c60be383ba9a33a0c28b',
    channel: 'Default',
    logFromField: false,
  },
})

const formValidator = new FormValidator(chatSocketSettingsForm)

formValidator.form.fields = {
  url: formValidator.form.querySelector('.url input'),
  name: formValidator.form.querySelector('.name input'),
  secret: formValidator.form.querySelector('.secret input'),
  channel: formValidator.form.querySelector('.channel input'),
  logFromField: formValidator.form.querySelector('.log-from-field input'),
}

formValidator.form.actions = {
  reset: formValidator.form.querySelector('#chatsocketsettings-action-reset'),
}

// Load `ChatSocketStore` into the form fields
function populateFormWithSettings() {
  const { url, name: name_, secret, channel, logFromField } = formValidator.form.fields
  const settings = ChatSocketStore.value
  url.value = settings.url
  name_.value = settings.name
  secret.value = settings.secret
  channel.value = settings.channel
  logFromField.checked = settings.logFromField
}
populateFormWithSettings()

// Form reset button handler
formValidator.form.actions.reset.addEventListener('click', () => {
  ChatSocketStore.reset()
  populateFormWithSettings()
})

// Form submission
formValidator.form.addEventListener('submit', (e) => {
  const form = e.target
  if (!(form instanceof HTMLFormElement)) return
  e.preventDefault()

  const { url, name, secret, channel, logFromField } = form.fields
  ChatSocketStore.value = {
    url: url.value,
    name: name.value,
    secret: secret.value,
    channel: channel.value,
    logFromField: logFromField.checked,
  }

  connect(true)
  chatSocketSettingsDialog.close()
})

chatSocketSettingsDialog.addEventListener('mousedown', (e) => {
  if (e.target === chatSocketSettingsDialog) chatSocketSettingsDialog.close()
})

// Validation

formValidator.addValidator({
  name: 'chatsocketsettings-url',
  method: (field) => /^wss?:\/\/(?:[a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+(?::\d{1,5})?(?:\/\S*)?$/.test(field.value),
  message: 'WebSocket Server URL does not match pattern: ws(s)://domain(:port)(/path)',
})

formValidator.addValidator({
  name: 'chatsocketsettings-name',
  method: (field) => field.value.length,
  message: 'Name is a required field',
})

formValidator.addValidator({
  name: 'chatsocketsettings-secret',
  method: (field) => field.value.trim().length,
  message: 'Secret Key is a required field',
})

formValidator.addValidator({
  name: 'chatsocketsettings-channel',
  method: (field) => typeof field.value === 'string',
  message: 'Channel must be a string (XSS)',
})

formValidator.addValidator({
  name: 'chatsocketsettings-log-from-field',
  method: (field) => typeof field.checked === 'boolean',
  message: 'Log From Field must be a boolean (XSS)',
})
