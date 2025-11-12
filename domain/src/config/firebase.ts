import admin from 'firebase-admin';
import * as path from 'path';

// Service account key dosyasının yolu
const serviceAccountPath = path.join(__dirname, '../../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath)
});

// Configure Firestore for better connection handling with concurrent users
const db = admin.firestore();

// Firestore settings for production with high traffic
db.settings({
  ignoreUndefinedProperties: true,
  // Increase max idle channels for concurrent connections (default is 1)
  // This helps handle 100+ concurrent users more efficiently
  maxIdleChannels: 10,
});

export { db };
export default admin;
