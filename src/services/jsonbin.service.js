import { state } from "../core/state.js";
import { showStatus, hideStatus } from "../ui/status.ui.js";
const CONFIG = {
  apiKey: "$2a$10$hTYGSMnNHzJkNG0id/yRfeJsv2ngrcFYEKfuP7jsJKMmJwh2cvkMW",
  inventoryBin: "69344fedae596e708f87a733",
  billsBin: "69688172ae596e708fdd87be",
  baseUrl: "https://api.jsonbin.io/v3/b",
};

export async function syncInventory() {
  try {
    showStatus("Syncing to JSONBin...", "loading");
    await fetch(`${CONFIG.baseUrl}/${CONFIG.inventoryBin}`, {
      method: "PUT",
      headers: {
        "X-Master-Key": CONFIG.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state.inventory),
    });
    showStatus("Sync successful", "success");
    hideStatus();
  } catch (e) {
    showStatus("Sync failed", "error");
  }
}

export async function loadInventory() {
  const res = await fetch(`${CONFIG.baseUrl}/${CONFIG.inventoryBin}/latest`, {
    headers: { "X-Master-Key": CONFIG.apiKey },
  });
  const json = await res.json();
  state.inventory = json.record || [];
}

export async function syncBills() {
  try {
    showStatus("Syncing bills...", "loading");
    await fetch(`${CONFIG.baseUrl}/${CONFIG.billsBin}`, {
      method: "PUT",
      headers: {
        "X-Master-Key": CONFIG.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state.bills),
    });
    showStatus("Bills sync successful", "success");
    hideStatus();
  } catch (e) {
    showStatus("Bills sync failed", "error");
  }
}

export async function loadBills() {
  try {
    const res = await fetch(`${CONFIG.baseUrl}/${CONFIG.billsBin}/latest`, {
      headers: { "X-Master-Key": CONFIG.apiKey },
    });
    const json = await res.json();
    state.bills = json.record || [];
  } catch (e) {
    console.error("Failed to load bills", e);
  }
}
