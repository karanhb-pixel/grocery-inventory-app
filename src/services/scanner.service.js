import { state } from "../core/state.js";

let html5QrcodeScanner = null;

/**
 * Handles successful barcode/QR code scans
 * @param {string} decodedText - The text decoded from the scanner
 */
export function handleScanSuccess(decodedText) {
  // Keep raw text for logic, matching, and form values to avoid breakage from early escaping
  const rawText = decodedText;
  const statusEl = document.getElementById("scanner-status");

  // Only escape when inserting into DOM or if strictly needed for UI display
  if (statusEl) statusEl.textContent = `Scanned: ${rawText}`;

  // 1. Search existing inventory for match (case-insensitive)
  const match = state.inventory.find(
    (i) =>
      i.name.toLowerCase() === rawText.toLowerCase() ||
      (i.id && i.id.toString() === rawText),
  );

  if (match) {
    // 2. Auto-fill the form if item exists
    const nameInput = document.querySelector('[name="itemName"]');
    const categoryInput = document.querySelector('[name="category"]');
    const priceInput = document.querySelector('[name="itemPrice"]');

    if (nameInput) nameInput.value = match.name;
    if (categoryInput) categoryInput.value = match.category;
    if (priceInput) priceInput.value = match.price;

    alert(`Found existing item: ${match.name}`);
    stopScanner();
  } else {
    // 3. Prepare for new item entry
    const nameInput = document.querySelector('[name="itemName"]');
    if (nameInput) nameInput.value = rawText;

    alert(`New item detected: ${rawText}. Please assign a category.`);
    stopScanner();
  }
}

/**
 * Handles scan failure
 * Note: This function intentionally ignores errors from per-frame scan attempts to avoid
 * noisy logs and allow subsequent frames to be processed. Errors from persistent scanning
 * issues (e.g., camera permissions, hardware) are typically caught in the start() promise
 * rather than here. If you need to escalate certain error types, add logic to check
 * error properties (e.g., error.message or error.name) for specific conditions.
 */
export function handleScanError(error) {
  // Intentionally ignore frame-level errors to prevent log noise
}

/**
 * Initializes and starts the camera scanner
 * @param {string} elementId - The ID of the container element
 */
export function startScanner(elementId) {
  // Dependency check for global/CDN library
  if (typeof Html5Qrcode === "undefined") {
    const statusEl = document.getElementById("scanner-status");
    const errorMsg =
      "Html5Qrcode library not loaded. Check your internet connection or script tags.";
    console.error(errorMsg);
    if (statusEl) {
      statusEl.textContent = errorMsg;
      statusEl.classList.add("error");
    }
    return;
  }

  const modal = document.getElementById("scanner-modal");
  if (modal) modal.classList.add("active");

  const statusEl = document.getElementById("scanner-status");
  if (statusEl) statusEl.textContent = "Requesting camera access...";

  // Correct instantiation: pass elementId to constructor
  if (!html5QrcodeScanner) {
    try {
      html5QrcodeScanner = new Html5Qrcode(elementId);
    } catch (e) {
      console.error("Failed to initialize Html5Qrcode", e);
      if (statusEl) statusEl.textContent = "Error initializing scanner.";
      return;
    }
  }

  // Config passed to start()
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  html5QrcodeScanner
    .start(
      { facingMode: "environment" },
      config,
      handleScanSuccess,
      handleScanError,
    )
    .catch((err) => {
      console.error("Unable to start scanner", err);
      if (statusEl) {
        statusEl.textContent = "Error: Camera access denied or not found.";
        statusEl.classList.add("error");
      }
    });
}

/**
 * Stops the scanner and cleans up
 */
export function stopScanner() {
  const modal = document.getElementById("scanner-modal");
  if (modal) modal.classList.remove("active");

  if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
    html5QrcodeScanner
      .stop()
      .then(() => {
        console.log("Scanner stopped.");
      })
      .catch((err) => {
        console.error("Failed to stop scanner", err);
      });
  }
}

/**
 * Initialize individual scanner UI bindings
 */
export function initScannerUI() {
  const scanBtns = document.querySelectorAll(".scan-btn");
  const closeBtn = document.querySelector(".close-scanner-modal");

  scanBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const itemFormContainer = document.getElementById("item-form-container");
      if (itemFormContainer && itemFormContainer.style.display === "none") {
        const addNewItemBtn = document.getElementById("add-new-item");
        if (addNewItemBtn) addNewItemBtn.click();
      }
      startScanner("scanner-reader");
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", stopScanner);
  }

  const modal = document.getElementById("scanner-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) stopScanner();
    });
  }
}
