import { loadStorage } from "./core/storage.js";
import { addItem, deleteItem } from "./features/inventory.feature.js";
import { renderInventory } from "./ui/inventory.ui.js";
import { syncInventory, loadInventory } from "./services/jsonbin.service.js";
import { addBill, deleteBill } from "./features/bills.features.js";
import { renderBills } from "./ui/bills.ui.js";

document.addEventListener("DOMContentLoaded", () => {
  loadStorage();
  renderInventory();

  document.getElementById("item-form").addEventListener("submit", (e) => {
    e.preventDefault();
    addItem({
      name: itemName.value,
      price: +sellingPrice.value,
      purchasePrice: +purchasePrice.value,
      category: category.value,
    });
    renderInventory();
  });

  document.querySelector("#inventory-table").addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (e.target.classList.contains("delete-btn")) {
      deleteItem(+row.dataset.id);
      renderInventory();
    }
  });

  document
    .getElementById("sync-to-jsonbin")
    .addEventListener("click", syncInventory);

  document.getElementById("bill-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    addBill({
      date: billDate.value,
      itemName: billItem.options[billItem.selectedIndex].text,
      quantity: +billQuantity.value,
      purchasePrice: +billPurchasePrice.value,
    });
    renderBills();
  });

  document
    .getElementById("load-from-jsonbin")
    ?.addEventListener("click", async () => {
      await loadInventory();
      renderInventory();
    });
});
