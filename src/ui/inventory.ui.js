import {
  getFilteredInventory,
  deleteItem,
} from "../features/inventory.features.js";
import { state } from "../core/state.js";
import { getItemBurnRate } from "../features/analysis.features.js";
import { renderPriceHistory } from "./price-chart.ui.js";

// Security: Helper to escape HTML and prevent XSS
const escapeHtml = (value) => {
  const str = value === null || value === undefined ? "" : String(value);
  const div = document.createElement("div");
  div.textContent = str;
  // Escape quotes for attribute safety
  return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};

// Robustness: Helper to ensure price is a valid finite number
const toSafePrice = (val) => {
  const num = Number(val);
  return Number.isFinite(num) ? num : 0;
};

export function renderInventory() {
  const tbody = document.querySelector("#inventory-table tbody");
  const itemCount = document.getElementById("item-count");
  const billItemDatalist = document.getElementById("bill-item-options");

  tbody.innerHTML = "";

  const items = getFilteredInventory();

  // Update Item Count
  if (itemCount) {
    itemCount.textContent = items.length;
  }

  // Populate Bill Item Datalist (Searchable)
  if (billItemDatalist) {
    billItemDatalist.innerHTML = "";
    const sortedItems = [...state.inventory].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    sortedItems.forEach((item) => {
      billItemDatalist.insertAdjacentHTML(
        "beforeend",
        `
        <option value="${escapeHtml(item.name)}">${escapeHtml(item.category)} - ₹${toSafePrice(item.price).toFixed(2)}</option>
      `,
      );
    });
  }

  // Conditional Rendering: Table vs Cards
  const isMobile = window.innerWidth <= 768;
  const inventoryCards = document.getElementById("inventory-cards");

  if (isMobile && inventoryCards) {
    // Mobile Card View
    if (tbody) tbody.innerHTML = ""; // Hide table body
    inventoryCards.innerHTML = "";
    inventoryCards.style.display = "flex";

    items.forEach((item) => {
      const safePrice = toSafePrice(item.price);
      // Calculate days remaining for this item
      const burnRateData = getItemBurnRate(item.name);
      const daysRemaining = burnRateData.daysRemaining;
      const daysRemainingDisplay =
        daysRemaining === Infinity
          ? "∞"
          : daysRemaining > 999
            ? ">999"
            : daysRemaining.toFixed(1);

      // Calculate stock percentage for meter (assuming 14 days = 100% full)
      const stockPercentage = Math.min((daysRemaining / 14) * 100, 100);
      const stockClass =
        stockPercentage < 20
          ? "critical"
          : stockPercentage < 50
            ? "warning"
            : "healthy";

      inventoryCards.insertAdjacentHTML(
        "beforeend",
        `
           <div class="mobile-card" data-id="${escapeHtml(item.id)}">
             <div class="card-header">
               <div class="card-title" style="cursor: pointer; color: var(--primary); text-decoration: underline;" title="View Price History">${escapeHtml(item.name)}</div>
               <div class="card-price">₹${safePrice.toFixed(2)}</div>
             </div>
             <div class="card-meta">
               <span>📂 ${escapeHtml(item.category)}</span>
             </div>
             <div class="stock-meter-info">
               <span>Stock Status: <strong>${daysRemainingDisplay} days left</strong></span>
               <div class="stock-meter-container">
                 <div class="stock-bar ${stockClass}" style="width: ${stockPercentage}%"></div>
               </div>
             </div>
             <div class="card-actions">
               <button class="edit-btn secondary">Edit</button>
               <button class="delete-btn danger">Remove</button>
             </div>
           </div>
         `,
      );
    });
  } else {
    // Desktop Table View
    if (inventoryCards) inventoryCards.style.display = "none";
    if (tbody) {
      tbody.innerHTML = "";
      items.forEach((item) => {
        const safePrice = toSafePrice(item.price);
        // Calculate days remaining for this item
        const burnRateData = getItemBurnRate(item.name);
        const daysRemaining = burnRateData.daysRemaining;
        const daysRemainingDisplay =
          daysRemaining === Infinity
            ? "∞"
            : daysRemaining > 999
              ? ">999"
              : daysRemaining.toFixed(1);

        // Calculate stock percentage for meter (assuming 14 days = 100% full)
        const stockPercentage = Math.min((daysRemaining / 14) * 100, 100);
        const stockClass =
          stockPercentage < 20
            ? "critical"
            : stockPercentage < 50
              ? "warning"
              : "healthy";

        tbody.insertAdjacentHTML(
          "beforeend",
          `
             <tr data-id="${escapeHtml(item.id)}">
               <td style="cursor: pointer; color: var(--primary); text-decoration: underline;" title="View Price History" class="item-name-cell">${escapeHtml(item.name)}</td>
               <td>₹${safePrice.toFixed(2)}</td>
               <td>${escapeHtml(item.category)}</td>
               <td>
                 <div class="stock-meter-info">
                   <span>Stock Status: <strong>${daysRemainingDisplay} days left</strong></span>
                   <div class="stock-meter-container">
                     <div class="stock-bar ${stockClass}" style="width: ${stockPercentage}%"></div>
                   </div>
                 </div>
               </td>
               <td>
                 <button class="edit-btn">Edit</button>
                 <button class="delete-btn">Remove</button>
               </td>
             </tr>
           `,
        );
      });
    }
  }
}

