import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  bordered?: boolean;
  glow?: 'orange' | 'cyan' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  bordered = true,
  glow = 'none',
  className = '',
  ...props
}) => {
  const glowStyles = {
    orange: 'hover:border-[#FB8205]/40 hover:shadow-lg hover:shadow-[#FB8205]/5',
    cyan: 'hover:border-[#0BE9EF]/40 hover:shadow-lg hover:shadow-[#0BE9EF]/5',
    none: '',
  };

  return (
    <div
      className={`bg-[#0A1428] rounded-2xl ${bordered ? 'border border-white/5' : ''} ${
        interactive ? `transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${glowStyles[glow]}` : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-5 pb-3 flex items-center justify-between border-b border-white/5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`text-base font-semibold text-white tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-5 pt-3 border-t border-white/5 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number; // e.g. +14% or -5%
  changeLabel?: string;
  icon?: React.ReactNode;
  accentColor?: '#FB8205' | '#0BE9EF' | '#10D97F';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeLabel = 'vs hier',
  icon,
  accentColor = '#FB8205',
  onClick,
}) => {
  const isPositive = change !== undefined ? change >= 0 : null;

  return (
    <Card
      interactive={!!onClick}
      onClick={onClick}
      className="p-5 flex flex-col justify-between relative overflow-hidden group"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</span>
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105"
            style={{
              backgroundColor: `${accentColor}15`,
              borderColor: `${accentColor}30`,
              color: accentColor,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
        <div className="flex items-center gap-2 text-xs">
          {change !== undefined && (
            <span
              className={`inline-flex items-center font-semibold ${
                isPositive ? 'text-[#10D97F]' : 'text-rose-400'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {Math.abs(change)}%
            </span>
          )}
          {subtitle ? (
            <span className="text-gray-400">{subtitle}</span>
          ) : (
            <span className="text-gray-400">{changeLabel}</span>
          )}
        </div>
      </div>
    </Card>
  );
};
