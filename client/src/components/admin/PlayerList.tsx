import type { Player } from '../../types/player.types';
import { Button } from '../shared/Button';

interface PlayerListProps {
  players: Player[];
  onEdit: (player: Player) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleStatus: (id: string) => Promise<void>;
  onSetPassword: (player: Player) => void;
}

export const PlayerList = ({ players, onEdit, onDelete, onToggleStatus, onSetPassword }: PlayerListProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-orange-600 text-white">
        <h2 className="text-2xl font-bold">Oyuncu Listesi ({players.length})</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Takma Ad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                İsim Soyisim
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Forma No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Pozisyon
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {players.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Henüz oyuncu eklenmemiş
                </td>
              </tr>
            ) : (
              players.map((player) => (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {player.nickname}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {player.firstName} {player.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {player.jerseyNumber || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {player.position || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        player.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {player.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="secondary"
                        onClick={() => onEdit(player)}
                        className="text-xs"
                      >
                        Düzenle
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => onSetPassword(player)}
                        className="text-xs bg-blue-500 hover:bg-blue-600"
                      >
                        Şifre Belirle
                      </Button>
                      <Button
                        variant={player.isActive ? 'secondary' : 'primary'}
                        onClick={() => onToggleStatus(player.id)}
                        className="text-xs"
                      >
                        {player.isActive ? 'Pasife Al' : 'Aktif Et'}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => onDelete(player.id)}
                        className="text-xs"
                      >
                        Sil
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};