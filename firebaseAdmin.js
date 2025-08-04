const admin = require("firebase-admin");
const serviceAccount = require("./bevtrends-e701a-firebase-adminsdk-fbsvc-xxxxx.json"); // Update filename if needed

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const postsCollection = db.collection("posts");

module.exports = { admin, db, postsCollection };
