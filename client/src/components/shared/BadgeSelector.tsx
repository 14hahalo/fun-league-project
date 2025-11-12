import React, { useState, useEffect } from 'react';
import type { PlayerBadges, Badge } from '../../types/player.types';

interface BadgeSelectorProps {
  selectedBadges: PlayerBadges;
  onChange: (badges: PlayerBadges) => void;
  disabled?: boolean;
}

export const BadgeSelector: React.FC<BadgeSelectorProps> = ({
  selectedBadges,
  onChange,
  disabled = false,
}) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const loadBadges = async () => {
      try {
        const response = await fetch('/data/player-badges.json');
        const data = await response.json();
        setBadges(data);
      } catch (error) {
        console.error('Failed to load badges:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBadges();
  }, []);

  if (loading) {
    return <div className="text-gray-400">Loading badges...</div>;
  }

  const categories = ['Bitiriş', 'Şut', 'Oyun Kurma', 'Savunma', 'Ribaund', 'Genel'];

  const handleBadgeSelect = (category: string, badgeName: string) => {
    if (disabled) return;

    const newBadges = { ...selectedBadges };
    const currentBadgeCount = Object.keys(selectedBadges).length;

    // Toggle: if same badge is clicked, unselect it
    if (newBadges[category as keyof PlayerBadges] === badgeName) {
      delete newBadges[category as keyof PlayerBadges];
    } else {
      // Check if already has a badge in this category
      const hasExistingBadgeInCategory = !!newBadges[category as keyof PlayerBadges];

      // If trying to add a new badge (not replacing) and already at max (3), prevent it
      if (!hasExistingBadgeInCategory && currentBadgeCount >= 3) {
        return; // Don't allow more than 3 total badges
      }

      newBadges[category as keyof PlayerBadges] = badgeName;
    }

    onChange(newBadges);
    setSelectedCategory(null); // Close modal after selection
  };

  const categoryColors: Record<string, { border: string; bg: string; text: string; selected: string; hover: string }> = {
    'Bitiriş': {
      border: 'border-red-500',
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      selected: 'bg-red-500/30 border-red-400',
      hover: 'hover:border-red-400',
    },
    'Şut': {
      border: 'border-green-500',
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      selected: 'bg-green-500/30 border-green-400',
      hover: 'hover:border-green-400',
    },
    'Oyun Kurma': {
      border: 'border-blue-500',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      selected: 'bg-blue-500/30 border-blue-400',
      hover: 'hover:border-blue-400',
    },
    'Savunma': {
      border: 'border-purple-500',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      selected: 'bg-purple-500/30 border-purple-400',
      hover: 'hover:border-purple-400',
    },
    'Ribaund': {
      border: 'border-orange-500',
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      selected: 'bg-orange-500/30 border-orange-400',
      hover: 'hover:border-orange-400',
    },
    'Genel': {
      border: 'border-cyan-500',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      selected: 'bg-cyan-500/30 border-cyan-400',
      hover: 'hover:border-cyan-400',
    },
  };

  const selectedCount = Object.keys(selectedBadges).length;
  const maxBadges = 3;
  const isAtLimit = selectedCount >= maxBadges;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-white">🏆 Oyuncu Rozetleri</h3>
        <span className={`text-sm font-semibold ${isAtLimit ? 'text-orange-400' : 'text-gray-400'}`}>
          {selectedCount}/{maxBadges} seçildi
          {isAtLimit && ' (Maks)'}
        </span>
      </div>

      {/* 2x3 Grid of Categories */}
      <div className="grid grid-cols-2 gap-3">
        {categories.map((category) => {
          const selectedBadge = selectedBadges[category as keyof PlayerBadges];
          const colors = categoryColors[category];
          const hasExistingBadgeInCategory = !!selectedBadge;
          const canSelect = !isAtLimit || hasExistingBadgeInCategory;

          return (
            <button
              key={category}
              type="button"
              onClick={() => !disabled && canSelect && setSelectedCategory(category)}
              disabled={disabled || !canSelect}
              className={`border-2 rounded-lg p-3 transition-all text-left ${
                selectedBadge
                  ? `${colors.selected}`
                  : `${colors.border} ${colors.bg} ${!disabled && canSelect ? colors.hover : ''}`
              } ${disabled || !canSelect ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
            >
              <div className="font-bold text-sm mb-1 ${colors.text}">{category}</div>
              {selectedBadge ? (
                <div className="text-xs text-gray-300 truncate">{selectedBadge}</div>
              ) : (
                <div className="text-xs text-gray-500">Rozet seç...</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Badge Selection Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden border-2 border-gray-700">
            {/* Header */}
            <div className={`px-4 py-3 flex justify-between items-center ${categoryColors[selectedCategory].bg} border-b-2 ${categoryColors[selectedCategory].border}`}>
              <h3 className={`font-bold text-lg ${categoryColors[selectedCategory].text}`}>
                {selectedCategory} Rozetleri
              </h3>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Badge List */}
            <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(80vh-4rem)]">
              {badges
                .filter((b) => b.category === selectedCategory)
                .map((badge) => {
                  const isSelected = selectedBadges[selectedCategory as keyof PlayerBadges] === badge.name;
                  const colors = categoryColors[selectedCategory];

                  return (
                    <button
                      key={badge.name}
                      type="button"
                      onClick={() => handleBadgeSelect(selectedCategory, badge.name)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? colors.selected
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSelected
                              ? `${colors.border} ${colors.bg}`
                              : 'border-gray-600'
                          }`}
                        >
                          {isSelected && (
                            <span className={`text-xs ${colors.text}`}>✓</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className={`font-bold ${isSelected ? colors.text : 'text-white'}`}>
                            {badge.name}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {badge.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {!disabled && (
        <div className="text-xs text-gray-400 italic">
          💡 Maksimum 3 rozet seçebilirsiniz (her kategoriden en fazla 1)
        </div>
      )}
    </div>
  );
};
