import { loadStorage } from './core/storage.js';
import { state } from './core/state.js';

// Fixed plural import paths
import { addItem, deleteItem, updateItem } from './features/inventory.features.js';
import { addBill, deleteBill, updateBill, getLastBillPrice } from './features/bills.features.js';

import { renderInventory, cancelEdit, initInventoryUI } from './ui/inventory.ui.js';
import { renderBills, cancelEditBill, initBillsUI } from './ui/bills.ui.js';
import { initNavigation, initModals, initBillsFormUI, initItemFormUI } from './ui/navigation.ui.js';
import { initBulkEntryUI, getAllItemsData, clearAllRows, initBulkBillEntryUI, getAllBillsData, clearAllBillRows } from './ui/bulk-entry.ui.js';
import { renderAnalysis, initAnalysisUI } from './ui/analysis.ui.js';

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
  initItemFormUI();
  initInventoryUI(); // Wired up logic for Search, Sort, Edit, Delete
  initBillsUI(); // Wired up logic for Bills Edit/Delete
  initBulkEntryUI(); // Wired up logic for bulk item entry
  initBulkBillEntryUI(); // Wired up logic for bulk bill entry
  initAnalysisUI(); // Wired up logic for purchase analysis
  
  // Render analysis when panel is shown
  document.addEventListener('analysis-shown', () => {
    renderAnalysis();
  });

  /* INVENTORY */
  if (itemForm) {
      itemForm.addEventListener('submit', e => {
        e.preventDefault();
        
        // Check if we're in edit mode (edit uses old single-field approach)
        if (state.editingId) {
          // Edit mode - use old single item approach
          const itemData = {
            name: document.querySelector('[name="itemName"]')?.value,
            price: +document.querySelector('[name="itemPrice"]')?.value,
            category: document.querySelector('[name="category"]')?.value
          };
          updateItem(state.editingId, itemData);
          cancelEdit();
        } else {
          // Add mode - use bulk entry
          const items = getAllItemsData();
          
          if (items.length === 0) {
            alert('Please fill in at least one complete item');
            return;
          }
          
          // Add all items
          items.forEach(itemData => {
            addItem(itemData);
          });
          
          // Clear all rows
          clearAllRows();
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
    
    // Check if we're in edit mode
    if (state.editingBillId) {
      // Edit mode - handle single bill update
      const billData = {
        date: document.getElementById('bill-date')?.value,
        itemName: document.querySelector('[name="billItem"]')?.value,
        quantity: +document.querySelector('[name="billQuantity"]')?.value,
        purchasePrice: +document.querySelector('[name="billPurchasePrice"]')?.value
      };
      updateBill(state.editingBillId, billData);
      cancelEditBill();
    } else {
      // Add mode - use bulk entry
      const bills = getAllBillsData();
      
      if (bills.length === 0) {
        alert('Please select a date and fill in at least one item');
        return;
      }
      
      // Add all bills
      bills.forEach(billData => {
        addBill(billData);
      });
      
      // Clear date and all rows
      const dateInput = document.getElementById('bill-date');
      if (dateInput) dateInput.value = '';
      clearAllBillRows();
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
