import { loadStorage } from './core/storage.js';
import { state } from './core/state.js';

// Fixed plural import paths
import { addItem, deleteItem, updateItem } from './features/inventory.features.js';
import { addBill, deleteBill, updateBill, getLastBillPrice } from './features/bills.features.js';

import { renderInventory, cancelEdit, initInventoryUI } from './ui/inventory.ui.js';
import { renderBills, cancelEditBill, initBillsUI } from './ui/bills.ui.js';
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
  // inventoryTable selection removed as it is handled in initInventoryUI

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
  initInventoryUI(); // Wired up logic for Search, Sort, Edit, Delete
  initBillsUI(); // Wired up logic for Bills Edit/Delete

  /* INVENTORY */
  if (itemForm) {
      itemForm.addEventListener('submit', e => {
        e.preventDefault();
        
        const itemData = {
          name: itemName.value,
          price: +itemPrice.value,
          category: category.value
        };

        if (state.editingId) {
          // Update existing item
          updateItem(state.editingId, itemData);
          cancelEdit(); // Reset form and mode
        } else {
          // Add new item
          addItem(itemData);
          itemForm.reset();
        }
        
        renderInventory();
      });
  }

  /* Removed redundant inventoryTable listener - handled in initInventoryUI */

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
    
    const billData = {
      date: billDate.value,
      itemName: billItem.value,
      quantity: +billQuantity.value,
      purchasePrice: +billPurchasePrice.value
    };

    if (state.editingBillId) {
       updateBill(state.editingBillId, billData);
       cancelEditBill();
    } else {
       addBill(billData);
       billForm.reset();
    }
    
    renderBills();
  });

  /* Removed redundant billsTable listener - handled in initBillsUI */

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
