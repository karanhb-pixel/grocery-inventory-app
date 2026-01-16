// ==============================================================================
// Grocery Inventory Tracker - Data Management (store.js)
// ==============================================================================

// Import configurations and status functions from api.js
import { JSONBIN_CONFIG, BILLS_JSONBIN_CONFIG, showJSONBinStatus, hideJSONBinStatus } from './api.js';

// Global State
export let inventoryData = [];
export let currentSort = 'name'; // 'name' or 'category'
export let nextId = 1;
export let currentSearchTerm = ''; // Track current search term
export let searchTimeout; // For debouncing search

// localStorage keys
export const STORAGE_KEY = 'grocery_inventory_data';
export const BILLS_STORAGE_KEY = 'grocery_bills_data';

// Bills data
export let billsData = [];
export let nextBillId = 1;

// ==============================================================================
// Restock Insights Functions
// ==============================================================================

/**
 * Get start date timestamp for X days ago
 * @param {number} days - Number of days ago
 * @returns {number} Timestamp for the start date
 */
export function getStartDate(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

/**
 * Calculate consumption data for the given days limit
 * @param {number} daysLimit - Number of days to look back
 * @returns {Object} Object with itemName keys, each containing totalQuantity and frequency
 */
export function calculateConsumption(daysLimit) {
    const startTimestamp = getStartDate(daysLimit);
    const filteredBills = billsData.filter(bill => new Date(bill.date).getTime() >= startTimestamp);

    return filteredBills.reduce((acc, bill) => {
        const itemName = bill.itemName;
        if (!acc[itemName]) {
            acc[itemName] = { totalQuantity: 0, frequency: 0 };
        }
        acc[itemName].totalQuantity += bill.quantity;
        acc[itemName].frequency += 1;
        return acc;
    }, {});
}

// ==============================================================================
// localStorage Data Management
// ==============================================================================

/**
 * Load data from localStorage
 */
export function loadDataFromStorage() {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            inventoryData = JSON.parse(storedData);
            // Find the next available ID
            if (inventoryData.length > 0) {
                nextId = Math.max(...inventoryData.map(item => parseInt(item.id))) + 1;
            }
            console.log(`Data loaded from localStorage. Total items: ${inventoryData.length}`);
        } else {
            console.log('No data found in localStorage. Starting with empty inventory.');
            inventoryData = [];
            nextId = 1;
        }
    } catch (error) {
        console.error('Error loading data from localStorage:', error);
        inventoryData = [];
        nextId = 1;
    }
}

/**
 * Load bills data from localStorage
 */
export function loadBillsFromStorage() {
    try {
        const storedBills = localStorage.getItem(BILLS_STORAGE_KEY);
        if (storedBills) {
            billsData = JSON.parse(storedBills);
            // Find the next available bill ID
            if (billsData.length > 0) {
                nextBillId = Math.max(...billsData.map(bill => parseInt(bill.id))) + 1;
            }
            console.log(`Bills loaded from localStorage. Total bills: ${billsData.length}`);
        } else {
            console.log('No bills found in localStorage. Starting with empty bills.');
            billsData = [];
            nextBillId = 1;
        }
    } catch (error) {
        console.error('Error loading bills from localStorage:', error);
        billsData = [];
        nextBillId = 1;
    }
}

/**
 * Save bills data to localStorage
 */
export function saveBillsToStorage() {
    try {
        localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(billsData));
        console.log('Bills saved to localStorage successfully.');
    } catch (error) {
        console.error('Error saving bills to localStorage:', error);
        alert('Failed to save bills data. Please check if localStorage is available.');
    }
}

/**
 * Save data to localStorage
 */
export function saveDataToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inventoryData));
        console.log('Data saved to localStorage successfully.');
    } catch (error) {
        console.error('Error saving data to localStorage:', error);
        alert('Failed to save data. Please check if localStorage is available.');
    }
}

/**
 * Clear all data from localStorage
 */
export function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        inventoryData = [];
        nextId = 1;
        renderTable();
        console.log('All data cleared from localStorage.');
    }
}

// ==============================================================================
// Data Sorting and Filtering
// ==============================================================================

export function handleSortToggle() {
    if (currentSort === 'name') {
        currentSort = 'category';
        document.getElementById('toggle-sort').textContent = 'Sort by: Category';
    } else {
        currentSort = 'name';
        document.getElementById('toggle-sort').textContent = 'Sort by: Name (A-Z)';
    }
    renderTable();
}

export function sortData(data) {
    return data.sort((a, b) => {
        if (currentSort === 'category') {
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            return a.name.localeCompare(b.name); // Secondary sort by name
        }
        // Default sort by name
        return a.name.localeCompare(b.name);
    });
}

