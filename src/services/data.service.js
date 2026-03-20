import { state } from "../core/state.js";
import { saveInventory, saveBills, loadStorage } from "../core/storage.js";
import { renderInventory, initInventoryUI } from "../ui/inventory.ui.js";
import { renderBills, initBillsUI } from "../ui/bills.ui.js";

/**
 * Validates and imports JSON data into the application state
 * @param {string} jsonData - The stringified JSON data
 * @returns {Promise<boolean>} - Success or failure
 */
export async function importFromJSON(jsonData) {
  try {
    const parsed = JSON.parse(jsonData);

    if (!Array.isArray(parsed.inventory) || !Array.isArray(parsed.bills)) {
      throw new Error("Invalid format: Missing inventory or bills data");
    }

    // Sanitize Inventory: Ensure numbers stay numbers
    state.inventory = parsed.inventory.map((item) => ({
      ...item,
      id: Number.isFinite(Number(item.id)) ? Number(item.id) : 0,
      price: parseFloat(item.price) || 0,
      quantity: parseFloat(item.quantity) || 0,
    }));

    // Sanitize Bills: Ensure numbers stay numbers and dates are valid
    state.bills = parsed.bills.map((bill) => ({
      ...bill,
      id: Number.isFinite(Number(bill.id)) ? Number(bill.id) : 0,
      quantity: parseFloat(bill.quantity) || 0,
      purchasePrice: parseFloat(bill.purchasePrice) || 0,
    }));

    // Persistence
    saveInventory();
    saveBills();

    // Recalculate next IDs to avoid collisions with imported data
    loadStorage();

    // Trigger Re-renders
    renderInventory();
    renderBills();

    return true;
  } catch (error) {
    console.error("Import failed:", error);
    return false;
  }
}

/**
 * Validates and imports CSV data into the application inventory
 * Expected format: Name, Category, Price, Quantity, Status
 * @param {string} csvData - The raw CSV string
 * @returns {Promise<boolean>} - Success or failure
 */
export async function importFromCSV(csvData) {
  try {
    const lines = csvData.split("\n");
    if (lines.length < 2) throw new Error("CSV is empty or missing header");

    const header = lines[0].split(",");
    const inventory = [];

    // Simple CSV parser (assuming comma-separated and no complex escaping for now)
    // Note: This matches the structure in exportToCSV
    const parseCSVLine = (text) => {
      const result = [];
      let cell = "";
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === "," && !inQuotes) {
          result.push(cell.trim().replace(/^"|"$/g, ""));
          cell = "";
        } else cell += char;
      }
      result.push(cell.trim().replace(/^"|"$/g, ""));
      return result;
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = parseCSVLine(line);
      if (cols.length < 5) continue;

      inventory.push({
        name: cols[0],
        category: cols[1],
        price: parseFloat(cols[2]) || 0,
        quantity: parseFloat(cols[3]) || 0,
        status: cols[4] || "Active",
        id: state.nextItemId++, // Generate new IDs for CSV imports
      });
    }

    if (inventory.length === 0) throw new Error("No valid items found in CSV");

    state.inventory = inventory;
    saveInventory();

    // Recalculate next IDs
    loadStorage();

    renderInventory();
    return true;
  } catch (error) {
    console.error("CSV Import failed:", error);
    return false;
  }
}

/**
 * Clears all local data after confirmation
 */
export function clearAllData() {
  state.inventory = [];
  state.bills = [];
  saveInventory();
  saveBills();
  loadStorage();
  renderInventory();
  renderBills();
}
