import dotenv from 'dotenv';
dotenv.config();

import { db } from '../config/firebase';
import { PlayerRole, DEFAULT_PLAYER_PASSWORD } from '../models/Player';
import { hashPassword } from '../utils/password';

const migrateExistingPlayers = async () => {
  try {
    const playersCollection = db.collection('players');
    const snapshot = await playersCollection.get();

    if (snapshot.empty) {
      process.exit(0);
    }

    if (!DEFAULT_PLAYER_PASSWORD) {
      throw new Error('DEFAULT_PLAYER_PASSWORD is not defined');
    }

    // Hash default password once
    const hashedPassword = await hashPassword(DEFAULT_PLAYER_PASSWORD);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const doc of snapshot.docs) {
      const player = doc.data();

      if (player.password && player.role) {
        skippedCount++;
        continue;
      }

      await doc.ref.update({
        password: hashedPassword,
        role: player.role || PlayerRole.PLAYER, // Keep existing role if present
        needsPasswordChange: true,
        refreshToken: null,
        updatedAt: new Date(),
      });

      updatedCount++;
    }

    if (updatedCount > 0) {
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

migrateExistingPlayers();
