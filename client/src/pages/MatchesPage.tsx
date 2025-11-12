import { useNavigate } from 'react-router-dom';
import { useGames } from '../hooks/useGames';
import { MatchList } from '../components/visitor/MatchList';
import { Loading } from '../components/shared/Loading';

export const MatchesPage = () => {
  const navigate = useNavigate();
  const { games, loading: gamesLoading, error: gamesError } = useGames();

  const handleMatchClick = (gameId: string) => {
    navigate(`/match/${gameId}`);
  };

  if (gamesLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">

          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="h-[2px] w-16 md:w-24 bg-gradient-to-r from-transparent to-orange-500"></div>
            <span className={`text-xs md:text-sm uppercase tracking-widest font-bold text-orange-300`}>
              Son Oynanan Maçlar
            </span>
            <div className="h-[2px] w-16 md:w-24 bg-gradient-to-l from-transparent to-orange-500"></div>
          </div>

        </div>

        {gamesError && (
          <div className={`border-2 border-red-500 px-6 py-4 rounded-xl text-center mb-12 bg-red-500/20 text-red-200 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.3)]`}>
            {gamesError}
          </div>
        )}

        

        <MatchList games={games} onMatchClick={handleMatchClick} />
      </div>
    </div>
  );
};
