import { useState } from 'react';
import type { Player } from '../../types/player.types';
import type { CreateVideoDto } from '../../types/basketball.types';
import { YouTubePlayer } from '../shared/YouTubePlayer';

interface VideoUploadFormProps {
  gameId: string;
  availablePlayers: Player[];
  onAddVideo: (video: CreateVideoDto) => void;
  onRemoveVideo?: (index: number) => void;
  videos: CreateVideoDto[];
}

export const VideoUploadForm = ({
  gameId,
  availablePlayers,
  onAddVideo,
  onRemoveVideo,
  videos,
}: VideoUploadFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !youtubeUrl.trim()) {
      alert('Lütfen video başlığı ve YouTube URL\'sini girin');
      return;
    }

    const newVideo: CreateVideoDto = {
      gameId,
      title: title.trim(),
      description: description.trim() || undefined,
      youtubeUrl: youtubeUrl.trim(),
      playerIds: selectedPlayerIds,
    };

    onAddVideo(newVideo);

    // Reset form
    setTitle('');
    setDescription('');
    setYoutubeUrl('');
    setSelectedPlayerIds([]);
    setShowPreview(false);
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🎥 Yeni Video Ekle</h3>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Video Başlığı *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Örn: Muhteşem 3 sayılık atışlar"
            required
          />
        </div>

        {/* YouTube URL */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            YouTube URL *
          </label>
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="https://www.youtube.com/watch?v=..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            YouTube'dan video paylaşım linkini buraya yapıştırın
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Açıklama (Opsiyonel)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Video hakkında kısa bir açıklama..."
          />
        </div>

        {/* Player Tags */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Oyuncu Etiketleri (Videoda hangi oyuncular var?)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-2 border border-gray-200 rounded-lg">
            {availablePlayers.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => handleTogglePlayer(player.id)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedPlayerIds.includes(player.id)
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                #{player.jerseyNumber} {player.nickname}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {selectedPlayerIds.length} oyuncu seçildi
          </p>
        </div>

        {/* Preview Toggle */}
        {youtubeUrl && (
          <div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm text-orange-600 hover:text-orange-700 font-semibold"
            >
              {showPreview ? '🙈 Önizlemeyi Gizle' : '👁️ Önizleme Göster'}
            </button>
          </div>
        )}

        {/* Preview */}
        {showPreview && youtubeUrl && (
          <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
            <p className="text-sm font-semibold text-gray-700 mb-2">Önizleme:</p>
            <YouTubePlayer url={youtubeUrl} title={title || 'Video Önizleme'} />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
        >
          ➕ Video Ekle
        </button>
      </form>

      {/* Added Videos List */}
      {videos.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            📹 Eklenen Videolar ({videos.length})
          </h3>
          <div className="space-y-4">
            {videos.map((video, index) => {
              const taggedPlayers = availablePlayers.filter((p) =>
                video.playerIds.includes(p.id)
              );

              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{video.title}</h4>
                      {video.description && (
                        <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2 break-all">{video.youtubeUrl}</p>
                      {taggedPlayers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {taggedPlayers.map((player) => (
                            <span
                              key={player.id}
                              className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded"
                            >
                              #{player.jerseyNumber} {player.nickname}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {onRemoveVideo && (
                      <button
                        type="button"
                        onClick={() => onRemoveVideo(index)}
                        className="ml-4 text-red-500 hover:text-red-700 font-bold text-xl"
                        title="Videoyu Kaldır"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
