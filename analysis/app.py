from fastapi import FastAPI, HTTPException
import yfinance as yf
import quantstats as qs
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import seaborn as sns
import matplotlib.pyplot as plt
import io
import base64
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
import json
from fastapi.middleware.cors import CORSMiddleware

# Define Pydantic models for request validation
class PortfolioRequest(BaseModel):
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format") 
    stocks: List[str] = Field(..., description="List of stock tickers")
    weights: List[float] = Field(..., description="List of weights for each stock (should sum to 1.0)")
    benchmark: str = Field("SPY", description="Benchmark ticker")

# Initialize FastAPI app
app = FastAPI(
    title="Portfolio Analytics API",
    description="API for analyzing portfolio performance with comprehensive metrics and visualizations",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Function to fetch data and calculate portfolio returns
def get_portfolio_data(stocks, weights, start_date, end_date):
    try:
        # Download data for all stocks at once
        data = yf.download(stocks, start=start_date, end=end_date, progress=False)
        
        if data.empty:
            raise HTTPException(status_code=404, detail="No data available for the selected stocks")
            
        # Handle data structure based on number of stocks
        if len(stocks) == 1:
            # For single stock, data structure is different
            closes = pd.DataFrame(data['Close'], columns=stocks)
        else:
            # For multiple stocks, get all 'Close' prices
            closes = data['Close']
        
        # Calculate returns
        returns = closes.pct_change().dropna()  # Drop NaN values
        portfolio_returns = (returns * weights).sum(axis=1)
        
        # Calculate cumulative returns for each stock
        stock_cum_returns = (1 + returns).cumprod()
        
        return closes, returns, portfolio_returns, stock_cum_returns
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching portfolio data: {str(e)}")

# Function to get live price data
def get_live_price(ticker):
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        if not info:
            return None
        
        return {
            'price': info.get('regularMarketPrice', 0),
            'change': info.get('regularMarketChangePercent', 0),
            'volume': info.get('regularMarketVolume', 0),
            'market_cap': info.get('marketCap', 0),
            'pe_ratio': info.get('forwardPE', 0),
            'dividend_yield': info.get('dividendYield', 0) if info.get('dividendYield') else 0
        }
    except Exception as e:
        return None

def get_drawdown_details(returns):
    """
    Returns simplified drawdown details with only the required fields:
    start date, recovery date, drawdown magnitude, and underwater days.
    """
    try:
        # Calculate drawdown series using QuantStats
        drawdown = qs.stats.to_drawdown_series(returns)
        
        # Get drawdown details DataFrame from QuantStats
        dd_details = qs.stats.drawdown_details(drawdown)
        
        # Initialize the list to store processed drawdown records
        data = []
        
        # Process each drawdown period
        for _, row in dd_details.iterrows():
            # Extract only start and end dates safely
            start = row['start']
            end = row['end']
            
            # Format dates as strings (handle NaT or non-datetime objects gracefully)
            start_str = start.strftime('%Y-%m-%d') if pd.notna(start) and hasattr(start, 'strftime') else str(start)
            recovery_str = end.strftime('%Y-%m-%d') if pd.notna(end) and hasattr(end, 'strftime') else str(end)
            
            # Ensure underwater days and max drawdown are properly processed
            underwater = int(row['days']) if pd.notna(row['days']) else 0
            max_dd = float(row['max drawdown']) if pd.notna(row['max drawdown']) else 0
            max_dd = max_dd / 100.0  # Convert from percentage to decimal
            
            # Create simplified dictionary with only the required fields
            drawdown_record = {
                'start': start_str,
                'recovery': recovery_str,
                'drawdown': max_dd,
                'underwater': underwater
            }
            
            data.append(drawdown_record)
        
        # Sort by worst drawdown (most negative first)
        return sorted(data, key=lambda x: x['drawdown'])
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating drawdown details: {str(e)}")

# Function to calculate risk metrics
def calculate_risk_metrics(returns, benchmark_returns=None):
    try:
        # Ensure returns and benchmark_returns have the same index
        if benchmark_returns is not None:
            common_index = returns.index.intersection(benchmark_returns.index)
            if len(common_index) == 0:
                raise HTTPException(status_code=400, detail="No overlapping dates between portfolio and benchmark returns")
                
            # Sort the common index to ensure proper alignment
            common_index = sorted(common_index)
            returns = returns[common_index]
            benchmark_returns = benchmark_returns[common_index]
        
        metrics = {
            'Sharpe_Ratio': float(qs.stats.sharpe(returns)),
            'Sortino_Ratio': float(qs.stats.sortino(returns)),
            'Max_Drawdown': float(qs.stats.max_drawdown(returns)),
            'CAGR': float(qs.stats.cagr(returns)),
            'Volatility': float(qs.stats.volatility(returns)),
            'Win_Rate': float(qs.stats.win_rate(returns)),
            'Profit_Ratio': float(qs.stats.profit_ratio(returns)),
            'Value_at_Risk': float(qs.stats.var(returns))
        }
        
        if benchmark_returns is not None and not benchmark_returns.empty:
            try:
                # Get beta from greeks
                greeks = qs.stats.greeks(returns, benchmark_returns)
                metrics.update({
                    'Beta': float(greeks.get('beta', 0)),
                    'Alpha': float(greeks.get('alpha', 0)),
                    'Information_Ratio': float(qs.stats.information_ratio(returns, benchmark_returns))
                })
            except Exception:
                # If benchmark metrics fail, continue without them
                pass
        
        return metrics
    except Exception as e:
        if "No overlapping dates" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=f"Error calculating risk metrics: {str(e)}")

