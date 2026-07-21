import { useEffect, useState } from 'react';
import { playerAnalysisApi } from '../../api/playerAnalysisApi';
import type { PlayerAnalysis } from '../../types/playerAnalysis.types';
import { RobotMascot } from './RobotMascot';

interface PlayerAnalysisModalProps {
  playerId: string;
  playerName: string;
  onClose: () => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const PlayerAnalysisModal = ({ playerId, playerName, onClose }: PlayerAnalysisModalProps) => {
  const [analysis, setAnalysis] = useState<PlayerAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<PlayerAnalysis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const data = await playerAnalysisApi.getActiveAnalysis(playerId);
        setAnalysis(data);
        setError(null);
      } catch (err) {
        setError('Analiz yüklenirken bir hata oluştu');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [playerId]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  const toggleHistory = async () => {
    const opening = !historyOpen;
    setHistoryOpen(opening);

    if (opening && history.length === 0) {
      try {
        setHistoryLoading(true);
        const result = await playerAnalysisApi.getAnalysisHistory(playerId);
        setHistory(result.items.filter((item) => !item.isActive));
      } catch (err) {
        console.error(err);
      } finally {
        setHistoryLoading(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-purple-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent"></div>

          <div className="relative px-5 py-4 flex items-center gap-3">
            <RobotMascot className="w-16 h-16 flex-shrink-0" glow />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 truncate">
                AI Performans Analizi
              </h2>
              <p className="text-xs text-gray-500 truncate">{playerName}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 flex items-center justify-center transition-all group"
            >
              <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(90vh-90px)] custom-scrollbar">
          {loading && <AnalysisSkeleton />}

          {!loading && error && (
            <div className="text-center py-16 text-red-400 text-sm">{error}</div>
          )}

          {!loading && !error && !analysis && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <RobotMascot className="w-32 h-32 mb-4 opacity-50" glow />
              <p className="text-gray-400 font-semibold mb-1">Henüz bir analiz yok</p>
              <p className="text-gray-600 text-sm">
                Bu oyuncunun ilk maç istatistiği kaydedildiğinde analiz otomatik olarak oluşturulacak.
              </p>
            </div>
          )}

          {!loading && !error && analysis && (
            <div className="space-y-4">
              <AnalysisBody analysis={analysis} />

              <div className="pt-3 border-t border-gray-800 flex flex-col gap-1">
                <p className="text-[11px] text-gray-500">
                  Son güncelleme: {formatDate(analysis.generatedAt)} · {analysis.basedOnMatchCount} maça dayanıyor
                </p>
                <p className="text-[10px] text-gray-600 italic">Bu analiz yapay zeka tarafından otomatik olarak oluşturulmuştur</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={toggleHistory}
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                >
                  <svg
                    className={`w-3 h-3 transition-transform ${historyOpen ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Geçmiş analizler
                </button>

                {historyOpen && (
                  <div className="mt-3 space-y-2">
                    {historyLoading && <p className="text-xs text-gray-600">Yükleniyor...</p>}
                    {!historyLoading && history.length === 0 && (
                      <p className="text-xs text-gray-600">Geçmiş analiz bulunamadı.</p>
                    )}
                    {!historyLoading &&
                      history.map((item) => (
                        <div key={item.id} className="border border-gray-800 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                            className="w-full text-left px-3 py-2 bg-gray-900/60 hover:bg-gray-900 text-xs text-gray-400 flex items-center justify-between transition-colors"
                          >
                            <span>{formatDate(item.generatedAt)}</span>
                            <span className="text-gray-600">{item.basedOnMatchCount} maç</span>
                          </button>
                          {expandedHistoryId === item.id && (
                            <div className="px-3 py-3 bg-black/30">
                              <AnalysisBody analysis={item} compact />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AnalysisSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-16 bg-gray-800/60 rounded-xl"></div>
    <div className="h-24 bg-gray-800/60 rounded-xl"></div>
    <div className="h-24 bg-gray-800/60 rounded-xl"></div>
    <div className="h-12 bg-gray-800/60 rounded-xl"></div>
  </div>
);

const AnalysisBody = ({ analysis, compact = false }: { analysis: PlayerAnalysis; compact?: boolean }) => {
  const insights = analysis.structuredInsights;

  if (!insights) {
    return <p className="text-gray-300 text-sm leading-relaxed">{analysis.analysisText}</p>;
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="bg-gray-900/60 border border-purple-500/20 rounded-xl p-3">
        <p className="text-gray-200 text-sm leading-relaxed">{insights.summary}</p>
      </div>

      {insights.strengths.length > 0 && (
        <div className="bg-gray-900/60 border border-emerald-500/30 rounded-xl p-3">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <span>💪</span> Güçlü Yönler
          </h4>
          <ul className="space-y-1">
            {insights.strengths.map((s, i) => (
              <li key={i} className="text-gray-300 text-sm flex gap-1.5">
                <span className="text-emerald-500">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {insights.weaknesses.length > 0 && (
        <div className="bg-gray-900/60 border border-orange-500/30 rounded-xl p-3">
          <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <span>🎯</span> Gelişim Alanları
          </h4>
          <ul className="space-y-1">
            {insights.weaknesses.map((w, i) => (
              <li key={i} className="text-gray-300 text-sm flex gap-1.5">
                <span className="text-orange-500">•</span> {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-gray-900/60 border border-cyan-500/30 rounded-xl p-3">
        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
          <span>📈</span> Trend
        </h4>
        <p className="text-gray-300 text-sm leading-relaxed">{insights.trend}</p>
      </div>

      {insights.attendance && (
        <div className="bg-gray-900/60 border border-blue-500/30 rounded-xl p-3">
          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <span>📅</span> Katılım
          </h4>
          <p className="text-gray-300 text-sm leading-relaxed">{insights.attendance}</p>
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-500/10 to-orange-500/10 border border-purple-500/30 rounded-xl p-3">
        <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wide mb-1.5 flex items-center gap-1">
          <span>💡</span> Tavsiye
        </h4>
        <p className="text-gray-200 text-sm leading-relaxed">{insights.advice}</p>
      </div>
    </div>
  );
};
