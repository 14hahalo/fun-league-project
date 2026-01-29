import { useState, useRef, useEffect } from 'react';
import type { Video } from '../../types/basketball.types';
import { YouTubePlayer } from '../shared/YouTubePlayer';

interface TopPlaysCarouselProps {
  videos: Video[];
}

export const TopPlaysCarousel = ({ videos }: TopPlaysCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const itemWidth = container.scrollWidth / videos.length;
      container.scrollTo({
        left: itemWidth * currentIndex,
        behavior: 'smooth',
      });
    }
  }, [currentIndex, videos.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-900/20 via-gray-900/40 to-black/60 backdrop-blur-md border-2 border-orange-500/30 shadow-2xl">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-hidden scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="flex-shrink-0 w-full snap-center"
              style={{ scrollSnapAlign: 'center' }}
            >
              <div className="p-4 md:p-8">
                <div className="mb-4 text-center">
                  <h3 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 mb-2">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-sm md:text-base text-gray-400 font-medium">
                      {video.description}
                    </p>
                  )}
                </div>

                <div className="aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl border-2 border-orange-500/50">
                  {index === currentIndex ? (
                    <YouTubePlayer
                      url={video.youtubeUrl}
                      title={video.title}
                      className="w-full h-full"
                    />
                  ) : (
                    <YouTubePlayer
                      url={video.youtubeUrl}
                      title={video.title}
                      className="w-full h-full"
                      thumbnail={true}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {videos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-2 md:p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 z-10 border-2 border-orange-400"
              aria-label="Previous video"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={goToNext}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-2 md:p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 z-10 border-2 border-orange-400"
              aria-label="Next video"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {videos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {videos.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? 'w-8 md:w-10 h-2 md:h-3 bg-gradient-to-r from-orange-400 to-orange-600 shadow-lg shadow-orange-500/50'
                    : 'w-2 md:w-3 h-2 md:h-3 bg-gray-500 hover:bg-gray-400'
                }`}
                aria-label={`Go to video ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-gray-400 font-bold text-sm">
          {currentIndex + 1} / {videos.length}
        </p>
      </div>
    </div>
  );
};