// ==============================================================================
// Search and Filtering Functions
// ==============================================================================

/**
 * Handle search input with debouncing
 */
export function handleSearchInput(event) {
    const searchTerm = event.target.value.trim();

    // Clear previous timeout
    clearTimeout(searchTimeout);

    // Debounce search to avoid excessive filtering
    searchTimeout = setTimeout(() => {
        currentSearchTerm = searchTerm;
        renderTable();
        updateSearchUI();
    }, 300);
}

/**
 * Filter inventory data based on search term
 */
export function filterInventoryData(data) {
    if (!currentSearchTerm) {
        return data;
    }

    const searchLower = currentSearchTerm.toLowerCase();
    return data.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower)
    );
}

/**
 * Clear search and reset to show all items
 */
export function clearSearch() {
    document.getElementById('search-input').value = '';
    currentSearchTerm = '';
    renderTable();
    updateSearchUI();
}

/**
 * Update search UI elements (clear button visibility, etc.)
 */
export function updateSearchUI() {
    const clearButton = document.getElementById('clear-search');
    const searchInput = document.getElementById('search-input');

    if (currentSearchTerm) {
        clearButton.style.display = 'inline-block';
    } else {
        clearButton.style.display = 'none';
    }
}

// ==============================================================================
// CRUD Operations
// ==============================================================================

export function handleAddItem(event) {
    event.preventDefault();
    const form = event.target;

    const newItem = {
        id: nextId++,
        name: form.itemName.value.trim(),
        price: parseFloat(form.sellingPrice.value),
        purchasePrice: parseFloat(form.purchasePrice.value),
        category: form.category.value,
        status: 'Active'
    };

    if (!newItem.name || isNaN(newItem.price) || isNaN(newItem.purchasePrice) || !newItem.category) {
        alert("Please fill all fields correctly.");
        return;
    }

    // Add to inventory and save
    inventoryData.push(newItem);
    saveDataToStorage();

    console.log(`Item added successfully (ID: ${newItem.id}).`);
    form.reset();
    renderTable();

    // Auto-sync to JSONBin if configured
    autoSyncToJSONBin();
}

// --- Inline Edit Logic ---

export function handleEdit(button) {
    const row = button.closest('tr');
    if (row.classList.contains('editing')) {
        handleSave(button);
    } else {
        startEditing(row);
    }
}

export function startEditing(row) {
    // Disable all other edit buttons while one row is being edited
    document.querySelectorAll('.edit-btn').forEach(btn => btn.classList.add('disabled'));

    row.classList.add('editing');
    const cells = row.cells;
    const item = inventoryData.find(i => i.id == row.dataset.itemId);

    // 1. Item Name (Text)
    cells[0].innerHTML = `<input type="text" value="${item.name}" data-field="name">`;
    // 2. Selling Price (Number)
    cells[1].innerHTML = `<input type="number" value="${item.price}" data-field="price" step="0.01">`;
    // 3. Purchase Price (Number)
    cells[2].innerHTML = `<input type="number" value="${item.purchasePrice}" data-field="purchasePrice" step="0.01">`;
    // 4. Category (Dropdown)
    const selectHtml = document.getElementById('category').innerHTML;
    cells[3].innerHTML = `<select data-field="category">${selectHtml}</select>`;
    cells[3].querySelector('select').value = item.category;

    // 5. Actions update
    const actionsCell = cells[4];
    actionsCell.innerHTML = `
        <button class="action-btn save-btn" onclick="handleSave(this)">Save</button>
        <button class="action-btn cancel-btn" onclick="handleCancel(this)">Cancel</button>
    `;
}

export function handleSave(button) {
    const row = button.closest('tr');
    const cells = row.cells;
    const itemId = row.dataset.itemId;
    const itemIndex = inventoryData.findIndex(i => i.id == itemId);

    const updatedItem = {
        id: parseInt(itemId),
        name: cells[0].querySelector('input[data-field="name"]').value.trim(),
        price: parseFloat(cells[1].querySelector('input[data-field="price"]').value),
        purchasePrice: parseFloat(cells[2].querySelector('input[data-field="purchasePrice"]').value),
        category: cells[3].querySelector('select[data-field="category"]').value,
        status: inventoryData[itemIndex].status
    };

    if (!updatedItem.name || isNaN(updatedItem.price) || isNaN(updatedItem.purchasePrice) || !updatedItem.category) {
        alert("Invalid data entered. Changes not saved.");
        renderTable(); // Revert to original view
        return;
    }

    // Update in memory and save
    inventoryData[itemIndex] = updatedItem;
    saveDataToStorage();

    console.log(`Item ID ${itemId} updated successfully.`);
    row.classList.remove('editing');
    renderTable();

    // Auto-sync to JSONBin if configured
    autoSyncToJSONBin();

    // Re-enable edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => btn.classList.remove('disabled'));
}

