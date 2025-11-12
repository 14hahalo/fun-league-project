import dotenv from 'dotenv';
dotenv.config();

import { db } from '../config/firebase';
import { PlayerRole, DEFAULT_PLAYER_PASSWORD } from '../models/Player';
import { hashPassword } from '../utils/password';

/**
 * Migration script to add authentication fields to existing players
 * Usage: npx ts-node src/scripts/migrateExistingPlayers.ts
 *
 * This script will:
 * 1. Find all players without authentication fields (password, role)
 * 2. Add default password "player123" (hashed)
 * 3. Set role to PLAYER
 * 4. Set needsPasswordChange to true
 */

const migrateExistingPlayers = async () => {
  try {
    console.log('🔄 Starting player migration...\n');

    const playersCollection = db.collection('players');
    const snapshot = await playersCollection.get();

    if (snapshot.empty) {
      console.log('ℹ️  No players found in database.');
      process.exit(0);
    }

    console.log(`📊 Found ${snapshot.docs.length} player(s) in database.\n`);

    // Hash default password once
    console.log('🔐 Hashing default password...');
    const hashedPassword = await hashPassword(DEFAULT_PLAYER_PASSWORD);

    let updatedCount = 0;
    let skippedCount = 0;

    // Process each player
    for (const doc of snapshot.docs) {
      const player = doc.data();
      const playerId = doc.id;

      // Check if player already has authentication fields
      if (player.password && player.role) {
        console.log(`⏭️  Skipping ${player.nickname || playerId} - already has auth fields`);
        skippedCount++;
        continue;
      }

      console.log(`🔧 Updating ${player.nickname || playerId}...`);

      // Update player with authentication fields
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
