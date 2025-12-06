/**
 * Google Apps Script Web App for managing grocery inventory data.
 * This script handles all CRUD operations (Read, Create, Update, Delete)
 * by exposing a single secure endpoint to the client-side JavaScript.
 */

// --- CONFIGURATION: Replace these values ---
const SPREADSHEET_ID = '1d8bG3SMD6RwJJdrXs70faPyWB6Y1w6TN1jO-oClHdyA'; 
const SHEET_NAME = 'Sheet1'; 
const PRIMARY_KEY = 'ID'; // Column used for unique identification (must be 'ID')
// --- END CONFIGURATION ---

/**
 * Global function to return data as a JSON response with CORS headers.
 * @param {object} obj - The JavaScript object to be returned as JSON.
 * @return {GoogleAppsScript.Content.TextOutput} 
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Handles GET requests (used primarily for fetching all data).
 * @return {GoogleAppsScript.Content.TextOutput} JSON response containing all inventory data.
 */
function doGet(e) {
  try {
    const data = readData();
    return jsonResponse({ success: true, data: data });
  } catch (error) {
    return jsonResponse({ success: false, error: 'Read operation failed: ' + error.message });
  }
}

/**
 * Handles OPTIONS requests (CORS preflight).
 * @return {GoogleAppsScript.Content.TextOutput} Empty response with CORS headers.
 */
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.TEXT_PLAIN)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Handles POST requests (used for Create, Update, and Delete operations).
 * The action must be specified in the request body (e.g., { action: 'create', data: {...} }).
 * @param {GoogleAppsScript.Events.DoPost} e - Event object containing request body.
 * @return {GoogleAppsScript.Content.TextOutput} JSON response indicating success or failure.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Wait 30 seconds for lock

    if (!e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'No data provided in the request body.' });
    }

    const request = JSON.parse(e.postData.contents);
    const action = request.action ? request.action.toUpperCase() : null;
    const data = request.data;
    
    if (!action) {
      return jsonResponse({ success: false, error: 'Action field is missing in the request body.' });
    }

    switch (action) {
      case 'CREATE':
        return jsonResponse(createData(data));
      case 'UPDATE':
        return jsonResponse(updateData(data));
      case 'DELETE':
        return jsonResponse(deleteData(request.id));
      default:
        return jsonResponse({ success: false, error: 'Invalid action specified: ' + action });
    }
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  } finally {
    lock.releaseLock();
  }
}

// ==============================================================================
// CRUD Helper Functions
// ==============================================================================

/**
 * Reads all inventory data from the sheet.
 */
function readData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet named '${SHEET_NAME}' not found.`);

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return []; // Only header row

  const headers = values[0];
  const data = values.slice(1).map(row => {
    const item = {};
    headers.forEach((header, i) => {
      // Clean up headers to match app.js keys (ID -> id, ITEM_NAME -> name, etc.)
      const key = header.toLowerCase().replace(/_(\w)/g, (m, c) => c.toUpperCase());
      item[key] = row[i];
    });
    return item;
  });

  return data;
}

/**
 * Appends a new item row to the sheet.
 * Assumes the data object matches column names.
 * @param {object} itemData - The new item data (name, price, purchasePrice, category, status).
 */
function createData(itemData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // 1. Generate new ID (find max ID in sheet and increment)
  const idColumn = headers.indexOf(PRIMARY_KEY) + 1;
  const currentIds = sheet.getRange(2, idColumn, sheet.getLastRow() - 1, 1).getValues().flat();
  const newId = currentIds.length > 0 ? Math.max(...currentIds.filter(Number)) + 1 : 1;
  
  // 2. Map itemData to sheet row order
  const newRow = headers.map(header => {
    switch (header) {
      case PRIMARY_KEY: return newId;
      case 'ITEM_NAME': return itemData.name;
      case 'PRICE': return parseFloat(itemData.price);
      case 'PURCHASE_PRICE': return parseFloat(itemData.purchasePrice);
      case 'CATEGORY': return itemData.category;
      case 'STATUS': return itemData.status || 'Active';
      default: return '';
    }
  });

  sheet.appendRow(newRow);
  return { success: true, message: 'Item created.', id: newId };
}

/**
 * Updates an existing row based on the item's ID.
 * @param {object} itemData - The updated item data, including the 'id'.
 */
function updateData(itemData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idColumnIndex = headers.indexOf(PRIMARY_KEY) + 1; // 1-based index
  const rowId = parseInt(itemData.id);

  if (isNaN(rowId)) throw new Error('Invalid item ID provided for update.');
  
  // Find the row number (1-based index)
  const idRange = sheet.getRange(2, idColumnIndex, sheet.getLastRow() - 1, 1);
  const rowValues = idRange.getValues().flat();
  
  // + 2 accounts for the header row (1) and the 0-based index conversion (+1)
  const targetRow = rowValues.findIndex(id => id == rowId) + 2; 

  if (targetRow < 2) throw new Error(`Item with ID ${rowId} not found.`);

  // Create the new row array based on the updated data
  const updatedRow = headers.map(header => {
    switch (header) {
      case PRIMARY_KEY: return rowId;
      case 'ITEM_NAME': return itemData.name;
      case 'PRICE': return parseFloat(itemData.price);
      case 'PURCHASE_PRICE': return parseFloat(itemData.purchasePrice);
      case 'CATEGORY': return itemData.category;
      case 'STATUS': return itemData.status || 'Active';
      default: return '';
    }
  });

  // Update the row
  sheet.getRange(targetRow, 1, 1, updatedRow.length).setValues([updatedRow]);

  return { success: true, message: `Item ID ${rowId} updated.` };
}

/**
 * Deletes a row based on the item's ID.
 * @param {number} itemId - The ID of the item to delete.
 */
function deleteData(itemId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idColumnIndex = headers.indexOf(PRIMARY_KEY) + 1; // 1-based index
  const rowId = parseInt(itemId);

  if (isNaN(rowId)) throw new Error('Invalid item ID provided for delete.');

  // Find the row number (1-based index)
  const idRange = sheet.getRange(2, idColumnIndex, sheet.getLastRow() - 1, 1);
  const rowValues = idRange.getValues().flat();
  
  // + 2 accounts for the header row (1) and the 0-based index conversion (+1)
  const targetRow = rowValues.findIndex(id => id == rowId) + 2; 

  if (targetRow < 2) throw new Error(`Item with ID ${rowId} not found.`);

  sheet.deleteRow(targetRow);
  
  return { success: true, message: `Item ID ${rowId} deleted.` };
}
