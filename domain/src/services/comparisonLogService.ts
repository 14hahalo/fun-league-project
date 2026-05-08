import { db } from '../config/firebase';

export const comparisonLogService = {
  async log(playerAName: string, playerBName: string, ip: string | null): Promise<void> {
    await db.collection('comparisonLogs').add({
      playerAName,
      playerBName,
      ip: ip ?? 'unknown',
      requestedAt: new Date(),
    });
  },
};
