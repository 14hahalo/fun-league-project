import admin from 'firebase-admin';
import * as path from 'path';

let serviceAccount: admin.ServiceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  const serviceAccountPath = path.join(__dirname, '../../../serviceAccountKey.json');
  serviceAccount = require(serviceAccountPath);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

db.settings({
  ignoreUndefinedProperties: true,
  maxIdleChannels: 10,
});

export { db };
export default admin;
