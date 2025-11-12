import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TeamType } from '../../types/basketball.types';
import type { CreatePlayerStatsDto } from '../../types/basketball.types';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';

const playerStatsSchema = z.object({
  playerId: z.string().min(1, 'Oyuncu seçimi zorunludur'),
  teamType: z.enum([TeamType.TEAM_A, TeamType.TEAM_B]),
  twoPointAttempts: z.number().min(0, 'Negatif olamaz'),
  twoPointMade: z.number().min(0, 'Negatif olamaz'),
  threePointAttempts: z.number().min(0, 'Negatif olamaz'),
  threePointMade: z.number().min(0, 'Negatif olamaz'),
  defensiveRebounds: z.number().min(0, 'Negatif olamaz'),
  offensiveRebounds: z.number().min(0, 'Negatif olamaz'),
  assists: z.number().min(0, 'Negatif olamaz'),
}).refine((data) => data.twoPointMade <= data.twoPointAttempts, {
  message: '2 sayılık isabetli sayısı denemeden fazla olamaz',
  path: ['twoPointMade'],
}).refine((data) => data.threePointMade <= data.threePointAttempts, {
  message: '3 sayılık isabetli sayısı denemeden fazla olamaz',
  path: ['threePointMade'],
});

type PlayerStatsFormData = z.infer<typeof playerStatsSchema>;

interface PlayerStatsFormProps {
  gameId: string;
  availablePlayers: Array<{ id: string; nickname: string; jerseyNumber?: number }>;
  teamType: TeamType;
  onSubmit: (data: CreatePlayerStatsDto) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<PlayerStatsFormData>;
}

export const PlayerStatsForm: React.FC<PlayerStatsFormProps> = ({
  gameId,
  availablePlayers,
  teamType,
  onSubmit,
  onCancel,
  initialData,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<PlayerStatsFormData>({
    resolver: zodResolver(playerStatsSchema),
    defaultValues: {
      teamType,
      twoPointAttempts: 0,
      twoPointMade: 0,
      threePointAttempts: 0,
      threePointMade: 0,
      defensiveRebounds: 0,
      offensiveRebounds: 0,
      assists: 0,
      ...initialData,
    },
  });

  const twoPointMade = watch('twoPointMade');
  const threePointMade = watch('threePointMade');
  const calculatedPoints = (twoPointMade * 2) + (threePointMade * 3);

  const handleFormSubmit = async (data: PlayerStatsFormData) => {
    try {
      await onSubmit({
        gameId,
        playerId: data.playerId,
        teamType: data.teamType,
        twoPointAttempts: data.twoPointAttempts,
        twoPointMade: data.twoPointMade,
        threePointAttempts: data.threePointAttempts,
        threePointMade: data.threePointMade,
        defensiveRebounds: data.defensiveRebounds,
        offensiveRebounds: data.offensiveRebounds,
        assists: data.assists,
      });
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Oyuncu Bilgileri</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="playerId" className="block text-sm font-medium text-gray-700 mb-1">
              Oyuncu *
            </label>
            <select
              id="playerId"
              {...register('playerId')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Oyuncu Seçin</option>
              {availablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.jerseyNumber ? `#${player.jerseyNumber} - ` : ''}{player.nickname}
                </option>
              ))}
            </select>
            {errors.playerId && (
              <p className="text-red-500 text-xs mt-1">{errors.playerId.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="teamType" className="block text-sm font-medium text-gray-700 mb-1">
              Takım *
            </label>
            <select
              id="teamType"
              {...register('teamType')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value={TeamType.TEAM_A}>Takım A</option>
              <option value={TeamType.TEAM_B}>Takım B</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Şut İstatistikleri</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            label="2P Deneme"
            type="number"
            {...register('twoPointAttempts', { valueAsNumber: true })}
            error={errors.twoPointAttempts?.message}
          />
          <Input
            label="2P İsabet"
            type="number"
            {...register('twoPointMade', { valueAsNumber: true })}
            error={errors.twoPointMade?.message}
          />
          <Input
            label="3P Deneme"
            type="number"
            {...register('threePointAttempts', { valueAsNumber: true })}
            error={errors.threePointAttempts?.message}
          />
          <Input
            label="3P İsabet"
            type="number"
            {...register('threePointMade', { valueAsNumber: true })}
            error={errors.threePointMade?.message}
          />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Diğer İstatistikler</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Input
            label="Savunma Ribaund"
            type="number"
            {...register('defensiveRebounds', { valueAsNumber: true })}
            error={errors.defensiveRebounds?.message}
          />
          <Input
            label="Hücum Ribaund"
            type="number"
            {...register('offensiveRebounds', { valueAsNumber: true })}
            error={errors.offensiveRebounds?.message}
          />
          <Input
            label="Asist"
            type="number"
            {...register('assists', { valueAsNumber: true })}
            error={errors.assists?.message}
          />
        </div>
      </div>

      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Hesaplanan Toplam Puan:</span>{' '}
          <span className="text-2xl font-bold text-orange-600 ml-2">{calculatedPoints}</span>
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} fullWidth>
          {isSubmitting ? 'Kaydediliyor...' : 'İstatistikleri Kaydet'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} fullWidth>
            İptal
          </Button>
        )}
      </div>
    </form>
  );
};
