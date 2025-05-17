
'use client';

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Portfolio } from "@/types";
import { analyzePortfolio } from "@/lib/api/portfolio";
import { getPortfolioById } from "@/lib/api/dashboard";
import Navbar from "@/components/dashboard/Navbar";
import { Loader2, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import CumulativeReturnsChart from "@/components/portfolio/CumulativeReturnsChart";
import MonthlyReturnsHeatmap from "@/components/portfolio/MonthlyReturnsHeatmap";
import ReturnsDistributionChart from "@/components/portfolio/ReturnsDistributionChart";
import RollingMetricsChart from "@/components/portfolio/RollingMetricsChart";
import DrawdownChart from "@/components/portfolio/DrawdownChart";
import RiskMetricsCards from "@/components/portfolio/RiskMetricsCards";
import DrawdownTable from "@/components/portfolio/DrawdownTable";
import CorrelationMatrix from "@/components/portfolio/CorrelationMatrix";
import RollingBetaChart from "@/components/portfolio/RollingBetaChart";
import StockAllocationChart from "@/components/portfolio/StockAllocationChart";

interface PortfolioAnalysis {
  portfolio_settings: {
    stocks: { ticker: string; weight: number }[];
    date_range: { start: string; end: string };
    benchmark: string;
  };
  live_market_data: Record<string, {
    price: number;
    change: number;
    volume: number;
    market_cap: number;
    pe_ratio: number;
    dividend_yield: number;
  }>;
  portfolio_overview: {
    cumulative_returns: {
      dates: string[];
      portfolio: number[];
      stocks: Record<string, number[]>;
      benchmark?: { ticker: string; values: number[] };
    };
    key_metrics: {
      Sharpe_Ratio: number;
      Sortino_Ratio: number;
      Max_Drawdown: number;
      CAGR: number;
      Volatility: number;
      Win_Rate: number;
      Profit_Ratio: number;
      Value_at_Risk: number;
      Beta?: number;
      Alpha?: number;
      Information_Ratio?: number;
    };
  };
  returns_analysis: {
    monthly_returns_heatmap: { year: number; month: number; return: number }[];
    returns_distribution: { date: string; return: number }[];
    rolling_sharpe: { date: string; sharpe: number | null }[];
    rolling_sortino: { date: string; sortino: number | null }[];
  };
  risk_metrics: {
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
    rolling_volatility: { date: string; volatility: number | null }[];
  };
  drawdown_analysis: {
    drawdown_series: { date: string; drawdown: number }[];
    worst_drawdowns: {
      start: string;
      recovery: string;
      drawdown: number;
      underwater: number;
    }[];
    max_drawdown: number;
    avg_drawdown_length: number;
    drawdown_distribution: number[];
  };
  advanced_analytics: {
    rolling_beta: { date: string; beta_30d: number | null; beta_90d: number | null }[];
    rolling_correlation: { date: string; correlation: number | null }[];
    overall_correlation: number | null;
    correlation_matrix: Record<string, Record<string, number>>;
  };
}

export default function PortfolioAnalysis() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [analysisData, setAnalysisData] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const portfolioId = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  const token = useMemo(() => session?.backendAccessToken || null, [session?.backendAccessToken]);

  useEffect(() => {
    if (status !== "authenticated" || !portfolioId || !token) return;

    const fetchPortfolioDetails = async () => {
      setLoading(true);
      try {
        const data = await getPortfolioById(portfolioId, token);
        setPortfolio(data);
      } catch (err) {
        console.error("Error fetching portfolio details:", err);
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioDetails();
  }, [status, portfolioId, token, router]);

  useEffect(() => {
    if (!portfolio || !token) return;

    const fetchAnalysisData = async () => {
      setLoadingAnalysis(true);
      setApiError(null);
      try {
        const data = await analyzePortfolio(portfolio, token);
        setAnalysisData(data);
      } catch (err) {
        console.error("Error fetching portfolio analysis:", err);
        setApiError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoadingAnalysis(false);
      }
    };

    fetchAnalysisData();
  }, [portfolio, token]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-10">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Portfolio not found</h3>
            <Button onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="flex items-center gap-1"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" /> Back to Portfolio
            </Button>
            <h1 className="text-2xl font-bold">Portfolio Analysis: {portfolio.name}</h1>
          </div>

          <Badge variant="outline" className="text-sm">
            Analysis period: {formatDate(portfolio.startDate)} - {formatDate(portfolio.endDate)}
          </Badge>
        </div>

        {loadingAnalysis ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-gray-500">Analyzing portfolio performance...</p>
          </div>
        ) : apiError ? (
          <div className="py-16 text-center">
            <p className="text-red-500 mb-4">Unable to load portfolio analysis: {apiError}</p>
            <p className="text-gray-500 mb-6">Please check your portfolio settings and try again.</p>
            <Button onClick={() => router.push("/dashboard")} className="mt-4">
              Return to Dashboard
            </Button>
          </div>
        ) : analysisData ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-5 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="returns">Returns Analysis</TabsTrigger>
              <TabsTrigger value="risk">Risk Metrics</TabsTrigger>
              <TabsTrigger value="drawdowns">Drawdowns</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Portfolio Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Cumulative Returns</CardTitle>
                    <CardDescription>Performance compared to benchmark and individual holdings</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {analysisData.portfolio_overview.cumulative_returns && (
                      <CumulativeReturnsChart data={analysisData.portfolio_overview.cumulative_returns} />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio Allocation</CardTitle>
                    <CardDescription>Current asset allocation</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <StockAllocationChart
                      stocks={portfolio.stocks.map(stock => ({
                        symbol: stock.symbol,
                        weight: stock.weight
                      }))}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">CAGR</div>
                      <div className="text-2xl font-bold">
                        {(analysisData.portfolio_overview.key_metrics.CAGR * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Sharpe Ratio</div>
                      <div className="text-2xl font-bold">
                        {analysisData.portfolio_overview.key_metrics.Sharpe_Ratio.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Max Drawdown</div>
                      <div className="text-2xl font-bold text-red-500">
                        {(analysisData.portfolio_overview.key_metrics.Max_Drawdown * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Volatility</div>
                      <div className="text-2xl font-bold">
                        {(analysisData.portfolio_overview.key_metrics.Volatility * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live Market Data */}
              {Object.keys(analysisData.live_market_data).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Live Market Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="px-4 py-3">Symbol</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Change</th>
                            <th className="px-4 py-3 hidden md:table-cell">Volume</th>
                            <th className="px-4 py-3 hidden md:table-cell">Market Cap</th>
                            <th className="px-4 py-3 hidden lg:table-cell">P/E Ratio</th>
                            <th className="px-4 py-3 hidden lg:table-cell">Dividend Yield</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(analysisData.live_market_data).map(([symbol, data]) => (
                            <tr key={symbol} className="border-t">
                              <td className="px-4 py-3 font-medium">{symbol}</td>
                              <td className="px-4 py-3">${data.price.toFixed(2)}</td>
                              <td className={`px-4 py-3 ${data.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {data.change >= 0 ? '+' : ''}{(data.change * 100).toFixed(2)}%
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                {new Intl.NumberFormat().format(data.volume)}
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                ${(data.market_cap / 1000000000).toFixed(2)}B
                              </td>
                              <td className="px-4 py-3 hidden lg:table-cell">
                                {data.pe_ratio ? data.pe_ratio.toFixed(2) : 'N/A'}
                              </td>
                              <td className="px-4 py-3 hidden lg:table-cell">
                                {data.dividend_yield ? (data.dividend_yield * 100).toFixed(2) + '%' : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="returns" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Returns Distribution</CardTitle>
                    <CardDescription>Histogram of daily returns</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {analysisData.returns_analysis.returns_distribution && (
                      <ReturnsDistributionChart data={analysisData.returns_analysis.returns_distribution} />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Returns Heatmap</CardTitle>
                    <CardDescription>Monthly performance visualization</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {analysisData.returns_analysis.monthly_returns_heatmap && (
                      <MonthlyReturnsHeatmap data={analysisData.returns_analysis.monthly_returns_heatmap} />
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Rolling Performance Metrics</CardTitle>
                  <CardDescription>30-day rolling Sharpe and Sortino ratios</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 h-80">
                  {analysisData.returns_analysis.rolling_sharpe && analysisData.returns_analysis.rolling_sortino && (
                    <RollingMetricsChart
                      sharpeData={analysisData.returns_analysis.rolling_sharpe}
                      sortinoData={analysisData.returns_analysis.rolling_sortino}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk" className="space-y-6">
              <RiskMetricsCards metrics={analysisData.risk_metrics} />

              <Card>
                <CardHeader>
                  <CardTitle>Rolling Volatility</CardTitle>
                  <CardDescription>30-day rolling annualized volatility</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 h-80">
                  {analysisData.risk_metrics.rolling_volatility && (
                    <RollingMetricsChart
                      volatilityData={analysisData.risk_metrics.rolling_volatility}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="drawdowns" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Drawdown Analysis</CardTitle>
                  <CardDescription>Historical drawdowns over time</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 h-80">
                  {analysisData.drawdown_analysis.drawdown_series && (
                    <DrawdownChart data={analysisData.drawdown_analysis.drawdown_series} />
                  )}
                </CardContent>
              </Card>

              <DrawdownTable drawdowns={analysisData.drawdown_analysis.worst_drawdowns} />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Rolling Beta</CardTitle>
                    <CardDescription>30-day and 90-day beta to benchmark</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 h-80">
                    {analysisData.advanced_analytics.rolling_beta && (
                      <RollingBetaChart data={analysisData.advanced_analytics.rolling_beta} />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Asset Correlation</CardTitle>
                    <CardDescription>Correlation between holdings</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {analysisData.advanced_analytics.correlation_matrix && (
                      <CorrelationMatrix data={analysisData.advanced_analytics.correlation_matrix} />
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Benchmark Correlation</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center text-sm text-gray-500">
                            <Info className="h-4 w-4 mr-1" />
                            Overall correlation: {analysisData.advanced_analytics.overall_correlation !== null ?
                              analysisData.advanced_analytics.overall_correlation.toFixed(2) : 'N/A'}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Correlation between portfolio and benchmark</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 h-80">
                  {analysisData.advanced_analytics.rolling_correlation && (
                    <RollingMetricsChart
                      correlationData={analysisData.advanced_analytics.rolling_correlation}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-16 text-center">
            <p className="text-gray-500">Unable to load portfolio analysis. Please try again later.</p>
            <Button onClick={() => router.push("/dashboard")} className="mt-4">
              Return to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}