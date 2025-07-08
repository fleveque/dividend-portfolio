import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll(".editable-target-price").forEach(element => {
        element.addEventListener("click", () => {
          const stockId = element.getAttribute("data-stock-id");
          const form = document.getElementById(`target-price-form-${stockId}`);
          form.classList.toggle("hidden");
        });
      });
    });
  }
}

