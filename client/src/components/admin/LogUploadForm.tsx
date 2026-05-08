import { useState, useRef, useCallback } from 'react';
import { parseMatchLog } from '../../utils/parseMatchLog';
import type { TeamPlayers, PlayerStatsInput } from './AddMatchStatsModal';
import type { MatchLogContext, PlayerPeriodStats } from '../../types/matchLog.types';

interface LogUploadFormProps {
  teamPlayers: TeamPlayers;
  onComplete: (stats: PlayerStatsInput[], logContext: MatchLogContext) => void;
  onBack: () => void;
}

interface ParsedResult {
  stats: PlayerStatsInput[];
  logContext: MatchLogContext;
}

function StatsTable({ players, teamLabel, color }: { players: PlayerPeriodStats[]; teamLabel: string; color: string }) {
  const totals = players.reduce(
    (acc, p) => ({
      twoPointMade: acc.twoPointMade + p.twoPointMade,
      twoPointAttempts: acc.twoPointAttempts + p.twoPointAttempts,
      threePointMade: acc.threePointMade + p.threePointMade,
      threePointAttempts: acc.threePointAttempts + p.threePointAttempts,
      offensiveRebounds: acc.offensiveRebounds + p.offensiveRebounds,
      defensiveRebounds: acc.defensiveRebounds + p.defensiveRebounds,
      totalRebounds: acc.totalRebounds + p.totalRebounds,
      assists: acc.assists + p.assists,
      points: acc.points + p.points,
    }),
    { twoPointMade: 0, twoPointAttempts: 0, threePointMade: 0, threePointAttempts: 0, offensiveRebounds: 0, defensiveRebounds: 0, totalRebounds: 0, assists: 0, points: 0 }
  );

  const pct = (made: number, att: number) => (att > 0 ? `${((made / att) * 100).toFixed(0)}%` : '—');

  const cols = ['Oyuncu', '2PM', '2PA', '2P%', '3PM', '3PA', '3P%', 'OREB', 'DREB', 'REB', 'AST', 'PTS'];

  return (
    <div className="mb-4">
      <div className={`px-4 py-2 font-bold text-white text-sm rounded-t-lg ${color}`}>{teamLabel}</div>
      <div className="overflow-x-auto border border-gray-200 rounded-b-lg">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {cols.map(c => (
                <th key={c} className="px-2 py-1.5 text-center font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200 first:text-left">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-2 py-1.5 font-medium text-gray-700 text-left whitespace-nowrap">{p.playerNickname}</td>
                <td className="px-2 py-1.5 text-center text-gray-600">{p.twoPointMade}</td>
                <td className="px-2 py-1.5 text-center text-gray-600">{p.twoPointAttempts}</td>
                <td className="px-2 py-1.5 text-center text-gray-600">{pct(p.twoPointMade, p.twoPointAttempts)}</td>
                <td className="px-2 py-1.5 text-center text-gray-600">{p.threePointMade}</td>
                <td className="px-2 py-1.5 text-center text-gray-600">{p.threePointAttempts}</td>
                <td className="px-2 py-1.5 text-center text-gray-600">{pct(p.threePointMade, p.threePointAttempts)}</td>
                <td className="px-2 py-1.5 text-center text-gray-600">{p.offensiveRebounds}</td>
                <td className="px-2 py-1.5 text-center text-gray-600">{p.defensiveRebounds}</td>
                <td className="px-2 py-1.5 text-center text-gray-600">{p.totalRebounds}</td>
                <td className="px-2 py-1.5 text-center text-gray-600">{p.assists}</td>
                <td className="px-2 py-1.5 text-center font-bold text-orange-600">{p.points}</td>
              </tr>
            ))}
            <tr className="bg-orange-50 font-bold border-t border-orange-200">
              <td className="px-2 py-1.5 text-left text-xs text-gray-800">TOPLAM</td>
              <td className="px-2 py-1.5 text-center text-gray-800">{totals.twoPointMade}</td>
              <td className="px-2 py-1.5 text-center text-gray-800">{totals.twoPointAttempts}</td>
              <td className="px-2 py-1.5 text-center text-gray-800">{pct(totals.twoPointMade, totals.twoPointAttempts)}</td>
              <td className="px-2 py-1.5 text-center text-gray-800">{totals.threePointMade}</td>
              <td className="px-2 py-1.5 text-center text-gray-800">{totals.threePointAttempts}</td>
              <td className="px-2 py-1.5 text-center text-gray-800">{pct(totals.threePointMade, totals.threePointAttempts)}</td>
              <td className="px-2 py-1.5 text-center text-gray-800">{totals.offensiveRebounds}</td>
              <td className="px-2 py-1.5 text-center text-gray-800">{totals.defensiveRebounds}</td>
              <td className="px-2 py-1.5 text-center text-gray-800">{totals.totalRebounds}</td>
              <td className="px-2 py-1.5 text-center text-gray-800">{totals.assists}</td>
              <td className="px-2 py-1.5 text-center font-bold text-orange-600">{totals.points}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const LogUploadForm = ({ teamPlayers, onComplete, onBack }: LogUploadFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('TOTAL');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setParsing(true);
    setErrors([]);
    setWarnings([]);
    setResult(null);
    try {
      const parsed = await parseMatchLog(f, teamPlayers);
      setErrors(parsed.errors);
      setWarnings(parsed.warnings);
      if (parsed.errors.length === 0 && parsed.playerStats.length > 0) {
        setResult({ stats: parsed.playerStats, logContext: parsed.logContext });
        setSelectedPeriod('TOTAL');
      }
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Dosya işlenirken bilinmeyen hata oluştu']);
    } finally {
      setParsing(false);
    }
  }, [teamPlayers]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const periods = result
    ? ['TOTAL', ...result.logContext.periodStats.map(p => p.period)]
    : [];

  const currentStats = (() => {
    if (!result) return null;
    if (selectedPeriod === 'TOTAL') return result.logContext.totalStats;
    return result.logContext.periodStats.find(p => p.period === selectedPeriod) ?? null;
  })();

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !parsing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all select-none ${
          isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
        } ${parsing ? 'cursor-wait' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
        <div className="text-4xl mb-2">{parsing ? '⏳' : file ? '📄' : '📁'}</div>
        {parsing ? (
          <p className="text-gray-600 font-medium">Dosya işleniyor...</p>
        ) : file ? (
          <div>
            <p className="font-semibold text-gray-700">{file.name}</p>
            <p className="text-sm text-gray-500 mt-1">Değiştirmek için tıklayın veya yeni dosya sürükleyin</p>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-gray-700">CSV veya Excel dosyası yükleyin</p>
            <p className="text-sm text-gray-500 mt-1">Dosyayı sürükleyip bırakın veya tıklayın</p>
            <p className="text-xs text-gray-400 mt-1">Desteklenen: .csv, .xlsx, .xls</p>
          </div>
        )}
      </div>

      {/* Format hint */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm font-semibold text-blue-800 mb-1">Beklenen Dosya Formatı</p>
        <p className="text-xs text-blue-700">
          3 sütun: <strong>Period</strong> | <strong>Actor</strong> | <strong>Event</strong>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Periyotlar: Q1, Q2, Q3, Q4, OT &nbsp;·&nbsp;
          Olaylar: 2PM, 2PA, 3PM, 3PA, DREB, OREB, ASS
        </p>
        <p className="text-xs text-blue-500 mt-0.5">
          Oyuncu adları Step 1'de girilen isimlerle tam eşleşmelidir.
        </p>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <h4 className="font-semibold text-red-700 mb-2">Hata ({errors.length})</h4>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((e, i) => <li key={i} className="text-sm text-red-600">{e}</li>)}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
          <h4 className="font-semibold text-yellow-700 mb-1">Uyarılar — {warnings.length} satır atlandı</h4>
          <div className="max-h-28 overflow-y-auto custom-scrollbar-dark">
            <ul className="list-disc list-inside space-y-0.5">
              {warnings.map((w, i) => <li key={i} className="text-xs text-yellow-700">{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          <div className="bg-green-50 border border-green-300 rounded-lg p-3 flex items-center gap-2">
            <span className="text-green-600 font-bold text-lg">✓</span>
            <span className="text-sm text-green-700">
              <strong>{result.logContext.events.length}</strong> olay işlendi.
              Takım A: <strong>{result.logContext.totalStats.teamA.reduce((s, p) => s + p.points, 0)}</strong> puan ·
              Takım B: <strong>{result.logContext.totalStats.teamB.reduce((s, p) => s + p.points, 0)}</strong> puan
            </span>
          </div>

          {/* Period tabs */}
          <div className="flex flex-wrap gap-2">
            {periods.map(p => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  selectedPeriod === p
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Stats tables */}
          {currentStats && (
            <div>
              <StatsTable players={currentStats.teamA} teamLabel="Takım A" color="bg-orange-500" />
              <StatsTable players={currentStats.teamB} teamLabel="Takım B" color="bg-blue-500" />
            </div>
          )}

          {/* Raw log preview */}
          <details className="border border-gray-200 rounded-lg">
            <summary className="px-4 py-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-50 rounded-lg select-none">
              Ham Log Önizleme ({result.logContext.events.length} olay)
            </summary>
            <div className="max-h-52 overflow-y-auto border-t border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-600 w-16">Periyot</th>
                    <th className="px-3 py-2 text-left text-gray-600">Oyuncu</th>
                    <th className="px-3 py-2 text-left text-gray-600 w-16">Olay</th>
                  </tr>
                </thead>
                <tbody>
                  {result.logContext.events.map((e, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50'}`}>
                      <td className="px-3 py-1 text-gray-500 font-medium">{e.period}</td>
                      <td className="px-3 py-1 text-gray-700">{e.actor}</td>
                      <td className="px-3 py-1 font-bold text-orange-600">{e.event}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Geri
        </button>
        <button
          onClick={() => result && onComplete(result.stats, result.logContext)}
          disabled={!result || errors.length > 0}
          className={`px-6 py-2 rounded-md font-semibold transition-colors ${
            result && errors.length === 0
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Hesapla & Kaydet →
        </button>
      </div>
    </div>
  );
};
