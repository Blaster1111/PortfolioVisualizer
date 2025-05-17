import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface DrawdownChartProps {
  data: { date: string; drawdown: number }[];
}

const DrawdownChart: React.FC<DrawdownChartProps> = ({ data }) => {
  // Format the data for the chart
  const chartData = data.map(item => ({
    date: item.date,
    drawdown: item.drawdown * 100 // Convert to percentage
  }));
  
  // Find the maximum drawdown (will be negative)
  const maxDrawdown = Math.min(...chartData.map(item => item.drawdown));
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis 
          dataKey="date" 
          tickFormatter={(tick) => {
            const date = new Date(tick);
            return `${date.getMonth() + 1}/${date.getFullYear().toString().substr(2)}`;
          }}
          tick={{ fontSize: 12 }}
          minTickGap={30}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          domain={[Math.min(maxDrawdown * 1.1, -5), 0]} // Leave some space below max drawdown
          tickFormatter={(tick) => `${tick.toFixed(0)}%`}
        />
        <Tooltip 
          formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Area 
          type="monotone" 
          dataKey="drawdown" 
          stroke="#ef4444" 
          fill="#fee2e2" 
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default DrawdownChart;