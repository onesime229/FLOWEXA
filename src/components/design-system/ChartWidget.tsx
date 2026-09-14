import React from 'react';

export interface ChartDataPoint {
  label: string;
  value: number;
  formattedValue?: string;
}

export interface BarChartWidgetProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  color?: string; // hex
  height?: number;
}

export const BarChartWidget: React.FC<BarChartWidgetProps> = ({
  title,
  subtitle,
  data,
  color = '#FB8205',
  height = 160,
}) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-5 text-left">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white tracking-tight">{title}</h4>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-end justify-between gap-2 pt-4" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const heightPercent = Math.round((item.value / maxValue) * 100);
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <div className="relative w-full flex items-end justify-center h-full">
                {/* Tooltip on hover */}
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#020919] border border-white/20 px-2 py-0.5 rounded text-[10px] text-white whitespace-nowrap pointer-events-none z-10 shadow-lg">
                  {item.formattedValue || item.value}
                </div>

                {/* Bar */}
                <div
                  className="w-full max-w-[28px] rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                  style={{
                    height: `${Math.max(heightPercent, 4)}%`,
                    backgroundColor: color,
                    opacity: 0.85,
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-400 font-mono truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface AreaTrendWidgetProps {
  title: string;
  total: string;
  changeBadge?: string;
  data: number[]; // e.g. 7 points
  strokeColor?: string;
}

export const AreaTrendWidget: React.FC<AreaTrendWidgetProps> = ({
  title,
  total,
  changeBadge,
  data,
  strokeColor = '#0BE9EF',
}) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 240;
  const height = 50;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 10) - 5;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-5 text-left flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase font-medium">{title}</span>
        {changeBadge && (
          <span className="text-[10px] font-bold text-[#10D97F] bg-[#10D97F]/10 px-2 py-0.5 rounded-full border border-[#10D97F]/20">
            {changeBadge}
          </span>
        )}
      </div>

      <div className="text-xl font-bold text-white mb-3">{total}</div>

      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12 overflow-visible">
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    </div>
  );
};
