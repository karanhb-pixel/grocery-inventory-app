import { getFilteredInventory, deleteItem } from '../features/inventory.features.js';
import { state } from '../core/state.js';

export function renderInventory() {
  const tbody = document.querySelector('#inventory-table tbody');
  const itemCount = document.getElementById('item-count'); 
  const billItemDatalist = document.getElementById('bill-item-options');
  
  tbody.innerHTML = '';
  
  const items = getFilteredInventory();
  
  // Update Item Count
  if (itemCount) {
    itemCount.textContent = items.length;
  }

  // Populate Bill Item Datalist (Searchable)
  if (billItemDatalist) {
    billItemDatalist.innerHTML = '';
    
    // Sort items for the dropdown regardless of table sort state
    const sortedItems = [...state.inventory].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedItems.forEach(item => {
      billItemDatalist.insertAdjacentHTML('beforeend', `
        <option value="${item.name}">${item.category} - ₹${item.price}</option>
      `);
    });
  }

  items.forEach(item => {
    tbody.insertAdjacentHTML('beforeend', `
      <tr data-id="${item.id}">
        <td>${item.name}</td>
        <td>₹${item.price.toFixed(2)}</td>
        <td>${item.category}</td>
        <td>
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Remove</button>
        </td>
      </tr>
    `);
  });
}

export function initInventoryUI() {
  const searchInput = document.getElementById('search-input');
  const sortBtn = document.getElementById('toggle-sort');
  const table = document.getElementById('inventory-table');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchTerm = e.target.value;
      renderInventory();
    });
  }

  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      state.sortBy = state.sortBy === 'name' ? 'category' : 'name';
      sortBtn.textContent = `Sort by: ${state.sortBy === 'name' ? 'Name (A-Z)' : 'Category'}`;
      renderInventory();
    });
  }

  if (table) {
    table.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const tr = e.target.closest('tr');
        if (tr) {
          deleteItem(Number(tr.dataset.id));
          renderInventory();
        }
      }
      if (e.target.classList.contains('edit-btn')) {
         const tr = e.target.closest('tr');
         if (tr) {
           const id = Number(tr.dataset.id);
           const item = state.inventory.find(i => i.id === id);
           if (item) {
             startEdit(item);
           }
         }
      }
    });
  }
}

function startEdit(item) {
  state.editingId = item.id;
  
  // Show the form container
  const itemFormContainer = document.getElementById('item-form-container');
  if (itemFormContainer) {
    itemFormContainer.style.display = 'block';
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
  if (submitBtn) submitBtn.textContent = 'Update Item';
}

export function cancelEdit() {
  state.editingId = null;
  
  // Hide the form container
  const itemFormContainer = document.getElementById('item-form-container');
  if (itemFormContainer) {
    itemFormContainer.style.display = 'none';
  }
  
  // Reset the first row
  const firstRow = document.querySelector('.item-row[data-row-id="0"]');
  if (firstRow) {
    const nameInput = firstRow.querySelector('[name="itemName"]');
    const priceInput = firstRow.querySelector('[name="itemPrice"]');
    const categorySelect = firstRow.querySelector('[name="category"]');

    if (nameInput) nameInput.value = '';
    if (priceInput) priceInput.value = '';
    if (categorySelect) categorySelect.selectedIndex = 0;
  }
  
  // Reset button text
  const submitBtn = document.querySelector('#item-form button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Add All Items';
}
