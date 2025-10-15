import { usePlayers } from '../hooks/usePlayers';
import { PlayerCard } from '../components/visitor/PlayerCard';
import { Loading } from '../components/shared/Loading';

export const VisitorPage = () => {
  const { players, loading, error } = usePlayers(true); // Sadece aktif oyuncuları getir

  if (loading) return <Loading />;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          🏀 Takım Oyuncuları
        </h1>
        <p className="text-xl text-gray-600">
          Basketbol ligimizin yıldız oyuncularını keşfedin
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
          {error}
        </div>
      )}

      {players.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-2xl text-gray-500">Henüz aktif oyuncu bulunmuyor</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}

      <div className="text-center mt-12">
        <div className="bg-orange-100 rounded-lg p-6 inline-block">
          <p className="text-lg font-semibold text-orange-800">
            Toplam Aktif Oyuncu: {players.length}
          </p>
        </div>
      </div>
    </div>
  );
};