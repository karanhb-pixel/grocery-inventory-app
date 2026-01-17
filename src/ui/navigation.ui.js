export function initNavigation() {
  const inputPanel = document.getElementById('input-panel');
  const inventoryPanel = document.getElementById('inventory-panel');
  const billsPanel = document.getElementById('bills-panel');
  const showBillsBtns = document.querySelectorAll('.bills-btn');
  const backToInventoryBtn = document.getElementById('back-to-inventory');

  showBillsBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      inputPanel.style.display = 'none';
      inventoryPanel.style.display = 'none';
      billsPanel.style.display = 'block';
    });
  });

  if (backToInventoryBtn) {
    backToInventoryBtn.addEventListener('click', () => {
      inputPanel.style.display = 'block';
      inventoryPanel.style.display = 'block';
      billsPanel.style.display = 'none';
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
