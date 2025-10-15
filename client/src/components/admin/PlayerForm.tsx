import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Position } from '../../types/player.types';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';

// Zod validation schema
const playerSchema = z.object({
  nickname: z.string().min(2, 'Takma ad en az 2 karakter olmalıdır'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Geçersiz email formatı').optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  photoUrl: z.string().url('Geçersiz URL formatı').optional().or(z.literal('')),
  jerseyNumber: z.number().min(0).max(99).optional().or(z.literal('')),
  position: z.nativeEnum(Position).optional().or(z.literal('')),
  height: z.number().positive().max(250).optional().or(z.literal('')),
  weight: z.number().positive().max(200).optional().or(z.literal('')),
});

type PlayerFormData = z.infer<typeof playerSchema>;

interface PlayerFormProps {
  onSubmit: (data: PlayerFormData) => Promise<void>;
  onCancel?: () => void;
}

export const PlayerForm = ({ onSubmit, onCancel }: PlayerFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
  });

  const handleFormSubmit = async (data: PlayerFormData) => {
    try {
      // Boş stringleri undefined'a çevir
      const cleanedData = {
        ...data,
        email: data.email || undefined,
        phoneNumber: data.phoneNumber || undefined,
        photoUrl: data.photoUrl || undefined,
        jerseyNumber: data.jerseyNumber || undefined,
        position: data.position || undefined,
        height: data.height || undefined,
        weight: data.weight || undefined,
      };
      
      await onSubmit(cleanedData);
      reset();
    } catch (error: any) {
      // Backend'den gelen hataları göster
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
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Yeni Oyuncu Ekle</h2>

      {/* Root hata mesajı */}
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
          error={errors.jerseyNumber?.message}
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

        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="hasan@example.com"
        />

        <Input
          label="Telefon"
          {...register('phoneNumber')}
          error={errors.phoneNumber?.message}
          placeholder="05XX XXX XX XX"
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pozisyon
          </label>
          <select
            {...register('position')}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.position ? 'border-red-500' : 'border-gray-300'
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
          error={errors.height?.message}
          placeholder="185"
        />

        <Input
          label="Kilo (kg)"
          type="number"
          {...register('weight', { 
            setValueAs: (v) => v === '' ? undefined : parseFloat(v) 
          })}
          error={errors.weight?.message}
          placeholder="80"
        />

        <Input
          label="Fotoğraf URL"
          {...register('photoUrl')}
          error={errors.photoUrl?.message}
          placeholder="https://example.com/photo.jpg"
        />
      </div>

      <div className="flex gap-4 mt-6">
        <Button type="submit" disabled={isSubmitting} fullWidth>
          {isSubmitting ? 'Ekleniyor...' : 'Oyuncu Ekle'}
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