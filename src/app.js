import { loadStorage } from './core/storage.js';
import { state } from './core/state.js';

// Fixed plural import paths
import { addItem, deleteItem } from './features/inventory.features.js';
import { addBill, deleteBill, getLastBillPrice } from './features/bills.features.js';

import { renderInventory } from './ui/inventory.ui.js';
import { renderBills } from './ui/bills.ui.js';
import { initNavigation, initModals, initBillsFormUI } from './ui/navigation.ui.js';

import {
  syncInventory,
  loadInventory,
  syncBills,
  loadBills
} from './services/jsonbin.service.js';

document.addEventListener('DOMContentLoaded', () => {
  // Select DOM Elements
  const itemForm = document.getElementById('item-form');
  const itemName = document.getElementById('itemName');
  const itemPrice = document.getElementById('itemPrice');
  const category = document.getElementById('category');
  const inventoryTable = document.getElementById('inventory-table');

  const billForm = document.getElementById('bill-form');
  const billDate = document.getElementById('bill-date');
  const billItem = document.getElementById('bill-item');
  const billQuantity = document.getElementById('bill-quantity');
  const billPurchasePrice = document.getElementById('bill-purchase-price');
  const billsTable = document.getElementById('bills-table');

  const syncToJsonBinBtn = document.getElementById('sync-to-jsonbin');
  const loadFromJsonBinBtn = document.getElementById('load-from-jsonbin');
  const syncBillsBtn = document.getElementById('sync-bills');
  const loadBillsBtn = document.getElementById('load-bills');

  loadStorage();
  renderInventory();
  renderBills();

  // Initialize UI handlers
  initNavigation();
  initModals();
  initBillsFormUI();

  /* INVENTORY */
  if (itemForm) {
      itemForm.addEventListener('submit', e => {
        e.preventDefault();
        addItem({
          name: itemName.value,
          price: +itemPrice.value,
          category: category.value
        });
        renderInventory();
        itemForm.reset();
      });
  }

  if (inventoryTable) {
      inventoryTable.addEventListener('click', e => {
        const row = e.target.closest('tr');
        if (!row) return;

        if (e.target.classList.contains('delete-btn')) {
          // Verify if dataset.id exists and is valid
          if(row.dataset.id) {
             deleteItem(+row.dataset.id);
             renderInventory();
          }
        }
      });
  }

  /* BILLS */
  if (billItem) {
    billItem.addEventListener('change', () => {
       const price = getLastBillPrice(billItem.value);
       if(billPurchasePrice) {
         billPurchasePrice.value = price || '';
       }
    });

    billItem.addEventListener('input', () => {
       const price = getLastBillPrice(billItem.value);
       if(billPurchasePrice && price) {
          billPurchasePrice.value = price;
       }
    });
  }

  billForm?.addEventListener('submit', e => {
    e.preventDefault();
    addBill({
      date: billDate.value,
      itemName: billItem.value, // Read directly from input
      quantity: +billQuantity.value,
      purchasePrice: +billPurchasePrice.value
    });
    renderBills();
    billForm.reset();
  });

  billsTable?.addEventListener('click', e => {
    const row = e.target.closest('tr');
    if (row && e.target.classList.contains('delete-bill')) {
      if(row.dataset.id) {
        deleteBill(+row.dataset.id);
        renderBills();
      }
    }
  });

  /* JSONBIN */
  if (syncToJsonBinBtn) {
    syncToJsonBinBtn.addEventListener('click', () => {
      console.log('Sync to JSONBin clicked');
      syncInventory();
    });
  } else {
    console.error('Sync to JSONBin button NOT found');
  }

  if (loadFromJsonBinBtn) {
    loadFromJsonBinBtn.addEventListener('click', async () => {
      console.log('Load from JSONBin clicked');
      await loadInventory();
      console.log('Inventory loaded, rendering...');
      renderInventory();
    });
  } else {
    console.error('Load from JSONBin button NOT found');
  }

  if (syncBillsBtn) {
    syncBillsBtn.addEventListener('click', () => {
      console.log('Sync Bills clicked');
      syncBills();
    });
  } else {
    console.warn('Sync Bills button NOT found');
  }

  if (loadBillsBtn) {
    loadBillsBtn.addEventListener('click', async () => {
      console.log('Load Bills clicked');
      await loadBills();
      console.log('Bills loaded, rendering...');
      renderBills();
    });
  } else {
    console.warn('Load Bills button NOT found');
  }

  /* BILLS FILTER */
  const billFilterDate = document.getElementById('bill-filter-date');
  const clearBillFilter = document.getElementById('clear-bill-filter');

  if (billFilterDate) {
    billFilterDate.addEventListener('change', (e) => {
      state.billFilterDate = e.target.value;
      renderBills();
    });
  }

  if (clearBillFilter) {
    clearBillFilter.addEventListener('click', () => {
      state.billFilterDate = null;
      if (billFilterDate) billFilterDate.value = '';
      renderBills();
    });
  }
});
