import { useEffect, useState } from 'react';
import type { Player } from '../../types/player.types';
import type { PlayerAnalysisFailure } from '../../types/playerAnalysis.types';
import { playerAnalysisApi } from '../../api/playerAnalysisApi';

interface AnalysisManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
}

type BackfillSummary = { processed: number; skipped: number; failed: { playerId: string; error: string }[] };

export const AnalysisManagementModal: React.FC<AnalysisManagementModalProps> = ({ isOpen, onClose, players }) => {
  const [failures, setFailures] = useState<PlayerAnalysisFailure[]>([]);
  const [failuresLoading, setFailuresLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillSummary, setBackfillSummary] = useState<BackfillSummary | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const getPlayerName = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return 'Bilinmiyor';
    return player.nickname || `${player.firstName} ${player.lastName}`;
  };

  const loadFailures = async () => {
    try {
      setFailuresLoading(true);
      const data = await playerAnalysisApi.getFailures();
      setFailures(data);
    } catch (err) {
      console.error('Analiz hataları yüklenemedi:', err);
    } finally {
      setFailuresLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setBackfillSummary(null);
      setStatusMessage(null);
      loadFailures();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRegenerateAll = async () => {
    setRegenerating(true);
    setStatusMessage(null);
    try {
      await playerAnalysisApi.regenerateAll();
      setStatusMessage('Tüm oyuncular için yenileme arka planda başlatıldı. Kısa süre sonra "Durumu Yenile" ile sonucu kontrol edebilirsin.');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Yenileme başlatılamadı');
    } finally {
      setRegenerating(false);
    }
  };

  const handleBackfill = async () => {
    setBackfilling(true);
    setStatusMessage(null);
    try {
      const summary = await playerAnalysisApi.backfill();
      setBackfillSummary(summary);
      await loadFailures();
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Backfill başarısız oldu');
    } finally {
      setBackfilling(false);
    }
  };

  const handleRetry = async (playerId: string) => {
    setRetryingId(playerId);
    try {
      await playerAnalysisApi.regeneratePlayer(playerId);
      setFailures((prev) => prev.filter((f) => f.playerId !== playerId));
    } catch (err) {
      console.error(`Tekrar deneme başarısız (playerId=${playerId}):`, err);
      setStatusMessage(`${getPlayerName(playerId)} için tekrar deneme başarısız oldu.`);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400">
            🧠 AI Analiz Yönetimi
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl">
            ✕
          </button>
        </div>

        <p className="text-gray-300 mb-6 text-sm">
          Oyuncu performans analizlerini toplu olarak yenile veya eksik analizleri oluştur. OpenAI kotasını aşmamak
          için istekler kuyruğa alınarak yavaşça gönderilir; bir maç istatistiği eklendiğinde tetiklenen otomatik
          analizler de aynı kuyruğu kullanır.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleRegenerateAll}
            disabled={regenerating}
            className="p-4 rounded-lg border-2 border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 text-left transition-colors disabled:opacity-50"
          >
            <div className="text-white font-bold mb-1">{regenerating ? 'Başlatılıyor...' : '🔄 Tüm Oyuncuları Yeniden Oluştur'}</div>
            <div className="text-xs text-gray-400">Tüm aktif oyuncular için analiz arka planda yenilenir.</div>
          </button>

          <button
            onClick={handleBackfill}
            disabled={backfilling}
            className="p-4 rounded-lg border-2 border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-left transition-colors disabled:opacity-50"
          >
            <div className="text-white font-bold mb-1">{backfilling ? 'Çalışıyor...' : '➕ Eksik Analizleri Oluştur'}</div>
            <div className="text-xs text-gray-400">Maçı olup hiç analizi olmayan oyuncular için analiz oluşturur.</div>
          </button>
        </div>

        {statusMessage && (
          <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-sm">
            {statusMessage}
          </div>
        )}

        {backfillSummary && (
          <div className="mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="text-white font-semibold mb-2">Backfill Sonucu</div>
            <div className="flex gap-4 text-sm text-gray-300">
              <span>✅ Oluşturuldu: <span className="text-emerald-400 font-bold">{backfillSummary.processed}</span></span>
              <span>⏭️ Atlandı: <span className="text-gray-400 font-bold">{backfillSummary.skipped}</span></span>
              <span>❌ Başarısız: <span className="text-red-400 font-bold">{backfillSummary.failed.length}</span></span>
            </div>
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-white">Başarısız Analizler</h3>
            <button
              onClick={loadFailures}
              disabled={failuresLoading}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
            >
              {failuresLoading ? 'Yükleniyor...' : '⟳ Durumu Yenile'}
            </button>
          </div>

          {failuresLoading && failures.length === 0 && (
            <p className="text-gray-500 text-sm">Yükleniyor...</p>
          )}

          {!failuresLoading && failures.length === 0 && (
            <p className="text-gray-500 text-sm">Bekleyen başarısız analiz yok. 🎉</p>
          )}

          {failures.length > 0 && (
            <div className="space-y-2">
              {failures.map((failure) => (
                <div
                  key={failure.playerId}
                  className="flex items-center justify-between gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                >
                  <div className="min-w-0">
                    <div className="text-white font-medium">{getPlayerName(failure.playerId)}</div>
                    <div className="text-xs text-red-300 truncate">{failure.lastError}</div>
                    <div className="text-[10px] text-gray-500">
                      Son deneme: {new Date(failure.lastAttemptAt).toLocaleString('tr-TR')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRetry(failure.playerId)}
                    disabled={retryingId === failure.playerId}
                    className="shrink-0 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {retryingId === failure.playerId ? '...' : 'Tekrar Dene'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
