// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import { db } from '../config/firebase';

async function cleanupOrphanedStats() {
  try {
    // Get all games
    const gamesSnapshot = await db.collection('games').get();
    const validGameIds = new Set(gamesSnapshot.docs.map(doc => doc.id));

    let totalOrphaned = 0;

    // 1. Check and remove orphaned player stats
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

    // 2. Check and remove orphaned team stats
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

    // 3. Check and remove orphaned teams
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

    // 4. Check and remove orphaned videos
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
