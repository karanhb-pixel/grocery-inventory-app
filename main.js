// ==============================================================================
// Grocery Inventory Tracker - Main Entry Point (main.js)
// ==============================================================================

import { loadDataFromStorage, loadBillsFromStorage, handleAddItem, handleSortToggle, handleSearchInput, clearSearch, handleAddBill } from './store.js';
import { initializeJSONBin, initializeBillsJSONBin } from './api.js';
import { renderTable, showBillsView, showInventoryView, addNewBill, cancelBill, toggleDataModal } from './ui.js';

// Make functions global for onclick handlers in HTML
window.handleAddItem = handleAddItem;
window.handleSortToggle = handleSortToggle;
window.handleSearchInput = handleSearchInput;
window.clearSearch = clearSearch;
window.showBillsView = showBillsView;
window.showInventoryView = showInventoryView;
window.addNewBill = addNewBill;
window.cancelBill = cancelBill;
window.handleAddBill = handleAddBill;
window.toggleDataModal = toggleDataModal;

// Import other functions that might be called from HTML
import { handleEdit, handleRemove, handleEditCard, handleRemoveCard, deleteBill, exportData, importData, exportToCSV, importFromCSV, clearAllData } from './store.js';
import { syncToJSONBin, loadFromJSONBin, syncBillsToJSONBin, loadBillsFromJSONBin } from './api.js';

window.handleEdit = handleEdit;
window.handleRemove = handleRemove;
window.handleEditCard = handleEditCard;
window.handleRemoveCard = handleRemoveCard;
window.deleteBill = deleteBill;
window.exportData = exportData;
window.importData = importData;
window.exportToCSV = exportToCSV;
window.importFromCSV = importFromCSV;
window.clearAllData = clearAllData;
window.syncToJSONBin = syncToJSONBin;
window.loadFromJSONBin = loadFromJSONBin;
window.syncBillsToJSONBin = syncBillsToJSONBin;
window.loadBillsFromJSONBin = loadBillsFromJSONBin;

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