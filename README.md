# Grocery Inventory Tracker

This is the final source code for the single-page inventory management application integrated with Google Sheets.

## Project Summary

* **Front-End:** HTML, CSS, JavaScript (Vanilla JS).
* **Back-End/Database:** Direct connection to the Google Sheet provided by the client.
* **Features:** Add, View (Sort by Name/Category), Inline Edit, and Remove.
* **Data Fields:** ID, ITEM_NAME, PRICE, PURCHASE_PRICE, CATEGORY, STATUS.

## 🚀 Deployment and Setup Guide

**The application will NOT work until you complete these steps to configure the API key.**

### Step 1: Google Sheet Preparation (Completed)

Ensure your sheet is accessible and has the required headers in the first row:
`ID`, `ITEM_NAME`, `PRICE`, `PURCHASE_PRICE`, `CATEGORY`, `STATUS`.

* **Your Sheet ID:** 1d8bG3SMD6RwJJdrXs70faPyWB6Y1w6TN1jO-oClHdyA
* **Target Sheet Name:** Sheet1 (Assumed)

### Step 2: Choose Your Deployment Method

You must choose a method to securely connect the web app (frontend JavaScript) to the Google Sheet:

#### Option A: Google Apps Script (Recommended for Simple Apps)

1.  **Open Google Apps Script:** In your Google Sheet, go to **Extensions** > **Apps Script**.
2.  **Deploy as Web App:** Write a simple script (called a 'serverless backend') that acts as a secure intermediary between your `app.js` and the sheet data. You deploy this script as a 'Web App' to get a unique URL.
3.  **Get the API Endpoint:** The deployed URL is your secure **`API_URL`**.

#### Option B: Dedicated API Service (Advanced)

Use a dedicated server (like Node.js, Python, or a service like Sheety/SheetDB) to host a secure API layer that handles the authentication and read/write requests to the Google Sheets API.

### Step 3: Update `app.js` Configuration

Once you have secured your API endpoint (the URL from Step 2), you must open the `app.js` file and replace the placeholder variables at the top:

```javascript
// ==============================================================================
// 1. Configuration (MUST BE UPDATED ACCORDING TO README.MD INSTRUCTIONS)
// ==============================================================================

const API_URL = 'YOUR_SECURE_APPS_SCRIPT_OR_API_ENDPOINT_HERE'; 
const SPREADSHEET_ID = '1d8bG3SMD6RwJJdrXs70faPyWB6Y1w6TN1jO-oClHdyA'; // Your sheet ID
const SHEET_NAME = 'Sheet1'; // Assuming default sheet name

// ... rest of the code ...