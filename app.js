// ==============================================================================
// Grocery Inventory Tracker - localStorage Version
// ==============================================================================

// ==============================================================================
// 1. Global State & Initialization
// ==============================================================================

let inventoryData = [];
let currentSort = 'name'; // 'name' or 'category'
let nextId = 1;

// localStorage key
const STORAGE_KEY = 'grocery_inventory_data';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Set up event listeners
    document.getElementById('item-form').addEventListener('submit', handleAddItem);
    document.getElementById('toggle-sort').addEventListener('click', handleSortToggle);
    
    // 2. Initialize JSONBin cloud storage
    await initializeJSONBin();
    
    // 3. Load data from localStorage
    loadDataFromStorage();
    
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

function renderTable() {
    const tableBody = document.querySelector('#inventory-table tbody');
    tableBody.innerHTML = '';
    const sortedData = sortData(inventoryData);
    
    let rowCount = 0;
    
    sortedData.forEach(item => {
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
        rowCount++;
    });

    document.getElementById('item-count').textContent = rowCount;
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