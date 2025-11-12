import { useState } from 'react';
import type { Video } from '../../types/basketball.types';
import { YouTubePlayer } from './YouTubePlayer';

interface VideoGalleryProps {
  videos: Video[];
  title?: string;
  emptyMessage?: string;
}

export const VideoGallery = ({
  videos,
  title = '🎥 Videolar',
  emptyMessage = 'Henüz video eklenmemiş',
}: VideoGalleryProps) => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  if (videos.length === 0) {
    return (
      <div className="relative group p-[2px] rounded-3xl bg-gradient-to-br from-gray-700 to-gray-800">
        <div className="bg-gray-900 rounded-3xl p-12 text-center">
          <div className="text-7xl mb-4">📹</div>
          <p className="text-2xl text-gray-400 font-bold">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 flex items-center gap-3">
          {title}
        </h3>
        <span className="text-sm font-bold text-gray-400 bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
          {videos.length} video
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            onClick={() => setSelectedVideo(video)}
            className="group cursor-pointer relative p-[2px] rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300 transform hover:scale-105"
          >
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden">
              {/* Video Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-purple-900/20 to-pink-900/20 overflow-hidden">
                <YouTubePlayer url={video.youtubeUrl} title={video.title} thumbnail />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-all">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                    <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                {/* Gradient Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-900 to-transparent"></div>
              </div>

              {/* Video Info */}
              <div className="p-5">
                <h4 className="text-lg font-black text-white mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400 transition-all">
                  {video.title}
                </h4>
                {video.description && (
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                    {video.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(video.createdAt).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative max-w-6xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-16 right-0 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-all border border-white/20 group z-10"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video Player */}
            <div className="relative p-[3px] rounded-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 shadow-[0_0_80px_rgba(168,85,247,0.6)]">
              <div className="bg-black rounded-3xl overflow-hidden">
                <YouTubePlayer url={selectedVideo.youtubeUrl} title={selectedVideo.title} autoplay autoFullscreen />

                {/* Video Info Below Player */}
                <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800">
                  <h3 className="text-2xl font-black text-white mb-2">{selectedVideo.title}</h3>
                  {selectedVideo.description && (
                    <p className="text-gray-400 mb-4">{selectedVideo.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(selectedVideo.createdAt).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
