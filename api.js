// ==============================================================================
// Grocery Inventory Tracker - JSONBin API (api.js)
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
export async function initializeJSONBin() {
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
export async function initializeBillsJSONBin() {
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
export async function syncToJSONBin() {
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
export async function loadFromJSONBin() {
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
export function autoSyncToJSONBin() {
    // Debounce sync to avoid too frequent API calls
    clearTimeout(window.jsonbinSyncTimeout);
    window.jsonbinSyncTimeout = setTimeout(() => {
        syncToJSONBin();
    }, 3000); // Wait 3 seconds after last change
}

/**
 * Auto-sync bills to JSONBin when data changes
 */
export function autoSyncBillsToJSONBin() {
    // Debounce sync to avoid too frequent API calls
    clearTimeout(window.billsJsonbinSyncTimeout);
    window.billsJsonbinSyncTimeout = setTimeout(() => {
        syncBillsToJSONBin();
    }, 3000); // Wait 3 seconds after last change
}

/**
 * Sync bills data to JSONBin
 */
export async function syncBillsToJSONBin() {
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
export async function loadBillsFromJSONBin() {
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

// Import necessary variables and functions
import { inventoryData, nextId, billsData, nextBillId, saveDataToStorage, saveBillsToStorage } from './store.js';
import { renderTable, renderBillsTable } from './ui.js';