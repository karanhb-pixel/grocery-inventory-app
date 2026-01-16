// ==============================================================================
// Grocery Inventory Tracker - UI Components (ui.js)
// ==============================================================================

import { inventoryData, currentSort, currentSearchTerm, filterInventoryData, sortData, billsData } from './store.js';

/**
 * Renders the inventory table using DocumentFragment for
 * optimal performance and minimal layout shifts.
 */
function renderInventoryTable(items) {
    const tableBody = document.querySelector('#inventory-table tbody');

    // 1. Clear the current view
    tableBody.innerHTML = '';

    // 2. Create the fragment "container"
    const fragment = document.createDocumentFragment();

    // 3. Loop and build
    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'inventory-row';
        tr.dataset.itemId = item.id;

        tr.innerHTML = `
            <td>${item.name}</td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>₹${item.purchasePrice.toFixed(2)}</td>
            <td>${item.category}</td>
            <td>
                <button class="action-btn edit-btn" onclick="handleEdit(this)">Edit</button>
                <button class="action-btn remove-btn" onclick="handleRemove(this)">Remove</button>
            </td>
        `;

        // Append to fragment (no browser reflow triggered here)
        fragment.appendChild(tr);
    });

    // 4. Final Injection (Single reflow/paint)
    tableBody.appendChild(fragment);
}

