import 'dotenv/config';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

if (!admin.apps.length) {
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
    GOOGLE_APPLICATION_CREDENTIALS
  } = process.env;

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else if (GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(GOOGLE_APPLICATION_CREDENTIALS)) {
    const json = JSON.parse(fs.readFileSync(GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(json) });
  } else {
    const localJson = path.resolve('serviceAccount.json');
    if (fs.existsSync(localJson)) {
      const json = JSON.parse(fs.readFileSync(localJson, 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(json) });
    } else {
      throw new Error('Firebase Admin credentials not found. Set env vars or add serviceAccount.json.');
    }
  }
}

export const db = () => admin.firestore();
export default admin;