export function initInventoryUI() {
  const searchInput = document.getElementById("search-input");
  const sortBtn = document.getElementById("toggle-sort");
  const table = document.getElementById("inventory-table");
  const inventoryCards = document.getElementById("inventory-cards");

  // Generic handler for events from both table and cards
  const handleAction = (e) => {
    const target = e.target;
    if (target.classList.contains("delete-btn")) {
      const container = target.closest("tr") || target.closest(".mobile-card");
      if (container) {
        deleteItem(Number(container.dataset.id));
        renderInventory();
      }
    }
    if (target.classList.contains("edit-btn")) {
      const container = target.closest("tr") || target.closest(".mobile-card");
      if (container) {
        const id = Number(container.dataset.id);
        const item = state.inventory.find((i) => i.id === id);
        if (item) startEdit(item);
      }
    }
    if (target.classList.contains("item-name-cell") || target.classList.contains("card-title")) {
      const container = target.closest("tr") || target.closest(".mobile-card");
      if (container) {
        const id = Number(container.dataset.id);
        const item = state.inventory.find((i) => i.id === id);
        if (item) {
          const modal = document.getElementById("price-history-modal");
          const title = document.getElementById("price-history-title");
          if (modal) {
            modal.classList.add("active");
            if (title) title.textContent = `Price History: ${item.name}`;
            renderPriceHistory("price-history-chart", item.name);
          }
        }
      }
    }
  };

  const closeBtn = document.querySelector(".close-chart-modal");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const modal = document.getElementById("price-history-modal");
      if (modal) modal.classList.remove("active");
    });
  }

  // Close on backdrop click
  const priceModal = document.getElementById("price-history-modal");
  if (priceModal) {
    priceModal.addEventListener("click", (e) => {
      if (e.target === priceModal) priceModal.classList.remove("active");
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchTerm = e.target.value;
      renderInventory();
    });
  }

  if (sortBtn) {
    sortBtn.addEventListener("click", () => {
      state.sortBy = state.sortBy === "name" ? "category" : "name";
      sortBtn.textContent = `Sort by: ${state.sortBy === "name" ? "Name (A-Z)" : "Category"}`;
      renderInventory();
    });
  }

  if (table) table.addEventListener("click", handleAction);
  if (inventoryCards) inventoryCards.addEventListener("click", handleAction);
}

function startEdit(item) {
  state.editingId = item.id;

  // Show the form container
  const itemFormContainer = document.getElementById("item-form-container");
  if (itemFormContainer) {
    itemFormContainer.style.display = "block";
  }

  // Get the first row inputs (using name attributes)
  const firstRow = document.querySelector('.item-row[data-row-id="0"]');
  if (!firstRow) return;

  const nameInput = firstRow.querySelector('[name="itemName"]');
  const priceInput = firstRow.querySelector('[name="itemPrice"]');
  const categorySelect = firstRow.querySelector('[name="category"]');

  // Populate form with item data
  if (nameInput) nameInput.value = item.name;
  if (priceInput) priceInput.value = item.price;
  if (categorySelect) categorySelect.value = item.category;

  // Change Button Text
  const submitBtn = document.querySelector('#item-form button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Update Item";
}

export function cancelEdit() {
  state.editingId = null;

  // Hide the form container
  const itemFormContainer = document.getElementById("item-form-container");
  if (itemFormContainer) {
    itemFormContainer.style.display = "none";
  }

  // Reset the first row
  const firstRow = document.querySelector('.item-row[data-row-id="0"]');
  if (firstRow) {
    const nameInput = firstRow.querySelector('[name="itemName"]');
    const priceInput = firstRow.querySelector('[name="itemPrice"]');
    const categorySelect = firstRow.querySelector('[name="category"]');

    if (nameInput) nameInput.value = "";
    if (priceInput) priceInput.value = "";
    if (categorySelect) categorySelect.selectedIndex = 0;
  }

  // Reset button text
  const submitBtn = document.querySelector('#item-form button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Add All Items";
}
