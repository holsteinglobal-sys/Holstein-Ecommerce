import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceAccountPath = join(__dirname, 'serviceAccount.json');

console.log(`\n--- START DIAGNOSTIC ---`);
console.log(`Checking Service Account at: ${serviceAccountPath}`);

if (!existsSync(serviceAccountPath)) {
    console.error(`[ERROR] File not found: ${serviceAccountPath}`);
    process.exit(1);
}

try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    console.log(`Project ID: ${serviceAccount.project_id}`);
    console.log(`Client Email: ${serviceAccount.client_email}`);
    
    // Check for common formatting issues
    if (serviceAccount.private_key && serviceAccount.private_key.includes('\\n')) {
       console.log(`[INFO] Private key contains escaped newlines (expected).`);
    } else {
       console.warn(`[WARN] Private key might be malformed (no escaped newlines found).`);
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log(`[INFO] Firebase Admin initialized.`);
    }

    const db = admin.firestore();
    console.log(`[INFO] Attempting Firestore Connection...`);
    
    // Attempt real connection
    const collections = await db.listCollections();
    console.log(`[SUCCESS] Connected! Found ${collections.length} collections.`);
    collections.forEach(c => console.log(` - ${c.id}`));
    console.log(`--- DIAGNOSTIC PASSED ---\n`);

} catch (error) {
    console.error(`\n[FATAL ERROR] Connection Failed!`);
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Message: ${error.message}`);
    
    if (error.code === 16 || error.message.includes('UNAUTHENTICATED')) {
        console.error(`\n[ANALYSIS] The Service Account Key is Invalid or Expired.`);
        console.log(`Steps to fix:`);
        console.log(`1. Go to Firebase Console > Project Settings > Service Accounts.`);
        console.log(`2. Click 'Generate New Private Key'.`);
        console.log(`3. Replace 'server/serviceAccount.json' with the new file.`);
    }
    console.log(`--- DIAGNOSTIC FAILED ---\n`);
}
