// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import { db } from '../config/firebase';

async function cleanupOrphanedStats() {
  try {
    console.log('🧹 Starting cleanup of orphaned data...\n');

    // Get all games
    const gamesSnapshot = await db.collection('games').get();
    const validGameIds = new Set(gamesSnapshot.docs.map(doc => doc.id));
    console.log(`✅ Found ${validGameIds.size} valid games\n`);

    let totalOrphaned = 0;

    // 1. Check and remove orphaned player stats
    console.log('📊 Checking player stats...');
    const playerStatsSnapshot = await db.collection('playerStats').get();
    const orphanedPlayerStats = playerStatsSnapshot.docs.filter(
      doc => !validGameIds.has(doc.data().gameId)
    );

    if (orphanedPlayerStats.length > 0) {
      console.log(`   ⚠️  Found ${orphanedPlayerStats.length} orphaned player stats`);
      for (const doc of orphanedPlayerStats) {
        await doc.ref.delete();
        console.log(`   🗑️  Deleted player stat: ${doc.id} (gameId: ${doc.data().gameId})`);
      }
      totalOrphaned += orphanedPlayerStats.length;
    } else {
      console.log('   ✅ No orphaned player stats found');
    }

    // 2. Check and remove orphaned team stats
    console.log('\n📊 Checking team stats...');
    const teamStatsSnapshot = await db.collection('teamStats').get();
    const orphanedTeamStats = teamStatsSnapshot.docs.filter(
      doc => !validGameIds.has(doc.data().gameId)
    );

    if (orphanedTeamStats.length > 0) {
      console.log(`   ⚠️  Found ${orphanedTeamStats.length} orphaned team stats`);
      for (const doc of orphanedTeamStats) {
        await doc.ref.delete();
        console.log(`   🗑️  Deleted team stat: ${doc.id} (gameId: ${doc.data().gameId})`);
      }
      totalOrphaned += orphanedTeamStats.length;
    } else {
      console.log('   ✅ No orphaned team stats found');
    }

    // 3. Check and remove orphaned teams
    console.log('\n👥 Checking teams...');
    const teamsSnapshot = await db.collection('teams').get();
    const orphanedTeams = teamsSnapshot.docs.filter(
      doc => !validGameIds.has(doc.data().gameId)
    );

    if (orphanedTeams.length > 0) {
      console.log(`   ⚠️  Found ${orphanedTeams.length} orphaned teams`);
      for (const doc of orphanedTeams) {
        await doc.ref.delete();
        console.log(`   🗑️  Deleted team: ${doc.id} (gameId: ${doc.data().gameId})`);
      }
      totalOrphaned += orphanedTeams.length;
    } else {
      console.log('   ✅ No orphaned teams found');
    }

    // 4. Check and remove orphaned videos
    console.log('\n🎥 Checking videos...');
    const videosSnapshot = await db.collection('videos').get();
    const orphanedVideos = videosSnapshot.docs.filter(
      doc => !validGameIds.has(doc.data().gameId)
    );

    if (orphanedVideos.length > 0) {
      console.log(`   ⚠️  Found ${orphanedVideos.length} orphaned videos`);
      for (const doc of orphanedVideos) {
        await doc.ref.delete();
        console.log(`   🗑️  Deleted video: ${doc.id} (gameId: ${doc.data().gameId})`);
      }
      totalOrphaned += orphanedVideos.length;
    } else {
      console.log('   ✅ No orphaned videos found');
    }

    // 5. Check orphaned player ratings (but DON'T delete them - just report)
    console.log('\n⭐ Checking player ratings...');
    const ratingsSnapshot = await db.collection('playerRatings').get();
    const orphanedRatings = ratingsSnapshot.docs.filter(
      doc => !validGameIds.has(doc.data().gameId)
    );

    if (orphanedRatings.length > 0) {
      console.log(`   ⚠️  Found ${orphanedRatings.length} orphaned player ratings`);
      console.log(`   ℹ️  Note: Ratings are preserved as historical data and are NOT automatically deleted`);
      console.log(`   ℹ️  If you want to delete them manually, run the following command:`);
      console.log(`   ℹ️  ratingsSnapshot.docs.forEach(doc => doc.ref.delete())`);
    } else {
      console.log('   ✅ No orphaned player ratings found');
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Cleanup completed!`);
    console.log(`   Total orphaned records removed: ${totalOrphaned}`);
    console.log(`   Note: ${orphanedRatings.length} orphaned ratings were found but preserved`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
}

cleanupOrphanedStats();
