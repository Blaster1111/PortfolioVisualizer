import React from 'react';
import { ResponsiveContainer, Tooltip } from 'recharts';

interface MonthlyReturnsHeatmapProps {
  data: { year: number; month: number; return: number }[];
}

const MonthlyReturnsHeatmap: React.FC<MonthlyReturnsHeatmapProps> = ({ data }) => {
  // Process data to get unique years and months
  const years = [...new Set(data.map(item => item.year))].sort();
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Function to get color based on return value
  const getColor = (value: number) => {
    if (value === null || value === undefined) return '#f3f4f6'; // Light gray for no data
    
    if (value > 0) {
      // Green scale for positive returns
      if (value > 0.05) return '#059669'; // Very high returns (>5%)
      if (value > 0.03) return '#10b981'; // High returns (3-5%)
      if (value > 0.01) return '#34d399'; // Medium returns (1-3%)
      return '#6ee7b7'; // Low positive returns (0-1%)
    } else {
      // Red scale for negative returns
      if (value < -0.05) return '#dc2626'; // Very bad returns (<-5%)
      if (value < -0.03) return '#ef4444'; // Bad returns (-3 to -5%)
      if (value < -0.01) return '#f87171'; // Medium negative returns (-1 to -3%)
      return '#fca5a5'; // Low negative returns (0 to -1%)
    }
  };

  // Get the data for a specific year and month
  const getReturnData = (year: number, month: number) => {
    const monthData = data.find(item => item.year === year && item.month === month);
    return monthData ? monthData.return : null;
  };

  return (
    <div className="w-full">
      <div className="flex mb-2">
        <div className="w-12"></div> {/* Empty cell for alignment */}
        {monthNames.map(month => (
          <div key={month} className="flex-1 text-center text-xs font-medium text-gray-600">
            {month}
          </div>
        ))}
      </div>
      
      {years.map(year => (
        <div key={year} className="flex mb-1">
          <div className="w-12 flex items-center text-xs font-medium text-gray-600">
            {year}
          </div>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
            const returnValue = getReturnData(year, month);
            const bgColor = getColor(returnValue ?? 0);
            const textColor = returnValue && returnValue < 0 ? 'text-white' : 
                             returnValue && returnValue > 0.03 ? 'text-white' : 'text-gray-800';
            
            return (
              <div
                key={`${year}-${month}`}
                className={`flex-1 h-10 flex items-center justify-center text-xs font-medium ${textColor}`}
                style={{ backgroundColor: bgColor }}
                title={returnValue !== null ? `${monthNames[month-1]} ${year}: ${(returnValue * 100).toFixed(2)}%` : 'No data'}
              >
                {returnValue !== null ? `${(returnValue * 100).toFixed(1)}%` : ''}
              </div>
            );
          })}
        </div>
      ))}
      
      <div className="flex justify-center items-center mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4" style={{ backgroundColor: '#dc2626' }}></div>
          <span className="text-xs text-gray-600">{'< -5%'}</span>
        </div>
        <div className="mx-2 text-gray-300">|</div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4" style={{ backgroundColor: '#fca5a5' }}></div>
          <span className="text-xs text-gray-600">{'0% to -1%'}</span>
        </div>
        <div className="mx-2 text-gray-300">|</div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4" style={{ backgroundColor: '#6ee7b7' }}></div>
          <span className="text-xs text-gray-600">{'0% to 1%'}</span>
        </div>
        <div className="mx-2 text-gray-300">|</div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4" style={{ backgroundColor: '#059669' }}></div>
          <span className="text-xs text-gray-600">{'>5%'}</span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReturnsHeatmap;