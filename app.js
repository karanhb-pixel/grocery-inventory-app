// ==============================================================================
// Grocery Inventory Tracker - localStorage Version
// ==============================================================================

// ==============================================================================
// 1. Global State & Initialization
// ==============================================================================

let inventoryData = [];
let currentSort = 'name'; // 'name' or 'category'
let nextId = 1;
let currentSearchTerm = ''; // Track current search term
let searchTimeout; // For debouncing search

// localStorage keys
const STORAGE_KEY = 'grocery_inventory_data';
const BILLS_STORAGE_KEY = 'grocery_bills_data';

// Bills data
let billsData = [];
let nextBillId = 1;

// Load environment variables
if (typeof process === 'undefined') {
    const dotenv = require('dotenv');
    dotenv.config();
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Set up event listeners
    document.getElementById('item-form').addEventListener('submit', handleAddItem);
    document.getElementById('toggle-sort').addEventListener('click', handleSortToggle);
    
    // Set up search event listeners
    document.getElementById('search-input').addEventListener('input', handleSearchInput);
    document.getElementById('clear-search').addEventListener('click', clearSearch);
    
    // Set up bills event listeners
    document.getElementById('show-bills').addEventListener('click', showBillsView);
    document.getElementById('back-to-inventory').addEventListener('click', showInventoryView);
    document.getElementById('add-new-bill').addEventListener('click', addNewBill);
    document.getElementById('bill-form').addEventListener('submit', handleAddBill);
    
    // Set up main bills button
    document.getElementById('show-bills-main').addEventListener('click', showBillsView);
    
    // 2. Initialize JSONBin cloud storage
    await initializeJSONBin();
    
    // 3. Load data from localStorage
    loadDataFromStorage();
    loadBillsFromStorage();
    
    // 4. Render the table
    renderTable();
});

// ==============================================================================
// 2. localStorage Data Management
// ==============================================================================

/**
 * Load data from localStorage
 */
function loadDataFromStorage() {
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
function loadBillsFromStorage() {
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
function saveBillsToStorage() {
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
function saveDataToStorage() {
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
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        inventoryData = [];
        nextId = 1;
        renderTable();
        console.log('All data cleared from localStorage.');
    }
}

// ==============================================================================
// 3. Data Sorting and Rendering Logic
// ==============================================================================

function handleSortToggle() {
    if (currentSort === 'name') {
        currentSort = 'category';
        document.getElementById('toggle-sort').textContent = 'Sort by: Category';
    } else {
        currentSort = 'name';
        document.getElementById('toggle-sort').textContent = 'Sort by: Name (A-Z)';
    }
    renderTable();
}

function sortData(data) {
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
// 3.1. Search and Filtering Functions
// ==============================================================================

/**
 * Handle search input with debouncing
 */
function handleSearchInput(event) {
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
function filterInventoryData(data) {
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
function clearSearch() {
    document.getElementById('search-input').value = '';
    currentSearchTerm = '';
    renderTable();
    updateSearchUI();
}

/**
 * Update search UI elements (clear button visibility, etc.)
 */
function updateSearchUI() {
    const clearButton = document.getElementById('clear-search');
    const searchInput = document.getElementById('search-input');
    
    if (currentSearchTerm) {
        clearButton.style.display = 'inline-block';
    } else {
        clearButton.style.display = 'none';
    }
}

function renderTable() {
    const tableBody = document.querySelector('#inventory-table tbody');
    const cardsContainer = document.getElementById('inventory-cards');
    
    // Filter data based on search term, then sort
    const filteredData = filterInventoryData(inventoryData);
    const sortedData = sortData(filteredData);
    
    // Clear both views
    tableBody.innerHTML = '';
    if (cardsContainer) cardsContainer.innerHTML = '';
    
    let rowCount = 0;
    
    sortedData.forEach(item => {
        // Render table row (for desktop)
        const row = tableBody.insertRow();
        row.dataset.itemId = item.id;
        
        // 1. Item Name
        row.insertCell().textContent = item.name;
        // 2. Selling Price
        row.insertCell().textContent = `₹${item.price.toFixed(2)}`;
        // 3. Purchase Price
        row.insertCell().textContent = `₹${item.purchasePrice.toFixed(2)}`;
        // 4. Category
        row.insertCell().textContent = item.category;
        
        // 5. Actions (Edit/Remove buttons)
        const actionsCell = row.insertCell();
        actionsCell.innerHTML = `
            <button class="action-btn edit-btn" onclick="handleEdit(this)">Edit</button>
            <button class="action-btn remove-btn" onclick="handleRemove(this)">Remove</button>
        `;
        
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
        
        rowCount++;
    });

    // Update item count display
    const countElement = document.getElementById('item-count');
    if (currentSearchTerm) {
        countElement.textContent = `${rowCount} of ${inventoryData.length}`;
        countElement.title = `Showing ${rowCount} of ${inventoryData.total} total items`;
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
        }
    }
}

// Card-specific handlers for mobile
function handleEditCard(button) {
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

function handleRemoveCard(button) {
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
// 4. CRUD Operations (localStorage-based)
// ==============================================================================

function handleAddItem(event) {
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

function handleEdit(button) {
    const row = button.closest('tr');
    if (row.classList.contains('editing')) {
        handleSave(button);
    } else {
        startEditing(row);
    }
}

function startEditing(row) {
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

function handleSave(button) {
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

function handleCancel(button) {
    const row = button.closest('tr');
    row.classList.remove('editing');
    document.querySelectorAll('.edit-btn').forEach(btn => btn.classList.remove('disabled'));
    renderTable();
}

function handleRemove(button) {
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

// ==============================================================================
// 5. Utility Functions
// ==============================================================================

/**
 * Export data to JSON file
 */
function exportData() {
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
function importData(event) {
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
function exportToCSV() {
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
 * Import data from CSV file
 */
function importFromCSV(event) {
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



// ==============================================================================
// 7. JSONBin.io Integration (Simple & Free Alternative)
// ==============================================================================

/**
 * JSONBin.io API Configuration
 * Get your free API key from https://jsonbin.io
 */
const JSONBIN_CONFIG = {
    // Your JSONBin API key (X-Master-Key from https://jsonbin.io)
    apiKey: '$2a$10$hTYGSMnNHzJkNG0id/yRfeJsv2ngrcFYEKfuP7jsJKMmJwh2cvkMW',
    
    // Your JSONBin bin ID (from the URL when you create a bin)
    binId: '69344fedae596e708f87a733',
    
    // JSONBin API base URL (DO NOT include bin ID here)
    baseUrl: 'https://api.jsonbin.io/v3/b'
};

// Bills JSONBin configuration (separate bin for bills)
const BILLS_JSONBIN_CONFIG = {
    // Your JSONBin API key for bills (can be same as above)
    apiKey: '$2a$10$hTYGSMnNHzJkNG0id/yRfeJsv2ngrcFYEKfuP7jsJKMmJwh2cvkMW',
    
    // Separate bin ID for bills data
    binId: '69688172ae596e708fdd87be', // Different bin ID for bills
    
    // JSONBin API base URL
    baseUrl: 'https://api.jsonbin.io/v3/b'
};

/**
 * Initialize JSONBin connection
 */
async function initializeJSONBin() {
    try {
        console.log('Initializing JSONBin connection...');
        
        // Check if configuration is set
        if (JSONBIN_CONFIG.apiKey === 'YOUR_JSONBIN_API_KEY_HERE' ||
            JSONBIN_CONFIG.binId === 'YOUR_JSONBIN_BIN_ID_HERE') {
            console.warn('JSONBin not configured. Using demo mode.');
            showJSONBinStatus('Demo mode - configure JSONBin to enable sync', 'warning');
            return false;
        }
        
        // Test connection by reading existing data
        const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.apiKey
            }
        });
        
        if (response.ok) {
            console.log('✅ JSONBin connection successful');
            showJSONBinStatus('Connected to JSONBin', 'success');
            return true;
        } else if (response.status === 404) {
            throw new Error('Bin not found. Make sure your bin ID is correct and the bin exists.');
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('❌ JSONBin connection failed:', error);
        showJSONBinStatus('JSONBin connection failed', 'error');
        return false;
    }
}

/**
 * Initialize Bills JSONBin connection
 */
async function initializeBillsJSONBin() {
    try {
        console.log('Initializing Bills JSONBin connection...');
        
        // Check if configuration is set
        if (BILLS_JSONBIN_CONFIG.apiKey === 'YOUR_JSONBIN_API_KEY_HERE' ||
            BILLS_JSONBIN_CONFIG.binId === 'YOUR_JSONBIN_BIN_ID_HERE') {
            console.warn('Bills JSONBin not configured. Using demo mode.');
            showJSONBinStatus('Demo mode - configure Bills JSONBin to enable sync', 'warning');
            return false;
        }
        
        // Test connection by reading existing data
        const response = await fetch(`${BILLS_JSONBIN_CONFIG.baseUrl}/${BILLS_JSONBIN_CONFIG.binId}/latest`, {
            headers: {
                'X-Master-Key': BILLS_JSONBIN_CONFIG.apiKey
            }
        });
        
        if (response.ok) {
            console.log('✅ Bills JSONBin connection successful');
            showJSONBinStatus('Connected to Bills JSONBin', 'success');
            return true;
        } else if (response.status === 404) {
            throw new Error('Bills bin not found. Make sure your bin ID is correct and the bin exists.');
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('❌ Bills JSONBin connection failed:', error);
        showJSONBinStatus('Bills JSONBin connection failed', 'error');
        return false;
    }
}

/**
 * Sync localStorage data to JSONBin
 */
async function syncToJSONBin() {
    if (inventoryData.length === 0) {
        console.log('No data to sync');
        showJSONBinStatus('No data to sync', 'info');
        return;
    }
    
    try {
        showJSONBinStatus('Syncing to JSONBin...', 'loading');
        
        const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}`, {
            method: 'PUT',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(inventoryData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Data synced to JSONBin successfully');
            showJSONBinStatus(`Synced ${inventoryData.length} items to JSONBin`, 'success');
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                hideJSONBinStatus();
            }, 3000);
        } else {
            throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('❌ Sync to JSONBin failed:', error);
        showJSONBinStatus('Sync failed: ' + error.message, 'error');
    }
}

/**
 * Load data from JSONBin to localStorage
 */
async function loadFromJSONBin() {
    try {
        showJSONBinStatus('Loading from JSONBin...', 'loading');
        
        const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.apiKey
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const jsonData = data.record || data; // JSONBin returns {record: [...]}
            
            if (Array.isArray(jsonData) && jsonData.length > 0) {
                // Convert data back to inventory objects
                inventoryData = jsonData.map(item => ({
                    id: parseInt(item.id) || 0,
                    name: item.name || '',
                    price: parseFloat(item.price) || 0,
                    purchasePrice: parseFloat(item.purchasePrice) || 0,
                    category: item.category || '',
                    status: item.status || 'Active'
                })).filter(item => item.name && item.category); // Filter out invalid rows
                
                // Update nextId
                if (inventoryData.length > 0) {
                    nextId = Math.max(...inventoryData.map(item => parseInt(item.id))) + 1;
                } else {
                    nextId = 1;
                }
                
                // Save to localStorage and update UI
                saveDataToStorage();
                renderTable();
                
                console.log(`✅ Loaded ${inventoryData.length} items from JSONBin`);
                showJSONBinStatus(`Loaded ${inventoryData.length} items from JSONBin`, 'success');
                
                setTimeout(() => {
                    hideJSONBinStatus();
                }, 3000);
            } else {
                console.log('No data found in JSONBin');
                showJSONBinStatus('No data found in JSONBin', 'info');
            }
        } else {
            throw new Error(`Load failed: ${response.status} ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('❌ Load from JSONBin failed:', error);
        showJSONBinStatus('Load failed: ' + error.message, 'error');
    }
}

/**
 * Show JSONBin status message
 */
function showJSONBinStatus(message, type = 'info') {
    let statusElement = document.getElementById('jsonbin-status');
    
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'jsonbin-status';
        statusElement.className = 'jsonbin-status';
        document.querySelector('.sheets-sync-section').appendChild(statusElement);
    }
    
    statusElement.textContent = message;
    statusElement.className = `jsonbin-status ${type}`;
    statusElement.style.display = 'inline-block';
}

/**
 * Hide JSONBin status message
 */
function hideJSONBinStatus() {
    const statusElement = document.getElementById('jsonbin-status');
    if (statusElement) {
        statusElement.style.display = 'none';
    }
}

/**
 * Auto-sync to JSONBin when data changes
 */
function autoSyncToJSONBin() {
    // Debounce sync to avoid too frequent API calls
    clearTimeout(window.jsonbinSyncTimeout);
    window.jsonbinSyncTimeout = setTimeout(() => {
        syncToJSONBin();
    }, 3000); // Wait 3 seconds after last change
}

/**
 * Auto-sync bills to JSONBin when data changes
 */
function autoSyncBillsToJSONBin() {
    // Debounce sync to avoid too frequent API calls
    clearTimeout(window.billsJsonbinSyncTimeout);
    window.billsJsonbinSyncTimeout = setTimeout(() => {
        syncBillsToJSONBin();
    }, 3000); // Wait 3 seconds after last change
}

/**
 * Sync bills data to JSONBin
 */
async function syncBillsToJSONBin() {
    if (billsData.length === 0) {
        console.log('No bills data to sync');
        showJSONBinStatus('No bills data to sync', 'info');
        return;
    }
    
    try {
        showJSONBinStatus('Syncing bills to JSONBin...', 'loading');
        
        const response = await fetch(`${BILLS_JSONBIN_CONFIG.baseUrl}/${BILLS_JSONBIN_CONFIG.binId}`, {
            method: 'PUT',
            headers: {
                'X-Master-Key': BILLS_JSONBIN_CONFIG.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(billsData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Bills data synced to JSONBin successfully');
            showJSONBinStatus(`Synced ${billsData.length} bills to JSONBin`, 'success');
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                hideJSONBinStatus();
            }, 3000);
        } else {
            throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('❌ Sync bills to JSONBin failed:', error);
        showJSONBinStatus('Bills sync failed: ' + error.message, 'error');
    }
}

/**
 * Load bills data from JSONBin to localStorage
 */
async function loadBillsFromJSONBin() {
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
                // Convert data back to bills objects
                billsData = jsonData.map(bill => ({
                    id: parseInt(bill.id) || 0,
                    date: bill.date || '',
                    itemId: parseInt(bill.itemId) || 0,
                    itemName: bill.itemName || '',
                    category: bill.category || '',
                    quantity: parseInt(bill.quantity) || 1,
                    purchasePrice: parseFloat(bill.purchasePrice) || 0,
                    previousPurchasePrice: parseFloat(bill.previousPurchasePrice) || 0,
                    timestamp: bill.timestamp || ''
                })).filter(bill => bill.itemName && bill.date); // Filter out invalid bills
                
                // Update nextBillId
                if (billsData.length > 0) {
                    nextBillId = Math.max(...billsData.map(bill => parseInt(bill.id))) + 1;
                } else {
                    nextBillId = 1;
                }
                
                // Save to localStorage and update UI
                saveBillsToStorage();
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

// ==============================================================================
// 8. Mobile Modal Functions
// ==============================================================================

/**
 * Toggle data management modal for mobile
 */
function toggleDataModal() {
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

// ==============================================================================
// 9. Bills Management Functions
// ==============================================================================

/**
 * Show bills view
 */
function showBillsView() {
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
function showInventoryView() {
    document.getElementById('bills-panel').style.display = 'none';
    document.getElementById('inventory-panel').style.display = 'block';
    cancelBill();
}

/**
 * Show bill form
 */
function addNewBill() {
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
function cancelBill() {
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
 * Handle bill form submission
 */
function handleAddBill(event) {
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
 * Render bills table
 */
function renderBillsTable() {
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

/**
 * Delete a bill
 */
function deleteBill(billId) {
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