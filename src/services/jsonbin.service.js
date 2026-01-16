import { state } from "../core/state.js";
import { showStatus, hideStatus } from "../ui/status.ui.js";
const CONFIG = {
  apiKey: "YOUR_KEY",
  inventoryBin: "BIN_ID_1",
  billsBin: "BIN_ID_2",
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
