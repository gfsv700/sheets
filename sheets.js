const { google } = require('googleapis');
const path = require('path');

// 1. Path to your downloaded service account credentials
const KEYFILEPATH = path.join(__dirname, 'credentials.json');

// 2. Define the scopes your script needs (Read-only access is sufficient here)
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// 3. Replace with your actual Spreadsheet ID for:
// "Copy of "Parents of Class of 2026" College Application Fee Information and Waiver Codes (Responses)"
//SHEET URL: https://docs.google.com/spreadsheets/d/1_dBozutanczzUxfAHaWL7tOE4mFNSt2avtyvM-SfTIo/edit?gid=170229371#gid=170229371
//SHEET id: 1_dBozutanczzUxfAHaWL7tOE4mFNSt2avtyvM-SfTIo
const SPREADSHEET_ID = '1_dBozutanczzUxfAHaWL7tOE4mFNSt2avtyvM-SfTIo';

async function extractSheetData() {
  try {
    // Authenticate using the service account key file
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILEPATH,
      scopes: SCOPES,
    });

    // Create the Sheets API client instance
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch the data from the sheet.
    // "Form Responses 1!A:Z" fetches the first sheet tab. Adjust the range if necessary.
    console.log("extracting sheets data..")
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Form Responses 1!A:Z',
    });

    let rows = response.data.values;


    if (!rows || rows.length === 0) {
      console.log('No data found.');
      return [];
    }

    //console.log(rows[1])

    // Extract headers (the first row)
    const headers = rows[1];

    // Find index positions of our target columns
    const schoolNameIndex = headers.indexOf('Name of School');
    const waiverCodeIndex = headers.indexOf('Waiver Code');

    if (schoolNameIndex === -1 || waiverCodeIndex === -1) {
      throw new Error("Required columns ('Name of School' or 'Waiver Code') not found in the sheet headers.");
    }

    //rows = rows.splice(1, 30);

    const seenSchools = new Set();

    // Process rows starting from index 1 (skipping headers)
    const extractedData = rows.slice(1).reduce((acc, row) => {
      const schoolName = row[schoolNameIndex] ? row[schoolNameIndex].trim() : '';

      // Normalize name to lowercase to catch case-insensitive duplicates
      const normalizedSchoolName = schoolName.toLowerCase();

      // If the school name is not empty and hasn't been seen yet, process it
      if (schoolName && !seenSchools.has(normalizedSchoolName)) {
        // Add to our Set to mark it as seen
        seenSchools.add(normalizedSchoolName);

        let waiverCode = row[waiverCodeIndex];

        // Handle empty/missing values or strings with more than 2 words
        if (!waiverCode || waiverCode.trim() === '' || waiverCode.split(" ").length > 2) {
          waiverCode = 'Free Application';
        } else {
          waiverCode = waiverCode.trim();
        }

        // Push the transformed object to the accumulator array
        acc.push({
          School: schoolName,
          Code: waiverCode,
          Validity: "xx"
        });
      }

      return acc;
    }, []);

    console.log('Successfully extracted data:');
    console.log('length: ',  extractedData.length);
    //console.log(JSON.stringify(extractedData, null, 2));
    return JSON.stringify(extractedData);

  } catch (error) {
    console.error('Error fetching or processing data:', error);
  }
}

// Execute the function
//extractSheetData();
module.exports = {extractSheetData};