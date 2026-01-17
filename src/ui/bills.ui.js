import { state } from '../core/state.js';
import { deleteBill, getFilteredBills } from '../features/bills.features.js';

export function renderBills() {
  const tbody = document.querySelector('#bills-table tbody');
  tbody.innerHTML = '';

  const bills = getFilteredBills();

  bills.forEach(bill => {
    tbody.insertAdjacentHTML('beforeend', `
      <tr data-id="${bill.id}">
        <td>${bill.date}</td>
        <td>${bill.itemName}</td>
        <td>${bill.quantity}</td>
        <td>₹${bill.purchasePrice ? bill.purchasePrice.toFixed(2) : '0.00'}</td>
        <td>
          <button class="bill-edit-btn">Edit</button>
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
      // Delete
      if (e.target.classList.contains('delete-bill')) {
        const tr = e.target.closest('tr');
        if (tr) {
          deleteBill(Number(tr.dataset.id));
          renderBills();
        }
      }
      
      // Edit
      if (e.target.classList.contains('bill-edit-btn')) {
        const tr = e.target.closest('tr');
        if (tr) {
          const id = Number(tr.dataset.id);
          const bill = state.bills.find(b => b.id === id);
          if (bill) startEditBill(bill);
        }
      }
    });
  }
}

export function startEditBill(bill) {
  state.editingBillId = bill.id;

  // Show the form container
  const formContainer = document.getElementById('bill-form-container');
  if (formContainer) {
    formContainer.style.display = 'block';
  }

  // Populate Form
  document.getElementById('bill-date').value = bill.date;
  document.getElementById('bill-item').value = bill.itemName;
  document.getElementById('bill-quantity').value = bill.quantity;
  document.getElementById('bill-purchase-price').value = bill.purchasePrice;

  // Change Button Text
  const submitBtn = document.querySelector('#bill-form button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Update Bill';

  // Show Cancel Button
  let cancelBtn = document.getElementById('cancel-bill-btn');
  // It might already exist in HTML (display:none? No, currently hardcoded in HTML as button type=button)
  // Let's check index.html again. The previous instruction showed a Cancel button.
  // Actually, we should make sure it works if it's there, or create it.
  // Looking at index.html, there is: <button type="button" class="cancel-bill-btn" id="cancel-bill-btn">Cancel</button> inside the form.
  
  if (cancelBtn) {
    cancelBtn.style.display = 'inline-block';
    cancelBtn.onclick = cancelEditBill;
  }
}

export function cancelEditBill() {
  state.editingBillId = null;
  document.getElementById('bill-form').reset();

  const submitBtn = document.querySelector('#bill-form button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Add to Bill';

  const cancelBtn = document.getElementById('cancel-bill-btn');
  if (cancelBtn) { 
     // We can hide it or keep it visible as "reset". 
     // Usually "Cancel" implies exiting edit mode.
     // In index.html it might be visible by default? No, usually hidden. 
     // Let's hide it for now to match dynamic behavior.
     cancelBtn.style.display = 'none'; 
  }
}