export function renderTable() {
    const tableBody = document.querySelector('#inventory-table tbody');
    const cardsContainer = document.getElementById('inventory-cards');

    // Filter data based on search term, then sort
    const filteredData = filterInventoryData(inventoryData);
    const sortedData = sortData(filteredData);

    // Clear both views
    if (cardsContainer) cardsContainer.innerHTML = '';

    // Render table rows using DocumentFragment
    renderInventoryTable(sortedData);

    let rowCount = sortedData.length;

    sortedData.forEach(item => {
        // Render card (for mobile)
        if (cardsContainer) {
            const card = document.createElement('div');
            card.className = 'inventory-card';
            card.dataset.itemId = item.id;
            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${item.name}</h3>
                    <span class="card-category">${item.category}</span>
                </div>
                <div class="card-body">
                    <div class="card-row">
                        <span class="card-label">Selling Price</span>
                        <span class="card-value price">₹${item.price.toFixed(2)}</span>
                    </div>
                    <div class="card-row">
                        <span class="card-label">Purchase Price</span>
                        <span class="card-value">₹${item.purchasePrice.toFixed(2)}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="action-btn edit-btn" onclick="handleEditCard(this)">✏️ Edit</button>
                    <button class="action-btn remove-btn" onclick="handleRemoveCard(this)">🗑️ Remove</button>
                </div>
            `;
            cardsContainer.appendChild(card);
        }
    });

    // Update item count display
    const countElement = document.getElementById('item-count');
    if (currentSearchTerm) {
        countElement.textContent = `${rowCount} of ${inventoryData.length}`;
        countElement.title = `Showing ${rowCount} of ${inventoryData.length} total items`;
    } else {
        countElement.textContent = rowCount;
        countElement.title = '';
    }

    // Show empty state if no items
    if (rowCount === 0) {
        if (currentSearchTerm) {
            // No results found for search
            if (cardsContainer) {
                cardsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>No items found</h3>
                        <p>No items match "${currentSearchTerm}"</p>
                        <button onclick="clearSearch()" class="clear-search-empty">Clear search</button>
                    </div>
                `;
            }

            // Also show message in table view
            const tableBody = document.querySelector('#inventory-table tbody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="no-results-cell">
                            <div class="no-results-message">
                                <div class="no-results-icon">🔍</div>
                                <h3>No items found</h3>
                                <p>No items match "${currentSearchTerm}"</p>
                                <button onclick="clearSearch()" class="clear-search-empty-btn">Clear search</button>
                            </div>
                        </td>
                    </tr>
                `;
            }
        } else {
            // No items in inventory at all
            if (cardsContainer) {
                cardsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📦</div>
                        <h3>No items yet</h3>
                        <p>Add your first inventory item above!</p>
                    </div>
                `;
            }

            // Also show message in table view
            const tableBody = document.querySelector('#inventory-table tbody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="no-results-cell">
                            <div class="no-results-message">
                                <div class="no-results-icon">📦</div>
                                <h3>No items yet</h3>
                                <p>Add your first inventory item above!</p>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }
}

// ==============================================================================
// Bills UI Functions
// ==============================================================================

/**
 * Show bills view
 */
export function showBillsView() {
    document.getElementById('inventory-panel').style.display = 'none';
    document.getElementById('bills-panel').style.display = 'block';
    populateBillItems();
    renderBillsTable();

    // Initialize bills JSONBin connection
    initializeBillsJSONBin();

    // Add bills sync buttons to UI
    addBillsSyncButtons();
}

/**
 * Add bills sync buttons to the bills view
 */
function addBillsSyncButtons() {
    const billsSyncSection = document.getElementById('sheets-sync-section');

    // Check if bills sync buttons already exist
    if (document.getElementById('bills-sync-group')) {
        return;
    }

    const billsSyncGroup = document.createElement('div');
    billsSyncGroup.id = 'bills-sync-group';
    billsSyncGroup.className = 'sync-group';
    billsSyncGroup.innerHTML = `
        <h4>Bills JSONBin Sync</h4>
        <button id="sync-bills-to-jsonbin" class="sync-btn sync-to-jsonbin" onclick="syncBillsToJSONBin()">
            📤 Sync Bills to JSONBin
        </button>
        <button id="load-bills-from-jsonbin" class="sync-btn load-from-jsonbin" onclick="loadBillsFromJSONBin()">
            📥 Load Bills from JSONBin
        </button>
    `;

    billsSyncSection.appendChild(billsSyncGroup);
}

/**
 * Show inventory view
 */
export function showInventoryView() {
    document.getElementById('bills-panel').style.display = 'none';
    document.getElementById('inventory-panel').style.display = 'block';
    cancelBill();
}

/**
 * Show bill form
 */
export function addNewBill() {
    document.getElementById('bill-form-container').style.display = 'block';
    document.getElementById('bill-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('bill-quantity').value = '1';
    document.getElementById('bill-purchase-price').value = '';
    document.getElementById('previous-purchase-price').textContent = '₹0.00';
    populateBillItems();
}

/**
 * Cancel bill creation
 */
export function cancelBill() {
    document.getElementById('bill-form-container').style.display = 'none';
    document.getElementById('bill-form').reset();
}

/**
 * Populate bill items dropdown from inventory
 */
function populateBillItems() {
    const billItemSelect = document.getElementById('bill-item');
    billItemSelect.innerHTML = '<option value="" disabled selected>Select an item</option>';

    inventoryData.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.name} (${item.category})`;
        option.dataset.price = item.purchasePrice;
        billItemSelect.appendChild(option);
    });
}

/**
 * Update previous purchase price when item is selected
 */
document.getElementById('bill-item').addEventListener('change', function() {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption && selectedOption.dataset.price) {
        const previousPrice = parseFloat(selectedOption.dataset.price);
        document.getElementById('previous-purchase-price').textContent = `₹${previousPrice.toFixed(2)}`;
        document.getElementById('bill-purchase-price').value = previousPrice.toFixed(2);
    } else {
        document.getElementById('previous-purchase-price').textContent = '₹0.00';
        document.getElementById('bill-purchase-price').value = '';
    }
});

/**
 * Render bills table
 */
export function renderBillsTable() {
    const tableBody = document.getElementById('bills-table-body');
    tableBody.innerHTML = '';

    // Sort bills by date (newest first)
    const sortedBills = [...billsData].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedBills.forEach(bill => {
        const row = tableBody.insertRow();
        row.dataset.billId = bill.id;

        // Format date
        const formattedDate = new Date(bill.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        row.insertCell().textContent = formattedDate;
        row.insertCell().textContent = bill.itemName;
        row.insertCell().textContent = bill.quantity;
        row.insertCell().textContent = `₹${bill.purchasePrice.toFixed(2)}`;
        row.insertCell().textContent = `₹${bill.previousPurchasePrice.toFixed(2)}`;

        // Actions cell
        const actionsCell = row.insertCell();
        actionsCell.innerHTML = `
            <button class="bill-action-btn bill-delete-btn" onclick="deleteBill(${bill.id})">Delete</button>
        `;
    });

    // Show empty state if no bills
    if (billsData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-results-cell">
                    <div class="no-results-message">
                        <div class="no-results-icon">📄</div>
                        <h3>No bills yet</h3>
                        <p>Add your first bill using the button above!</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// ==============================================================================
// Mobile Modal Functions
// ==============================================================================

/**
 * Toggle data management modal for mobile
 */
export function toggleDataModal() {
    const modal = document.getElementById('data-modal');
    modal.classList.toggle('active');

    // Prevent body scroll when modal is open
    if (modal.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('data-modal');
    if (event.target === modal) {
        toggleDataModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('data-modal');
        if (modal.classList.contains('active')) {
            toggleDataModal();
        }
    }
});

// Import necessary functions
import { initializeBillsJSONBin } from './api.js';
import { syncBillsToJSONBin, loadBillsFromJSONBin } from './api.js';
import { deleteBill } from './store.js';
import { clearSearch } from './store.js';