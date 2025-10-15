import type { Player } from '../../types/player.types';

interface PlayerCardProps {
  player: Player;
}

export const PlayerCard = ({ player }: PlayerCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.nickname}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-white text-6xl font-bold">
            {player.nickname.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{player.nickname}</h3>
            {(player.firstName || player.lastName) && (
              <p className="text-gray-600">
                {player.firstName} {player.lastName}
              </p>
            )}
          </div>
          {player.jerseyNumber && (
            <div className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
              {player.jerseyNumber}
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm text-gray-700">
          {player.position && (
            <div className="flex items-center">
              <span className="font-semibold w-20">Pozisyon:</span>
              <span>{player.position}</span>
            </div>
          )}
          {player.height && (
            <div className="flex items-center">
              <span className="font-semibold w-20">Boy:</span>
              <span>{player.height} cm</span>
            </div>
          )}
          {player.weight && (
            <div className="flex items-center">
              <span className="font-semibold w-20">Kilo:</span>
              <span>{player.weight} kg</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};