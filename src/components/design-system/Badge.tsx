import React from 'react';

export type BadgeVariant =
  | 'orange'
  | 'cyan'
  | 'success'
  | 'danger'
  | 'neutral'
  | 'warning'
  | 'primary'
  | 'default'
  | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant | string;
  dot?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  dot = false,
  className = '',
  ...props
}) => {
  const variantStyles: Record<string, { container: string; dot: string }> = {
    orange: {
      container: 'bg-[#FB8205]/10 text-[#FB8205] border border-[#FB8205]/20',
      dot: 'bg-[#FB8205]',
    },
    cyan: {
      container: 'bg-[#0BE9EF]/10 text-[#0BE9EF] border border-[#0BE9EF]/20',
      dot: 'bg-[#0BE9EF]',
    },
    primary: {
      container: 'bg-[#0BE9EF]/10 text-[#0BE9EF] border border-[#0BE9EF]/20',
      dot: 'bg-[#0BE9EF]',
    },
    success: {
      container: 'bg-[#10D97F]/10 text-[#10D97F] border border-[#10D97F]/20',
      dot: 'bg-[#10D97F]',
    },
    warning: {
      container: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      dot: 'bg-amber-400',
    },
    danger: {
      container: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      dot: 'bg-rose-500',
    },
    info: {
      container: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
      dot: 'bg-sky-400',
    },
    default: {
      container: 'bg-white/5 text-gray-300 border border-white/10',
      dot: 'bg-gray-400',
    },
    neutral: {
      container: 'bg-white/5 text-gray-300 border border-white/10',
      dot: 'bg-gray-400',
    },
  };

  const currentStyle = (variant && variantStyles[variant]) || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${currentStyle.container} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentStyle.dot}`} />}
      {children}
    </span>
  );
};
