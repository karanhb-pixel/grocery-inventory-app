# SOLUTION.md

# Fixing Grocery Inventory App Configuration Issues

## Problem Summary
Your app is deployed on Netlify but failing due to:
1. **Wrong .env configuration** (PostgreSQL instead of Google Apps Script)
2. **Google Apps Script API not working** (returning HTML instead of JSON)
3. **Environment variables not properly set**

## SOLUTION 1: Fix Google Apps Script (Recommended)

### Step 1: Deploy Google Apps Script Properly

1. **Open Google Apps Script**
   - Go to your Google Sheet
   - Extensions → Apps Script
   - Delete any existing code and paste the content from `Code.gs`

2. **Deploy as Web App**
   - Click "Deploy" → "New deployment"
   - Type: Web app
   - Description: "Grocery Inventory API"
   - Execute as: Me
   - Who has access: Anyone
   - Click "Deploy"

3. **Copy the Web App URL**
   - Copy the "Web app" URL (ends with `/exec`)

### Step 2: Configure Netlify Environment Variables

1. **Go to Netlify Dashboard**
   - Site settings → Environment variables

2. **Add these variables:**
   ```
   API_URL = https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   SPREADSHEET_ID = 1d8bG3SMD6RwJJdrXs70faPyWB6Y1w6TN1jO-oClHdyA
   SHEET_NAME = Sheet1
   ```

3. **Deploy the site again**

### Step 3: Update .env file (Optional - for local testing)

Create a `.env` file in your project root:
```
API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
SPREADSHEET_ID=1d8bG3SMD6RwJJdrXs70faPyWB6Y1w6TN1jO-oClHdyA
SHEET_NAME=Sheet1
```

## SOLUTION 2: Switch to Alternative Backend

If Google Apps Script continues to have issues, here's an alternative:

### Create a simple Node.js API

1. **Install dependencies:**
```bash
npm init -y
npm install express cors dotenv googleapis
```

2. **Create `server.js`:**
```javascript
const express = require('express');
const cors = require('cors');
const { GoogleSpreadsheet } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

// Load environment variables
require('dotenv').config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1d8bG3SMD6RwJJdrXs70faPyWB6Y1w6TN1jO-oClHdyA';
const SHEET_NAME = process.env.SHEET_NAME || 'Sheet1';

// Google Sheets setup (you'll need service account credentials)
async function getSheetData() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'path/to/service-account-key.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const client = await auth.getClient();
  const spreadsheet = await google.sheets({ version: 'v4', auth: client });
  
  const response = await spreadsheet.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:Z`,
  });
  
  return response.data.values;
}

// API endpoints (simplified)
app.get('/api/items', async (req, res) => {
  try {
    const data = await getSheetData();
    res.json({ success: true, data: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/items', async (req, res) => {
  // Implement CRUD operations
});

app.listen(3000, () => {
  console.log('API server running on port 3000');
});
```

## Quick Fix for Immediate Testing

To test locally immediately, update `app.js` with the correct API URL:

```javascript
// Temporary fix - replace with your actual Apps Script URL
let API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYED_SCRIPT_ID/exec';
```

## Verification Steps

After implementing either solution:

1. **Check browser console** for errors
2. **Verify API response** is JSON, not HTML
3. **Test data loading** in the inventory table
4. **Test adding/editing** items

## Common Issues & Solutions

| Error | Solution |
|-------|----------|
| "CORS policy" | Ensure Apps Script has CORS headers |
| "Script function not found" | Redeploy Apps Script as Web App |
| "Permission denied" | Check Apps Script deployment permissions |
| "404 Not Found" | Verify environment variables in Netlify |

## Next Steps

1. **Choose Solution 1** (Google Apps Script) for simplicity
2. **Deploy the Apps Script** and get the URL
3. **Configure Netlify environment variables**
4. **Test the application**

The Google Apps Script approach is recommended as it requires no additional infrastructure and integrates seamlessly with Google Sheets.