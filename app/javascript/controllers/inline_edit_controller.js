import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { 
    url: String, 
    stockId: String, 
    currentValue: String 
  }

  edit() {
    const currentText = this.element.textContent.trim()
    
    // Create input form
    const input = document.createElement("input")
    input.type = "number"
    input.step = "0.01"
    input.value = this.currentValueValue
    input.className = "w-20 p-1 border rounded text-sm"
    
    // Create save button
    const saveBtn = document.createElement("button")
    saveBtn.textContent = "✓"
    saveBtn.className = "ml-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
    saveBtn.type = "button"
    
    // Create cancel button
    const cancelBtn = document.createElement("button")
    cancelBtn.textContent = "✕"
    cancelBtn.className = "ml-1 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
    cancelBtn.type = "button"
    
    // Store original content
    const originalContent = this.element.innerHTML
    
    // Replace content
    this.element.innerHTML = ""
    this.element.appendChild(input)
    this.element.appendChild(saveBtn)
    this.element.appendChild(cancelBtn)
    
    input.focus()
    input.select()
    
    // Event handlers
    const save = () => this.save(input.value, originalContent)
    const cancel = () => this.cancel(originalContent)
    
    saveBtn.addEventListener("click", save)
    cancelBtn.addEventListener("click", cancel)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") save()
      if (e.key === "Escape") cancel()
    })
    
    // Auto-cancel on blur (with delay for button clicks)
    input.addEventListener("blur", () => {
      setTimeout(() => {
        if (document.activeElement !== saveBtn && document.activeElement !== cancelBtn) {
          cancel()
        }
      }, 150)
    })
  }

  save(newValue, originalContent) {
    if (newValue === this.currentValueValue) {
      this.cancel(originalContent)
      return
    }

    // Show loading
    this.element.innerHTML = '<span class="text-gray-500">Updating...</span>'
    
    // Submit via Turbo
    const form = document.createElement("form")
    form.method = "POST"
    form.action = this.urlValue
    form.style.display = "none"
    
    // CSRF token
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content
    const csrfInput = document.createElement("input")
    csrfInput.type = "hidden"
    csrfInput.name = "authenticity_token"
    csrfInput.value = csrfToken
    form.appendChild(csrfInput)
    
    // Method override
    const methodInput = document.createElement("input")
    methodInput.type = "hidden"
    methodInput.name = "_method"
    methodInput.value = "PATCH"
    form.appendChild(methodInput)
    
    // Stock ID
    const stockIdInput = document.createElement("input")
    stockIdInput.type = "hidden"
    stockIdInput.name = "stock_id"
    stockIdInput.value = this.stockIdValue
    form.appendChild(stockIdInput)
    
    // Target price
    const targetPriceInput = document.createElement("input")
    targetPriceInput.type = "hidden"
    targetPriceInput.name = "target_price"
    targetPriceInput.value = newValue
    form.appendChild(targetPriceInput)
    
    // Action type for inline updates
    const actionTypeInput = document.createElement("input")
    actionTypeInput.type = "hidden"
    actionTypeInput.name = "action_type"
    actionTypeInput.value = "update_target_inline"
    form.appendChild(actionTypeInput)
    
    document.body.appendChild(form)
    form.submit()
  }

  cancel(originalContent) {
    this.element.innerHTML = originalContent
  }
}
