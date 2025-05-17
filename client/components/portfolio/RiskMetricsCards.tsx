import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RiskMetricsCardsProps {
  metrics: {
    ratios: {
      sharpe_ratio: number;
      sortino_ratio: number;
      information_ratio: number | null;
    };
    measures: {
      volatility: number;
      value_at_risk: number;
      max_drawdown: number;
    };
  };
}

const RiskMetricsCards: React.FC<RiskMetricsCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Risk Ratios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm font-medium">Sharpe Ratio</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Risk-adjusted return. Measures excess return per unit of risk. Higher is better.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className={`text-lg font-bold ${metrics.ratios.sharpe_ratio > 1 ? 'text-green-500' : metrics.ratios.sharpe_ratio > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                {metrics.ratios.sharpe_ratio.toFixed(2)}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm font-medium">Sortino Ratio</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Measures return relative to downside risk. Higher is better.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className={`text-lg font-bold ${metrics.ratios.sortino_ratio > 1 ? 'text-green-500' : metrics.ratios.sortino_ratio > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                {metrics.ratios.sortino_ratio.toFixed(2)}
              </div>
            </div>
            
            {metrics.ratios.information_ratio !== null && (
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm font-medium">Information Ratio</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 ml-1" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Active return relative to tracking error. Measures portfolio manager skill.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className={`text-lg font-bold ${metrics.ratios.information_ratio > 0.5 ? 'text-green-500' : metrics.ratios.information_ratio > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {metrics.ratios.information_ratio.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Risk Measures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm font-medium">Volatility (Annualized)</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Standard deviation of returns, annualized. Measures portfolio risk.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className={`text-lg font-bold ${metrics.measures.volatility < 0.15 ? 'text-green-500' : metrics.measures.volatility < 0.25 ? 'text-yellow-500' : 'text-red-500'}`}>
                {(metrics.measures.volatility * 100).toFixed(2)}%
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm font-medium">Value at Risk (95%)</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Maximum expected loss over a single day with 95% confidence.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-lg font-bold text-red-500">
                {(metrics.measures.value_at_risk * 100).toFixed(2)}%
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm font-medium">Maximum Drawdown</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Largest peak-to-trough decline in portfolio value.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-lg font-bold text-red-500">
                {(metrics.measures.max_drawdown * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskMetricsCards;