import admin from '../config/firebase';

export async function setUserCustomClaims(userId: string, role: 'ADMIN' | 'PLAYER') {
  try {
    await admin.auth().setCustomUserClaims(userId, {
      role: role,
    });
  } catch (error) {
    console.error('Hata oluştu, Custom Claims:', error);
    throw new Error(`Hata oluştu, Custom Claims: ${error}`);
  }
}

export async function createCustomToken(userId: string, role: 'ADMIN' | 'PLAYER') {
  try {
    const customToken = await admin.auth().createCustomToken(userId, {
      role: role,
    });
    return customToken;
  } catch (error) {
    console.error('Custom token oluştururken hata oluştu:', error);
    throw new Error(`Custom token oluştururken hata oluştu: ${error}`);
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
    console.error('Token onay esnasında hata oluştu:', error);
    throw new Error(`Token onay esnasında hata oluştu: ${error}`);
  }
}
