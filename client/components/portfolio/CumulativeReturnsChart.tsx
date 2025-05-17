import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface CumulativeReturnsChartProps {
  data: {
    dates: string[];
    portfolio: number[];
    stocks: Record<string, number[]>;
    benchmark?: {
      ticker: string;
      values: number[];
    };
  };
}

const CumulativeReturnsChart: React.FC<CumulativeReturnsChartProps> = ({ data }) => {
  // Transform the data into the format expected by Recharts
  const chartData = data.dates.map((date, index) => {
    const dataPoint: any = { date };
    
    // Add portfolio value
    dataPoint.Portfolio = data.portfolio[index];
    
    // Add benchmark value if available
    if (data.benchmark) {
      dataPoint[data.benchmark.ticker] = data.benchmark.values[index];
    }
    
    // Add values for individual stocks
    Object.entries(data.stocks).forEach(([ticker, values]) => {
      dataPoint[ticker] = values[index];
    });
    
    return dataPoint;
  });

  // Generate colors for the lines
  const getLineColor = (index: number) => {
    const colors = [
      '#2563eb', // Primary blue for portfolio
      '#22c55e', // Green
      '#f97316', // Orange
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#14b8a6', // Teal
      '#f43f5e', // Rose
      '#f59e0b', // Amber
      '#0ea5e9', // Light blue
      '#10b981', // Emerald
    ];
    
    return colors[index % colors.length];
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
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
          tickFormatter={(tick) => `${(tick * 100 - 100).toFixed(0)}%`}
          tick={{ fontSize: 12 }}
          domain={[
            Math.min(...data.portfolio.filter(v => !isNaN(v)), 0.7),
            Math.max(...data.portfolio.filter(v => !isNaN(v)), 1.3)
          ]}
        />
        <Tooltip 
          formatter={(value: number) => [`${((value * 100) - 100).toFixed(2)}%`]}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        
        {/* Portfolio line (thicker, always first) */}
        <Line 
          type="monotone" 
          dataKey="Portfolio" 
          stroke={getLineColor(0)} 
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6 }}
        />
        
        {/* Benchmark line (if available) */}
        {data.benchmark && (
          <Line 
            type="monotone" 
            dataKey={data.benchmark.ticker} 
            stroke="#9ca3af" // Gray for benchmark
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        )}
        
        {/* Individual stock lines */}
        {Object.keys(data.stocks).map((ticker, i) => (
          <Line 
            key={ticker}
            type="monotone" 
            dataKey={ticker} 
            stroke={getLineColor(i + 2)} 
            strokeWidth={1.5}
            dot={false}
            opacity={0.7}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CumulativeReturnsChart;