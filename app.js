// ==============================================================================
// 1. Configuration (MUST BE UPDATED ACCORDING TO README.MD INSTRUCTIONS)
// ==============================================================================

// PLACEHOLDERS: These variables would be set after you configure the Google Sheets API
const API_URL = 'YOUR_GOOGLE_SHEETS_API_ENDPOINT_HERE'; 
const SPREADSHEET_ID = '1d8bG3SMD6RwJJdrXs70faPyWB6Y1w6TN1jO-oClHdyA'; // Your sheet ID
const SHEET_NAME = 'Sheet1'; // Assuming default sheet name

// ==============================================================================
// 2. Global State & Initialization
// ==============================================================================

let inventoryData = [];
let currentSort = 'name'; // 'name' or 'category'

document.addEventListener('DOMContentLoaded', () => {
    // 1. Set up event listeners
    document.getElementById('item-form').addEventListener('submit', handleAddItem);
    document.getElementById('toggle-sort').addEventListener('click', handleSortToggle);
    
    // 2. Load the initial data (Simulated fetch)
    fetchData(); 
});

// ==============================================================================
// 3. Data Fetching and Sorting Logic
// ==============================================================================

// Simulates fetching data from the Google Sheet via your configured API endpoint
async function fetchData() {
    console.log("Attempting to fetch data from Google Sheet...");
    try {
        // In a real app, this API call would require authorization tokens and parameters
        // Example: const response = await fetch(`${API_URL}/read?id=${SPREADSHEET_ID}&sheet=${SHEET_NAME}`);
        
        // --- START: Simulation Data ---
        // Since API is not configured, we use simulation data based on the structure:
        // ID, ITEM_NAME, PRICE, PURCHASE_PRICE, CATEGORY, STATUS
        inventoryData = [
            { id: 1, name: "Basmati Rice", price: 180.00, purchasePrice: 150.00, category: "Staple Foods", status: "Active" },
            { id: 2, name: "Curd/Yogurt", price: 40.00, purchasePrice: 30.00, category: "Dairy & Related", status: "Active" },
            { id: 3, name: "Turmeric Powder", price: 65.50, purchasePrice: 50.00, category: "Spices & Condiments", status: "Active" },
            { id: 4, name: "Sunflower Oil", price: 150.00, purchasePrice: 125.00, category: "Oils & Ghee", status: "Active" }
        ];
        console.log("Data loaded (simulated).");
        // --- END: Simulation Data ---

        renderTable();

    } catch (error) {
        console.error("Error fetching inventory data:", error);
        alert("Failed to load inventory. Please check the console and your API configuration.");
    }
}

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
// 4. CRUD Operations (Connect to API)
// ==============================================================================

async function handleAddItem(event) {
    event.preventDefault();
    const form = event.target;
    
    const newItem = {
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

    // --- API CALL: Create/Append new item ---
    try {
        // In a real app, this API call would send the newItem data to append a row
        // Example: const response = await fetch(`${API_URL}/create`, { method: 'POST', body: JSON.stringify(newItem) });
        // After successful API call, we update the local data:
        
        // Simulation of adding an item:
        const newId = inventoryData.length > 0 ? Math.max(...inventoryData.map(i => i.id)) + 1 : 1;
        inventoryData.push({...newItem, id: newId});
        console.log(`Item added (ID: ${newId}).`);

        form.reset();
        renderTable();
    } catch (error) {
        console.error("Failed to add item:", error);
        alert("Failed to save item to Google Sheet.");
    }
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

async function handleSave(button) {
    const row = button.closest('tr');
    const cells = row.cells;
    const itemId = row.dataset.itemId;
    const itemIndex = inventoryData.findIndex(i => i.id == itemId);

    const updatedItem = {
        name: cells[0].querySelector('input[data-field="name"]').value.trim(),
        price: parseFloat(cells[1].querySelector('input[data-field="price"]').value),
        purchasePrice: parseFloat(cells[2].querySelector('input[data-field="purchasePrice"]').value),
        category: cells[3].querySelector('select[data-field="category"]').value,
        id: parseInt(itemId),
        status: inventoryData[itemIndex].status
    };

    if (!updatedItem.name || isNaN(updatedItem.price) || isNaN(updatedItem.purchasePrice) || !updatedItem.category) {
        alert("Invalid data entered. Changes not saved.");
        renderTable(); // Revert to original view
        return;
    }

    // --- API CALL: Update existing item ---
    try {
        // In a real app, this API call would send the updatedItem data and the itemId to update the row
        // Example: const response = await fetch(`${API_URL}/update`, { method: 'PUT', body: JSON.stringify(updatedItem) });
        
        // Simulation of updating an item:
        inventoryData[itemIndex] = updatedItem;
        console.log(`Item ID ${itemId} updated.`);

        row.classList.remove('editing');
        renderTable();
        
    } catch (error) {
        console.error("Failed to save item:", error);
        alert("Failed to update item in Google Sheet.");
    } finally {
        document.querySelectorAll('.edit-btn').forEach(btn => btn.classList.remove('disabled'));
    }
}

function handleCancel(button) {
    const row = button.closest('tr');
    row.classList.remove('editing');
    document.querySelectorAll('.edit-btn').forEach(btn => btn.classList.remove('disabled'));
    renderTable();
}

async function handleRemove(button) {
    if (!confirm("Are you sure you want to remove this item permanently?")) {
        return;
    }
    
    const row = button.closest('tr');
    const itemId = row.dataset.itemId;
    const itemIndex = inventoryData.findIndex(i => i.id == itemId);

    // --- API CALL: Delete item ---
    try {
        // In a real app, this API call would send the itemId to delete the corresponding row
        // Example: const response = await fetch(`${API_URL}/delete?id=${itemId}`, { method: 'DELETE' });
        
        // Simulation of removing an item:
        inventoryData.splice(itemIndex, 1);
        console.log(`Item ID ${itemId} removed.`);
        
        renderTable();
    } catch (error) {
        console.error("Failed to remove item:", error);
        alert("Failed to delete item from Google Sheet.");
    }
}