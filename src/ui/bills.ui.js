import { state } from '../core/state.js';
import { deleteBill, getFilteredBills } from '../features/bills.features.js';

// Security: Helper to escape HTML and prevent XSS
const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

export function renderBills() {
  const tbody = document.querySelector('#bills-table-body');
  const bills = getFilteredBills();
  const isMobile = window.innerWidth <= 768;
  const billCards = document.getElementById('bill-cards');

  if (isMobile && billCards) {
    if (tbody) tbody.innerHTML = '';
    billCards.innerHTML = '';
    billCards.style.display = 'flex';

    bills.forEach(bill => {
      billCards.insertAdjacentHTML('beforeend', `
        <div class="mobile-card" data-id="${bill.id}">
          <div class="card-header">
            <div class="card-title">${escapeHtml(bill.itemName)}</div>
            <div class="card-price">₹${bill.purchasePrice ? bill.purchasePrice.toFixed(2) : '0.00'}</div>
          </div>
          <div class="card-meta">
            <span>📅 ${escapeHtml(bill.date)}</span>
            <span>🔢 Qty: ${bill.quantity}</span>
          </div>
          <div class="card-actions">
            <button class="bill-edit-btn secondary">Edit</button>
            <button class="delete-bill danger">Delete</button>
          </div>
        </div>
      `);
    });
  } else {
    if (billCards) billCards.style.display = 'none';
    if (tbody) {
      tbody.innerHTML = '';
      bills.forEach(bill => {
        tbody.insertAdjacentHTML('beforeend', `
          <tr data-id="${bill.id}">
            <td>${escapeHtml(bill.date)}</td>
            <td>${escapeHtml(bill.itemName)}</td>
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
  }
}

export function initBillsUI() {
  const table = document.getElementById('bills-table');
  const billCards = document.getElementById('bill-cards');

  const handleAction = (e) => {
    const target = e.target;
    // Delete
    if (target.classList.contains('delete-bill')) {
      const container = target.closest('tr') || target.closest('.mobile-card');
      if (container) {
        deleteBill(Number(container.dataset.id));
        renderBills();
      }
    }
    
    // Edit
    if (target.classList.contains('bill-edit-btn')) {
      const container = target.closest('tr') || target.closest('.mobile-card');
      if (container) {
        const id = Number(container.dataset.id);
        const bill = state.bills.find(b => b.id === id);
        if (bill) startEditBill(bill);
      }
    }
  };

  if (table) table.addEventListener('click', handleAction);
  if (billCards) billCards.addEventListener('click', handleAction);
}

export function startEditBill(bill) {
  state.editingBillId = bill.id;

  // Show the form container
  const formContainer = document.getElementById('bill-form-container');
  if (formContainer) {
    formContainer.style.display = 'block';
  }

  // Populate Form
  const dateEl = document.getElementById('bill-date');
  const itemEl = document.getElementById('bill-item');
  const qtyEl = document.getElementById('bill-quantity');
  const priceEl = document.getElementById('bill-purchase-price');

  if (dateEl) dateEl.value = bill.date;
  if (itemEl) itemEl.value = bill.itemName;
  if (qtyEl) qtyEl.value = bill.quantity;
  if (priceEl) priceEl.value = bill.purchasePrice;

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
  const form = document.getElementById('bill-form');
  if (form) form.reset();

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
