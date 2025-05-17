import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RollingMetricsChartProps {
  sharpeData?: { date: string; sharpe: number | null }[];
  sortinoData?: { date: string; sortino: number | null }[];
  volatilityData?: { date: string; volatility: number | null }[];
  correlationData?: { date: string; correlation: number | null }[];
}

const RollingMetricsChart: React.FC<RollingMetricsChartProps> = ({ 
  sharpeData, 
  sortinoData, 
  volatilityData,
  correlationData
}) => {
  // Determine which metrics we're displaying
  const showingSharpe = !!sharpeData?.length;
  const showingSortino = !!sortinoData?.length;
  const showingVolatility = !!volatilityData?.length;
  const showingCorrelation = !!correlationData?.length;

  // Prepare data based on what metrics are provided
  let chartData: any[] | undefined = [];

  if (showingSharpe) {
    chartData = sharpeData?.map(point => ({
      date: new Date(point.date).toLocaleDateString(),
      sharpe: point.sharpe
    })) || [];
  }

  if (showingSortino) {
    // If we already have data from sharpe, merge it
    if (chartData.length) {
      // Create a map for easy date lookup
      const dateMap = new Map(chartData.map(item => [item.date, item]));
      
      sortinoData?.forEach(point => {
        const date = new Date(point.date).toLocaleDateString();
        if (dateMap.has(date)) {
          dateMap.get(date).sortino = point.sortino;
        } else {
          dateMap.set(date, { date, sortino: point.sortino });
        }
      });
      
      chartData = Array.from(dateMap.values());
    } else {
      chartData = sortinoData?.map(point => ({
        date: new Date(point.date).toLocaleDateString(),
        sortino: point.sortino
      })) || [];
    }
  }

  if (showingVolatility) {
    if (chartData.length) {
      const dateMap = new Map(chartData.map(item => [item.date, item]));
      
      volatilityData?.forEach(point => {
        const date = new Date(point.date).toLocaleDateString();
        if (dateMap.has(date)) {
          dateMap.get(date).volatility = point.volatility;
        } else {
          dateMap.set(date, { date, volatility: point.volatility });
        }
      });
      
      chartData = Array.from(dateMap.values());
    } else {
      chartData = volatilityData?.map(point => ({
        date: new Date(point.date).toLocaleDateString(),
        volatility: point.volatility
      })) || [];
    }
  }

  if (showingCorrelation) {
    if (chartData.length) {
      const dateMap = new Map(chartData.map(item => [item.date, item]));
      
      correlationData?.forEach(point => {
        const date = new Date(point.date).toLocaleDateString();
        if (dateMap.has(date)) {
          dateMap.get(date).correlation = point.correlation;
        } else {
          dateMap.set(date, { date, correlation: point.correlation });
        }
      });
      
      chartData = Array.from(dateMap.values());
    } else {
      chartData = correlationData?.map(point => ({
        date: new Date(point.date).toLocaleDateString(),
        correlation: point.correlation
      })) || [];
    }
  }

  // Helper function to get Y-domain based on the chart type
  const getYDomain = () => {
    if (showingCorrelation) return [-1, 1];
    if (showingSharpe || showingSortino) return [-3, 5];
    if (showingVolatility) return [0, 0.5];
    return [0, 1];
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`tooltip-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value !== null ? entry.value.toFixed(2) : 'N/A'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Ensure we have data
  if (!chartData.length) {
    return <div className="flex items-center justify-center h-full">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickFormatter={(tick) => tick}
        />
        <YAxis 
          domain={getYDomain()}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={customTooltip} />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
        
        {showingSharpe && (
          <Line
            type="monotone"
            dataKey="sharpe"
            name="Sharpe Ratio"
            stroke="#2563eb"
            dot={false}
            strokeWidth={2}
            connectNulls
          />
        )}
        
        {showingSortino && (
          <Line
            type="monotone"
            dataKey="sortino"
            name="Sortino Ratio"
            stroke="#8b5cf6"
            dot={false}
            strokeWidth={2}
            connectNulls
          />
        )}
        
        {showingVolatility && (
          <Line
            type="monotone"
            dataKey="volatility"
            name="Volatility"
            stroke="#ef4444"
            dot={false}
            strokeWidth={2}
            connectNulls
          />
        )}
        
        {showingCorrelation && (
          <Line
            type="monotone"
            dataKey="correlation"
            name="Correlation"
            stroke="#22c55e"
            dot={false}
            strokeWidth={2}
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RollingMetricsChart;
