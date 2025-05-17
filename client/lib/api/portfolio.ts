import type { Portfolio } from "@/types";

export interface AnalysisRequestBody {
  start_date: string;
  end_date: string;
  stocks: string[];
  weights: number[];
  benchmark: string;
}

export async function getPortfolioById(id: string, token: string): Promise<Portfolio> {
  const response = await fetch(`/portfolios/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio: ${response.status}`);
  }

  return response.json();
}

export function convertDateToISO(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.slice(0, 10);
  }

  // else assume dd-mm-yyyy and convert manually
  const [dd, mm, yyyy] = dateStr.split("-");
  if (!dd || !mm || !yyyy) return null;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

export async function analyzePortfolio(portfolio: Portfolio, token: string) {
  try {
    // Ensure stocks array is not empty
    if (!portfolio.stocks || portfolio.stocks.length === 0) {
      throw new Error("Portfolio has no stocks");
    }
    
    // Prepare stocks and weights for the API
    const stocks = portfolio.stocks.map(stock => stock.symbol);
    const weights = portfolio.stocks.map(stock => stock.weight / 100); // Convert percentages to decimals
    
    // Validate the weights sum to 1.0 (FastAPI validation requirement)
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(weightSum - 1.0) > 0.01) {
      const normalizedWeights = weights.map(w => w / weightSum);
      weights.splice(0, weights.length, ...normalizedWeights);
    }
    
    // Format dates properly
    const startDate = convertDateToISO(portfolio.startDate) || "2020-01-01"; // Default if not specified
    const endDate = convertDateToISO(portfolio.endDate) || "2025-01-01"; // Default to today
    
    // Create request body
    const requestBody = {
      start_date: startDate,
      end_date: endDate,
      stocks,
      weights,
      benchmark: portfolio.benchmark || "SPY" 
    };
    
    console.log("Sending analysis request:", JSON.stringify(requestBody));
    
    // Call FastAPI endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_ANALYSIS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status}`, errorText);
      throw new Error(`API error: ${response.status}${errorText ? ' - ' + errorText : ''}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error analyzing portfolio:", error);
    throw error;
  }
}