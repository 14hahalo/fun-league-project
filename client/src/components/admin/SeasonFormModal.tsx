import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Season, CreateSeasonDto, UpdateSeasonDto } from '../../types/season.types';
import { Button } from '../shared/Button';

const seasonSchema = z.object({
  name: z.string().min(2, 'Sezon adı en az 2 karakter olmalıdır').max(50),
  beginDate: z.string().min(1, 'Başlangıç tarihi zorunludur'),
  finishDate: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
}).refine((data) => {
  if (data.finishDate && data.finishDate !== '') {
    const begin = new Date(data.beginDate);
    const finish = new Date(data.finishDate);
    return finish > begin;
  }
  return true;
}, {
  message: "Bitiş tarihi başlangıç tarihinden sonra olmalıdır",
  path: ["finishDate"],
});

type SeasonFormData = z.infer<typeof seasonSchema>;

interface SeasonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  season?: Season;
  onSubmit: (data: CreateSeasonDto | UpdateSeasonDto) => Promise<void>;
}

export const SeasonFormModal = ({ isOpen, onClose, season, onSubmit }: SeasonFormModalProps) => {
  const isEditMode = !!season;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SeasonFormData>({
    resolver: zodResolver(seasonSchema),
    defaultValues: season ? {
      name: season.name,
      beginDate: season.beginDate.toString().split('T')[0],
      finishDate: season.finishDate ? season.finishDate.toString().split('T')[0] : '',
      isActive: season.isActive,
    } : {
      name: '',
      beginDate: '',
      finishDate: '',
      isActive: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (season) {
        reset({
          name: season.name,
          beginDate: new Date(season.beginDate).toISOString().split('T')[0],
          finishDate: season.finishDate ? new Date(season.finishDate).toISOString().split('T')[0] : '',
          isActive: season.isActive,
        });
      } else {
        reset({
          name: '',
          beginDate: '',
          finishDate: '',
          isActive: false,
        });
      }
    }
  }, [season, isOpen, reset]);

  const handleFormSubmit = async (data: SeasonFormData) => {
    try {
      const cleanedData: CreateSeasonDto | UpdateSeasonDto = {
        name: data.name,
        beginDate: new Date(data.beginDate),
        finishDate: data.finishDate ? new Date(data.finishDate) : null,
        isActive: data.isActive,
      };

      await onSubmit(cleanedData);
      reset();
      onClose();
    } catch (error: any) {
      console.error('Form submission error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto border border-orange-500/30">
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-t-lg">
          <h2 className="text-xl font-bold text-white">
            {isEditMode ? 'Sezon Düzenle' : 'Yeni Sezon Ekle'}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Sezon Adı *
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="25-26"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Başlangıç Tarihi *
            </label>
            <input
              {...register('beginDate')}
              type="date"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            {errors.beginDate && (
              <p className="mt-1 text-sm text-red-400">{errors.beginDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Bitiş Tarihi
            </label>
            <input
              {...register('finishDate')}
              type="date"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            {errors.finishDate && (
              <p className="mt-1 text-sm text-red-400">{errors.finishDate.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              {...register('isActive')}
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-700 rounded focus:ring-orange-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-300">
              Aktif Sezon
            </label>
          </div>

          <div className="sticky bottom-0 bg-gray-900 pt-4 flex justify-end space-x-2">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
