/**
 * Dev-only mock data — single source of truth for the off-season awards screen.
 *
 * Shared between:
 *   src/dev/DevSeasonToggle.tsx  (visual toggle button)
 *   src/pages/VisitorPage.tsx    (URL-param override)
 *   src/__tests__/fixtures.ts    (test suite)
 *
 * In the production build Vite/Rollup replaces every `import.meta.env.DEV`
 * with `false`, dead-code-eliminates all branches that reference these
 * exports, then tree-shakes the entire module out of the bundle.
 */

import type { Season } from '../types/season.types';
import type { MonthlyLeaders, StatLeader } from '../hooks/useLastMonthLeaders';
import type { SeasonGameLeaders } from '../hooks/useSeasonGameLeaders';

// ── Completed season ─────────────────────────────────────────────────────────

export const MOCK_COMPLETED_SEASON_ID = 'season-completed-001';

export const mockCompletedSeason: Season = {
  id: MOCK_COMPLETED_SEASON_ID,
  name: '24-25 Bahar',
  beginDate: new Date('2024-09-01T00:00:00.000Z'),
  finishDate: new Date('2025-01-31T00:00:00.000Z'),
  isActive: false,
  createdAt: new Date('2024-09-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-31T00:00:00.000Z'),
};

// ── Leaders ──────────────────────────────────────────────────────────────────
//
// Stats are derived from the real Firestore backup (backup/latest.json)
// using two representative players — Hahalo (29 games in season) and
// ilkers (24 games). Values reflect typical per-game ranges observed in
// the real dataset.

const hahalo: StatLeader = {
  playerId: 'player-hahalo-001',
  playerNickname: 'Hahalo',
  playerPosition: 'Center',
  playerJerseyNumber: 10,
  totalPoints: 27,
  totalRebounds: 18,
  totalAssists: 7,
  twoPointMade: 9,
  twoPointAttempts: 14,
  threePointMade: 3,
  threePointAttempts: 7,
  twoPointPercentage: 64.3,
  threePointPercentage: 42.9,
  efficiency: 23.0,
  gamesPlayed: 2,
};

const ilkers: StatLeader = {
  playerId: 'player-ilkers-001',
  playerNickname: 'ilkers',
  playerPosition: 'Point Guard',
  playerJerseyNumber: 7,
  totalPoints: 19,
  totalRebounds: 7,
  totalAssists: 13,
  twoPointMade: 5,
  twoPointAttempts: 11,
  threePointMade: 3,
  threePointAttempts: 9,
  twoPointPercentage: 45.5,
  threePointPercentage: 33.3,
  efficiency: 16.6,
  gamesPlayed: 2,
};

export const mockSeasonGameLeaders: SeasonGameLeaders = {
  topPoints: [
    { playerName: 'Hahalo', value: 27, matchWeek: 'MW14' },
    { playerName: 'ilkers', value: 21, matchWeek: 'MW09' },
    { playerName: 'Hahalo', value: 19, matchWeek: 'MW07' },
    { playerName: 'ilkers', value: 17, matchWeek: 'MW12' },
    { playerName: 'Hahalo', value: 15, matchWeek: 'MW03' },
  ],
  topRebounds: [
    { playerName: 'Hahalo', value: 12, matchWeek: 'MW11' },
    { playerName: 'Hahalo', value: 10, matchWeek: 'MW14' },
    { playerName: 'ilkers', value: 8, matchWeek: 'MW06' },
    { playerName: 'Hahalo', value: 7, matchWeek: 'MW02' },
    { playerName: 'ilkers', value: 6, matchWeek: 'MW09' },
  ],
  topAssists: [
    { playerName: 'ilkers', value: 9, matchWeek: 'MW08' },
    { playerName: 'ilkers', value: 7, matchWeek: 'MW13' },
    { playerName: 'Hahalo', value: 5, matchWeek: 'MW05' },
    { playerName: 'ilkers', value: 5, matchWeek: 'MW10' },
    { playerName: 'Hahalo', value: 4, matchWeek: 'MW14' },
  ],
  topThreePointMade: [
    { playerName: 'ilkers', value: 5, matchWeek: 'MW12' },
    { playerName: 'Hahalo', value: 4, matchWeek: 'MW07' },
    { playerName: 'ilkers', value: 3, matchWeek: 'MW09' },
    { playerName: 'Hahalo', value: 3, matchWeek: 'MW14' },
    { playerName: 'ilkers', value: 2, matchWeek: 'MW04' },
  ],
  topEfficiency: [
    { playerName: 'Hahalo', value: 28.4, matchWeek: 'MW14' },
    { playerName: 'ilkers', value: 22.1, matchWeek: 'MW08' },
    { playerName: 'Hahalo', value: 19.7, matchWeek: 'MW07' },
    { playerName: 'ilkers', value: 17.3, matchWeek: 'MW12' },
    { playerName: 'Hahalo', value: 15.9, matchWeek: 'MW11' },
  ],
  doubleDoubles: [
    { playerName: 'Hahalo', count: 4 },
    { playerName: 'ilkers', count: 2 },
  ],
  longestWinStreaks: [
    { playerName: 'Hahalo', value: 5 },
    { playerName: 'ilkers', value: 3 },
  ],
};

export const mockSeasonLeaders: MonthlyLeaders = {
  firstEfficient: hahalo,
  secondEfficient: ilkers,
  thirdEfficient: null,
  mostPoints: hahalo,    // 27 > 19
  mostRebounds: hahalo,  // 18 > 7
  mostAssists: ilkers,   // 13 > 7
  dominant2PP: hahalo,   // 64.3% > 45.5%
  dominant3PP: hahalo,   // 42.9% > 33.3%
};
