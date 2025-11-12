import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Position } from '../types/player.types';
import type { PlayerBadges } from '../types/player.types';
import { BadgeSelector } from '../components/shared/BadgeSelector';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nickname: '',
    firstName: '',
    lastName: '',
    jerseyNumber: undefined as number | undefined,
    photoUrl: '',
    position: '' as Position | '',
    height: undefined as number | undefined,
    badges: {} as PlayerBadges,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        jerseyNumber: user.jerseyNumber,
        photoUrl: user.photoUrl || '',
        position: (user.position as Position) || '',
        height: user.height,
        badges: user.badges || {},
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === 'jerseyNumber' || name === 'height') ? (value ? parseInt(value) : undefined) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const accessToken = sessionStorage.getItem('accessToken');
      const submitData = {
        ...formData,
        position: formData.position || undefined,
      };

      await axios.put(
        `${API_BASE_URL}/players/${user?.id}`,
        submitData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const updatedUser = {
        ...user,
        ...submitData,
      };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccess('Profiliniz başarıyla güncellendi!');

      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Profil güncellenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-12 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-black`}>
      <div className="max-w-2xl mx-auto">
        <div className={`rounded-2xl shadow-2xl p-8 bg-gray-800/50 backdrop-blur-md border border-orange-500/20`}>
          <div className="mb-8">
            <h1 className={`text-4xl font-bold mb-2 text-white`}>Oyuncu Kartım</h1>
            <p className="text-gray-300">Oyuncu kartınızdaki bilgileri buradan düzenleyebilirsiniz</p>
          </div>

          {error && (
            <div className={`border px-4 py-3 rounded-lg mb-6 bg-red-500/20 border-red-500 text-red-200`}>
              {error}
            </div>
          )}

          {success && (
            <div className={`border px-4 py-3 rounded-lg mb-6 bg-green-500/20 border-green-500 text-green-200`}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={`block text-sm font-semibold mb-2 text-gray-300`} htmlFor="nickname">
                  Lakap *
                </label>
                <input
                  id="nickname"
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-700 border-gray-600 text-white placeholder-gray-400`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 text-gray-300`} htmlFor="firstName">
                  İsim
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-700 border-gray-600 text-white placeholder-gray-400`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 text-gray-300`} htmlFor="lastName">
                  Soyisim
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-700 border-gray-600 text-white placeholder-gray-400`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={`block text-sm font-semibold mb-2 text-gray-300`} htmlFor="jerseyNumber">
                  Forma Numarası
                </label>
                <input
                  id="jerseyNumber"
                  type="number"
                  name="jerseyNumber"
                  value={formData.jerseyNumber || ''}
                  onChange={handleChange}
                  min="0"
                  max="99"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-700 border-gray-600 text-white placeholder-gray-400`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 text-gray-300`} htmlFor="position">
                  Pozisyon
                </label>
                <select
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-700 border-gray-600 text-white placeholder-gray-400`}
                >
                  <option value="">Pozisyon Seçin</option>
                  {Object.values(Position).map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 text-gray-300`} htmlFor="height">
                  Boy (cm)
                </label>
                <input
                  id="height"
                  type="number"
                  name="height"
                  value={formData.height || ''}
                  onChange={handleChange}
                  min="100"
                  max="250"
                  placeholder="ör. 185"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-700 border-gray-600 text-white placeholder-gray-400`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 text-gray-300`} htmlFor="photoUrl">
                Fotoğraf URL
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    id="photoUrl"
                    type="url"
                    name="photoUrl"
                    value={formData.photoUrl}
                    onChange={handleChange}
                    placeholder="https://i.ibb.co/xxxxx/photo.jpg"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-700 border-gray-600 text-white placeholder-gray-400`}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Fotoğraf koymak için internette bulunan bir fotoğrafın URL'ini koymanız gerekmekte. Fotoğrafınıza sağ tıklayarak adresini kopyala seçeneğini tıklayıp buraya yapıştırın
                  </p>
                  {formData.photoUrl && formData.photoUrl.includes('ibb.co/') && !formData.photoUrl.includes('i.ibb.co/') && (
                    <p className="text-xs text-orange-600 mt-1 font-semibold">
                      Dikkat, sayfanın adresini kopyaladınız, lütfen fotoğrafın adresini kopyalayın.
                    </p>
                  )}
                </div>
                {formData.photoUrl && (
                  <div className="w-24 h-24 border-2 border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                    <img
                      src={formData.photoUrl}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-red-500 text-xs text-center p-2">Invalid URL</div>';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Badge Selector */}
            <div className="pt-6 border-t border-gray-200">
              <BadgeSelector
                selectedBadges={formData.badges}
                onChange={(badges) => setFormData((prev) => ({ ...prev, badges }))}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Kaydediliyor' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>Profil tipi:</strong> {user?.role}
              </p>
              <p className="text-xs text-gray-500 mt-4">
                Değişiklik talebinizi sayfa yöneticinize bildirin
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
