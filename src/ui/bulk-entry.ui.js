let rowCounter = 0;

export function initBulkEntryUI() {
  const addRowBtn = document.getElementById('add-item-row-btn');
  const itemRowsContainer = document.getElementById('item-rows-container');
  
  if (!addRowBtn || !itemRowsContainer) return;

  // Add row button
  addRowBtn.addEventListener('click', (e) => {
    e.preventDefault();
    addItemRow();
  });

  // Delegate remove button clicks
  itemRowsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-row-btn')) {
      const row = e.target.closest('.item-row');
      if (row) {
        removeItemRow(row);
      }
    }
  });
}

export function addItemRow() {
  const container = document.getElementById('item-rows-container');
  const firstRow = container.querySelector('.item-row');
  
  if (!firstRow) return;

  rowCounter++;
  const newRow = firstRow.cloneNode(true);
  newRow.setAttribute('data-row-id', rowCounter);
  
  // Clear input values
  const inputs = newRow.querySelectorAll('input, select');
  inputs.forEach(input => {
    if (input.tagName === 'SELECT') {
      input.selectedIndex = 0;
    } else {
      input.value = '';
    }
  });

  // Show remove button
  const removeBtn = newRow.querySelector('.remove-row-btn');
  if (removeBtn) {
    removeBtn.style.display = 'inline-block';
  }

  container.appendChild(newRow);
}

export function removeItemRow(row) {
  const container = document.getElementById('item-rows-container');
  const rows = container.querySelectorAll('.item-row');
  
  // Don't remove if it's the only row
  if (rows.length > 1) {
    row.remove();
  }
}

export function clearAllRows() {
  const container = document.getElementById('item-rows-container');
  const rows = container.querySelectorAll('.item-row');
  
  // Remove all but the first row
  rows.forEach((row, index) => {
    if (index > 0) {
      row.remove();
    }
  });

  // Clear the first row
  const firstRow = rows[0];
  if (firstRow) {
    const inputs = firstRow.querySelectorAll('input, select');
    inputs.forEach(input => {
      if (input.tagName === 'SELECT') {
        input.selectedIndex = 0;
      } else {
        input.value = '';
      }
    });
  }
}

export function getAllItemsData() {
  const container = document.getElementById('item-rows-container');
  const rows = container.querySelectorAll('.item-row');
  const items = [];

  rows.forEach(row => {
    const nameInput = row.querySelector('[name="itemName"]');
    const priceInput = row.querySelector('[name="itemPrice"]');
    const categorySelect = row.querySelector('[name="category"]');

    const name = nameInput?.value.trim();
    const price = priceInput?.value.trim();
    const category = categorySelect?.value;

    // Only include rows with complete data
    if (name && price && category) {
      items.push({
        name,
        price: +price,
        category
      });
    }
  });

  return items;
}

/* ============================================
   BILLS BULK ENTRY
   ============================================ */

let billRowCounter = 0;

export function initBulkBillEntryUI() {
  const addRowBtn = document.getElementById('add-bill-row-btn');
  const billRowsContainer = document.getElementById('bill-rows-container');
  
  if (!addRowBtn || !billRowsContainer) return;

  // Add row button
  addRowBtn.addEventListener('click', (e) => {
    e.preventDefault();
    addBillRow();
  });

  // Delegate remove button clicks
  billRowsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-bill-row-btn')) {
      const row = e.target.closest('.bill-row');
      if (row) {
        removeBillRow(row);
      }
    }
  });
}

export function addBillRow() {
  const container = document.getElementById('bill-rows-container');
  const firstRow = container.querySelector('.bill-row');
  
  if (!firstRow) return;

  billRowCounter++;
  const newRow = firstRow.cloneNode(true);
  newRow.setAttribute('data-row-id', billRowCounter);
  
  // Clear input values
  const inputs = newRow.querySelectorAll('input');
  inputs.forEach(input => {
    input.value = '';
  });

  // Show remove button
  const removeBtn = newRow.querySelector('.remove-bill-row-btn');
  if (removeBtn) {
    removeBtn.style.display = 'inline-block';
  }

  container.appendChild(newRow);
}

export function removeBillRow(row) {
  const container = document.getElementById('bill-rows-container');
  const rows = container.querySelectorAll('.bill-row');
  
  // Don't remove if it's the only row
  if (rows.length > 1) {
    row.remove();
  }
}

export function clearAllBillRows() {
  const container = document.getElementById('bill-rows-container');
  const rows = container.querySelectorAll('.bill-row');
  
  // Remove all but the first row
  rows.forEach((row, index) => {
    if (index > 0) {
      row.remove();
    }
  });

  // Clear the first row
  const firstRow = rows[0];
  if (firstRow) {
    const inputs = firstRow.querySelectorAll('input');
    inputs.forEach(input => {
      input.value = '';
    });
  }
}

export function getAllBillsData() {
  const dateInput = document.getElementById('bill-date');
  const date = dateInput?.value;
  
  if (!date) return [];

  const container = document.getElementById('bill-rows-container');
  const rows = container.querySelectorAll('.bill-row');
  const bills = [];

  rows.forEach(row => {
    const itemInput = row.querySelector('[name="billItem"]');
    const quantityInput = row.querySelector('[name="billQuantity"]');
    const priceInput = row.querySelector('[name="billPurchasePrice"]');

    const itemName = itemInput?.value.trim();
    const quantity = quantityInput?.value.trim();
    const purchasePrice = priceInput?.value.trim();

    // Only include rows with complete data
    if (itemName && quantity && purchasePrice) {
      bills.push({
        date,
        itemName,
        quantity: +quantity,
        purchasePrice: +purchasePrice
      });
    }
  });

  return bills;
}
