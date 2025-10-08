'use strict'

;(() => {
  // Theres no need to modify this file, instead look into app.js
  const chatSocketStatus = document.getElementById('chatSocketStatus')
  const chatSocketForm = document.getElementById('chatSocket')

  chatSocketForm.fields = {
    type: chatSocketForm.querySelector('.type select'),
    message: chatSocketForm.querySelector('.message input'),
    data: chatSocketForm.querySelector('.data input'),
  }

  function updateReadyState(readyState) {
    const name = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][+readyState ?? 3]
    chatSocketStatus.innerText = name
    chatSocketStatus.dataset.readyState = +readyState ?? 3
    chatSocketForm.dataset.readyState = +readyState ?? 3
  }

  // WebSocket
  let ws = null
  let retryCount = 0

  window.onload = () => {
    ws = new ChatSocketWebClient(false ? 'ws://legendarygames.dev:47576' : 'wss://chatsocket-a1xp.onrender.com', {
      name: 'GitHubWebClient',
      [atob('c2VjcmV0')]: atob(
        'MzkwNjNlMGY1ZDM2MDRlNmJkNWU5MDhjYWExY2YxN2NiNTk2N2NiZDExOTBjNjBiZTM4M2JhOWEzM2EwYzI4Yg'
      ),
      userAgent: window.navigator.userAgent,
      channel: 'Hypixel',
      onlog,
    })

    // Custom logic
    new MinecraftApp(ws)

    updateReadyState(ws.readyState)

    const timeout = setTimeout(() => {
      if (ws.readyState === ChatSocketWebClient.CONNECTING) ws.close()
    }, 2000)

    ws.addEventListener('open', () => {
      clearTimeout(timeout)
      retryCount = 0
      updateReadyState(ws.readyState)
    })

    ws.addEventListener('close', () => {
      clearTimeout(timeout)
      updateReadyState(ws.readyState)
      setTimeout(connect, Math.min(30000, 2000 * Math.pow(1.25, retryCount++)))
    })
  }

  // Log
  function onlog({ detail: { line, type, message, data } }) {
    const logEl = document.getElementById('log')

    if (logEl === null) {
      console.log(Utils.removeMcFormatting(line))
      return
    }
    const lineEl = Utils.mcToHTML(line)
    lineEl.title = new Date().toLocaleString('nl-BE')

    if (typeof type === 'string') {
      lineEl.dataset.json = JSON.stringify({ type, message, data })
      lineEl.style.cursor = 'copy'

      lineEl.addEventListener('click', (e) => {
        const json = lineEl.dataset.json
        if (!json) return

        const { type, message, data } = JSON.parse(json)

        // If `type` is an option of `chatSocketForm.fields.type`
        if ([...chatSocketForm.fields.type.querySelectorAll('option')].some((option) => option.textContent === type)) {
          chatSocketForm.fields.type.value = type
        }
        chatSocketForm.fields.message.value = message
        chatSocketForm.fields.data.value = JSON.stringify(data)
      })
    }

    logEl.prepend(document.createElement('br'))
    logEl.prepend(lineEl)

    if (logEl.children.length > 1024) logEl.removeChild(logEl.lastChild)
  }

  // Form
  const messageBytes = document.querySelector('.message .bytes')
  const dataBytes = document.querySelector('.data .bytes')

  chatSocketForm.fields.message.name = `chatsocket-message-${chatSocketForm.fields.type.value.toLowerCase()}`
  chatSocketForm.fields.data.name = `chatsocket-data-${chatSocketForm.fields.type.value.toLowerCase()}`

  const updateBytes = (el, value) => (el.innerText = `(${new TextEncoder().encode(value).byteLength} B)`)

  updateBytes(messageBytes, chatSocketForm.fields.message.value)
  updateBytes(dataBytes, chatSocketForm.fields.data.value)

  chatSocketForm.fields.type.addEventListener('input', (e) => {
    chatSocketForm.fields.message.name = `message-${e.target.value.toLowerCase()}`
    chatSocketForm.fields.data.name = `data-${e.target.value.toLowerCase()}`
  })

  chatSocketForm.fields.message.addEventListener('input', (e) => {
    updateBytes(messageBytes, e.target.value)
  })

  chatSocketForm.fields.data.addEventListener('input', (e) => {
    e.target.classList.remove('error')
    updateBytes(dataBytes, e.target.value)
  })

  chatSocketForm.addEventListener('submit', (e) => {
    e.preventDefault()

    if (!ws || ws.readyState !== ChatSocketWebClient.OPEN) return

    const form = e.target
    const type = form.fields.type.value
    const message = form.fields.message.value
    let data = {}

    try {
      data = JSON.parse(form.fields.data.value || '{}')
      if (!data || data.constructor !== Object) data = {}

      form.fields.data.classList.remove('error')
      form.fields.data.value = JSON.stringify(data)

      ws.sendEncoded(type, message, data)
    } catch (err) {
      console.error(err)
      form.fields.data.classList.add('error')
    }
  })

  // Falling chars animation
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

  new FallingChars(document.getElementById('falling-chars'), chars, '', {
    spawnDensityPerSecond: 15,
  })

  // Hue rotation effect
  /* let hue = 40
let frame = 0

function loop() {
  if (++frame % 8 === 0) {
    document.documentElement.style.setProperty('--hue', hue)
    hue = (hue + 1) % 360
  }
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop) */
})()
