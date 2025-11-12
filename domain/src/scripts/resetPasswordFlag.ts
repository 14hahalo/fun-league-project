// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import { db } from '../config/firebase';

async function resetPasswordFlag() {
  try {
    const nickname = process.argv[2] || 'Hahalo';

    // Find player by nickname
    const playersSnapshot = await db
      .collection('players')
      .where('nickname', '==', nickname)
      .get();

    if (playersSnapshot.empty) {
      console.log(`Player with nickname "${nickname}" not found`);
      return;
    }

    const playerDoc = playersSnapshot.docs[0];

    // Update needsPasswordChange flag
    await playerDoc.ref.update({
      needsPasswordChange: true,
      updatedAt: new Date(),
    });

    console.log(`✅ Successfully set needsPasswordChange=true for player "${nickname}"`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

resetPasswordFlag();
