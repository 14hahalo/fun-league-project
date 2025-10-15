import { useState } from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { PlayerForm } from '../components/admin/PlayerForm';
import { PlayerList } from '../components/admin/PlayerList';
import { Loading } from '../components/shared/Loading';
import type { CreatePlayerDto } from '../types/player.types';

export const AdminPage = () => {
  const { players, loading, error, createPlayer, deletePlayer } = usePlayers();
  const [showForm, setShowForm] = useState(false);

  const handleCreatePlayer = async (data: CreatePlayerDto) => {
    await createPlayer(data);
    setShowForm(false);
  };

  const handleDeletePlayer = async (id: string) => {
    if (window.confirm('Bu oyuncuyu silmek istediğinize emin misiniz?')) {
      await deletePlayer(id);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-800">Admin Panel</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {showForm ? 'Formu Kapat' : '+ Yeni Oyuncu Ekle'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <PlayerForm
          onSubmit={handleCreatePlayer}
          onCancel={() => setShowForm(false)}
        />
      )}

      <PlayerList players={players} onDelete={handleDeletePlayer} />
    </div>
  );
};