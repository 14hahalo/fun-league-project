import { useLastMonthLeaders } from '../hooks/useLastMonthLeaders';
import { useTopPlays } from '../hooks/useTopPlays';
import { FIFAPlayerCard } from '../components/visitor/FIFAPlayerCard';
import { TopPlaysCarousel } from '../components/visitor/TopPlaysCarousel';
import { Loading } from '../components/shared/Loading';

export const VisitorPage = () => {
  const { leaders, loading, error, monthName } = useLastMonthLeaders();
  const { topPlays, loading: topPlaysLoading } = useTopPlays();

  if (loading) return <Loading />;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 mb-6 drop-shadow-[0_0_30px_rgba(249,115,22,0.5)]">
            enBallerZ
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 font-semibold">
            {monthName} Ayının Liderleri
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent to-orange-500"></div>
            <span className="text-orange-400 text-sm uppercase tracking-widest font-bold">
              Menüden maç ve oyuncu detaylarına ulaşabilirsiniz
            </span>
            <div className="h-[2px] w-24 bg-gradient-to-l from-transparent to-orange-500"></div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500 text-red-200 px-6 py-4 rounded-xl text-center mb-12 backdrop-blur-md">
            {error}
          </div>
        )}

        <div className="mb-20">
          <h2 className="text-center text-2xl md:text-4xl font-black text-white mb-8 md:mb-12 uppercase tracking-wide">
            🏆 EN VERİMLİ 3 OYUNCU 🏆
          </h2>

          <div className="hidden md:flex items-end justify-center gap-4 lg:gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center" >
              <div className="relative">
                {leaders.secondEfficient && (
                  <FIFAPlayerCard
                    player={leaders.secondEfficient}
                    title="2. SIRA"
                    mainStat={{
                      label: "VERİMLİLİK %",
                      value: Math.round(leaders.secondEfficient.efficiency || 0)
                    }}
                    gradient="from-gray-400 via-gray-500 to-gray-600"
                    icon="🥈"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative transform scale-110 lg:scale-110">
                {leaders.firstEfficient && (
                  <FIFAPlayerCard
                    player={leaders.firstEfficient}
                    title="BİRİNCİ"
                    mainStat={{
                      label: "VERİMLİLİK %",
                      value: Math.round(leaders.firstEfficient.efficiency || 0)
                    }}
                    gradient="from-yellow-500 via-yellow-600 to-yellow-700"
                    icon="🥇"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col items-center" >
              <div className="relative transform scale-100">
                {leaders.thirdEfficient && (
                  <FIFAPlayerCard
                    player={leaders.thirdEfficient}
                    title="3. SIRA"
                    mainStat={{
                      label: "VERİMLİLİK %",
                      value: Math.round(leaders.thirdEfficient.efficiency || 0)
                    }}
                    gradient="from-orange-600 via-orange-700 to-orange-800"
                    icon="🥉"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="md:hidden flex flex-col items-center gap-8 px-4">
            {leaders.firstEfficient && (
              <div className="flex flex-col items-center w-full max-w-sm">
                <div className="relative w-full">
                  <FIFAPlayerCard
                    player={leaders.firstEfficient}
                    title="BİRİNCİ"
                    mainStat={{
                      label: "VERİMLİLİK %",
                      value: Math.round(leaders.firstEfficient.efficiency || 0)
                    }}
                    gradient="from-yellow-500 via-yellow-600 to-yellow-700"
                    icon="🥇"
                  />
                </div>
              </div>
            )}

            {leaders.secondEfficient && (
              <div className="flex flex-col items-center w-full max-w-sm">
                <div className="relative w-full">
                  <FIFAPlayerCard
                    player={leaders.secondEfficient}
                    title="2. SIRA"
                    mainStat={{
                      label: "VERİMLİLİK %",
                      value: Math.round(leaders.secondEfficient.efficiency || 0)
                    }}
                    gradient="from-gray-400 via-gray-500 to-gray-600"
                    icon="🥈"
                  />
                </div>
              </div>
            )}

            {leaders.thirdEfficient && (
              <div className="flex flex-col items-center w-full max-w-sm">
                <div className="relative w-full">
                  <FIFAPlayerCard
                    player={leaders.thirdEfficient}
                    title="3. SIRA"
                    mainStat={{
                      label: "VERİMLİLİK %",
                      value: Math.round(leaders.thirdEfficient.efficiency || 0)
                    }}
                    gradient="from-orange-600 via-orange-700 to-orange-800"
                    icon="🥉"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {!topPlaysLoading && topPlays.length > 0 && (
          <div className="my-20">
            <h2 className="text-center text-2xl md:text-4xl font-black text-white mb-8 md:mb-12 uppercase tracking-wide">
              🎬 {monthName} AYININ EN İYİ OYUNLARI 🎬
            </h2>
            <div className="max-w-6xl mx-auto px-4">
              <TopPlaysCarousel videos={topPlays} />
            </div>
          </div>
        )}

        <div className="mt-16 px-4">
          <h2 className="text-center text-xl md:text-3xl font-black text-white mb-8 md:mb-10 uppercase tracking-wide">
            📊 DİĞER KATEGORİ LİDERLERİ 📊
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mx-auto">
            {leaders.mostPoints && (
              <div className="transform hover:scale-105 transition-transform">
                <div className="relative">
                  <FIFAPlayerCard
                    player={leaders.mostPoints}
                    title="EN SKORER"
                    mainStat={{
                      label: "Toplam Sayı",
                      value: leaders.mostPoints.totalPoints || 0
                    }}
                    gradient="from-red-600 via-red-700 to-red-900"
                    icon="🔥"
                  />
                </div>
              </div>
            )}

            {leaders.mostRebounds && (
              <div className="transform hover:scale-105 transition-transform">
                <div className="relative">
                  <FIFAPlayerCard
                    player={leaders.mostRebounds}
                    title="RİBAUND KRALI"
                    mainStat={{
                      label: "Toplam Ribaund",
                      value: leaders.mostRebounds.totalRebounds || 0
                    }}
                    gradient="from-green-600 via-green-700 to-green-900"
                    icon="💪"
                  />
                </div>
              </div>
            )}

            {leaders.mostAssists && (
              <div className="transform hover:scale-105 transition-transform">
                <div className="relative">
                  <FIFAPlayerCard
                    player={leaders.mostAssists}
                    title="ASİST LİDERİ"
                    mainStat={{
                      label: "TOPLAM ASİST",
                      value: leaders.mostAssists.totalAssists || 0
                    }}
                    gradient="from-purple-600 via-purple-700 to-purple-900"
                    icon="🎯"
                  />
                </div>
              </div>
            )}

            {leaders.dominant2PP && (
              <div className="transform hover:scale-105 transition-transform">
                <div className="relative">
                  <FIFAPlayerCard
                    player={leaders.dominant2PP}
                    title="2 SAYI KRALI"
                    mainStat={{
                      label: "2 Sayı %",
                      value: `${leaders.dominant2PP.twoPointPercentage?.toFixed(1)}%`
                    }}
                    gradient="from-blue-600 via-blue-700 to-blue-900"
                    icon="🎪"
                  />
                </div>
              </div>
            )}

            {leaders.dominant3PP && (
              <div className="transform hover:scale-105 transition-transform">
                <div className="relative">
                  <FIFAPlayerCard
                    player={leaders.dominant3PP}
                    title="3 SAYI KRALI"
                    mainStat={{
                      label: "3 Sayı %",
                      value: `${leaders.dominant3PP.threePointPercentage?.toFixed(1)}%`
                    }}
                    gradient="from-indigo-600 via-indigo-700 to-indigo-900"
                    icon="🌟"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
