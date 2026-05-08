import * as XLSX from 'xlsx';
import type { TeamPlayers, PlayerStatsInput } from '../components/admin/AddMatchStatsModal';
import { EventType, VALID_PERIODS, type LogEvent, type MatchLogContext, type PlayerPeriodStats } from '../types/matchLog.types';

export interface ParseResult {
  events: LogEvent[];
  playerStats: PlayerStatsInput[];
  logContext: MatchLogContext;
  errors: string[];
  warnings: string[];
}

function parseCSVText(text: string): string[][] {
  return text.split(/\r?\n/).map(line => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if ((ch === ',' || ch === ';' || ch === '\t') && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

async function extractRows(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Dosya okuma hatası'));

    reader.onload = (e) => {
      const data = e.target?.result;
      if (data === undefined || data === null) {
        return reject(new Error('Dosya okunamadı'));
      }
      try {
        if (file.name.toLowerCase().endsWith('.csv')) {
          const text = typeof data === 'string' ? data : new TextDecoder('utf-8').decode(data as ArrayBuffer);
          resolve(parseCSVText(text));
        } else {
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          resolve(rows.map(row => (row as unknown[]).map(cell => String(cell).trim())));
        }
      } catch (err) {
        reject(new Error('Dosya ayrıştırma hatası: ' + (err instanceof Error ? err.message : String(err))));
      }
    };

    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

function buildPlayerStats(
  playerEvents: LogEvent[],
  nickname: string,
  teamType: 'TEAM_A' | 'TEAM_B'
): PlayerPeriodStats {
  let twoM = 0, twoA = 0, threeM = 0, threeA = 0, oReb = 0, dReb = 0, ast = 0;
  for (const e of playerEvents) {
    switch (e.event) {
      case EventType.TWO_PM:   twoM++;  twoA++;   break;
      case EventType.TWO_PA:           twoA++;   break;
      case EventType.THREE_PM: threeM++; threeA++; break;
      case EventType.THREE_PA:          threeA++; break;
      case EventType.OREB:     oReb++;            break;
      case EventType.DREB:     dReb++;            break;
      case EventType.ASS:      ast++;             break;
    }
  }
  return {
    playerNickname: nickname,
    teamType,
    twoPointMade: twoM,
    twoPointAttempts: twoA,
    threePointMade: threeM,
    threePointAttempts: threeA,
    offensiveRebounds: oReb,
    defensiveRebounds: dReb,
    totalRebounds: oReb + dReb,
    assists: ast,
    points: twoM * 2 + threeM * 3,
  };
}

export async function parseMatchLog(file: File, teamPlayers: TeamPlayers): Promise<ParseResult> {
  const rows = await extractRows(file);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Build case-insensitive player lookup
  const playerMap = new Map<string, { id: string; nickname: string; teamType: 'TEAM_A' | 'TEAM_B' }>();
  for (const p of teamPlayers.teamA) {
    playerMap.set(p.nickname.toLowerCase(), { id: p.id, nickname: p.nickname, teamType: 'TEAM_A' });
  }
  for (const p of teamPlayers.teamB) {
    playerMap.set(p.nickname.toLowerCase(), { id: p.id, nickname: p.nickname, teamType: 'TEAM_B' });
  }

  // Detect and skip header row
  let dataStartIdx = 0;
  if (rows.length > 0) {
    const firstRow = rows[0].map(c => c.toLowerCase());
    const isHeader =
      firstRow.some(c => c.includes('period') || c.includes('periyot')) ||
      firstRow.some(c => c.includes('actor') || c.includes('oyuncu')) ||
      firstRow.some(c => c.includes('event') || c.includes('olay'));
    if (isHeader) dataStartIdx = 1;
  }

  const validEventValues = new Set(Object.values(EventType) as string[]);
  const events: LogEvent[] = [];
  const unmatchedActors = new Set<string>();

  for (let i = dataStartIdx; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => !c.trim())) continue;

    const periodRaw = row[0]?.trim() ?? '';
    const actorRaw  = row[1]?.trim() ?? '';
    const eventRaw  = row[2]?.trim() ?? '';

    if (!periodRaw || !actorRaw || !eventRaw) {
      warnings.push(`Satır ${i + 1}: Eksik sütun (${[periodRaw, actorRaw, eventRaw].join(' | ')}) — atlandı`);
      continue;
    }

    const period = periodRaw.toUpperCase();
    const event  = eventRaw.toUpperCase();

    if (!(VALID_PERIODS as readonly string[]).includes(period)) {
      warnings.push(`Satır ${i + 1}: Geçersiz periyot "${period}" — atlandı`);
      continue;
    }
    if (!validEventValues.has(event)) {
      warnings.push(`Satır ${i + 1}: Geçersiz olay tipi "${event}" — atlandı`);
      continue;
    }

    const player = playerMap.get(actorRaw.toLowerCase());
    if (!player) {
      unmatchedActors.add(actorRaw);
      continue;
    }

    events.push({ period: period as LogEvent['period'], actor: player.nickname, event: event as EventType });
  }

  if (unmatchedActors.size > 0) {
    errors.push(`Eşleşmeyen oyuncu adları: ${[...unmatchedActors].join(', ')}`);
  }
  if (events.length === 0 && errors.length === 0) {
    errors.push('Geçerli olay bulunamadı. Dosya formatını ve oyuncu adlarını kontrol edin.');
  }

  // Compute per-period stats
  const orderedPeriods = (VALID_PERIODS as readonly string[]).filter(p =>
    events.some(e => e.period === p)
  );

  const periodStats = orderedPeriods.map(period => {
    const pe = events.filter(e => e.period === period);
    const teamA = teamPlayers.teamA.map(p =>
      buildPlayerStats(pe.filter(e => e.actor.toLowerCase() === p.nickname.toLowerCase()), p.nickname, 'TEAM_A')
    );
    const teamB = teamPlayers.teamB.map(p =>
      buildPlayerStats(pe.filter(e => e.actor.toLowerCase() === p.nickname.toLowerCase()), p.nickname, 'TEAM_B')
    );
    return { period, teamA, teamB };
  });

  // Total stats per player
  const totalTeamA = teamPlayers.teamA.map(p =>
    buildPlayerStats(events.filter(e => e.actor.toLowerCase() === p.nickname.toLowerCase()), p.nickname, 'TEAM_A')
  );
  const totalTeamB = teamPlayers.teamB.map(p =>
    buildPlayerStats(events.filter(e => e.actor.toLowerCase() === p.nickname.toLowerCase()), p.nickname, 'TEAM_B')
  );

  const logContext: MatchLogContext = {
    events,
    periodStats,
    totalStats: { teamA: totalTeamA, teamB: totalTeamB },
  };

  // Build PlayerStatsInput[] (same shape as manual entry, for Firestore)
  const playerStats: PlayerStatsInput[] = [
    ...totalTeamA.map(s => ({
      playerId: playerMap.get(s.playerNickname.toLowerCase())!.id,
      playerNickname: s.playerNickname,
      teamType: 'TEAM_A' as const,
      twoPointMade: s.twoPointMade,
      twoPointAttempts: s.twoPointAttempts,
      threePointMade: s.threePointMade,
      threePointAttempts: s.threePointAttempts,
      offensiveRebounds: s.offensiveRebounds,
      defensiveRebounds: s.defensiveRebounds,
      assists: s.assists,
    })),
    ...totalTeamB.map(s => ({
      playerId: playerMap.get(s.playerNickname.toLowerCase())!.id,
      playerNickname: s.playerNickname,
      teamType: 'TEAM_B' as const,
      twoPointMade: s.twoPointMade,
      twoPointAttempts: s.twoPointAttempts,
      threePointMade: s.threePointMade,
      threePointAttempts: s.threePointAttempts,
      offensiveRebounds: s.offensiveRebounds,
      defensiveRebounds: s.defensiveRebounds,
      assists: s.assists,
    })),
  ];

  return { events, playerStats, logContext, errors, warnings };
}
