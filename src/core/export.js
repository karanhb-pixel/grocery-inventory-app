import { state } from "./state.js";
import { showStatus, hideStatus } from "../ui/status.ui.js";

/**
 * Data Export Engine
 * Provides JSON and CSV export functionality for grocery inventory backup
 */

/**
 * Export entire state to JSON file
 * Creates a "lossless" backup of all app data
 */
export function exportToJSON() {
  try {
    // Stringify the entire state object
    const jsonString = JSON.stringify(state, null, 2);

    // Create a Blob with the JSON content
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element to trigger download
    const link = document.createElement("a");
    link.href = url;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    link.download = `grocery-inventory-backup-${timestamp}.json`;

    // Trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success feedback
    showStatus("✅ JSON backup downloaded successfully!", "success");
    hideStatus(3000);

    console.log("JSON export completed:", link.download);
  } catch (error) {
    console.error("JSON export failed:", error);
    showStatus("❌ Failed to export JSON", "error");
    hideStatus(3000);
  }
}

/**
 * Helper function to escape CSV values
 * Handles values that contain commas, quotes, or newlines
 */
function escapeCSVValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If the value contains comma, quote, newline, or carriage return, wrap it in quotes
  // and escape any existing quotes by doubling them (RFC 4180 compliant)
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Flatten inventory items into CSV format
 * Joins Name, Category, Price, Quantity, Status into comma-separated strings
 */
export function exportToCSV() {
  try {
    // Check if inventory is empty
    if (!state.inventory || state.inventory.length === 0) {
      showStatus("⚠️ No inventory data to export", "warning");
      hideStatus(3000);
      return;
    }

    // CSV header row - map through escapeCSVValue for consistency
    const headers = ["Name", "Category", "Price", "Quantity", "Status"].map(
      escapeCSVValue,
    );

    // Flatten each inventory item into a CSV row
    const csvRows = state.inventory.map((item) => {
      return [
        escapeCSVValue(item.name),
        escapeCSVValue(item.category),
        escapeCSVValue(item.price),
        escapeCSVValue(item.quantity),
        escapeCSVValue(item.status),
      ].join(",");
    });

    // Combine header and rows
    const csvString = [headers.join(","), ...csvRows].join("\n");

    // Create a Blob with the CSV content
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element to trigger download
    const link = document.createElement("a");
    link.href = url;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    link.download = `grocery-inventory-${timestamp}.csv`;

    // Trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success feedback
    showStatus("✅ CSV file downloaded successfully!", "success");
    hideStatus(3000);

    console.log("CSV export completed:", link.download);
  } catch (error) {
    console.error("CSV export failed:", error);
    showStatus("❌ Failed to export CSV", "error");
    hideStatus(3000);
  }
}

/**
 * Initialize export button event listeners
 * Wires up the UI buttons to trigger export functions
 */
export function initExportHandlers() {
  // Desktop export buttons
  const exportJsonBtn = document.getElementById("export-json-btn");
  const exportCsvBtn = document.getElementById("export-csv-btn");

  // Mobile export buttons
  const mobileExportJsonBtn = document.getElementById("mobile-export-json");
  const mobileExportCsvBtn = document.getElementById("mobile-export-csv");

  // Attach JSON export handlers
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", exportToJSON);
  }

  if (mobileExportJsonBtn) {
    mobileExportJsonBtn.addEventListener("click", exportToJSON);
  }

  // Attach CSV export handlers
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", exportToCSV);
  }

  if (mobileExportCsvBtn) {
    mobileExportCsvBtn.addEventListener("click", exportToCSV);
  }

  console.log("Export handlers initialized");
}
