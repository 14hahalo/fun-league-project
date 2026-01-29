//Oyuncu,maç,sezon,stat bunlar hep birbirine IDler ile bağlı olduğu için, biri silindiğinde, bağlı olanlardan temizlenmesi gereken varsa temizlenmesi lazım
import dotenv from 'dotenv';
dotenv.config();

import { db } from '../config/firebase';

async function cleanupOrphanedStats() {
  try {
    // Bütün maçlar
    const gamesSnapshot = await db.collection('games').get();
    const validGameIds = new Set(gamesSnapshot.docs.map(doc => doc.id));

    let totalOrphaned = 0;

    // Bağlı oyuncu statı varsa sil
    const playerStatsSnapshot = await db.collection('playerStats').get();
    const orphanedPlayerStats = playerStatsSnapshot.docs.filter(
      doc => !validGameIds.has(doc.data().gameId)
    );

    if (orphanedPlayerStats.length > 0) {
      for (const doc of orphanedPlayerStats) {
        await doc.ref.delete();
      }
      totalOrphaned += orphanedPlayerStats.length;
    } else {
    }

    // Bağlı takım statı varsa sil
    const teamStatsSnapshot = await db.collection('teamStats').get();
    const orphanedTeamStats = teamStatsSnapshot.docs.filter(
      doc => !validGameIds.has(doc.data().gameId)
    );

    if (orphanedTeamStats.length > 0) {
      for (const doc of orphanedTeamStats) {
        await doc.ref.delete();
      }
      totalOrphaned += orphanedTeamStats.length;
    } else {
    }

    // Bağlı takım varsa sil
    const teamsSnapshot = await db.collection('teams').get();
    const orphanedTeams = teamsSnapshot.docs.filter(
      doc => !validGameIds.has(doc.data().gameId)
    );

    if (orphanedTeams.length > 0) {
      for (const doc of orphanedTeams) {
        await doc.ref.delete();
      }
      totalOrphaned += orphanedTeams.length;
    } else {
    }

    // Bağlı videolar varsa sil
    const videosSnapshot = await db.collection('videos').get();
    const orphanedVideos = videosSnapshot.docs.filter(
      doc => !validGameIds.has(doc.data().gameId)
    );

    if (orphanedVideos.length > 0) {
      for (const doc of orphanedVideos) {
        await doc.ref.delete();
      }
      totalOrphaned += orphanedVideos.length;
    } 

  } catch (error) {
  } finally {
    process.exit(0);
  }
}

cleanupOrphanedStats();
