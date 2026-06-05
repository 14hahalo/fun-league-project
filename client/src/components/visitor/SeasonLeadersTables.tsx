import type { SeasonGameLeaders } from '../../hooks/useSeasonGameLeaders';

interface TableConfig {
  title: string;
  icon: string;
  accentColor: string;
  headerBg: string;
  data: Array<{ playerName: string; value: number; matchWeek?: string }>;
  unit?: string;
  showMatchWeek?: boolean;
}

const LeadersTable = ({ config }: { config: TableConfig }) => {
  const { title, icon, accentColor, headerBg, data, unit, showMatchWeek = true } = config;

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col">
      <div className={`${headerBg} px-4 py-3 flex items-center gap-2`}>
        <span className="text-xl">{icon}</span>
        <h3 className={`font-black text-sm uppercase tracking-widest ${accentColor}`}>
          {title}
        </h3>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
              <th className="text-left px-4 py-2 font-semibold">#</th>
              <th className="text-left px-4 py-2 font-semibold">Oyuncu</th>
              <th className="text-right px-4 py-2 font-semibold">Miktar</th>
              {showMatchWeek && (
                <th className="text-right px-4 py-2 font-semibold">Maç Haftası</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={showMatchWeek ? 4 : 3} className="text-center py-6 text-gray-500 text-xs">
                  Veri bulunamadı
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={`${row.playerName}-${row.matchWeek ?? idx}-${idx}`}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-semibold text-white truncate max-w-[120px]">
                    {row.playerName}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-black tabular-nums ${accentColor}`}>
                    {row.value}
                    {unit && <span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>}
                  </td>
                  {showMatchWeek && (
                    <td className="px-4 py-2.5 text-right text-gray-300 font-mono text-xs">
                      {row.matchWeek}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface SeasonLeadersTablesProps {
  leaders: SeasonGameLeaders;
  isOffSeason?: boolean;
  seasonName?: string;
}

export const SeasonLeadersTables = ({ leaders, isOffSeason = false, seasonName }: SeasonLeadersTablesProps) => {
  const tables: TableConfig[] = [
    {
      title: 'En Çok Sayı',
      icon: '🔥',
      accentColor: 'text-orange-400',
      headerBg: 'bg-gradient-to-r from-orange-900/60 to-red-900/40',
      data: leaders.topPoints,
    },
    {
      title: 'En Çok Ribaund',
      icon: '💪',
      accentColor: 'text-green-400',
      headerBg: 'bg-gradient-to-r from-green-900/60 to-emerald-900/40',
      data: leaders.topRebounds,
    },
    {
      title: 'En Çok Asist',
      icon: '🎯',
      accentColor: 'text-purple-400',
      headerBg: 'bg-gradient-to-r from-purple-900/60 to-indigo-900/40',
      data: leaders.topAssists,
    },
    {
      title: 'En Çok 3 Sayı',
      icon: '🌟',
      accentColor: 'text-yellow-400',
      headerBg: 'bg-gradient-to-r from-yellow-900/60 to-amber-900/40',
      data: leaders.topThreePointMade,
    },
    {
      title: 'En Verimli Performans',
      icon: '📈',
      accentColor: 'text-pink-400',
      headerBg: 'bg-gradient-to-r from-pink-900/60 to-rose-900/40',
      data: leaders.topEfficiency,
    },
    {
      title: 'Double Double',
      icon: '⚡',
      accentColor: 'text-cyan-400',
      headerBg: 'bg-gradient-to-r from-cyan-900/60 to-sky-900/40',
      data: leaders.doubleDoubles.map((r) => ({ playerName: r.playerName, value: r.count })),
      showMatchWeek: false,
    },
  ];

  return (
    <div className="mt-16 px-4">
      <h2 className="text-center text-xl md:text-3xl font-black text-white mb-8 md:mb-10 uppercase tracking-wide">
        {isOffSeason
          ? `📋 ${seasonName ? `${seasonName} ` : ''}SEZON MAÇ REKORLARI 📋`
          : `📋 ${seasonName ? `${seasonName} ` : ''}SEZON LİDERLERİ 📋`}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto">
        {tables.map((cfg) => (
          <LeadersTable key={cfg.title} config={cfg} />
        ))}
      </div>
    </div>
  );
};