export function handleCancel(button) {
    const row = button.closest('tr');
    row.classList.remove('editing');
    document.querySelectorAll('.edit-btn').forEach(btn => btn.classList.remove('disabled'));
    renderTable();
}

export function handleRemove(button) {
    if (!confirm("Are you sure you want to remove this item permanently?")) {
        return;
    }

    const row = button.closest('tr');
    const itemId = row.dataset.itemId;
    const itemIndex = inventoryData.findIndex(i => i.id == itemId);

    // Remove from memory and save
    inventoryData.splice(itemIndex, 1);
    saveDataToStorage();

    console.log(`Item ID ${itemId} removed successfully.`);
    renderTable();

    // Auto-sync to JSONBin if configured
    autoSyncToJSONBin();
}

// Card-specific handlers for mobile
export function handleEditCard(button) {
    const card = button.closest('.inventory-card');
    const itemId = card.dataset.itemId;
    const item = inventoryData.find(i => i.id == itemId);

    if (card.classList.contains('editing')) {
        // Save changes
        const inputs = card.querySelectorAll('input, select');
        const updatedItem = {
            id: parseInt(itemId),
            name: card.querySelector('[data-field="name"]').value.trim(),
            price: parseFloat(card.querySelector('[data-field="price"]').value),
            purchasePrice: parseFloat(card.querySelector('[data-field="purchasePrice"]').value),
            category: card.querySelector('[data-field="category"]').value,
            status: item.status
        };

        if (!updatedItem.name || isNaN(updatedItem.price) || isNaN(updatedItem.purchasePrice)) {
            alert("Please fill all fields correctly.");
            return;
        }

        const itemIndex = inventoryData.findIndex(i => i.id == itemId);
        inventoryData[itemIndex] = updatedItem;
        saveDataToStorage();
        renderTable();
        autoSyncToJSONBin();
    } else {
        // Start editing
        card.classList.add('editing');
        const selectOptions = document.getElementById('category').innerHTML;

        card.innerHTML = `
            <div class="card-header">
                <input type="text" class="card-input" data-field="name" value="${item.name}" placeholder="Item Name">
            </div>
            <div class="card-body">
                <div class="card-row">
                    <span class="card-label">Selling Price</span>
                    <input type="number" class="card-input" data-field="price" value="${item.price}" step="0.01">
                </div>
                <div class="card-row">
                    <span class="card-label">Purchase Price</span>
                    <input type="number" class="card-input" data-field="purchasePrice" value="${item.purchasePrice}" step="0.01">
                </div>
                <div class="card-row">
                    <span class="card-label">Category</span>
                    <select class="card-input" data-field="category">${selectOptions}</select>
                </div>
            </div>
            <div class="card-actions">
                <button class="action-btn save-btn" onclick="handleEditCard(this)">💾 Save</button>
                <button class="action-btn cancel-btn" onclick="renderTable()">❌ Cancel</button>
            </div>
        `;
        card.querySelector('[data-field="category"]').value = item.category;
    }
}

export function handleRemoveCard(button) {
    if (!confirm("Are you sure you want to remove this item?")) return;

    const card = button.closest('.inventory-card');
    const itemId = card.dataset.itemId;
    const itemIndex = inventoryData.findIndex(i => i.id == itemId);

    inventoryData.splice(itemIndex, 1);
    saveDataToStorage();
    renderTable();
    autoSyncToJSONBin();
}

// ==============================================================================
// Bills Management
// ==============================================================================

/**
 * Handle bill form submission
 */
