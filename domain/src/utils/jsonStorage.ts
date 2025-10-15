import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');

export class JsonStorage {
  // Data klasörünü oluştur
  static async ensureDataDir(): Promise<void> {
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
  }

  // Players dosyasını oluştur
  static async ensurePlayersFile(): Promise<void> {
    await this.ensureDataDir();
    try {
      await fs.access(PLAYERS_FILE);
    } catch {
      await fs.writeFile(PLAYERS_FILE, JSON.stringify([], null, 2));
    }
  }

  // Tüm oyuncuları oku
  static async readPlayers<T>(): Promise<T[]> {
    await this.ensurePlayersFile();
    const data = await fs.readFile(PLAYERS_FILE, 'utf-8');
    return JSON.parse(data);
  }

  // Oyuncuları kaydet
  static async writePlayers<T>(players: T[]): Promise<void> {
    await this.ensureDataDir();
    await fs.writeFile(PLAYERS_FILE, JSON.stringify(players, null, 2));
  }
}