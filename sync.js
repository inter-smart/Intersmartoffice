const admin = require("firebase-admin");
const { GoogleSpreadsheet } = require("google-spreadsheet");

// Load Firebase credentials from environment variable
const firebaseCredentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(firebaseCredentials),
});

const db = admin.firestore();

// Load Google Sheets API credentials from environment variable
const sheetsCredentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);

// Google Sheets setup
const SHEET_ID = "1TyCXn_R8fv_EJtZ8UZ4UErBeFY2TCgtKfejURTJttMw"; // Your Google Sheet ID
const doc = new GoogleSpreadsheet(SHEET_ID);

async function accessSpreadsheet() {
  await doc.useServiceAccountAuth({
    client_email: sheetsCredentials.client_email,
    private_key: sheetsCredentials.private_key.replace(/\\n/g, "\n"),
  });

  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0]; // Get the first sheet

  // Set headers if the sheet is empty
  const headers = [
    "date",
    "time",
    "name",
    "email",
    "department",
    "role",
    "purpose",
    "userId",
    "userEmail",
    "userDisplayName",
  ];
  await sheet.setHeaderRow(headers);

  return sheet;
}

// Fetch Firestore data and send to Google Sheets
async function syncFirestoreToSheets() {
  try {
    const sheet = await accessSpreadsheet();
    
    // Fetch all bookings from Firestore
    const snapshot = await db.collection("bookings").get();
    const rows = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Map Firestore document data to match the headers
      rows.push({
        date: data.date || "",
        time: data.time || "",
        name: data.name || "",
        email: data.email || "",
        department: data.department || "",
        role: data.role || "",
        purpose: data.purpose || "",
        userId: data.userId || "",
        userEmail: data.userEmail || "",
        userDisplayName: data.userDisplayName || "",
      });
    });

    if (rows.length > 0) {
      // Optional: Clear existing rows (except the header) before adding new ones
      await sheet.clearRows();

      // Add the new rows
      await sheet.addRows(rows);
      console.log(`✅ Successfully synced ${rows.length} bookings to Google Sheets!`);
    } else {
      console.log("⚠️ No data found in Firestore 'bookings' collection.");
    }
  } catch (error) {
    console.error("❌ Error syncing Firestore to Google Sheets:", error);
    throw error; // Ensure the error is thrown so GitHub Actions can mark the job as failed
  }
}

// Run the function
syncFirestoreToSheets().catch((error) => {
  console.error("Sync failed:", error);
  process.exit(1); // Exit with a failure code to signal GitHub Actions
});
