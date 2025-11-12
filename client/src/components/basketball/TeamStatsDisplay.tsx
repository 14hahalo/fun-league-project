import React from 'react';
import { TeamType } from '../../types/basketball.types';
import type { TeamStats } from '../../types/basketball.types';
import { StatCard } from './StatCard';

interface TeamStatsDisplayProps {
  stats: TeamStats;
  teamName?: string;
}

export const TeamStatsDisplay: React.FC<TeamStatsDisplayProps> = ({ stats, teamName }) => {
  const bgColor = stats.teamType === TeamType.TEAM_A ? 'bg-blue-50' : 'bg-red-50';
  const borderColor = stats.teamType === TeamType.TEAM_A ? 'border-blue-300' : 'border-red-300';
  const textColor = stats.teamType === TeamType.TEAM_A ? 'text-blue-700' : 'text-red-700';

  return (
    <div className={`p-6 rounded-xl border-2 ${borderColor} ${bgColor}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-2xl font-bold ${textColor}`}>
            {teamName || (stats.teamType === TeamType.TEAM_A ? 'Takım A' : 'Takım B')}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Takım İstatistikleri</p>
        </div>
        <div className="text-right">
          <p className={`text-5xl font-bold ${textColor}`}>{stats.totalPoints}</p>
          <p className="text-sm text-gray-600 mt-1">Toplam Puan</p>
        </div>
      </div>

      {/* Shooting Stats */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Şut İstatistikleri
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">2 Sayılık</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.twoPointMade} / {stats.twoPointAttempts}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-semibold">{stats.twoPointPercentage.toFixed(1)}%</span> Başarı
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">3 Sayılık</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.threePointMade} / {stats.threePointAttempts}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-semibold">{stats.threePointPercentage.toFixed(1)}%</span> Başarı
            </p>
          </div>
        </div>
      </div>

      {/* Other Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Toplam Ribaund"
          value={stats.totalRebounds}
          variant="default"
        />
        <StatCard
          label="Savunma Ribaund"
          value={stats.defensiveRebounds}
          variant="default"
        />
        <StatCard
          label="Hücum Ribaund"
          value={stats.offensiveRebounds}
          variant="default"
        />
        <StatCard
          label="Asist"
          value={stats.assists}
          variant="default"
        />
      </div>
    </div>
  );
};
