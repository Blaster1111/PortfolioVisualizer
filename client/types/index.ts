export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stock {
  id: string;
  symbol: string;
  weight: number;
  portfolioId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockInput {
  symbol: string;
  weight: number;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string | null;
  userId: string;
  stocks: Stock[];
  startDate?: string | null;
  endDate?: string | null;
  benchmark?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioInput {
  name: string;
  description?: string;
  benchmark?: string;
  startDate?: string;
  endDate?: string;
  stocks: StockInput[];
}

export interface PortfolioUpdateInput extends PortfolioInput {
  id: string;
}

export interface SearchStocksResult {
  count: number;
  result: {
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}