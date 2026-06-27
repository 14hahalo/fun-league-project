import type { Game } from '../types/basketball.types';

export const isMatchExcludedFromStats = (game: Game): boolean =>
  game.countInStats === false;
