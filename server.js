const express = require('express');
const { extractSheetData } = require('./sheets'); // Assumes sheets.js is in the same directory

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to handle JSON payloads
app.use(express.json());

/**
 * GET /sheets-data
 * Fetches and returns the processed Google Sheets data
 */
app.get('/sheets-data', async (req, res) => {
  try {
    const data = await extractSheetData();

    // If the function encountered an error inside its own catch block, it returns undefined
    if (data === undefined) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve or process sheet data.'
      });
    }

    // Safely parse the data if sheets.js returned a stringified JSON,
    // otherwise fallback to the raw object/array.
    const responseData = typeof data === 'string' ? JSON.parse(data) : data;

    // Send the structured data back to the client
    res.json(responseData);

  } catch (error) {
    console.error('Route Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running and listening on http://localhost:${PORT}`);
  console.log(`📊 Access sheet data at http://localhost:${PORT}/sheets-data`);
});