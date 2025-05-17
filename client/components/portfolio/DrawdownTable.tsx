import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Drawdown {
  start: string;
  recovery: string;
  drawdown: number;
  underwater: number;
}

interface DrawdownTableProps {
  drawdowns: Drawdown[];
}

const DrawdownTable: React.FC<DrawdownTableProps> = ({ drawdowns }) => {
  // Format date to readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Worst Drawdowns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recovery</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drawdown</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Underwater (days)</th>
              </tr>
            </thead>
            <tbody>
              {drawdowns.map((drawdown, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(drawdown.start)}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(drawdown.recovery)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-red-500">
                    {(drawdown.drawdown * 100).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-sm">{drawdown.underwater} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DrawdownTable;