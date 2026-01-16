import { getFilteredInventory } from '../features/inventory.feature.js';

export function renderInventory() {
  const tbody = document.querySelector('#inventory-table tbody');
  tbody.innerHTML = '';

  getFilteredInventory().forEach(item => {
    tbody.insertAdjacentHTML('beforeend', `
      <tr data-id="${item.id}">
        <td>${item.name}</td>
        <td>₹${item.price}</td>
        <td>${item.category}</td>
        <td>
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Remove</button>
        </td>
      </tr>
    `);
  });
}
