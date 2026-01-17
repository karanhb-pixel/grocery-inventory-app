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
  
  // Populate Form
  const nameInput = document.getElementById('itemName');
  const priceInput = document.getElementById('itemPrice');
  const catInput = document.getElementById('category');

  if (nameInput) nameInput.value = item.name;
  if (priceInput) priceInput.value = item.price;
  if (catInput) catInput.value = item.category;
  
  // Change Button Text
  const submitBtn = document.querySelector('#item-form button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Update Item';
  
  // Show Cancel Button
  let cancelBtn = document.getElementById('cancel-edit-btn');
  if (!cancelBtn) {
    cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-edit-btn';
    cancelBtn.type = 'button';
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = 'Cancel Edit';
    cancelBtn.style.marginLeft = '10px';
    cancelBtn.onclick = cancelEdit;
    submitBtn.parentNode.appendChild(cancelBtn);
  }
}

export function cancelEdit() {
  state.editingId = null;
  document.getElementById('item-form').reset();
  
  const submitBtn = document.querySelector('#item-form button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Add Item';
  
  const cancelBtn = document.getElementById('cancel-edit-btn');
  if (cancelBtn) cancelBtn.remove();
}
