import { useState } from 'react';
import { gameApi } from '../api/gameApi';
import { teamApi } from '../api/teamApi';
import { playerStatsApi } from '../api/playerStatsApi';
import { teamStatsApi } from '../api/teamStatsApi';
import { videoApi } from '../api/videoApi';
import { matchEventLogApi } from '../api/matchEventLogApi';
import type { MatchStatsData } from '../components/admin/AddMatchStatsModal';
import type { EditMatchStatsData } from '../components/admin/EditMatchStatsModal';
import type { Game, Team, TeamStats } from '../types/basketball.types';
import type { MatchLogContext } from '../types/matchLog.types';

async function createGameRecord(metadata: MatchStatsData['metadata']): Promise<Game> {
  return gameApi.createGame({
    gameNumber: metadata.gameNumber,
    date: metadata.date,
    status: 'COMPLETED',
    teamSize: metadata.teamSize,
    notes: metadata.notes,
    seasonId: metadata.seasonId,
    countInStats: metadata.countInStats,
  });
}

async function createMatchTeams(
  gameId: string,
  teamPlayers: MatchStatsData['teamPlayers']
): Promise<{ teamA: Team; teamB: Team }> {
  const [teamA, teamB] = await Promise.all([
    teamApi.createTeam({ gameId, teamType: 'TEAM_A', playerIds: teamPlayers.teamA.map((p) => p.id), teamName: 'Team A' }),
    teamApi.createTeam({ gameId, teamType: 'TEAM_B', playerIds: teamPlayers.teamB.map((p) => p.id), teamName: 'Team B' }),
  ]);
  return { teamA, teamB };
}

async function createPlayerStatsForGame(
  gameId: string,
  playerStats: MatchStatsData['playerStats']
): Promise<void> {
  await Promise.all(
    playerStats.map((s) =>
      playerStatsApi.createPlayerStats({
        gameId,
        playerId: s.playerId,
        teamType: s.teamType,
        twoPointAttempts: s.twoPointAttempts,
        twoPointMade: s.twoPointMade,
        threePointAttempts: s.threePointAttempts,
        threePointMade: s.threePointMade,
        defensiveRebounds: s.defensiveRebounds,
        offensiveRebounds: s.offensiveRebounds,
        assists: s.assists,
      })
    )
  );
}

async function generateAndLinkTeamStats(
  gameId: string,
  teamA: Team,
  teamB: Team
): Promise<void> {
  const [teamAStats, teamBStats] = await Promise.all([
    teamStatsApi.generateTeamStats(gameId, 'TEAM_A'),
    teamStatsApi.generateTeamStats(gameId, 'TEAM_B'),
  ]);
  await gameApi.updateGame(gameId, {
    teamAId: teamA.id,
    teamBId: teamB.id,
    teamAStatsId: teamAStats.id,
    teamBStatsId: teamBStats.id,
    teamAScore: teamAStats.totalPoints,
    teamBScore: teamBStats.totalPoints,
  });
}

function triggerAnalysisInBackground(gameId: string, logContext?: MatchLogContext): void {
  gameApi.generateAnalysis(gameId, logContext).catch(() => {});
}

function saveEventLogInBackground(gameId: string, logContext: MatchLogContext): void {
  const playerTeams: Record<string, 'TEAM_A' | 'TEAM_B'> = {};
  for (const p of logContext.totalStats.teamA) playerTeams[p.playerNickname] = 'TEAM_A';
  for (const p of logContext.totalStats.teamB) playerTeams[p.playerNickname] = 'TEAM_B';
  matchEventLogApi.save(gameId, logContext.events, playerTeams).catch(() => {});
}

async function uploadMatchVideos(gameId: string, videos: MatchStatsData['videos']): Promise<void> {
  if (!videos || videos.length === 0) return;
  await Promise.all(videos.map((v) => videoApi.createVideo({ ...v, gameId })));
}

async function recalculateScores(gameId: string): Promise<{ teamAStats: TeamStats; teamBStats: TeamStats }> {
  const [teamAStats, teamBStats] = await Promise.all([
    teamStatsApi.recalculateTeamStats(gameId, 'TEAM_A'),
    teamStatsApi.recalculateTeamStats(gameId, 'TEAM_B'),
  ]);
  return { teamAStats, teamBStats };
}

export const useMatchStats = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMatchStats = async (matchData: MatchStatsData): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const game = await createGameRecord(matchData.metadata);
      const { teamA, teamB } = await createMatchTeams(game.id, matchData.teamPlayers);
      await createPlayerStatsForGame(game.id, matchData.playerStats);
      await generateAndLinkTeamStats(game.id, teamA, teamB);
      triggerAnalysisInBackground(game.id, matchData.logContext);
      if (matchData.logContext) saveEventLogInBackground(game.id, matchData.logContext);
      await uploadMatchVideos(game.id, matchData.videos);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create match stats';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMatchStats = async (gameId: string, matchData: EditMatchStatsData): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await gameApi.updateGame(gameId, {
        gameNumber: matchData.metadata.gameNumber,
        date: matchData.metadata.date,
        teamSize: matchData.metadata.teamSize,
        notes: matchData.metadata.notes,
        countInStats: matchData.metadata.countInStats,
      });

      await updateTeamRosters(gameId, matchData.teamPlayers);
      await replacePlayerStats(gameId, matchData.playerStats);

      const { teamAStats, teamBStats } = await recalculateScores(gameId);
      await gameApi.updateGame(gameId, {
        teamAScore: teamAStats.totalPoints,
        teamBScore: teamBStats.totalPoints,
      });

      await uploadMatchVideos(gameId, matchData.videos);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update match stats';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createMatchStats, updateMatchStats, loading, error };
};

async function updateTeamRosters(
  gameId: string,
  teamPlayers: EditMatchStatsData['teamPlayers']
): Promise<void> {
  const existingTeams = await teamApi.getTeamsByGameId(gameId);
  const teamA = existingTeams.find((t) => t.teamType === 'TEAM_A');
  const teamB = existingTeams.find((t) => t.teamType === 'TEAM_B');
  await Promise.all([
    teamA ? teamApi.updateTeam(teamA.id, { playerIds: teamPlayers.teamA.map((p) => p.id) }) : Promise.resolve(),
    teamB ? teamApi.updateTeam(teamB.id, { playerIds: teamPlayers.teamB.map((p) => p.id) }) : Promise.resolve(),
  ]);
}

async function replacePlayerStats(
  gameId: string,
  playerStats: EditMatchStatsData['playerStats']
): Promise<void> {
  const existing = await playerStatsApi.getPlayerStatsByGameId(gameId);
  await Promise.all(
    existing.map((stat) =>
      playerStatsApi.deletePlayerStats(stat.id).catch((err: any) => {
        if (err?.response?.status !== 404) throw err;
      })
    )
  );
  await Promise.all(
    playerStats.map((s) =>
      playerStatsApi.createPlayerStats({
        gameId,
        playerId: s.playerId,
        teamType: s.teamType,
        twoPointAttempts: s.twoPointAttempts,
        twoPointMade: s.twoPointMade,
        threePointAttempts: s.threePointAttempts,
        threePointMade: s.threePointMade,
        defensiveRebounds: s.defensiveRebounds,
        offensiveRebounds: s.offensiveRebounds,
        assists: s.assists,
      })
    )
  );
}
