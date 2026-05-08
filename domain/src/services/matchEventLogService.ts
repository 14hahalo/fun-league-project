import { db } from '../config/firebase';

export interface StoredEventLog {
  id: string;
  gameId: string;
  events: { period: string; actor: string; event: string }[];
  playerTeams: Record<string, 'TEAM_A' | 'TEAM_B'>;
  createdAt: Date;
}

const COLLECTION_NAME = 'matchEventLogs';

export const matchEventLogService = {
  async save(
    gameId: string,
    events: { period: string; actor: string; event: string }[],
    playerTeams: Record<string, 'TEAM_A' | 'TEAM_B'>
  ): Promise<StoredEventLog> {
    const existing = await db.collection(COLLECTION_NAME).where('gameId', '==', gameId).get();
    if (!existing.empty) {
      const ref = existing.docs[0].ref;
      const updated = { events, playerTeams, updatedAt: new Date() };
      await ref.update(updated);
      const doc = await ref.get();
      const data = doc.data()!;
      return {
        id: doc.id,
        gameId: data.gameId,
        events: data.events,
        playerTeams: data.playerTeams,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      };
    }

    const ref = db.collection(COLLECTION_NAME).doc();
    const record: StoredEventLog = {
      id: ref.id,
      gameId,
      events,
      playerTeams,
      createdAt: new Date(),
    };
    await ref.set(record);
    return record;
  },

  async getByGameId(gameId: string): Promise<StoredEventLog | null> {
    const snapshot = await db.collection(COLLECTION_NAME).where('gameId', '==', gameId).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      gameId: data.gameId,
      events: data.events,
      playerTeams: data.playerTeams,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    };
  },
};