# Endpoint for portfolio analysis
@app.post("/analyze_portfolio", response_model=Dict[str, Any])
async def analyze_portfolio(request: PortfolioRequest):
    try:
        # Parse dates
        try:
            start_date = datetime.strptime(request.start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(request.end_date, '%Y-%m-%d').date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
            
        # Validate dates
        today = datetime.now().date()
        if start_date >= end_date:
            raise HTTPException(status_code=400, detail="End date must be after start date")
            
        if end_date > today:
            end_date = today
            
        # Validate stocks and weights
        stocks = request.stocks
        weights = request.weights
        
        if len(stocks) != len(weights):
            raise HTTPException(status_code=400, detail="Number of stocks must match number of weights")
            
        if not stocks:
            raise HTTPException(status_code=400, detail="Please provide at least one stock ticker")
            
        if abs(sum(weights) - 1.0) > 0.0001:
            raise HTTPException(status_code=400, detail="Weights must sum to 1.0")
            
        benchmark = request.benchmark
        
        # Initialize response dictionary
        response = {
            "portfolio_settings": {
                "stocks": [{"ticker": stock, "weight": weight} for stock, weight in zip(stocks, weights)],
                "date_range": {
                    "start": start_date.strftime('%Y-%m-%d'),
                    "end": end_date.strftime('%Y-%m-%d')
                },
                "benchmark": benchmark
            },
            "live_market_data": {},
            "portfolio_overview": {},
            "returns_analysis": {},
            "risk_metrics": {},
            "drawdown_analysis": {},
            "advanced_analytics": {}
        }
        
        # Get live market data
        for stock in stocks:
            live_data = get_live_price(stock)
            if live_data:
                response["live_market_data"][stock] = live_data
        
        # Get historical data
        result = get_portfolio_data(stocks, weights, start_date, end_date)
        
        if result is not None:
            closes, returns, portfolio_returns, stock_cum_returns = result
            
            # Get benchmark data
            try:
                benchmark_data = yf.download(benchmark, start=start_date, end=end_date, progress=False)
                benchmark_returns = None
                
                if not benchmark_data.empty:
                    # Handle MultiIndex columns from yfinance
                    if isinstance(benchmark_data.columns, pd.MultiIndex):
                        # Get the 'Close' price for the benchmark
                        benchmark_prices = benchmark_data[('Close', benchmark)]
                    else:
                        # Single-level columns
                        if 'Close' in benchmark_data.columns:
                            benchmark_prices = benchmark_data['Close']
                    
                    # Calculate returns if we have prices
                    if 'benchmark_prices' in locals():
                        benchmark_returns = benchmark_prices.pct_change().dropna()
                        
                        # Ensure benchmark returns align with portfolio returns
                        common_index = portfolio_returns.index.intersection(benchmark_returns.index)
                        
                        if len(common_index) > 0:
                            # Sort the common index to ensure proper alignment
                            common_index = sorted(common_index)
                            portfolio_returns_aligned = portfolio_returns[common_index]
                            benchmark_returns_aligned = benchmark_returns[common_index]
                            
                            benchmark_returns = benchmark_returns_aligned
                
            except Exception:
                benchmark_returns = None
            
            # Portfolio Overview
            # Calculate portfolio cumulative return
            try:
                portfolio_cum_return = (1 + portfolio_returns).cumprod()
                
                # Prepare data for cumulative returns chart
                cum_returns_data = {
                    "dates": [date.strftime('%Y-%m-%d') if hasattr(date, 'strftime') else str(date) for date in portfolio_cum_return.index],
                    "portfolio": [float(val) if not pd.isna(val) else None for val in portfolio_cum_return.tolist()],
                    "stocks": {}
                }
                
                for stock in stocks:
                    stock_values = [float(val) if not pd.isna(val) else None for val in stock_cum_returns[stock].tolist()]
                    cum_returns_data["stocks"][stock] = stock_values
                
                # Add benchmark if available
                if benchmark_returns is not None:
                    benchmark_cum_return = (1 + benchmark_returns).cumprod()
                    benchmark_values = [float(val) if not pd.isna(val) else None for val in benchmark_cum_return.tolist()]
                    cum_returns_data["benchmark"] = {
                        "ticker": benchmark,
                        "values": benchmark_values
                    }
                
                response["portfolio_overview"]["cumulative_returns"] = cum_returns_data
            except Exception as e:
                response["portfolio_overview"]["cumulative_returns"] = {"dates": [], "portfolio": [], "stocks": {}}
                print(f"Error creating cumulative returns data: {str(e)}")
            
            # Calculate key metrics
            metrics = calculate_risk_metrics(portfolio_returns, benchmark_returns)
            if metrics:
                response["portfolio_overview"]["key_metrics"] = metrics
            
            # Returns Analysis
            # Monthly returns heatmap data
            try:
                monthly_returns = portfolio_returns.resample('M').apply(lambda x: (1 + x).prod() - 1)
                heatmap_data = []
                
                for i, (date, value) in enumerate(monthly_returns.items()):
                    if not pd.isna(value):
                        year = date.year
                        month = date.month
                        heatmap_data.append({
                            "year": year,
                            "month": month,
                            "return": float(value)
                        })
                
                response["returns_analysis"]["monthly_returns_heatmap"] = heatmap_data
            except Exception as e:
                response["returns_analysis"]["monthly_returns_heatmap"] = []
                print(f"Error creating monthly returns heatmap: {str(e)}")
            
            # Returns distribution data
            try:
                returns_distribution = []
                for date, value in portfolio_returns.items():
                    if not pd.isna(value):
                        returns_distribution.append({
                            "date": date.strftime('%Y-%m-%d') if hasattr(date, 'strftime') else str(date),
                            "return": float(value)
                        })
                
                response["returns_analysis"]["returns_distribution"] = returns_distribution
            except Exception as e:
                response["returns_analysis"]["returns_distribution"] = []
                print(f"Error creating returns distribution: {str(e)}")
            
            # Rolling metrics
            try:
                rolling_sharpe = qs.stats.rolling_sharpe(portfolio_returns)
                sharpe_data = []
                for date, value in rolling_sharpe.items():
                    sharpe_data.append({
                        "date": date.strftime('%Y-%m-%d'),
                        "sharpe": float(value) if not np.isnan(value) else None
                    })
                response["returns_analysis"]["rolling_sharpe"] = sharpe_data
            except Exception:
                response["returns_analysis"]["rolling_sharpe"] = []
            
            try:
                rolling_sortino = qs.stats.rolling_sortino(portfolio_returns)
                sortino_data = []
                for date, value in rolling_sortino.items():
                    sortino_data.append({
                        "date": date.strftime('%Y-%m-%d'),
                        "sortino": float(value) if not np.isnan(value) else None
                    })
                response["returns_analysis"]["rolling_sortino"] = sortino_data
            except Exception:
                response["returns_analysis"]["rolling_sortino"] = []
            
            # Risk Metrics
            if metrics:
                response["risk_metrics"]["ratios"] = {
                    "sharpe_ratio": metrics["Sharpe_Ratio"],
                    "sortino_ratio": metrics["Sortino_Ratio"],
                    "information_ratio": metrics.get("Information_Ratio", None)
                }
                
                response["risk_metrics"]["measures"] = {
                    "volatility": metrics["Volatility"],
                    "value_at_risk": metrics["Value_at_Risk"],
                    "max_drawdown": metrics["Max_Drawdown"]
                }
            
            # Rolling volatility data
            try:
                rolling_vol = portfolio_returns.rolling(window=30).std() * (252 ** 0.5)  # Annualized
                vol_data = []
                for date, value in rolling_vol.items():
                    vol_data.append({
                        "date": date.strftime('%Y-%m-%d'),
                        "volatility": float(value) if not np.isnan(value) else None
                    })
                response["risk_metrics"]["rolling_volatility"] = vol_data
            except Exception:
                response["risk_metrics"]["rolling_volatility"] = []
            
            # Drawdown Analysis
            # Drawdown data
            try:
                drawdown_series = qs.stats.to_drawdown_series(portfolio_returns)
                drawdown_data = []
                for date, value in drawdown_series.items():
                    if not pd.isna(value):
                        drawdown_data.append({
                            "date": date.strftime('%Y-%m-%d') if hasattr(date, 'strftime') else str(date),
                            "drawdown": float(value)
                        })
                
                response["drawdown_analysis"]["drawdown_series"] = drawdown_data
            except Exception as e:
                response["drawdown_analysis"]["drawdown_series"] = []
                print(f"Error creating drawdown series: {str(e)}")
            
            # Drawdown table
            try:
                drawdown_details = get_drawdown_details(portfolio_returns)
                if drawdown_details:
                    response["drawdown_analysis"]["worst_drawdowns"] = drawdown_details[:10]  # Top 10
                    response["drawdown_analysis"]["max_drawdown"] = metrics["Max_Drawdown"]
                    
                    # Calculate average drawdown length
                    if drawdown_details:
                        avg_length = sum(item["underwater"] for item in drawdown_details) / len(drawdown_details)
                        response["drawdown_analysis"]["avg_drawdown_length"] = int(avg_length)
                    
                    # Drawdown distribution data (simplified)
                    dd_values = [item["drawdown"] for item in drawdown_details]
                    response["drawdown_analysis"]["drawdown_distribution"] = dd_values
            except Exception as e:
                response["drawdown_analysis"]["worst_drawdowns"] = []
                response["drawdown_analysis"]["max_drawdown"] = metrics["Max_Drawdown"] if metrics else None
                response["drawdown_analysis"]["drawdown_distribution"] = []
                print(f"Error processing drawdown details: {str(e)}")
            
            # Advanced Analytics
            if benchmark_returns is not None and not benchmark_returns.empty:
                # Rolling Beta
                try:
                    rolling_beta = pd.DataFrame()
                    rolling_beta['30d'] = qs.stats.rolling_greeks(portfolio_returns, benchmark_returns, window=30)['beta']
                    rolling_beta['90d'] = qs.stats.rolling_greeks(portfolio_returns, benchmark_returns, window=90)['beta']
                    
                    beta_data = []
                    for date, row in rolling_beta.iterrows():
                        beta_data.append({
                            "date": date.strftime('%Y-%m-%d'),
                            "beta_30d": float(row['30d']) if not np.isnan(row['30d']) else None,
                            "beta_90d": float(row['90d']) if not np.isnan(row['90d']) else None
                        })
                    response["advanced_analytics"]["rolling_beta"] = beta_data
                except Exception:
                    response["advanced_analytics"]["rolling_beta"] = []
                
                # Rolling Correlation
                try:
                    rolling_corr = portfolio_returns.rolling(window=30).corr(benchmark_returns)
                    corr_data = []
                    for date, value in rolling_corr.items():
                        corr_data.append({
                            "date": date.strftime('%Y-%m-%d'),
                            "correlation": float(value) if not np.isnan(value) else None
                        })
                    response["advanced_analytics"]["rolling_correlation"] = corr_data
                except Exception:
                    response["advanced_analytics"]["rolling_correlation"] = []
                
                # Overall correlation
                try:
                    corr = portfolio_returns.corr(benchmark_returns)
                    response["advanced_analytics"]["overall_correlation"] = float(corr)
                except Exception:
                    response["advanced_analytics"]["overall_correlation"] = None
            
            # Correlation matrix for all assets
            try:
                corr_matrix = returns.corr()
                matrix_data = {}
                
                for stock1 in stocks:
                    matrix_data[stock1] = {}
                    for stock2 in stocks:
                        matrix_data[stock1][stock2] = float(corr_matrix.loc[stock1, stock2])
                
                response["advanced_analytics"]["correlation_matrix"] = matrix_data
            except Exception:
                response["advanced_analytics"]["correlation_matrix"] = {}
        
        # Ensure all numerical values are JSON serializable
        def convert_to_serializable(obj):
            if isinstance(obj, (np.integer, np.floating)):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, (datetime, pd.Timestamp)):
                return obj.strftime('%Y-%m-%d')
            elif isinstance(obj, dict):
                return {k: convert_to_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_to_serializable(i) for i in obj]
            else:
                return obj
        
        response = convert_to_serializable(response)
        return response
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)