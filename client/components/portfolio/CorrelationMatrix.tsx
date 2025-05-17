import React from 'react';
import { ResponsiveContainer } from 'recharts';

interface CorrelationMatrixProps {
  data: Record<string, Record<string, number>>; // Matrix of correlations
}

const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({ data }) => {
  const stocks = Object.keys(data);
  
  if (!stocks.length) {
    return <div className="flex items-center justify-center h-full">No correlation data available</div>;
  }

  // Color scale for correlation values
  const getCorrelationColor = (value: number): string => {
    // Strong negative correlation (dark red)
    if (value <= -0.8) return '#ef4444';
    // Moderate negative correlation (light red)
    if (value <= -0.4) return '#fca5a5';
    // Weak negative correlation (light pink)
    if (value < 0) return '#fecaca';
    // No correlation (white/light gray)
    if (value === 0) return '#f3f4f6';
    // Weak positive correlation (light green)
    if (value < 0.4) return '#bbf7d0';
    // Moderate positive correlation (medium green)
    if (value < 0.8) return '#86efac';
    // Strong positive correlation (dark green)
    return '#22c55e';
  };

  const getTextColor = (value: number): string => {
    // Use white text for dark backgrounds, black for light backgrounds
    if (value <= -0.7 || value >= 0.7) return 'white';
    return 'black';
  };

  return (
    <ResponsiveContainer width="100%" height={stocks.length <= 5 ? 300 : 400}>
      <div className="w-full h-full overflow-auto">
        <table className="w-full h-full">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-10 bg-gray-100 p-2"></th>
              {stocks.map(stock => (
                <th 
                  key={`header-${stock}`} 
                  className="sticky top-0 z-10 bg-gray-100 p-2 text-sm font-medium whitespace-nowrap"
                >
                  {stock}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stocks.map(stock1 => (
              <tr key={`row-${stock1}`}>
                <th 
                  className="sticky left-0 z-10 bg-gray-100 p-2 text-sm font-medium text-left whitespace-nowrap"
                >
                  {stock1}
                </th>
                {stocks.map(stock2 => {
                  const value = data[stock1]?.[stock2] ?? 0;
                  const backgroundColor = getCorrelationColor(value);
                  const textColor = getTextColor(value);
                  
                  return (
                    <td 
                      key={`cell-${stock1}-${stock2}`}
                      className="text-center p-2 text-sm"
                      style={{ 
                        backgroundColor,
                        color: textColor,
                        width: `${100 / (stocks.length + 1)}%`
                      }}
                    >
                      {value.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ResponsiveContainer>
  );
};

export default CorrelationMatrix;