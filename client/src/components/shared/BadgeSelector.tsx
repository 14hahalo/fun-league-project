import React, { useState } from 'react';
import type { PlayerBadges, Badge } from '../../types/player.types';

const BADGE_DATA: Badge[] = [
  { name: 'Akrobat',          category: 'Bitiriş',    description: 'Düşük yüzdelik şutlarda bile potaya yakın konumda etkin bitirir.' },
  { name: 'Kontr Bitirici',   category: 'Bitiriş',    description: 'Kontr atak durumlarında üst düzey bitiriş yapar.' },
  { name: 'Poster İmzacısı',  category: 'Bitiriş',    description: 'Rakip oyuncular üzerinden sert smaç atabilir.' },
  { name: 'Pro Dokunuş',      category: 'Bitiriş',    description: 'Potaya yakın şutlarda yüksek isabet sağlar.' },
  { name: 'İki El Smaç',      category: 'Bitiriş',    description: 'İki elle yapılan smaçlarda yüksek etkinlik gösterir.' },
  { name: 'Layup Ustası',     category: 'Bitiriş',    description: 'Layup atışlarında son derece başarılı bitirir.' },
  { name: 'Temaslı Bitirici', category: 'Bitiriş',    description: 'Temas altında bile yüksek başarı oranıyla bitirir.' },

  { name: 'Keskin Nişancı',      category: 'Şut', description: 'Açık pozisyonlarda üç sayılık şutlarda yüksek isabet.' },
  { name: 'Al-At',               category: 'Şut', description: 'Pas alır almaz hızlıca şut çekme konusunda üstün.' },
  { name: 'Seri Atıcı',          category: 'Şut', description: 'Üst üste başarılı şutlarda isabet oranı artar.' },
  { name: 'Orta Mesafe Ustası',  category: 'Şut', description: 'Orta mesafe şutlarında son derece etkili.' },
  { name: 'Sıcak El',            category: 'Şut', description: 'Arka arkaya isabet sonrası şut oranı yükselir.' },
  { name: 'Kritik Atıcı',        category: 'Şut', description: 'Kritik anlarda şut başarısı artış gösterir.' },
  { name: 'Stres Altında Atıcı', category: 'Şut', description: 'Baskı altında bile sakin ve isabetli şut çeker.' },

  { name: 'Saha Vizyonu',   category: 'Oyun Kurma', description: 'Sahayı geniş okur ve doğru pas seçimlerini yapar.' },
  { name: 'Hızlı İlk Adım', category: 'Oyun Kurma', description: 'Rakibi geçmede ilk adımda patlayıcı hız sağlar.' },
  { name: 'Asist Ustası',   category: 'Oyun Kurma', description: 'Takım arkadaşlarına atış fırsatı yaratan paslar atar.' },
  { name: 'Zemin Generali', category: 'Oyun Kurma', description: 'Takımın oyununu yönlendirir ve iletişimi güçlendirir.' },
  { name: 'Dur-Git',        category: 'Oyun Kurma', description: 'Ani duruş ve hareket değişiklikleriyle rakibi sarsar.' },
  { name: 'Hız Artırıcı',  category: 'Oyun Kurma', description: 'Yüksek oyun kurma becerisiyle hız avantajı kazanır.' },
  { name: 'Ayak Kıran',    category: 'Oyun Kurma', description: '1\'e 1 durumlarında rakip oyuncunun dengesini bozar.' },

  { name: 'Yıldıran',      category: 'Savunma', description: 'Rakip oyuncuların şut yüzdelerini düşürür.' },
  { name: 'Cep Hırsızı',   category: 'Savunma', description: 'Top çalmada üst düzey etkinlik gösterir.' },
  { name: 'Kelepçe',       category: 'Savunma', description: 'Top taşıyıcıların hareket alanını ciddi ölçüde kısıtlar.' },
  { name: 'Pota Koruyucu', category: 'Savunma', description: 'Potaya yakın bölgede atışları engeller ve blok atar.' },
  { name: 'Tuğla Duvar',   category: 'Savunma', description: 'Ekranlar karşısında güçlü direniş gösterir.' },
  { name: 'Sinek',         category: 'Savunma', description: 'Rakibi sürekli rahatsız eden yorucu savunma yapar.' },
  { name: 'Faul Kartı',    category: 'Savunma', description: 'Hücum faulü almada üst düzey pozisyon alır.' },

  { name: 'Cam Temizleyici',  category: 'Ribaund', description: 'Savunmada üst düzey ribaund alır.' },
  { name: 'Hücum Rıbaundu',  category: 'Ribaund', description: 'Kaçırılan şutlarda ikinci şans pozisyonu yakalar.' },
  { name: 'Ribaund Avcısı',  category: 'Ribaund', description: 'Savunmada pozisyon almaksızın topu kapabilir.' },
  { name: 'Geri Dönüş Ustası', category: 'Ribaund', description: 'Kaçan topları tekrar atışa dönüştürmede yetenekli.' },
  { name: 'Kutu Hakimi',     category: 'Ribaund', description: 'Boyasın içinde güçlü pozisyon alarak ribaund kazanır.' },

  { name: 'Takım Oyuncusu',            category: 'Genel', description: 'Takımın ihtiyaçlarını kendi önüne koyar.' },
  { name: 'Lider',                     category: 'Genel', description: 'Zor anlarda takımı motive eder ve yönlendirir.' },
  { name: 'Tutarlı',                   category: 'Genel', description: 'Her maçta istikrarlı performans sergiler.' },
  { name: 'Kritik Anlarda Performans', category: 'Genel', description: 'Maçın belirleyici anlarında üstün performans gösterir.' },
  { name: 'Yorulmaz',                  category: 'Genel', description: 'Maç boyunca yüksek enerji ve tempo sürdürür.' },
  { name: 'Tecrübeli Oyuncu',          category: 'Genel', description: 'Deneyimiyle takıma değer katıp oyunu sakinleştirir.' },
  { name: 'Çalışkan',                  category: 'Genel', description: 'Görünmeyen katkılarla takımın istatistiklerine destek olur.' },
];

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
  const badges = BADGE_DATA;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ['Bitiriş', 'Şut', 'Oyun Kurma', 'Savunma', 'Ribaund', 'Genel'];

  const handleBadgeSelect = (category: string, badgeName: string) => {
    if (disabled) return;

    const newBadges = { ...selectedBadges };
    const currentBadgeCount = Object.keys(selectedBadges).length;

    if (newBadges[category as keyof PlayerBadges] === badgeName) {
      delete newBadges[category as keyof PlayerBadges];
    } else {
      const hasExistingBadgeInCategory = !!newBadges[category as keyof PlayerBadges];

      if (!hasExistingBadgeInCategory && currentBadgeCount >= 3) {
        return; 
      }

      newBadges[category as keyof PlayerBadges] = badgeName;
    }

    onChange(newBadges);
    setSelectedCategory(null); 
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

      {selectedCategory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden border-2 border-gray-700">
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
