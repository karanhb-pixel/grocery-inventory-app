/**
 * Google Apps Script Web App for managing grocery inventory data.
 * This script handles all CRUD operations (Read, Create, Update, Delete)
 * by exposing a single secure endpoint to the client-side JavaScript.
 * 
 * Version: 2.0
 * Updated: Enhanced error handling, logging, and data validation
 */

// --- CONFIGURATION: Replace these values ---
const SPREADSHEET_ID = '1d8bG3SMD6RwJJdrXs70faPyWB6Y1w6TN1jO-oClHdyA'; 
const SHEET_NAME = 'Sheet1'; 
const PRIMARY_KEY = 'ID'; // Column used for unique identification (must be 'ID')
// --- END CONFIGURATION ---

// Enable logging for debugging
const ENABLE_LOGGING = true;

/**
 * Enhanced logging function
 */
function log(message, data = null) {
  if (ENABLE_LOGGING) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

/**
 * Global function to return data as a JSON response with CORS headers.
 * @param {object} obj - The JavaScript object to be returned as JSON.
 * @return {GoogleAppsScript.Content.TextOutput} 
 */
function jsonResponse(obj) {
  log('Sending JSON response', { success: obj.success, hasData: !!obj.data });
  
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Creates an error response with proper CORS headers
 * @param {string} errorMessage - The error message to return
 * @param {number} statusCode - HTTP status code (optional, defaults to 500)
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function errorResponse(errorMessage, statusCode = 500) {
  log('Sending error response', { error: errorMessage, statusCode });
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString()
  }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Handles GET requests (used primarily for fetching all data).
 * @param {GoogleAppsScript.Events.DoGet} e - Event object containing request parameters.
 * @return {GoogleAppsScript.Content.TextOutput} JSON response containing all inventory data.
 */
function doGet(e) {
  log('GET request received', e.parameter);
  
  try {
    const data = readData();
    log('Data read successfully', { count: data.length });
    return jsonResponse({ 
      success: true, 
      data: data,
      timestamp: new Date().toISOString(),
      count: data.length
    });
  } catch (error) {
    log('GET request failed', { error: error.message, stack: error.stack });
    return errorResponse('Read operation failed: ' + error.message);
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
  log('POST request received', { hasPostData: !!e.postData });
  
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Wait 30 seconds for lock

    if (!e.postData || !e.postData.contents) {
      log('POST request failed - no data provided');
      return errorResponse('No data provided in the request body.');
    }

    let request;
    try {
      request = JSON.parse(e.postData.contents);
      log('Request parsed successfully', { action: request.action });
    } catch (parseError) {
      log('POST request failed - JSON parse error', { error: parseError.message });
      return errorResponse('Invalid JSON in request body: ' + parseError.message);
    }

    const action = request.action ? request.action.toUpperCase() : null;
    const data = request.data;
    
    if (!action) {
      log('POST request failed - no action specified');
      return errorResponse('Action field is missing in the request body.');
    }

    // Validate required fields based on action
    const validationResult = validateRequest(action, data, request.id);
    if (!validationResult.valid) {
      log('POST request failed - validation error', { action, error: validationResult.error });
      return errorResponse(validationResult.error);
    }

    let result;
    switch (action) {
      case 'CREATE':
        result = createData(data);
        log('Item created successfully', { id: result.id });
        break;
      case 'UPDATE':
        result = updateData(data);
        log('Item updated successfully', { id: data.id });
        break;
      case 'DELETE':
        result = deleteData(request.id);
        log('Item deleted successfully', { id: request.id });
        break;
      default:
        log('POST request failed - invalid action', { action });
        return errorResponse('Invalid action specified: ' + action + '. Valid actions: CREATE, UPDATE, DELETE');
    }

    return jsonResponse({ 
      ...result, 
      timestamp: new Date().toISOString() 
    });
    
  } catch (error) {
    log('POST request failed - server error', { 
      error: error.message, 
      stack: error.stack,
      action: request?.action 
    });
    return errorResponse('Server error: ' + error.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Validates request data based on the action type
 * @param {string} action - The action to perform (CREATE, UPDATE, DELETE)
 * @param {object} data - The data object (for CREATE/UPDATE)
 * @param {number} id - The item ID (for UPDATE/DELETE)
 * @return {object} Validation result with {valid: boolean, error: string}
 */
function validateRequest(action, data, id) {
  switch (action) {
    case 'CREATE':
      if (!data) {
        return { valid: false, error: 'Data is required for CREATE operation' };
      }
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        return { valid: false, error: 'Item name is required and must be a non-empty string' };
      }
      if (data.price === undefined || data.price === null || isNaN(parseFloat(data.price))) {
        return { valid: false, error: 'Valid selling price is required' };
      }
      if (data.purchasePrice === undefined || data.purchasePrice === null || isNaN(parseFloat(data.purchasePrice))) {
        return { valid: false, error: 'Valid purchase price is required' };
      }
      if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
        return { valid: false, error: 'Category is required and must be a non-empty string' };
      }
      break;
      
    case 'UPDATE':
      if (!data) {
        return { valid: false, error: 'Data is required for UPDATE operation' };
      }
      if (!data.id || isNaN(parseInt(data.id))) {
        return { valid: false, error: 'Valid item ID is required for UPDATE operation' };
      }
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        return { valid: false, error: 'Item name is required and must be a non-empty string' };
      }
      if (data.price === undefined || data.price === null || isNaN(parseFloat(data.price))) {
        return { valid: false, error: 'Valid selling price is required' };
      }
      if (data.purchasePrice === undefined || data.purchasePrice === null || isNaN(parseFloat(data.purchasePrice))) {
        return { valid: false, error: 'Valid purchase price is required' };
      }
      if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
        return { valid: false, error: 'Category is required and must be a non-empty string' };
      }
      break;
      
    case 'DELETE':
      if (!id || isNaN(parseInt(id))) {
        return { valid: false, error: 'Valid item ID is required for DELETE operation' };
      }
      break;
  }
  
  return { valid: true };
}

// ==============================================================================
// CRUD Helper Functions
// ==============================================================================

/**
 * Reads all inventory data from the sheet.
 * @return {Array} Array of inventory items
 */
function readData() {
  log('Starting readData operation');
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!ss) {
      throw new Error(`Unable to open spreadsheet with ID: ${SPREADSHEET_ID}`);
    }
    
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`Sheet named '${SHEET_NAME}' not found in spreadsheet ${SPREADSHEET_ID}`);
    }

    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    
    log('Sheet info', { 
      sheetName: SHEET_NAME, 
      lastRow, 
      lastColumn,
      hasData: lastRow > 1 
    });

    if (lastRow <= 1) {
      log('No data found - only headers exist');
      return []; // Only header row
    }

    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    
    log('Headers found', headers);
    
    // Validate required columns
    const requiredColumns = [PRIMARY_KEY, 'ITEM_NAME', 'PRICE', 'PURCHASE_PRICE', 'CATEGORY', 'STATUS'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    const data = values.slice(1).map((row, index) => {
      try {
        const item = {};
        headers.forEach((header, i) => {
          // Clean up headers to match app.js keys (ID -> id, ITEM_NAME -> name, etc.)
          const key = header.toLowerCase().replace(/_(\w)/g, (m, c) => c.toUpperCase());
          let value = row[i];
          
          // Type conversion for numeric fields
          if (header === PRIMARY_KEY || header === 'PRICE' || header === 'PURCHASE_PRICE') {
            value = parseFloat(value) || 0;
          }
          
          item[key] = value;
        });
        
        // Validate item has required fields
        if (!item.id || !item.name || !item.price || !item.purchasePrice || !item.category) {
          log('Skipping invalid row', { rowIndex: index + 2, item });
          return null;
        }
        
        return item;
      } catch (rowError) {
        log('Error processing row', { rowIndex: index + 2, error: rowError.message });
        return null;
      }
    }).filter(item => item !== null); // Remove null items

    log('Data read successfully', { 
      totalRows: values.length - 1, 
      validItems: data.length 
    });

    return data;
    
  } catch (error) {
    log('readData failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Appends a new item row to the sheet.
 * @param {object} itemData - The new item data (name, price, purchasePrice, category, status).
 * @return {object} Result object with success status and new ID
 */
function createData(itemData) {
  log('Starting createData operation', itemData);
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet named '${SHEET_NAME}' not found`);
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    log('Headers for create operation', headers);
    
    // 1. Generate new ID (find max ID in sheet and increment)
    const idColumn = headers.indexOf(PRIMARY_KEY) + 1;
    const lastRow = sheet.getLastRow();
    let newId = 1; // Default if no existing data
    
    if (lastRow > 1) {
      const currentIds = sheet.getRange(2, idColumn, lastRow - 1, 1).getValues().flat();
      const validIds = currentIds.filter(id => !isNaN(parseFloat(id)));
      if (validIds.length > 0) {
        newId = Math.max(...validIds.map(id => parseFloat(id))) + 1;
      }
    }
    
    log('Generated new ID', newId);
    
    // 2. Clean and validate input data
    const cleanedItemData = {
      name: String(itemData.name).trim(),
      price: parseFloat(itemData.price),
      purchasePrice: parseFloat(itemData.purchasePrice),
      category: String(itemData.category).trim(),
      status: itemData.status || 'Active'
    };
    
    // Additional validation
    if (cleanedItemData.name.length === 0) {
      throw new Error('Item name cannot be empty');
    }
    if (isNaN(cleanedItemData.price) || cleanedItemData.price < 0) {
      throw new Error('Invalid selling price');
    }
    if (isNaN(cleanedItemData.purchasePrice) || cleanedItemData.purchasePrice < 0) {
      throw new Error('Invalid purchase price');
    }
    if (cleanedItemData.category.length === 0) {
      throw new Error('Category cannot be empty');
    }
    
    // 3. Map itemData to sheet row order
    const newRow = headers.map(header => {
      switch (header) {
        case PRIMARY_KEY: return newId;
        case 'ITEM_NAME': return cleanedItemData.name;
        case 'PRICE': return cleanedItemData.price;
        case 'PURCHASE_PRICE': return cleanedItemData.purchasePrice;
        case 'CATEGORY': return cleanedItemData.category;
        case 'STATUS': return cleanedItemData.status;
        default: return '';
      }
    });

    log('Prepared row for insertion', newRow);
    
    // 4. Insert the row
    sheet.appendRow(newRow);
    
    log('Item created successfully', { id: newId, name: cleanedItemData.name });
    
    return { 
      success: true, 
      message: `Item '${cleanedItemData.name}' created successfully.`, 
      id: newId,
      item: {
        id: newId,
        ...cleanedItemData
      }
    };
    
  } catch (error) {
    log('createData failed', { error: error.message, stack: error.stack, itemData });
    throw error;
  }
}

/**
 * Updates an existing row based on the item's ID.
 * @param {object} itemData - The updated item data, including the 'id'.
 * @return {object} Result object with success status and update details
 */
function updateData(itemData) {
  log('Starting updateData operation', itemData);
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet named '${SHEET_NAME}' not found`);
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idColumnIndex = headers.indexOf(PRIMARY_KEY) + 1;
    const rowId = parseInt(itemData.id);

    if (isNaN(rowId)) {
      throw new Error('Invalid item ID provided for update.');
    }
    
    log('Update request details', { rowId, idColumnIndex, headers });
    
    // Find the target row
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      throw new Error('No data found in spreadsheet');
    }
    
    const idRange = sheet.getRange(2, idColumnIndex, lastRow - 1, 1);
    const rowValues = idRange.getValues().flat();
    
    // + 2 accounts for the header row (1) and the 0-based index conversion (+1)
    const targetRow = rowValues.findIndex(id => id == rowId) + 2; 

    if (targetRow < 2) {
      throw new Error(`Item with ID ${rowId} not found.`);
    }

    // Clean and validate input data
    const cleanedItemData = {
      id: rowId,
      name: String(itemData.name).trim(),
      price: parseFloat(itemData.price),
      purchasePrice: parseFloat(itemData.purchasePrice),
      category: String(itemData.category).trim(),
      status: itemData.status || 'Active'
    };
    
    // Additional validation
    if (cleanedItemData.name.length === 0) {
      throw new Error('Item name cannot be empty');
    }
    if (isNaN(cleanedItemData.price) || cleanedItemData.price < 0) {
      throw new Error('Invalid selling price');
    }
    if (isNaN(cleanedItemData.purchasePrice) || cleanedItemData.purchasePrice < 0) {
      throw new Error('Invalid purchase price');
    }
    if (cleanedItemData.category.length === 0) {
      throw new Error('Category cannot be empty');
    }

    // Create the updated row array
    const updatedRow = headers.map(header => {
      switch (header) {
        case PRIMARY_KEY: return cleanedItemData.id;
        case 'ITEM_NAME': return cleanedItemData.name;
        case 'PRICE': return cleanedItemData.price;
        case 'PURCHASE_PRICE': return cleanedItemData.purchasePrice;
        case 'CATEGORY': return cleanedItemData.category;
        case 'STATUS': return cleanedItemData.status;
        default: return '';
      }
    });

    log('Prepared updated row', updatedRow);
    
    // Update the row
    sheet.getRange(targetRow, 1, 1, updatedRow.length).setValues([updatedRow]);
    
    log('Item updated successfully', { 
      id: rowId, 
      row: targetRow, 
      name: cleanedItemData.name 
    });

    return { 
      success: true, 
      message: `Item '${cleanedItemData.name}' (ID: ${rowId}) updated successfully.`,
      id: rowId,
      item: cleanedItemData
    };
    
  } catch (error) {
    log('updateData failed', { error: error.message, stack: error.stack, itemData });
    throw error;
  }
}

