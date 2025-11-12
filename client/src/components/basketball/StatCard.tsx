import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'highlight' | 'success' | 'warning';
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  variant = 'default',
  icon
}) => {
  const variantClasses = {
    default: 'bg-white border-gray-200',
    highlight: 'bg-orange-50 border-orange-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  const valueColorClasses = {
    default: 'text-gray-900',
    highlight: 'text-orange-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
  };

  return (
    <div className={`p-4 rounded-lg border ${variantClasses[variant]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${valueColorClasses[variant]}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="ml-2 text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
