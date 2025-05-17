import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface StockAllocationChartProps {
  stocks: {
    symbol: string;
    weight: number;
  }[];
}

const StockAllocationChart: React.FC<StockAllocationChartProps> = ({ stocks }) => {
  // Prepare data for the chart
  const chartData = stocks.map(stock => ({
    name: stock.symbol,
    value: stock.weight
  }));
  
  // Sort by weight descending
  chartData.sort((a, b) => b.value - a.value);
  
  // Generate colors for the pie slices
  const COLORS = [
    '#2563eb', // blue
    '#22c55e', // green
    '#f97316', // orange
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f43f5e', // rose
    '#f59e0b', // amber
    '#0ea5e9', // light blue
    '#10b981', // emerald
    '#6366f1', // indigo
    '#ef4444', // red
    '#a855f7', // violet
    '#06b6d4', // cyan
    '#eab308', // yellow
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value}%`} />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          wrapperStyle={{ fontSize: '12px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default StockAllocationChart;