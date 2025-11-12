// import type { Player } from '../../types/player.types';

// interface PlayerCardProps {
//   player: Player;
// }

// export const PlayerCard = ({ player }: PlayerCardProps) => {
//   return (
//     <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
//       <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
//         {player.photoUrl ? (
//           <img
//             src={player.photoUrl}
//             alt={player.nickname}
//             className="h-full w-full object-cover"
//           />
//         ) : (
//           <div className="text-white text-6xl font-bold">
//             {player.nickname.charAt(0).toUpperCase()}
//           </div>
//         )}
//       </div>
      
//       <div className="p-6">
//         <div className="flex justify-between items-start mb-4">
//           <div>
//             <h3 className="text-2xl font-bold text-gray-800">{player.nickname}</h3>
//             {(player.firstName || player.lastName) && (
//               <p className="text-gray-600">
//                 {player.firstName} {player.lastName}
//               </p>
//             )}
//           </div>
//           {player.jerseyNumber && (
//             <div className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
//               {player.jerseyNumber}
//             </div>
//           )}
//         </div>

//         <div className="space-y-2 text-sm text-gray-700">
//           {player.position && (
//             <div className="flex items-center">
//               <span className="font-semibold w-20">Pozisyon:</span>
//               <span>{player.position}</span>
//             </div>
//           )}
//           {player.height && (
//             <div className="flex items-center">
//               <span className="font-semibold w-20">Boy:</span>
//               <span>{player.height} cm</span>
//             </div>
//           )}
//           {player.weight && (
//             <div className="flex items-center">
//               <span className="font-semibold w-20">Kilo:</span>
//               <span>{player.weight} kg</span>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

import React from "react";
import type { TopPlayerStats } from '../../hooks/useTopPlayers';
import "../../PlayerCard.css";

interface FIFAPlayerCardProps {
  player: TopPlayerStats;
  title: string;
  mainStat: {
    label: string;
    value: string | number;
  };
  gradient: string;
  icon: string;
}

// Calculate overall rating based on stats
const calculateOverallRating = (player: TopPlayerStats): number => {
  const gamesPlayed = player.gamesPlayed || 1;
  const ppg = (player.totalPoints || 0) / gamesPlayed;
  const rpg = (player.totalRebounds || 0) / gamesPlayed;
  const apg = (player.totalAssists || 0) / gamesPlayed;
  const shootingPct = player.shootingPercentage || 0;

  // Weighted calculation for overall rating (scale to 99)
  const rating = Math.min(99, Math.round(
    (ppg * 3) + (rpg * 2) + (apg * 2.5) + (shootingPct * 0.5)
  ));

  return Math.max(65, rating); // Minimum 65
};

// Calculate individual stats for FIFA card (0-99 scale)
const calculateStats = (player: TopPlayerStats) => {
  const gamesPlayed = player.gamesPlayed || 1;
  const ppg = (player.totalPoints || 0) / gamesPlayed;
  const rpg = (player.totalRebounds || 0) / gamesPlayed;
  const apg = (player.totalAssists || 0) / gamesPlayed;

  return [
    { label: 'PAC', value: Math.min(99, Math.round(55 + (apg * 8))) },
    { label: 'SHO', value: Math.min(99, Math.round(50 + (ppg * 2.5))) },
    { label: 'PAS', value: Math.min(99, Math.round(50 + (apg * 10))) },
    { label: 'DRI', value: Math.min(99, Math.round(60 + (apg * 7))) },
    { label: 'DEF', value: Math.min(99, Math.round(55 + (rpg * 6))) },
    { label: 'PHY', value: Math.min(99, Math.round(60 + (rpg * 5))) },
  ];
};

// Convert full position names to abbreviations
const getPositionAbbreviation = (position: string | undefined): string => {
  if (!position) return 'POS';

  const positionMap: Record<string, string> = {
    'Point Guard': 'PG',
    'Shooting Guard': 'SG',
    'Small Forward': 'SF',
    'Power Forward': 'PF',
    'Center': 'C',
  };

  return positionMap[position] || position;
};

