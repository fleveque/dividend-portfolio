import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.setupEditableTargetPrices()
  }

  setupEditableTargetPrices() {
    this.element.querySelectorAll(".editable-target-price").forEach(element => {
      element.addEventListener("click", (e) => {
        this.startInlineEdit(e.target)
      });
    });
  }

  startInlineEdit(displayElement) {
    const stockId = displayElement.getAttribute("data-stock-id");
    const currentValue = displayElement.getAttribute("data-current-value");
    
    // Create input element
    const input = document.createElement("input");
    input.type = "number";
    input.step = "0.01";
    input.value = currentValue;
    input.className = "inline-edit-input w-20 p-1 border rounded text-sm";
    
    // Create save button
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "✓";
    saveBtn.className = "ml-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600";
    saveBtn.type = "button";
    
    // Create cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "✕";
    cancelBtn.className = "ml-1 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600";
    cancelBtn.type = "button";
    
    // Store original content
    const originalContent = displayElement.innerHTML;
    
    // Replace content with input and buttons
    displayElement.innerHTML = "";
    displayElement.appendChild(input);
    displayElement.appendChild(saveBtn);
    displayElement.appendChild(cancelBtn);
    
    // Focus and select input
    input.focus();
    input.select();
    
    // Save function
    const save = () => {
      const newValue = input.value;
      if (newValue && newValue !== currentValue) {
        this.updateTargetPrice(stockId, newValue, displayElement, originalContent);
      } else {
        this.cancelEdit(displayElement, originalContent);
      }
    };
    
    // Cancel function
    const cancel = () => {
      this.cancelEdit(displayElement, originalContent);
    };
    
    // Event listeners
    saveBtn.addEventListener("click", save);
    cancelBtn.addEventListener("click", cancel);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") save();
      if (e.key === "Escape") cancel();
    });
    input.addEventListener("blur", () => {
      // Small delay to allow button clicks to register
      setTimeout(() => {
        if (document.activeElement !== saveBtn && document.activeElement !== cancelBtn) {
          cancel();
        }
      }, 150);
    });
  }

  updateTargetPrice(stockId, newValue, displayElement, originalContent) {
    // Show loading state
    displayElement.innerHTML = '<span class="text-gray-500">Updating...</span>';
    
    // Create form data
    const formData = new FormData();
    formData.append("target_price", newValue);
    formData.append("_method", "PATCH");
    formData.append("authenticity_token", document.querySelector('meta[name="csrf-token"]').content);
    
    // Get the update URL from the page
    const updateUrl = `/radars/${this.getRadarId()}/stocks/${stockId}`;
    
    fetch(updateUrl, {
      method: "POST",
      body: formData,
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      }
    })
    .then(response => {
      if (response.ok) {
        return response.json().then(data => {
          // Use the server-formatted value to maintain consistency with Ruby decorator
          displayElement.innerHTML = data.target_price;
          displayElement.setAttribute("data-current-value", newValue);
          
          // Update the row styling if price_status_class is provided
          if (data.price_status_class) {
            const row = displayElement.closest('tr');
            if (row) {
              // Remove existing border classes
              row.className = row.className.replace(/border-\w+-\d+/g, '').replace(/bg-gradient-to-r/g, '').replace(/from-\w+-\d+/g, '').replace(/to-\w+-\d+/g, '');
              // Add new classes
              row.className += ` ${data.price_status_class}`;
            }
          }
        });
      } else {
        throw new Error("Update failed");
      }
    })
    .catch(error => {
      console.error("Error updating target price:", error);
      displayElement.innerHTML = originalContent;
      alert("Failed to update target price. Please try again.");
    });
  }

  cancelEdit(displayElement, originalContent) {
    displayElement.innerHTML = originalContent;
  }

  getRadarId() {
    // Get radar ID from the data attribute
    const radarId = this.element.getAttribute('data-radar-id');
    if (radarId) {
      return radarId;
    }
    
    // Fallback: extract from URL (for /radar path)
    const pathParts = window.location.pathname.split('/');
    const radarIndex = pathParts.indexOf('radar');
    if (radarIndex !== -1 && pathParts[radarIndex + 1]) {
      return pathParts[radarIndex + 1];
    }
    
    console.error('Could not find radar ID');
    return null;
  }
}

