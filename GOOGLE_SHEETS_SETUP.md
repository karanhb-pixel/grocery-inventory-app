# Google Sheets API Setup Guide

## Overview
This guide will help you set up direct access to Google Sheets API for hardcoded integration.

## Method 1: Service Account (Recommended) ✅

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Grocery Inventory Sheets"
3. Enable Google Sheets API
4. Enable Google Drive API

### Step 2: Create Service Account
1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Name: "Grocery Inventory Service"
4. Grant these roles:
   - **Editor** (for Sheets access)
   - **Service Account Token Creator**

### Step 3: Generate Key
1. Click on your service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose **JSON** format
5. Download the JSON file

### Step 4: Share Your Google Sheet
1. Create a new Google Sheet or use existing one
2. Share the sheet with your service account email:
   ```
   grocery-inventory-service@your-project-id.iam.gserviceaccount.com
   ```
3. Give it **Editor** permissions

### Step 5: Extract Credentials
From the JSON file, you'll need:
```json
{
  "client_email": "grocery-inventory-service@your-project-id.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
}
```

## Method 2: OAuth 2.0 with Refresh Token (Alternative)

### Step 1: Create OAuth 2.0 Client
1. In Google Cloud Console, go to "Credentials"
2. Create "OAuth 2.0 Client ID"
3. Application type: "Desktop application"
4. Download the JSON file

### Step 2: Get Refresh Token
Run this code once to get refresh token:
```javascript
const { google } = require('googleapis');

// Load credentials from downloaded JSON
const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'urn:ietf:wg:oauth:2.0:oob'
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/spreadsheets']
});

console.log('Visit this URL:', authUrl);
```

### Step 3: Exchange Code for Tokens
1. Visit the printed URL
2. Authorize the application
3. Copy the code from the redirect URL
4. Exchange it for refresh token

## Method 3: Quick Demo Setup (Easiest)

For immediate testing, you can use a demo approach:

### Option A: Share Sheet Publicly
1. Create a Google Sheet
2. Make it "Anyone with the link can view/edit"
3. Get the Sheet ID from the URL
4. Use API key for access

### Option B: Use Existing Public Sheet
- Create sample sheet with test data
- Share publicly
- Use for immediate testing

## Implementation Example

### Service Account Setup
```javascript
// In your app.js
const GOOGLE_SHEETS_CONFIG = {
  client_email: 'grocery-inventory-service@your-project.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n',
  spreadsheet_id: 'YOUR_SHEET_ID_HERE'
};

// Initialize Google Sheets API
const { GoogleSpreadsheet } = require('google-spreadsheet');
const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.spreadsheet_id);

async function initializeSheets() {
  await doc.useServiceAccountAuth({
    client_email: GOOGLE_SHEETS_CONFIG.client_email,
    private_key: GOOGLE_SHEETS_CONFIG.private_key,
  });
  
  await doc.loadInfo();
  console.log('Connected to Google Sheets');
}
```

## Security Considerations

### ⚠️ Important Security Notes:
1. **Never commit private keys** to version control
2. **Use environment variables** for sensitive data
3. **Rotate keys regularly**
4. **Limit API permissions** to only what's needed
5. **Monitor API usage** in Google Cloud Console

### 🔒 Secure Configuration:
```javascript
// Use environment variables instead of hardcoding
const config = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  spreadsheet_id: process.env.GOOGLE_SPREADSHEET_ID
};
```

## Testing Your Setup

### 1. Test API Connection
```javascript
async function testConnection() {
  try {
    await doc.loadInfo();
    console.log('✅ Google Sheets connection successful');
    
    // Test reading data
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadCells();
    console.log('✅ Sheet access successful');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}
```

### 2. Create Test Data
```javascript
async function createTestData() {
  const sheet = doc.sheetsByIndex[0];
  
  // Add headers
  await sheet.setHeaderRow(['ID', 'Name', 'Price', 'Category', 'Status']);
  
  // Add sample data
  await sheet.addRow({
    ID: 1,
    Name: 'Test Item',
    Price: 10.99,
    Category: 'Test',
    Status: 'Active'
  });
  
  console.log('✅ Test data created');
}
```

## Next Steps

After setting up:
1. **Replace placeholder values** in the configuration
2. **Test the connection** with sample data
3. **Implement sync functions** for localStorage ↔ Google Sheets
4. **Add error handling** for API failures
5. **Set up auto-sync** intervals

## Troubleshooting

### Common Issues:
- **401 Unauthorized**: Check service account permissions
- **403 Forbidden**: Verify sheet sharing settings
- **404 Not Found**: Check spreadsheet ID is correct
- **Quota exceeded**: Monitor API usage in Cloud Console

### Debug Steps:
1. Check Google Cloud Console for API enablement
2. Verify service account has correct permissions
3. Test with Google APIs Explorer
4. Check network connectivity and CORS settings