export const PlayerCard: React.FC<FIFAPlayerCardProps> = ({
  player,
  title: _title,
  mainStat: _mainStat,
  gradient,
  icon,
}) => {
  const overallRating = calculateOverallRating(player);
  const stats = calculateStats(player);
  const position = getPositionAbbreviation(player.playerPosition);

  // Transform player data to match template format
  const playerData = {
    rating: overallRating,
    position: position,
    name: player.playerNickname || 'Unknown',
    image: player.playerPhotoUrl || '',
    countryImage: icon, // Using icon as country/badge
    clubImage: '', // Can be added later
    backfont: player.playerNickname?.toUpperCase() || 'PLAYER',
    stats: stats,
    jerseyNumber: player.playerJerseyNumber || '',
  };

  return (
    <div className="fifa-card-container">
      {/* Card */}
      <div
        className="fifa-card active"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 267.3 427.3">
          <clipPath id={`svgPath-${player.playerId || 'default'}`}>
            <path fill="#000" d="M265.3 53.9a33.3 33.3 0 0 1-17.8-5.5 32 32 0 0 1-13.7-22.9c-.2-1.1-.4-2.3-.4-3.4 0-1.3-1-1.5-1.8-1.9a163 163 0 0 0-31-11.6A257.3 257.3 0 0 0 133.7 0a254.9 254.9 0 0 0-67.1 8.7 170 170 0 0 0-31 11.6c-.8.4-1.8.6-1.8 1.9 0 1.1-.2 2.3-.4 3.4a32.4 32.4 0 0 1-13.7 22.9A33.8 33.8 0 0 1 2 53.9c-1.5.1-2.1.4-2 2v293.9c0 3.3 0 6.6.4 9.9a22 22 0 0 0 7.9 14.4c3.8 3.2 8.3 5.3 13 6.8 12.4 3.9 24.8 7.5 37.2 11.5a388.7 388.7 0 0 1 50 19.4 88.7 88.7 0 0 1 25 15.5v.1-.1c7.2-7 16.1-11.3 25-15.5a427 427 0 0 1 50-19.4l37.2-11.5c4.7-1.5 9.1-3.5 13-6.8 4.5-3.8 7.2-8.5 7.9-14.4.4-3.3.4-6.6.4-9.9V231.6 60.5v-4.6c.4-1.6-.3-1.9-1.7-2z"/>
          </clipPath>
        </svg>

        <div className="fifa-card-inner" style={{
          clipPath: `url(#svgPath-${player.playerId || 'default'})`
        }}>
          {/* Top Section */}
          <div className="fifa-card-top" style={{
            background: gradient.includes('red')
              ? 'linear-gradient(135deg, #fca5a5 0%, #dc2626 100%)'
              : gradient.includes('blue')
              ? 'linear-gradient(135deg, #93c5fd 0%, #2563eb 100%)'
              : gradient.includes('green')
              ? 'linear-gradient(135deg, #86efac 0%, #16a34a 100%)'
              : gradient.includes('purple')
              ? 'linear-gradient(135deg, #d8b4fe 0%, #9333ea 100%)'
              : 'linear-gradient(135deg, #fdeaa7 0%, #d6b74a 100%)'
          }}>
            <div className="fifa-player-info">
              <div className="fifa-rating-value">{playerData.jerseyNumber}</div>
              <div className="fifa-position ">{playerData.position}</div>

              {/* Category Badge */}
              <div className="fifa-country">
                <div style={{
                  backgroundImage: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px'
                }}>
                  {icon}
                </div>
              </div>

              {/* Jersey Number
              {player.playerJerseyNumber && (
                <div className="fifa-club">
                  <div style={{
                    backgroundImage: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#725b16'
                  }}>
                    #{player.playerJerseyNumber}
                  </div>
                </div>
              )} */}
            </div>

            <div
              className="fifa-player-image"
              style={{
                backgroundImage: playerData.image ? `url(${playerData.image})` : 'none',
              }}
            >
              {!playerData.image && (
                <div style={{
                  width: '100%',
                  height: '10%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#725b16',
                  opacity: 0.3
                }}>
                  {playerData.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="fifa-backfont">{playerData.backfont}</div>
          </div>

          {/* Bottom Section */}
          <div className="fifa-card-bottom" style={{
            background: gradient.includes('red')
              ? 'linear-gradient(135deg, #fca5a5 0%, #dc2626 100%)'
              : gradient.includes('blue')
              ? 'linear-gradient(135deg, #93c5fd 0%, #2563eb 100%)'
              : gradient.includes('green')
              ? 'linear-gradient(135deg, #86efac 0%, #16a34a 100%)'
              : gradient.includes('purple')
              ? 'linear-gradient(135deg, #d8b4fe 0%, #9333ea 100%)'
              : 'linear-gradient(135deg, #fdeaa7 0%, #d6b74a 100%)'
          }}>
            <div className="fifa-player-name">{playerData.name}</div>

            {/* Basketball Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              padding: '2px 2px',
              borderTop: '2px solid rgba(114, 91, 22, 0.2)',
              borderBottom: '2px solid rgba(114, 91, 22, 0.2)',
              marginTop: '8px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#725b16', fontWeight: 'bold', opacity: 0.7 }}>PTS</div>
                <div style={{ fontSize: '18px', color: '#631192be', fontWeight: 'bold' }}>
                  {player.totalPoints?.toFixed(1) || '0.0'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#725b16', fontWeight: 'bold', opacity: 0.7 }}>REB</div>
                <div style={{ fontSize: '18px', color: '#631192be', fontWeight: 'bold' }}>
                  {player.totalRebounds?.toFixed(1) || '0.0'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#725b16', fontWeight: 'bold', opacity: 0.7 }}>AST</div>
                <div style={{ fontSize: '18px', color: '#631192be', fontWeight: 'bold' }}>
                  {player.totalAssists?.toFixed(1) || '0.0'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#725b16', fontWeight: 'bold', opacity: 0.7 }}>EFF</div>
                <div style={{ fontSize: '18px', color: '#631192be', fontWeight: 'bold' }}>
                  {(player as any).efficiency?.toFixed(1) || '0.0'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#725b16', fontWeight: 'bold', opacity: 0.7 }}>2P%</div>
                <div style={{ fontSize: '18px', color: '#631192be', fontWeight: 'bold' }}>
                  {(player as any).twoPointPercentage?.toFixed(0) || '0'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#725b16', fontWeight: "bold", opacity: 0.7 }}>3P%</div>
                <div style={{ fontSize: '18px', color: '#631192be', fontWeight: 'bold' }}>
                  {(player as any).threePointPercentage?.toFixed(0) || '0'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
