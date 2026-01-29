import React from 'react';
import type { PlayerStatsWithPlayerInfo } from '../../types/basketball.types';

interface PlayerStatRowProps {
  stats: PlayerStatsWithPlayerInfo;
  onEdit?: (stats: PlayerStatsWithPlayerInfo) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const PlayerStatRow: React.FC<PlayerStatRowProps> = ({
  stats,
  onEdit,
  onDelete,
  showActions = false
}) => {
  const handleDelete = () => {
    if (window.confirm('Bu oyuncunun istatistiklerini silmek istediğinize emin misiniz?')) {
      onDelete?.(stats.id);
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
            {stats.playerJerseyNumber ? (
              <span className="text-sm font-bold text-orange-600">#{stats.playerJerseyNumber}</span>
            ) : (
              <span className="text-sm font-bold text-orange-600">
                {stats.playerNickname?.charAt(0) || '?'}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{stats.playerNickname || 'Bilinmiyor'}</p>
            {stats.playerName && (
              <p className="text-xs text-gray-500">{stats.playerName}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center border-b border-gray-200">
        <div className="text-sm">
          <span className="font-semibold text-gray-900">{stats.twoPointMade}</span>
          <span className="text-gray-500">/{stats.twoPointAttempts}</span>
          <p className="text-xs text-gray-500 mt-0.5">{stats.twoPointPercentage.toFixed(1)}%</p>
        </div>
      </td>
      <td className="px-4 py-3 text-center border-b border-gray-200">
        <div className="text-sm">
          <span className="font-semibold text-gray-900">{stats.threePointMade}</span>
          <span className="text-gray-500">/{stats.threePointAttempts}</span>
          <p className="text-xs text-gray-500 mt-0.5">{stats.threePointPercentage.toFixed(1)}%</p>
        </div>
      </td>
      <td className="px-4 py-3 text-center border-b border-gray-200">
        <span className="font-semibold text-gray-900">{stats.totalRebounds}</span>
        <p className="text-xs text-gray-500">
          <span className="text-blue-600">{stats.defensiveRebounds}D</span> /
          <span className="text-orange-600 ml-1">{stats.offensiveRebounds}O</span>
        </p>
      </td>
      <td className="px-4 py-3 text-center border-b border-gray-200">
        <span className="font-semibold text-gray-900">{stats.assists}</span>
      </td>
      <td className="px-4 py-3 text-center border-b border-gray-200">
        <span className="text-lg font-bold text-orange-600">{stats.totalPoints}</span>
      </td>
      {showActions && (
        <td className="px-4 py-3 text-right border-b border-gray-200">
          <div className="flex items-center justify-end gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(stats)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Düzenle
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Sil
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
};
