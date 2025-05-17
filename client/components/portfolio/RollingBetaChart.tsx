import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  TooltipProps,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface RollingBetaChartProps {
  data: { date: string; beta_30d: number | null; beta_90d: number | null }[];
}

const RollingBetaChart: React.FC<RollingBetaChartProps> = ({ data }) => {
  // Format the dates and prepare data
  const chartData = data.map(point => ({
    date: new Date(point.date).toLocaleDateString(),
    beta_30d: point.beta_30d,
    beta_90d: point.beta_90d,
  }));

  const customTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={`tooltip-${index}`} style={{ color: entry.color }}>
              {entry.name === 'beta_30d' ? '30-day Beta: ' : '90-day Beta: '}
              {entry.value !== null ? (entry.value as number).toFixed(2) : 'N/A'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Get min and max beta values to set Y axis domain with some padding
  const allBetas = chartData.flatMap(item =>
    [item.beta_30d, item.beta_90d].filter(
      val => val !== null && val !== undefined
    ) as number[]
  );

  const minBeta = Math.min(...allBetas) * 1.1;
  const maxBeta = Math.max(...allBetas) * 1.1;

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-full">
        No beta data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis
          domain={[Math.min(minBeta, 0), Math.max(maxBeta, 2)]}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={customTooltip} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          formatter={(value: string) =>
            value === 'beta_30d' ? '30-day Beta' : '90-day Beta'
          }
        />
        <ReferenceLine y={1} stroke="#64748b" strokeDasharray="3 3" />
        <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />

        <Line
          type="monotone"
          dataKey="beta_30d"
          name="beta_30d"
          stroke="#f97316"
          dot={false}
          strokeWidth={2}
          connectNulls
        />

        <Line
          type="monotone"
          dataKey="beta_90d"
          name="beta_90d"
          stroke="#2563eb"
          dot={false}
          strokeWidth={2}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RollingBetaChart;
