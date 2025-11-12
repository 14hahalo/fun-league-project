import OpenAI from 'openai';
import { db } from '../config/firebase';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('⚠️  WARNING: OPENAI_API_KEY is not set in environment variables!');
}

const openai = new OpenAI({
  apiKey: apiKey,
});

export const openAIService = {
  /**
   * Build balanced basketball teams based on player performance
   */
  async buildBalancedTeams(playerIds: string[]): Promise<{
    teamA: string[];
    teamB: string[];
    analysis: string;
    cost: number;
    tokenUsage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    try {
      console.log(`🔍 Fetching data for ${playerIds.length} players...`);

      if (playerIds.length !== 10) {
        throw new Error('Exactly 10 players are required');
      }

      // Fetch player data
      const playerDocs = await Promise.all(
        playerIds.map(playerId => db.collection('players').doc(playerId).get())
      );

      // Fetch all stats for these players
      const playerStatsPromises = playerIds.map(playerId =>
        db.collection('playerStats').where('playerId', '==', playerId).get()
      );
      const playerStatsSnapshots = await Promise.all(playerStatsPromises);

      // Build player profiles with their stats
      const playerProfiles = playerDocs.map((doc, index) => {
        if (!doc.exists) {
          throw new Error(`Player ${playerIds[index]} not found`);
        }

        const playerData = doc.data();
        const fullName = `${playerData?.firstName || ''} ${playerData?.lastName || ''}`.trim();
        const displayName = playerData?.nickname || fullName || 'Unknown';

        // Calculate average stats
        const stats = playerStatsSnapshots[index].docs.map(doc => doc.data());
        const gamesPlayed = stats.length;

        if (gamesPlayed === 0) {
          return {
            id: playerIds[index],
            name: displayName,
            position: playerData?.position || 'Unknown',
            gamesPlayed: 0,
            avgPoints: 0,
            avgRebounds: 0,
            avgAssists: 0,
            twoPointPercentage: 0,
            threePointPercentage: 0,
          };
        }

        const totalPoints = stats.reduce((sum, s) => sum + (s.totalPoints || 0), 0);
        const totalRebounds = stats.reduce((sum, s) => sum + (s.totalRebounds || 0), 0);
        const totalAssists = stats.reduce((sum, s) => sum + (s.assists || 0), 0);
        const total2PMade = stats.reduce((sum, s) => sum + (s.twoPointMade || 0), 0);
        const total2PAttempts = stats.reduce((sum, s) => sum + (s.twoPointAttempts || 0), 0);
        const total3PMade = stats.reduce((sum, s) => sum + (s.threePointMade || 0), 0);
        const total3PAttempts = stats.reduce((sum, s) => sum + (s.threePointAttempts || 0), 0);

        return {
          id: playerIds[index],
          name: displayName,
          position: playerData?.position || 'Unknown',
          gamesPlayed,
          avgPoints: totalPoints / gamesPlayed,
          avgRebounds: totalRebounds / gamesPlayed,
          avgAssists: totalAssists / gamesPlayed,
          twoPointPercentage: total2PAttempts > 0 ? (total2PMade / total2PAttempts) * 100 : 0,
          threePointPercentage: total3PAttempts > 0 ? (total3PMade / total3PAttempts) * 100 : 0,
        };
      });

      console.log(`   Prepared ${playerProfiles.length} player profiles`);

      // Build prompt
      const prompt = `10 oyuncuyu 2 dengeli basketbol takımına ayır. Her takımda 5 oyuncu olmalı. Takımlar mümkün olduğunca dengeli olmalı (toplam yetenek, pozisyonlar, vb.).

**Oyuncu İstatistikleri:**
${playerProfiles.map(p => `
- ${p.name} (${p.position})
  * ${p.gamesPlayed} maç oynadı
  * Ortalama: ${p.avgPoints.toFixed(1)} sayı, ${p.avgRebounds.toFixed(1)} ribaund, ${p.avgAssists.toFixed(1)} asist
  * 2P: %${p.twoPointPercentage.toFixed(1)}, 3P: %${p.threePointPercentage.toFixed(1)}
`).join('\n')}

Lütfen şu formatta cevap ver:

**TAKIM A:**
- [Oyuncu İsmi]
- [Oyuncu İsmi]
- [Oyuncu İsmi]
- [Oyuncu İsmi]
- [Oyuncu İsmi]

**TAKIM B:**
- [Oyuncu İsmi]
- [Oyuncu İsmi]
- [Oyuncu İsmi]
- [Oyuncu İsmi]
- [Oyuncu İsmi]

**DENGE ANALİZİ:**
[Kısa açıklama: Neden bu takımlar dengeli? Her takımın güçlü yönleri neler?]`;

      console.log(`🤖 Calling OpenAI API for team balancing...`);

      // Call OpenAI API with economical settings
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Sen basketbol takım kurma uzmanısın. Oyuncu istatistiklerine göre dengeli takımlar oluşturursun. Türkçe yazarsın.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content || 'Takımlar oluşturulamadı.';

      // Calculate cost
      // GPT-4o-mini pricing: $0.150 per 1M input tokens, $0.600 per 1M output tokens
      const usage = completion.usage;
      const promptTokens = usage?.prompt_tokens || 0;
      const completionTokens = usage?.completion_tokens || 0;
      const totalTokens = usage?.total_tokens || 0;

      const inputCost = (promptTokens / 1_000_000) * 0.150;
      const outputCost = (completionTokens / 1_000_000) * 0.600;
      const totalCost = inputCost + outputCost;

      console.log('✅ OpenAI API call successful');
      console.log(`   Token Usage:`);
      console.log(`     - Prompt Tokens: ${promptTokens}`);
      console.log(`     - Completion Tokens: ${completionTokens}`);
      console.log(`     - Total Tokens: ${totalTokens}`);
      console.log(`   Cost Breakdown:`);
      console.log(`     - Input Cost: $${inputCost.toFixed(6)}`);
      console.log(`     - Output Cost: $${outputCost.toFixed(6)}`);
      console.log(`     - Total Cost: $${totalCost.toFixed(6)}`);

      // Parse team assignments from response
      const teamA: string[] = [];
      const teamB: string[] = [];

      const lines = response.split('\n');
      let currentTeam: 'A' | 'B' | null = null;

      for (const line of lines) {
        if (line.includes('TAKIM A') || line.includes('TEAM A')) {
          currentTeam = 'A';
          continue;
        }
        if (line.includes('TAKIM B') || line.includes('TEAM B')) {
          currentTeam = 'B';
          continue;
        }
        if (line.includes('DENGE') || line.includes('ANALİZ')) {
          currentTeam = null;
          continue;
        }

        // Extract player name from line like "- Player Name"
        if (currentTeam && line.trim().startsWith('-')) {
          const playerName = line.trim().substring(1).trim();
          // Find matching player ID
          const player = playerProfiles.find(p => p.name === playerName);
          if (player) {
            if (currentTeam === 'A') {
              teamA.push(player.id);
            } else {
              teamB.push(player.id);
            }
          }
        }
      }

      return {
        teamA,
        teamB,
        analysis: response,
        cost: totalCost,
        tokenUsage: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
      };
    } catch (error) {
      console.error('Error building balanced teams:', error);
      throw new Error('Failed to build balanced teams');
    }
  },

  /**
   * Generate AI analysis for a basketball match
   */
  async generateMatchAnalysis(gameId: string): Promise<string> {
    try {
      console.log(`🔍 Fetching data for game ${gameId}...`);

      // Fetch all necessary data
      const [playerStats, teamStats, game] = await Promise.all([
        db.collection('playerStats').where('gameId', '==', gameId).get(),
        db.collection('teamStats').where('gameId', '==', gameId).get(),
        db.collection('games').doc(gameId).get(),
      ]);

      console.log(`   Found ${playerStats.size} player stats`);
      console.log(`   Found ${teamStats.size} team stats`);

      if (!game.exists) {
        throw new Error('Game not found');
      }

      const gameData = game.data();
      console.log(`   Game: ${gameData?.gameNumber} - ${gameData?.teamAScore} vs ${gameData?.teamBScore}`);

      // Get unique player IDs
      const playerIds = playerStats.docs.map(doc => doc.data().playerId);
      console.log(`   Fetching player names for ${playerIds.length} players...`);

      // Fetch player names from players collection
      const playerDocs = await Promise.all(
        playerIds.map(playerId => db.collection('players').doc(playerId).get())
      );

      // Create a map of playerId -> playerName
      const playerNameMap = new Map<string, string>();
      playerDocs.forEach((doc, index) => {
        if (doc.exists) {
          const playerData = doc.data();
          const fullName = `${playerData?.firstName || ''} ${playerData?.lastName || ''}`.trim();
          const displayName = playerData?.nickname || fullName || 'Unknown';
          playerNameMap.set(playerIds[index], displayName);
        } else {
          playerNameMap.set(playerIds[index], 'Unknown');
        }
      });

      console.log(`   Fetched ${playerNameMap.size} player names`);

      // Parse player stats with fetched player names
      const players = playerStats.docs.map((doc) => {
        const data = doc.data();
        return {
          playerId: data.playerId,
          playerName: playerNameMap.get(data.playerId) || 'Unknown',
          teamType: data.teamType,
          totalPoints: data.totalPoints,
          totalRebounds: data.totalRebounds,
          assists: data.assists,
          twoPointMade: data.twoPointMade,
          twoPointAttempts: data.twoPointAttempts,
          threePointMade: data.threePointMade,
          threePointAttempts: data.threePointAttempts,
          offensiveRebounds: data.offensiveRebounds,
          defensiveRebounds: data.defensiveRebounds,
        };
      });

      // Parse team stats
      const teams = teamStats.docs.map((doc) => {
        const data = doc.data();
        return {
          teamType: data.teamType,
          totalPoints: data.totalPoints,
          totalRebounds: data.totalRebounds,
          totalAssists: data.totalAssists,
          twoPointPercentage: data.twoPointPercentage,
          threePointPercentage: data.threePointPercentage,
        };
      });

      // Prepare the prompt for OpenAI
      const prompt = `Sen bir basketbol maç analizcisindir. Aşağıdaki maç verilerini analiz et ve profesyonel bir analiz yaz. Analiz Türkçe olmalı ve şu konuları içermeli:

**Maç Bilgisi:**
- Maç Numarası: ${gameData?.gameNumber}
- Tarih: ${new Date(gameData?.date?.toDate?.() || gameData?.date).toLocaleDateString('tr-TR')}
- Skor: Team A ${gameData?.teamAScore} - ${gameData?.teamBScore} Team B

**Takım İstatistikleri:**
${teams.map(team => `
${team.teamType}:
- Toplam Sayı: ${team.totalPoints}
- Toplam Ribaund: ${team.totalRebounds}
- Toplam Asist: ${team.totalAssists}
- 2 Sayı Yüzdesi: ${team.twoPointPercentage?.toFixed(1)}%
- 3 Sayı Yüzdesi: ${team.threePointPercentage?.toFixed(1)}%
`).join('\n')}

**Oyuncu İstatistikleri:**
${players.map(p => `
- ${p.playerName} (${p.teamType}): ${p.totalPoints} sayı, ${p.totalRebounds} ribaund, ${p.assists} asist
  2P: ${p.twoPointMade}/${p.twoPointAttempts}, 3P: ${p.threePointMade}/${p.threePointAttempts}
`).join('\n')}

Lütfen şu başlıklar altında detaylı bir analiz yaz:
1. **Maç Özeti**: Maçın genel akışı ve sonucu
2. **Dikkat Çeken Performanslar**: En iyi performans gösteren oyuncular ve maçın MVP'si
3. **Takım Analizleri**: Her iki takımın güçlü ve zayıf yönleri
4. **Stratejik Gözlemler**: Taktiksel öneriler ve gözlemler

Analiz profesyonel, bilgilendirici ve okuyucuyu cezbedici olmalı. Markdown formatında yaz.`;

      console.log(`🤖 Calling OpenAI API...`);

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Sen profesyonel bir basketbol maç analizcisin. Detaylı, objektif ve bilgilendirici analizler yaparsın. Türkçe yazarsın.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      });

      const analysis = completion.choices[0]?.message?.content || 'Analiz oluşturulamadı.';

      // Log token usage
      const usage = completion.usage;
      console.log('✅ OpenAI API call successful');
      console.log(`   Generated ${analysis.length} characters of analysis`);
      console.log(`   Token Usage:`);
      console.log(`     - Prompt Tokens: ${usage?.prompt_tokens || 0}`);
      console.log(`     - Completion Tokens: ${usage?.completion_tokens || 0}`);
      console.log(`     - Total Tokens: ${usage?.total_tokens || 0}`);

      return analysis;
    } catch (error) {
      console.error('Error generating match analysis:', error);
      throw new Error('Failed to generate match analysis');
    }
  },
};
