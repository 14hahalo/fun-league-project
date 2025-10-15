import { Player } from "../models/Player";
import { CreatePlayerDto } from "../dtos/Player/CreatePlayerDTO";
import { UpdatePlayerDto } from "../dtos/Player/UpdatePlayerDTO";

import { JsonStorage } from "../utils/jsonStorage";
import { generateId } from "../utils/idGenerator";
import { AppError } from "../middleware/errorHandler";

export class PlayerService {
  // Tüm oyuncuları getir
  static async getAllPlayers(): Promise<Player[]> {
    return await JsonStorage.readPlayers<Player>();
  }

  // Aktif oyuncuları getir
  static async getActivePlayers(): Promise<Player[]> {
    const players = await JsonStorage.readPlayers<Player>();
    return players.filter((p) => p.isActive);
  }

  // ID'ye göre oyuncu getir
  static async getPlayerById(id: string): Promise<Player> {
    const players = await JsonStorage.readPlayers<Player>();
    const player = players.find((p) => p.id === id);

    if (!player) {
      throw new AppError("Oyuncu bulunamadı", 404);
    }

    return player;
  }

  // Yeni oyuncu oluştur
  static async createPlayer(data: CreatePlayerDto): Promise<Player> {
    const players = await JsonStorage.readPlayers<Player>();

    // Aynı nickname kontrolü
    const existingPlayer = players.find(
      (p) => p.nickname.toLowerCase() === data.nickname.toLowerCase()
    );

    if (existingPlayer) {
      throw new AppError("Bu takma ad zaten kullanılıyor", 400);
    }

    const newPlayer: Player = {
      id: generateId(),
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    players.push(newPlayer);
    await JsonStorage.writePlayers(players);

    return newPlayer;
  }

  // Oyuncu güncelle
  static async updatePlayer(
    id: string,
    data: UpdatePlayerDto
  ): Promise<Player> {
    const players = await JsonStorage.readPlayers<Player>();
    const playerIndex = players.findIndex((p) => p.id === id);

    if (playerIndex === -1) {
      throw new AppError("Oyuncu bulunamadı", 404);
    }

    // Nickname güncelleniyorsa, benzersizlik kontrolü
    if (data.nickname) {
      const existingPlayer = players.find(
        (p) =>
          data.nickname !== undefined &&
          p.nickname.toLowerCase() === data.nickname.toLowerCase() &&
          p.id !== id
      );

      if (existingPlayer) {
        throw new AppError("Bu takma ad zaten kullanılıyor", 400);
      }
    }

    const updatedPlayer: Player = {
      ...players[playerIndex],
      ...data,
      updatedAt: new Date(),
    };

    players[playerIndex] = updatedPlayer;
    await JsonStorage.writePlayers(players);

    return updatedPlayer;
  }

  // Oyuncu sil (soft delete)
  static async deletePlayer(id: string): Promise<void> {
    const players = await JsonStorage.readPlayers<Player>();
    const playerIndex = players.findIndex((p) => p.id === id);

    if (playerIndex === -1) {
      throw new AppError("Oyuncu bulunamadı", 404);
    }

    // Soft delete - isActive = false yap
    players[playerIndex].isActive = false;
    players[playerIndex].updatedAt = new Date();

    await JsonStorage.writePlayers(players);
  }

  // Oyuncu kalıcı olarak sil (hard delete)
  static async permanentDeletePlayer(id: string): Promise<void> {
    const players = await JsonStorage.readPlayers<Player>();
    const filteredPlayers = players.filter((p) => p.id !== id);

    if (players.length === filteredPlayers.length) {
      throw new AppError("Oyuncu bulunamadı", 404);
    }

    await JsonStorage.writePlayers(filteredPlayers);
  }
}
