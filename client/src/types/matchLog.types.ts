export type EventType = '2PM' | '2PA' | '3PM' | '3PA' | 'DREB' | 'OREB' | 'ASS';

export const EventType = {
  TWO_PM:   '2PM',
  TWO_PA:   '2PA',
  THREE_PM: '3PM',
  THREE_PA: '3PA',
  DREB:     'DREB',
  OREB:     'OREB',
  ASS:      'ASS',
} as const satisfies Record<string, EventType>;

export const VALID_PERIODS = ['Q1', 'Q2', 'Q3', 'Q4', 'OT'] as const;
export type Period = typeof VALID_PERIODS[number];

export interface LogEvent {
  period: Period;
  actor: string;
  event: EventType;
}

export interface PlayerPeriodStats {
  playerNickname: string;
  teamType: 'TEAM_A' | 'TEAM_B';
  twoPointMade: number;
  twoPointAttempts: number;
  threePointMade: number;
  threePointAttempts: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  totalRebounds: number;
  assists: number;
  points: number;
}

export interface PeriodStats {
  period: string;
  teamA: PlayerPeriodStats[];
  teamB: PlayerPeriodStats[];
}

export interface MatchLogContext {
  events: LogEvent[];
  periodStats: PeriodStats[];
  totalStats: {
    teamA: PlayerPeriodStats[];
    teamB: PlayerPeriodStats[];
  };
}
