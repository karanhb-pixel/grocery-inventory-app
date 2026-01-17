import { state } from '../core/state.js';
import { deleteBill } from '../features/bills.features.js';

export function renderBills() {
  const tbody = document.querySelector('#bills-table tbody');
  tbody.innerHTML = '';

  state.bills.forEach(bill => {
    tbody.insertAdjacentHTML('beforeend', `
      <tr data-id="${bill.id}">
        <td>${bill.date}</td>
        <td>${bill.itemName}</td>
        <td>${bill.quantity}</td>
        <td>
          <button class="delete-bill">Delete</button>
        </td>
      </tr>
    `);
  });
}

export function initBillsUI() {
  const table = document.getElementById('bills-table');
  if (table) {
    table.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-bill')) {
        const tr = e.target.closest('tr');
        if (tr) {
          deleteBill(Number(tr.dataset.id));
          renderBills();
        }
      }
    });
  }
}
