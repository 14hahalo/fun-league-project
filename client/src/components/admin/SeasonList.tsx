import type { Season } from '../../types/season.types';
import { Button } from '../shared/Button';

interface SeasonListProps {
  seasons: Season[];
  onEdit: (season: Season) => void;
  onDelete: (id: string) => Promise<void>;
}

export const SeasonList = ({ seasons, onEdit, onDelete }: SeasonListProps) => {
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-orange-600 text-white">
        <h2 className="text-2xl font-bold">Sezon Listesi ({seasons.length})</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Sezon Adı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Başlangıç Tarihi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Bitiş Tarihi
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
            {seasons.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Henüz sezon eklenmemiş
                </td>
              </tr>
            ) : (
              seasons.map((season) => (
                <tr key={season.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {season.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {formatDate(season.beginDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {formatDate(season.finishDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        season.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {season.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      variant="primary"
                      onClick={() => onEdit(season)}
                      className="text-orange-600 hover:text-orange-900"
                    >
                      Düzenle
                    </Button>
                    <Button
                      variant="danger"
                      onClick={async () => {
                        if (season.isActive) {
                          alert('Aktif sezon silinemez. Önce pasif hale getirin.');
                          return;
                        }
                        if (window.confirm(`"${season.name}" sezonunu silmek istediğinizden emin misiniz?`)) {
                          try {
                            await onDelete(season.id);
                          } catch (error: any) {
                            alert(error.message || 'Sezon silinirken bir hata oluştu');
                          }
                        }
                      }}
                      disabled={season.isActive}
                    >
                      Sil
                    </Button>
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
