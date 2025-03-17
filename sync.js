const admin = require("firebase-admin");
const { GoogleSpreadsheet } = require("google-spreadsheet");

const firebaseCredentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
admin.initializeApp({
  credential: admin.credential.cert(firebaseCredentials),
});

const db = admin.firestore();
const sheetsCredentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
const SHEET_ID = "YOUR_GOOGLE_SHEET_ID"; // Replace with your actual Sheet ID
const doc = new GoogleSpreadsheet(SHEET_ID);

async function accessSpreadsheet() {
  await doc.useServiceAccountAuth({
    client_email: sheetsCredentials.client_email,
    private_key: sheetsCredentials.private_key.replace(/\\n/g, "\n"),
  });
  await doc.loadInfo();
  return doc.sheetsByIndex[0];
}

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

syncFirestoreToSheets().catch(console.error);