/**
 * Deletes a row based on the item's ID.
 * @param {number} itemId - The ID of the item to delete.
 * @return {object} Result object with success status and deletion details
 */
function deleteData(itemId) {
  log('Starting deleteData operation', { itemId });
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet named '${SHEET_NAME}' not found`);
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idColumnIndex = headers.indexOf(PRIMARY_KEY) + 1;
    const rowId = parseInt(itemId);

    if (isNaN(rowId)) {
      throw new Error('Invalid item ID provided for delete.');
    }
    
    log('Delete request details', { rowId, idColumnIndex });
    
    // Find the target row
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      throw new Error('No data found in spreadsheet');
    }
    
    const idRange = sheet.getRange(2, idColumnIndex, lastRow - 1, 1);
    const rowValues = idRange.getValues().flat();
    
    // + 2 accounts for the header row (1) and the 0-based index conversion (+1)
    const targetRow = rowValues.findIndex(id => id == rowId) + 2; 

    if (targetRow < 2) {
      throw new Error(`Item with ID ${rowId} not found.`);
    }

    // Get the item details before deletion for logging
    const itemRange = sheet.getRange(targetRow, 1, 1, headers.length);
    const itemData = itemRange.getValues()[0];
    const itemName = itemData[headers.indexOf('ITEM_NAME')] || 'Unknown';
    
    log('Item to be deleted', { 
      id: rowId, 
      name: itemName, 
      row: targetRow 
    });

    // Delete the row
    sheet.deleteRow(targetRow);
    
    log('Item deleted successfully', { 
      id: rowId, 
      name: itemName, 
      row: targetRow 
    });

    return { 
      success: true, 
      message: `Item '${itemName}' (ID: ${rowId}) deleted successfully.`,
      deletedItem: {
        id: rowId,
        name: itemName
      }
    };
    
  } catch (error) {
    log('deleteData failed', { error: error.message, stack: error.stack, itemId });
    throw error;
  }
}
