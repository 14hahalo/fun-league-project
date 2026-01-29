import admin from 'firebase-admin';
import * as path from 'path';

const serviceAccountPath = path.join(__dirname, '../../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath)
});

const db = admin.firestore();

db.settings({
  ignoreUndefinedProperties: true,
  maxIdleChannels: 10,
});

export { db };
export default admin;
