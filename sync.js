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
const SHEET_ID = "YOUR_GOOGLE_SHEET_ID"; // Replace with your actual Sheet ID
const doc = new GoogleSpreadsheet(SHEET_ID);

async function accessSpreadsheet() {
  await doc.useServiceAccountAuth({
    client_email: sheetsCredentials.client_email,
    private_key: sheetsCredentials.private_key.replace(/\\n/g, "\n"),
  });

  await doc.loadInfo();
  return doc.sheetsByIndex[0]; // Get the first sheet
}

// Fetch Firestore data and send to Google Sheets
async function syncFirestoreToSheets() {
  const sheet = await accessSpreadsheet();
  const snapshot = await db.collection("YOUR_COLLECTION_NAME").get();
  const rows = [];

  snapshot.forEach((doc) => {
    rows.push(doc.data());
  });

  if (rows.length > 0) {
    await sheet.addRows(rows);
    console.log("✅ Firestore data sent to Google Sheets!");
  } else {
    console.log("⚠️ No data found in Firestore collection.");
  }
}

// Run the function
syncFirestoreToSheets().catch(console.error);
