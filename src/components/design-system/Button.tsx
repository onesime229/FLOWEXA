import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'cyan' | 'success' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#020919]';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-[#FB8205] hover:bg-[#E06900] text-white shadow-lg shadow-[#FB8205]/20 focus:ring-[#FB8205] active:scale-[0.98]',
    secondary: 'bg-[#0A1428] hover:bg-[#121F3A] text-white border border-white/10 focus:ring-white/20 active:scale-[0.98]',
    cyan: 'bg-[#0BE9EF] hover:bg-[#00D2D8] text-[#020919] font-semibold shadow-lg shadow-[#0BE9EF]/20 focus:ring-[#0BE9EF] active:scale-[0.98]',
    success: 'bg-[#10D97F] hover:bg-[#0EB86B] text-[#020919] font-semibold shadow-lg shadow-[#10D97F]/20 focus:ring-[#10D97F] active:scale-[0.98]',
    outline: 'bg-transparent hover:bg-white/5 text-white border border-white/20 focus:ring-white/30',
    ghost: 'bg-transparent hover:bg-white/5 text-gray-300 hover:text-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
  };

  const sizeStyle = sizeStyles[size] || sizeStyles.md;
  const variantStyle = variantStyles[variant] || variantStyles.primary;

  return (
    <button
      className={`${baseStyles} ${sizeStyle} ${variantStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
