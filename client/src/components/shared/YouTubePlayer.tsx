import { useState, useRef, useEffect } from 'react';

interface YouTubePlayerProps {
  url: string;
  title?: string;
  className?: string;
  thumbnail?: boolean; // Show thumbnail instead of embed
  autoplay?: boolean; // Autoplay when embedded
  autoFullscreen?: boolean; // Auto fullscreen on mobile
}

export const YouTubePlayer = ({
  url,
  title,
  className = '',
  thumbnail = false,
  autoplay = false,
  autoFullscreen = false
}: YouTubePlayerProps) => {
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto fullscreen on mobile when autoplay is true
  useEffect(() => {
    if (autoFullscreen && autoplay && iframeRef.current) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // Small delay to ensure iframe is loaded
        setTimeout(() => {
          if (iframeRef.current) {
            const iframe = iframeRef.current;
            if (iframe.requestFullscreen) {
              iframe.requestFullscreen().catch(() => {
                // Fullscreen request failed, continue playing normally
              });
            }
          }
        }, 500);
      }
    }
  }, [autoFullscreen, autoplay]);

  // Extract video ID from YouTube URL
  const extractVideoId = (youtubeUrl: string): string | null => {
    try {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
        /(?:youtube\.com\/shorts\/)([^&\n?#]+)/, // YouTube Shorts support
        /^([a-zA-Z0-9_-]{11})$/,
      ];

      for (const pattern of patterns) {
        const match = youtubeUrl.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      return null;
    } catch (err) {
      console.error('Error extracting video ID:', err);
      return null;
    }
  };

  const videoId = extractVideoId(url);

  if (!videoId || error) {
    return (
      <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 text-center border-2 border-gray-700 ${className}`}>
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-gray-400 font-bold text-lg mb-2">
          {error ? 'Video yüklenemedi' : 'Geçersiz YouTube URL'}
        </p>
        <p className="text-sm text-gray-600 break-all">{url}</p>
      </div>
    );
  }

  // Show thumbnail only (for video cards)
  if (thumbnail) {
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    return (
      <div className={`relative w-full h-full ${className}`}>
        <img
          src={thumbnailUrl}
          alt={title || 'Video thumbnail'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to standard quality thumbnail
            const target = e.target as HTMLImageElement;
            target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }}
        />
      </div>
    );
  }

  // Create embed URL for YouTube with optional autoplay and fullscreen params
  const embedUrl = `https://www.youtube.com/embed/${videoId}${autoplay ? '?autoplay=1&mute=0&fs=1&playsinline=0' : '?fs=1'}`;

  return (
    <div className={`relative ${className}`}>
      {/* Responsive container with 16:9 aspect ratio */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title || 'Video'}
          className="absolute top-0 left-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          onError={() => setError(true)}
          style={{
            border: 'none',
          }}
        />
      </div>
      {title && !thumbnail && (
        <div className="mt-3 px-2">
          <p className="text-sm font-bold text-gray-300">{title}</p>
        </div>
      )}
    </div>
  );
};
