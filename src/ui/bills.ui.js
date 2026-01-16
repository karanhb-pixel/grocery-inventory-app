import { state } from '../core/state.js';

export function renderBills() {
  const tbody = document.querySelector('#bills-table tbody');
  tbody.innerHTML = '';

  state.bills.forEach(bill => {
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${bill.date}</td>
        <td>${bill.itemName}</td>
        <td>${bill.quantity}</td>
      </tr>
    `);
  });
}
