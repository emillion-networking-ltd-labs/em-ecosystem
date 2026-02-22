'use client';

import Spinner from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses = {
  primary:
    'bg-surface-inverse text-content-inverse border border-border-default hover:opacity-90 disabled:bg-surface-primary disabled:text-content-disabled',
  secondary:
    'bg-surface-tertiary text-content-secondary border border-border-default hover:bg-hover disabled:bg-surface-primary disabled:text-content-disabled',
  outline:
    'bg-transparent text-content-primary border border-border-default hover:bg-hover disabled:text-content-disabled',
  danger:
    'bg-transparent text-error border border-error-border hover:bg-error-bg disabled:opacity-50',
};

const sizeClasses = {
  sm: 'px-6 py-2.5 text-caption font-medium rounded-md',
  md: 'px-6 py-2.5 text-body-sm font-medium rounded-md h-10',
  lg: 'px-9 py-[21px] text-body-lg rounded-md h-14',
};

export default function Button({
  variant = 'primary',
  size = 'lg',
  loading = false,
  fullWidth = true,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? <Spinner size={size === 'lg' ? 'md' : 'sm'} /> : children}
    </button>
  );
}
