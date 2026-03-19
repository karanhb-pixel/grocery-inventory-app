# Grocery Inventory Tracker

This is the final source code for the single-page inventory management application with cloud synchronization.

## Project Summary

- **Front-End:** HTML, CSS, JavaScript (Vanilla JS).
- **Back-End/Database:**
  - **JSONBin.io:** Cloud synchronization for multi-device data persistence.
- **Features:**
  - **Inventory Management:** Add, View, Inline Edit (Desktop), Card View (Mobile).
  - **Bulk Entry:** Fast addition of multiple inventory items and purchase bills.
  - **Purchase Analysis:** Track item purchase frequency, price history, and stock burn rates with automated "Days Remaining" predictions over customizable time periods.
  - **Real-time Sync:** Status indicators for cloud operations (Success, Error, Loading).
- **Data Fields:** ID, ITEM_NAME, PRICE, PURCHASE_PRICE, CATEGORY, STATUS.

## 🚀 Deployment and Setup Guide

**The application will NOT work until you complete these steps to configure the API key.**

### Step 1: Choose Your Deployment Method

You must choose a method to securely connect the web app (frontend JavaScript) to a cloud storage provider:

#### Option A: JSONBin.io Integration (Recommended for Cloud Sync)

1.  **Create Account:** Sign up at [JSONBin.io](https://jsonbin.io/).
2.  **Generate API Key:** Get your Secret Key from the dashboard.
3.  **Setup Bins:** Create two private bins (one for Inventory, one for Bills).
4.  **Reference Guide:** See [JSONBIN_SETUP.md](./JSONBIN_SETUP.md) for detailed instructions.
5.  **Reference Guide:** See [JSONBIN_SETUP.md](./JSONBIN_SETUP.md) for detailed instructions.

- Update `JSONBIN_CONFIG` in `src/services/jsonbin.service.js` with your API Key and Bin IDs.

#### Option B: Dedicated API Service (Advanced)

Use a dedicated server (like Node.js/Express, Python Flask/FastAPI, or serverless functions) to host a secure API layer.
If using Option B (Dedicated API Service):

- Update `API_URL` in `app.js` with your custom API endpoint
- Configure any required authentication keys/headers for your custom service

### 📂 File Structure

```
grocery-inventory-app/
├── index.html          # Main application UI
├── style.css           # Modern, responsive styling
├── app.js              # Main application entry point
├── JSONBIN_SETUP.md    # Guide for JSONBin.io configuration
├── src/                # Modular source code
│   ├── core/           # State, Storage, and Constants
│   ├── features/       # Inventory, Bills, and Analysis logic
│   ├── services/       # Cloud API services (JSONBin)
│   └── ui/             # Component-specific UI logic
```

If you choose to edit `app.js` directly, replace the placeholder variables at the top:

```javascript
// ==============================================================================
// 1. Configuration (MUST BE UPDATED ACCORDING TO README.MD INSTRUCTIONS)
// ==============================================================================

const API_URL = "YOUR_SECURE_API_ENDPOINT_HERE";

// ... rest of the code ...
```
