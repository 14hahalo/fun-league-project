import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Position } from '../../types/player.types';
import type { PlayerBadges, Player, CreatePlayerDto, UpdatePlayerDto } from '../../types/player.types';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { BadgeSelector } from '../shared/BadgeSelector';

const playerSchema = z.object({
  nickname: z.string().min(2, 'Takma ad en az 2 karakter olmalıdır'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  photoUrl: z.string().url('Geçersiz URL formatı').optional().or(z.literal('')),
  jerseyNumber: z.number().min(0).max(99).optional().or(z.literal('') as any),
  position: z.string().optional().or(z.literal('')),
  height: z.number().positive().max(250).optional().or(z.literal('') as any),
  weight: z.number().positive().max(200).optional().or(z.literal('') as any),
  isActive: z.boolean().optional(),
});

type PlayerFormData = z.infer<typeof playerSchema>;

interface PlayerFormProps {
  player?: Player; 
  onSubmit: (data: CreatePlayerDto | UpdatePlayerDto) => Promise<void>;
  onCancel?: () => void;
}

export const PlayerForm = ({ player, onSubmit, onCancel }: PlayerFormProps) => {
  const isEditMode = !!player;
  const [badges, setBadges] = useState<PlayerBadges>(player?.badges || {});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    watch,
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: player ? {
      nickname: player.nickname,
      firstName: player.firstName || '',
      lastName: player.lastName || '',
      photoUrl: player.photoUrl || '',
      jerseyNumber: player.jerseyNumber,
      position: player.position || '',
      height: player.height,
      weight: player.weight,
      isActive: player.isActive,
    } : undefined,
  });

  const photoUrl = watch('photoUrl');

  const handleFormSubmit = async (data: PlayerFormData) => {
    try {
      const cleanedData: CreatePlayerDto | UpdatePlayerDto = {
        nickname: data.nickname,
        photoUrl: data.photoUrl || undefined,
        firstName: data.firstName,
        lastName: data.lastName,
        jerseyNumber: typeof data.jerseyNumber === 'number' ? data.jerseyNumber : undefined,
        position: data.position as any || undefined,
        height: typeof data.height === 'number' ? data.height : undefined,
        weight: typeof data.weight === 'number' ? data.weight : undefined,
        badges: badges,
        ...(isEditMode && { isActive: data.isActive }),
      };

      await onSubmit(cleanedData);
      if (!isEditMode) {
        reset();
        setBadges({});
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err: any) => {
          setError(err.field as any, {
            type: 'manual',
            message: err.message,
          });
        });
      } else {
        setError('root', {
          type: 'manual',
          message: error.response?.data?.message || 'Bir hata oluştu',
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {isEditMode ? 'Oyuncu Düzenle' : 'Yeni Oyuncu Ekle'}
      </h2>

      {errors.root && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {errors.root.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Takma Ad *"
          {...register('nickname')}
          error={errors.nickname?.message}
          placeholder="HCT"
        />

        <Input
          label="Forma Numarası"
          type="number"
          {...register('jerseyNumber', {
            setValueAs: (v) => v === '' ? undefined : parseInt(v, 10)
          })}
          error={errors.jerseyNumber?.message as string}
          placeholder="23"
        />

        <Input
          label="İsim"
          {...register('firstName')}
          error={errors.firstName?.message}
          placeholder="Hasan"
        />

        <Input
          label="Soyisim"
          {...register('lastName')}
          error={errors.lastName?.message}
          placeholder="Can"
        />


        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pozisyon
          </label>
          <select
            {...register('position')}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.position ? 'border-red-500' : 'border-gray-300'
              }`}
          >
            <option value="">Pozisyon Seçin</option>
            {Object.values(Position).map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
          {errors.position && (
            <p className="mt-1 text-sm text-red-500">{errors.position.message}</p>
          )}
        </div>

        <Input
          label="Boy (cm)"
          type="number"
          {...register('height', {
            setValueAs: (v) => v === '' ? undefined : parseFloat(v)
          })}
          error={errors.height?.message as string}
          placeholder="185"
        />

        <Input
          label="Kilo (kg)"
          type="number"
          {...register('weight', {
            setValueAs: (v) => v === '' ? undefined : parseFloat(v)
          })}
          error={errors.weight?.message as string}
          placeholder="80"
        />

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fotoğraf URL
          </label>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="url"
                {...register('photoUrl')}
                placeholder="https://i.ibb.co/xxxxx/photo.jpg"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.photoUrl ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.photoUrl && (
                <p className="mt-1 text-sm text-red-500">{errors.photoUrl.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Direkt resim URL'si girin. ImgBB için: resme sağ tıklayıp "Copy image address" seçin
                (URL https://i.ibb.co/ ile başlamalı)
              </p>
              {photoUrl && photoUrl.includes('ibb.co/') && !photoUrl.includes('i.ibb.co/') && (
                <p className="text-xs text-orange-600 mt-1 font-semibold">
                  Uyarı: Bu bir sayfa URL'si gibi görünüyor. Lütfen direkt resim URL'sini kullanın.
                </p>
              )}
            </div>
            {photoUrl && (
              <div className="w-24 h-24 border-2 border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                <img
                  src={photoUrl}
                  alt="Önizleme"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-red-500 text-xs text-center p-2">Geçersiz URL</div>';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {isEditMode && (
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
              Aktif Oyuncu
            </label>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <BadgeSelector
          selectedBadges={badges}
          onChange={setBadges}
        />
      </div>

      <div className="flex gap-4 mt-6">
        <Button type="submit" disabled={isSubmitting} fullWidth>
          {isSubmitting
            ? isEditMode ? 'Güncelleniyor...' : 'Ekleniyor...'
            : isEditMode ? 'Güncelle' : 'Oyuncu Ekle'}
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