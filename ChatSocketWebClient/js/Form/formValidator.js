class FormValidator {
  errors = []
  validators = []

  constructor(form) {
    this.form = form
    this.resetSummary()

    this.form.addEventListener('submit', (event) => this.onSubmit(event))
  }

  onLoad() {
    this.resetSummary()
    this.removeInlineErrors()
  }

  onSubmit(event) {
    this.onLoad()

    if (!this.validate()) {
      event.preventDefault()
      event.stopImmediatePropagation()
      this.showSummary()
      this.showInlineErrors()
    }
  }

  validate() {
    this.validators.forEach((validator) => {
      if (!validator.method(validator.field)) {
        // prevent multiple errors per field
        if (this.errors.map((error) => error.name).includes(validator.name)) return

        this.errors.push(validator)
      }
    })

    return this.errors.length === 0
  }

  addValidator(validator) {
    this.validators.push({
      field: this.form.elements[validator.name],
      ...validator,
    })
  }

  createInlineError(error) {
    const span = document.createElement('span')

    span.classList.add('field-error')
    span.innerText = error.message
    span.setAttribute('id', error.name + '-error')

    return span
  }

  showInlineErrors() {
    this.errors.forEach((error) => {
      const errorElement = this.createInlineError(error)

      if (error.field instanceof Node) {
        error.field.classList.add('invalid')
        error.field.setAttribute('aria-invalid', 'true')

        error.field.labels[0].insertBefore(errorElement, error.field.labels[0].lastElementChild)
      } else if (error.field instanceof NodeList) {
        error.field.forEach((node) => {
          node.classList.add('invalid')
          node.setAttribute('aria-describedby', errorElement.id)
          node.setAttribute('aria-invalid', 'true')

          const fieldSet = error.field[0].closest('fieldset')
          const legend = fieldSet?.querySelector('legend')

          if (legend) legend.appendChild(errorElement)
        })
      }
    })
  }

  removeInlineErrors() {
    this.form.querySelectorAll('.field-error').forEach((element) => element.remove())

    this.form.querySelectorAll('.invalid').forEach((element) => {
      element.removeAttribute('aria-describedby')
      element.removeAttribute('aria-invalid')
      element.classList.remove('invalid')
    })

    this.errors = []
  }

  resetSummary() {
    const summmary = this.form.querySelector('.error-summary')
    if (!summmary) return

    summmary.style.display = 'none'
    this.form.querySelector('.error-summary ul').innerHTML = '' // clear ul
  }

  showSummary() {
    const summmary = this.form.querySelector('.error-summary')
    if (!summmary) return

    const ul = this.form.querySelector('.error-summary ul')

    // fill ul with links to the fields with an error
    this.errors.forEach((error) => {
      const a = document.createElement('a')

      // on condition the id of the field is the same as its name
      a.href = '#' + error.name
      a.innerText = error.message

      a.addEventListener('click', (event) => {
        event.preventDefault()

        const targetElement = document.querySelector(event.currentTarget.getAttribute('href'))
        if (!targetElement) return

        targetElement.focus()
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })

      const li = document.createElement('li')
      li.appendChild(a)
      ul.appendChild(li)
    })

    summmary.style.display = 'block'
    summmary.focus()
  }
}
