export function initNavigation() {
  const inputPanel = document.getElementById('input-panel');
  const inventoryPanel = document.getElementById('inventory-panel');
  const billsPanel = document.getElementById('bills-panel');
  const analysisPanel = document.getElementById('analysis-panel');
  const showBillsBtns = document.querySelectorAll('.bills-btn');
  const showAnalysisBtn = document.getElementById('show-analysis');
  const backToInventoryBtn = document.getElementById('back-to-inventory');
  const backFromAnalysisBtn = document.getElementById('back-to-inventory-from-analysis');
  
  const inventorySync = document.getElementById('inventory-sync-controls');
  const billsSync = document.getElementById('bills-sync-controls');
  const syncHeader = document.getElementById('sync-header');

  const toggleSync = (view) => {
    if(view === 'bills') {
      if(inventorySync) inventorySync.style.display = 'none';
      if(billsSync) billsSync.style.display = 'block';
      if(syncHeader) syncHeader.textContent = 'Bills Cloud Sync';
    } else {
      if(inventorySync) inventorySync.style.display = 'block';
      if(billsSync) billsSync.style.display = 'none';
      if(syncHeader) syncHeader.textContent = 'Inventory Cloud Sync';
    }
  };

  showBillsBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      inputPanel.style.display = 'none';
      inventoryPanel.style.display = 'none';
      billsPanel.style.display = 'block';
      if (analysisPanel) analysisPanel.style.display = 'none';
      toggleSync('bills');
    });
  });
  
  if (showAnalysisBtn) {
    showAnalysisBtn.addEventListener('click', () => {
      inputPanel.style.display = 'none';
      inventoryPanel.style.display = 'none';
      billsPanel.style.display = 'none';
      if (analysisPanel) {
        analysisPanel.style.display = 'block';
        // Trigger render when showing analysis
        const event = new Event('analysis-shown');
        document.dispatchEvent(event);
      }
      toggleSync('inventory');
    });
  }

  if (backToInventoryBtn) {
    backToInventoryBtn.addEventListener('click', () => {
      inputPanel.style.display = 'block';
      inventoryPanel.style.display = 'block';
      billsPanel.style.display = 'none';
      if (analysisPanel) analysisPanel.style.display = 'none';
      toggleSync('inventory');
    });
  }
  
  if (backFromAnalysisBtn) {
    backFromAnalysisBtn.addEventListener('click', () => {
      inputPanel.style.display = 'block';
      inventoryPanel.style.display = 'block';
      billsPanel.style.display = 'none';
      if (analysisPanel) analysisPanel.style.display = 'none';
      toggleSync('inventory');
    });
  }
}

export function initModals() {
  const modal = document.getElementById('data-modal');
  const openBtns = document.querySelectorAll('.mobile-data-btn');
  const closeBtns = document.querySelectorAll('.close-modal');

  // Toggle Logic
  const toggleModal = () => {
    if (modal) {
      modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    }
  };

  openBtns.forEach(btn => btn.addEventListener('click', toggleModal));
  closeBtns.forEach(btn => btn.addEventListener('click', toggleModal));

  // Data Export/Import UI triggers (Wiring only, logic is stubbed)
  const wireTrigger = (triggerId, inputId) => {
      const trigger = document.getElementById(triggerId);
      const input = document.getElementById(inputId);
      if (trigger && input) {
          trigger.addEventListener('click', () => input.click());
      }
  };

  wireTrigger('import-csv-trigger', 'csv-import');
  wireTrigger('import-json-trigger', 'json-import');
  wireTrigger('mobile-import-csv-trigger', 'mobile-csv-import');
  wireTrigger('mobile-import-json-trigger', 'mobile-json-import');
  
  // Toggle Data Management section
  const toggleDataMgmtBtn = document.getElementById('toggle-data-management');
  const dataMgmtSection = document.getElementById('data-management-section');
  
  if (toggleDataMgmtBtn && dataMgmtSection) {
    toggleDataMgmtBtn.addEventListener('click', () => {
      const isHidden = dataMgmtSection.style.display === 'none';
      dataMgmtSection.style.display = isHidden ? 'block' : 'none';
      toggleDataMgmtBtn.textContent = isHidden ? '📊 Hide Data Management' : '📊 Import/Export Data';
    });
  }
}

export function initBillsFormUI() {
    const addNewBillBtn = document.getElementById('add-new-bill');
    const cancelBillBtn = document.getElementById('cancel-bill-btn');
    const billFormContainer = document.getElementById('bill-form-container');

    if (addNewBillBtn && billFormContainer) {
        addNewBillBtn.addEventListener('click', () => {
            billFormContainer.style.display = 'block';
        });
    }

    if (cancelBillBtn && billFormContainer) {
        cancelBillBtn.addEventListener('click', () => {
            billFormContainer.style.display = 'none';
        });
    }
}

export function initItemFormUI() {
    const addNewItemBtn = document.getElementById('add-new-item');
    const cancelItemBtn = document.getElementById('cancel-item-btn');
    const itemFormContainer = document.getElementById('item-form-container');

    if (addNewItemBtn && itemFormContainer) {
        addNewItemBtn.addEventListener('click', () => {
            itemFormContainer.style.display = 'block';
        });
    }

    if (cancelItemBtn && itemFormContainer) {
        cancelItemBtn.addEventListener('click', () => {
            itemFormContainer.style.display = 'none';
            // Clear form when canceling
            const itemForm = document.getElementById('item-form');
            if (itemForm) {
                const clearAllRows = require('./bulk-entry.ui.js').clearAllRows;
                if (clearAllRows) clearAllRows();
            }
        });
    }
}