export function handleAddBill(event) {
    event.preventDefault();

    const date = document.getElementById('bill-date').value;
    const itemId = document.getElementById('bill-item').value;
    const quantity = parseInt(document.getElementById('bill-quantity').value);
    const purchasePrice = parseFloat(document.getElementById('bill-purchase-price').value);

    if (!date || !itemId || isNaN(quantity) || quantity <= 0 || isNaN(purchasePrice) || purchasePrice <= 0) {
        alert('Please fill all fields correctly.');
        return;
    }

    const selectedItem = inventoryData.find(item => item.id == itemId);
    if (!selectedItem) {
        alert('Selected item not found in inventory.');
        return;
    }

    const newBill = {
        id: nextBillId++,
        date: date,
        itemId: parseInt(itemId),
        itemName: selectedItem.name,
        category: selectedItem.category,
        quantity: quantity,
        purchasePrice: purchasePrice,
        previousPurchasePrice: selectedItem.purchasePrice,
        timestamp: new Date().toISOString()
    };

    // Add to bills data
    billsData.push(newBill);
    saveBillsToStorage();

    // Update the item's purchase price in inventory
    selectedItem.purchasePrice = purchasePrice;
    saveDataToStorage();

    console.log(`Bill added successfully (ID: ${newBill.id}).`);

    // Auto-sync bills to JSONBin
    autoSyncBillsToJSONBin();

    // Reset form and render bills
    cancelBill();
    renderBillsTable();
    renderTable(); // Refresh inventory table to show updated purchase price
}

/**
 * Delete a bill
 */
export function deleteBill(billId) {
    if (!confirm('Are you sure you want to delete this bill?')) {
        return;
    }

    const billIndex = billsData.findIndex(bill => bill.id === billId);
    if (billIndex === -1) {
        console.error('Bill not found:', billId);
        return;
    }

    // Remove from bills data
    billsData.splice(billIndex, 1);
    saveBillsToStorage();

    console.log(`Bill ID ${billId} deleted successfully.`);

    // Auto-sync bills to JSONBin after deletion
    autoSyncBillsToJSONBin();

    renderBillsTable();
}

// ==============================================================================
// Utility Functions
// ==============================================================================

/**
 * Export data to JSON file
 */
export function exportData() {
    const dataStr = JSON.stringify(inventoryData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grocery_inventory_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('Data exported successfully.');
}

/**
 * Import data from JSON file
 */
export function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                if (confirm('This will replace all existing data. Continue?')) {
                    inventoryData = importedData;
                    // Update nextId
                    if (inventoryData.length > 0) {
                        nextId = Math.max(...inventoryData.map(item => parseInt(item.id))) + 1;
                    } else {
                        nextId = 1;
                    }
                    saveDataToStorage();
                    renderTable();
                    console.log('Data imported successfully.');
                }
            } else {
                alert('Invalid file format. Please select a JSON file containing an array of items.');
            }
        } catch (error) {
            alert('Error reading file: ' + error.message);
        }
    };
    reader.readAsText(file);

    // Clear the file input
    event.target.value = '';
}

/**
 * Export data to CSV file
 */
