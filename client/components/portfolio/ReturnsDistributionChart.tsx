import React from 'react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

interface ReturnsDistributionChartProps {
  data: { date: string; return: number }[];
}

const ReturnsDistributionChart: React.FC<ReturnsDistributionChartProps> = ({ data }) => {
  const generateHistogram = () => {
    const returns = data.map(item => item.return * 100);

    const binSize = 0.5;
    const minReturn = Math.floor(Math.min(...returns) - 1);
    const maxReturn = Math.ceil(Math.max(...returns) + 1);

    const bins: { range: string; count: number; isPositive: boolean }[] = [];

    for (let i = minReturn; i < maxReturn; i += binSize) {
      const lowerBound = i;
      const upperBound = i + binSize;
      const binLabel = `${lowerBound.toFixed(1)}%`;

      const count = returns.filter(ret => ret >= lowerBound && ret < upperBound).length;

      bins.push({
        range: binLabel,
        count,
        isPositive: lowerBound >= 0
      });
    }

    return bins;
  };

  const histogramData = generateHistogram();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={histogramData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
        <XAxis 
          dataKey="range" 
          tick={{ fontSize: 10 }}
          interval={Math.floor(histogramData.length / 15)} 
        />
        <YAxis 
          tick={{ fontSize: 10 }}
          label={{ 
            value: 'Frequency', 
            angle: -90, 
            position: 'insideLeft',
            style: { fontSize: 12, textAnchor: 'middle' } 
          }}
        />
        <Tooltip 
          formatter={(value: number) => [`${value} days`, 'Frequency']}
          labelFormatter={(label) => `Return: ${label}`}
        />
        <ReferenceLine x="0.0%" stroke="#888" />
        <Bar dataKey="count" name="Frequency">
          {
            histogramData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.isPositive ? '#22c55e' : '#ef4444'} />
            ))
          }
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ReturnsDistributionChart;