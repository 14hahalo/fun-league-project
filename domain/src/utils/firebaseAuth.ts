import admin from '../config/firebase';

export async function setUserCustomClaims(userId: string, role: 'ADMIN' | 'PLAYER') {
  try {
    await admin.auth().setCustomUserClaims(userId, {
      role: role,
    });
  } catch (error) {
    console.error('Failed to set custom claims:', error);
    throw new Error(`Failed to set custom claims: ${error}`);
  }
}

export async function createCustomToken(userId: string, role: 'ADMIN' | 'PLAYER') {
  try {
    const customToken = await admin.auth().createCustomToken(userId, {
      role: role,
    });
    return customToken;
  } catch (error) {
    console.error('Failed to create custom token:', error);
    throw new Error(`Failed to create custom token: ${error}`);
  }
}

export async function verifyFirebaseToken(idToken: string) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      userId: decodedToken.uid,
      role: decodedToken.role as 'ADMIN' | 'PLAYER',
    };
  } catch (error) {
    console.error('Failed to verify token:', error);
    throw new Error(`Failed to verify token: ${error}`);
  }
}