export function exportToCSV() {
    if (inventoryData.length === 0) {
        alert('No data to export.');
        return;
    }

    // Create CSV header
    const headers = ['ID', 'Name', 'Selling Price', 'Purchase Price', 'Category', 'Status'];

    // Create CSV rows
    const csvRows = [headers.join(',')];

    inventoryData.forEach(item => {
        const row = [
            item.id,
            `"${item.name.replace(/"/g, '""')}"`, // Escape quotes
            item.price,
            item.purchasePrice,
            `"${item.category.replace(/"/g, '""')}"`, // Escape quotes
            item.status
        ];
        csvRows.push(row.join(','));
    });

    // Create and download CSV file
    const csvContent = csvRows.join('\n');
    const csvBlob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    const csvUrl = URL.createObjectURL(csvBlob);
    const csvLink = document.createElement('a');
    csvLink.href = csvUrl;
    csvLink.download = `grocery_inventory_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(csvLink);
    csvLink.click();
    document.body.removeChild(csvLink);
    URL.revokeObjectURL(csvUrl);

    console.log('Data exported to CSV successfully.');
}

/**
 * Load inventory data from JSONBin
 */
export function loadInventoryFromJSONBin(jsonData) {
    // Clear existing array and push new data to maintain reference
    inventoryData.length = 0;
    inventoryData.push(...jsonData.map(item => ({
        id: parseInt(item.id) || 0,
        name: item.name || '',
        price: parseFloat(item.price) || 0,
        purchasePrice: parseFloat(item.purchasePrice) || 0,
        category: item.category || '',
        status: item.status || 'Active'
    })).filter(item => item.name && item.category)); // Filter out invalid rows

    // Update nextId
    if (inventoryData.length > 0) {
        nextId = Math.max(...inventoryData.map(item => parseInt(item.id))) + 1;
    } else {
        nextId = 1;
    }

    // Save to localStorage
    saveDataToStorage();
}

/**
 * Load bills data from JSONBin
 */
export function _loadBillsFromJSONBin(jsonData) {
    // Clear existing array and push new data to maintain reference
    billsData.length = 0;
    billsData.push(...jsonData.map(bill => ({
        id: parseInt(bill.id) || 0,
        date: bill.date || '',
        itemId: parseInt(bill.itemId) || 0,
        itemName: bill.itemName || '',
        category: bill.category || '',
        quantity: parseInt(bill.quantity) || 1,
        purchasePrice: parseFloat(bill.purchasePrice) || 0,
        previousPurchasePrice: parseFloat(bill.previousPurchasePrice) || 0,
        timestamp: bill.timestamp || ''
    })).filter(bill => bill.itemName && bill.date)); // Filter out invalid bills

    // Update nextBillId
    if (billsData.length > 0) {
        nextBillId = Math.max(...billsData.map(bill => parseInt(bill.id))) + 1;
    } else {
        nextBillId = 1;
    }

    // Save to localStorage
    saveBillsToStorage();
}

export async function loadBillsFromJSONBinApi() {
    try {
        showJSONBinStatus('Loading bills from JSONBin...', 'loading');

        const response = await fetch(`${BILLS_JSONBIN_CONFIG.baseUrl}/${BILLS_JSONBIN_CONFIG.binId}/latest`, {
            headers: {
                'X-Master-Key': BILLS_JSONBIN_CONFIG.apiKey
            }
        });

        if (response.ok) {
            const data = await response.json();
            const jsonData = data.record || data; // JSONBin returns {record: [...]}

            if (Array.isArray(jsonData) && jsonData.length > 0) {
                // Load bills data from JSONBin
                _loadBillsFromJSONBin(jsonData);
                // Update UI
                renderBillsTable();

                console.log(`✅ Loaded ${billsData.length} bills from JSONBin`);
                showJSONBinStatus(`Loaded ${billsData.length} bills from JSONBin`, 'success');

                setTimeout(() => {
                    hideJSONBinStatus();
                }, 3000);
            } else {
                console.log('No bills data found in JSONBin');
                showJSONBinStatus('No bills data found in JSONBin', 'info');
            }
        } else {
            throw new Error(`Load failed: ${response.status} ${response.statusText}`);
        }

    } catch (error) {
        console.error('❌ Load bills from JSONBin failed:', error);
        showJSONBinStatus('Bills load failed: ' + error.message, 'error');
    }
}

/**
 * Import data from CSV file
 */
export function importFromCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csvContent = e.target.result;
            const lines = csvContent.trim().split('\n');

            if (lines.length < 2) {
                alert('CSV file must contain at least a header row and one data row.');
                return;
            }

            // Parse header row
            const headers = lines[0].split(',');
            if (headers.length < 6) {
                alert('CSV must contain columns: ID, Name, Selling Price, Purchase Price, Category, Status');
                return;
            }

            // Parse data rows
            const importedData = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue; // Skip empty lines

                // Simple CSV parsing (handles quoted fields)
                const values = [];
                let currentValue = '';
                let inQuotes = false;

                for (let j = 0; j < line.length; j++) {
                    const char = line[j];
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        values.push(currentValue.trim());
                        currentValue = '';
                    } else {
                        currentValue += char;
                    }
                }
                values.push(currentValue.trim()); // Add the last value

                if (values.length >= 6) {
                    const item = {
                        id: parseInt(values[0]) || 0,
                        name: values[1].replace(/^"|"$/g, '').replace(/""/g, '"'), // Remove quotes and unescape
                        price: parseFloat(values[2]) || 0,
                        purchasePrice: parseFloat(values[3]) || 0,
                        category: values[4].replace(/^"|"$/g, '').replace(/""/g, '"'), // Remove quotes and unescape
                        status: values[5] || 'Active'
                    };

                    // Validate required fields
                    if (item.name && !isNaN(item.price) && !isNaN(item.purchasePrice) && item.category) {
                        importedData.push(item);
                    }
                }
            }

            if (importedData.length === 0) {
                alert('No valid data found in CSV file. Please check the format.');
                return;
            }

            if (confirm(`Found ${importedData.length} items in CSV. This will replace all existing data. Continue?`)) {
                inventoryData = importedData;
                // Update nextId
                if (inventoryData.length > 0) {
                    nextId = Math.max(...inventoryData.map(item => parseInt(item.id))) + 1;
                } else {
                    nextId = 1;
                }
                saveDataToStorage();
                renderTable();
                console.log('Data imported from CSV successfully.');
            }

        } catch (error) {
            alert('Error reading CSV file: ' + error.message);
        }
    };
    reader.readAsText(file);

    // Clear the file input
    event.target.value = '';
}

// Import renderTable and other UI functions from ui.js
import { renderTable, renderBillsTable, cancelBill } from './ui.js';