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
         // Placeholder for edit
         console.log('Edit clicked');
      }
    });
  }
}
