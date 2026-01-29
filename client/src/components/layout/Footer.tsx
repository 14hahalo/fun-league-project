import { useState, useEffect } from 'react';

export const Footer = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-4 rounded-full shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 z-50 group animate-bounce-slow"
          aria-label="Scroll to top"
        >
          <svg
            className="w-6 h-6 transform group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}

      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-16">
        <div className="border-t border-gray-800">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-sm text-gray-400">
                © 2026 enBallerZ Basketbol. Tüm hakları saklıdır.
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center space-x-2">
                  <span>"Tutkuyla ve şevkle geliştirilmiştir 💻🏀" </span>
                  <a
                    href="https://linkedin.com/in/hct14"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-1 py-1 rounded-lg transition-all flex items-center justify-center space-x-2 group hover:scale-105 hover:shadow-lg"
                  >  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    aria-label="HcT"
                  >
                      <text
                        x="50%"
                        y="57%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontFamily="Helvetica, Arial, 'Segoe UI', Roboto, sans-serif"
                        fontWeight="700"
                        fontSize="10.8"
                        fill="#FFFFFF"
                      >
                        HcT
                      </text>
                    </svg></a>
                  <span>tarafından,evet tarafından</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer >
    </>
  );
};
