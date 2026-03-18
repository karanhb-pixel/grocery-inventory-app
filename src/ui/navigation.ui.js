import gsap from "gsap";
import { clearAllRows } from "./bulk-entry.ui.js";

export function initNavigation() {
  const inputPanel = document.getElementById("input-panel");
  const inventoryPanel = document.getElementById("inventory-panel");
  const billsPanel = document.getElementById("bills-panel");
  const analysisPanel = document.getElementById("analysis-panel");
  const showBillsBtns = document.querySelectorAll(".bills-btn");
  const showAnalysisBtn = document.getElementById("show-analysis");
  const backToInventoryBtn = document.getElementById("back-to-inventory");
  const backFromAnalysisBtn = document.getElementById(
    "back-to-inventory-from-analysis",
  );

  const inventorySync = document.getElementById("inventory-sync-controls");
  const billsSync = document.getElementById("bills-sync-controls");
  const syncHeader = document.getElementById("sync-header");

  const toggleSync = (view) => {
    // Update Sync Controls visibility and text
    if (view === "bills") {
      if (inventorySync) inventorySync.style.display = "none";
      if (billsSync) billsSync.style.display = "block";
      if (syncHeader) syncHeader.textContent = "Bills Cloud Sync";
    } else {
      if (inventorySync) inventorySync.style.display = "block";
      if (billsSync) billsSync.style.display = "none";
      if (syncHeader) syncHeader.textContent = "Inventory Cloud Sync";
    }

    const panels = [
      inputPanel,
      inventoryPanel,
      billsPanel,
      analysisPanel,
    ].filter((p) => p !== null);

    let targetPanel = null;
    if (view === "bills") {
      targetPanel = billsPanel;
    } else if (view === "inventory") {
      // Inventory view includes both input and inventory panels
      gsap.to(panels, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        display: "none",
        onComplete: () => {
          gsap.fromTo(
            [inputPanel, inventoryPanel],
            { opacity: 0, y: -20, display: "none" },
            {
              opacity: 1,
              y: 0,
              display: "block",
              duration: 0.5,
              ease: "back.out(1.7)",
            },
          );
        },
      });
      return;
    } else if (view === "analysis") {
      targetPanel = analysisPanel;
    }

    // Animate the outgoing panels
    gsap.to(panels, {
      opacity: 0,
      y: 20,
      duration: 0.3,
      display: "none",
      onComplete: () => {
        // Animate target in
        if (targetPanel) {
          gsap.fromTo(
            targetPanel,
            { opacity: 0, y: -20, display: "none" },
            {
              opacity: 1,
              y: 0,
              display: "block",
              duration: 0.5,
              ease: "back.out(1.7)",
            },
          );
        }
      },
    });
  };

  showBillsBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleSync("bills");
    });
  });

  if (showAnalysisBtn) {
    showAnalysisBtn.addEventListener("click", () => {
      // Trigger render when showing analysis
      const event = new Event("analysis-shown");
      document.dispatchEvent(event);
      toggleSync("analysis");
    });
  }

  if (backToInventoryBtn) {
    backToInventoryBtn.addEventListener("click", () => {
      toggleSync("inventory");
    });
  }

  if (backFromAnalysisBtn) {
    backFromAnalysisBtn.addEventListener("click", () => {
      toggleSync("inventory");
    });
  }
}

export function initModals() {
  const modal = document.getElementById("data-modal");
  const openBtns = document.querySelectorAll(".mobile-data-btn");
  const closeBtns = document.querySelectorAll(".close-modal");

  // Toggle Logic
  const toggleModal = () => {
    if (modal) {
      modal.style.display = modal.style.display === "flex" ? "none" : "flex";
    }
  };

  openBtns.forEach((btn) => btn.addEventListener("click", toggleModal));
  closeBtns.forEach((btn) => btn.addEventListener("click", toggleModal));

  // Data Export/Import UI triggers (Wiring only, logic is stubbed)
  const wireTrigger = (triggerId, inputId) => {
    const trigger = document.getElementById(triggerId);
    const input = document.getElementById(inputId);
    if (trigger && input) {
      trigger.addEventListener("click", () => input.click());
    }
  };

  wireTrigger("import-csv-trigger", "csv-import");
  wireTrigger("import-json-trigger", "json-import");
  wireTrigger("mobile-import-csv-trigger", "mobile-csv-import");
  wireTrigger("mobile-import-json-trigger", "mobile-json-import");

  // Toggle Data Management section
  const toggleDataMgmtBtn = document.getElementById("toggle-data-management");
  const dataMgmtSection = document.getElementById("data-management-section");

  if (toggleDataMgmtBtn && dataMgmtSection) {
    toggleDataMgmtBtn.addEventListener("click", () => {
      const isHidden = dataMgmtSection.style.display === "none";
      dataMgmtSection.style.display = isHidden ? "block" : "none";
      toggleDataMgmtBtn.textContent = isHidden
        ? "📊 Hide Data Management"
        : "📊 Import/Export Data";
    });
  }
}

export function initBillsFormUI() {
  const addNewBillBtn = document.getElementById("add-new-bill");
  const cancelBillBtn = document.getElementById("cancel-bill-btn");
  const billFormContainer = document.getElementById("bill-form-container");

  if (addNewBillBtn && billFormContainer) {
    addNewBillBtn.addEventListener("click", () => {
      billFormContainer.style.display = "block";
    });
  }

  if (cancelBillBtn && billFormContainer) {
    cancelBillBtn.addEventListener("click", () => {
      billFormContainer.style.display = "none";
    });
  }
}

export function initItemFormUI() {
  const addNewItemBtn = document.getElementById("add-new-item");
  const cancelItemBtn = document.getElementById("cancel-item-btn");
  const itemFormContainer = document.getElementById("item-form-container");

  if (addNewItemBtn && itemFormContainer) {
    addNewItemBtn.addEventListener("click", () => {
      itemFormContainer.style.display = "block";
    });
  }

  if (cancelItemBtn && itemFormContainer) {
    cancelItemBtn.addEventListener("click", () => {
      itemFormContainer.style.display = "none";
      // Clear form when canceling
      const itemForm = document.getElementById("item-form");
      if (itemForm && clearAllRows) {
        clearAllRows();
      }
    });
  }
}
