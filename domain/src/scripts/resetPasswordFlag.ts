// Kullanıcılar default şifrelerini değiştirdi mi değiştirmedi mi? Ona göre ilk girişte ekranyönlendirmesi yapılacak
import dotenv from 'dotenv';
dotenv.config();

import { db } from '../config/firebase';

async function resetPasswordFlag() {
  try {
    const nickname = process.argv[2] || 'Hahalo';

    const playersSnapshot = await db
      .collection('players')
      .where('nickname', '==', nickname)
      .get();

    if (playersSnapshot.empty) {
      return;
    }

    const playerDoc = playersSnapshot.docs[0];

    await playerDoc.ref.update({
      needsPasswordChange: true,
      updatedAt: new Date(),
    });

  } catch (error) {
  } finally {
    process.exit(0);
  }
}

resetPasswordFlag();
