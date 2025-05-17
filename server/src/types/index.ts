import { Request } from 'express';

export interface UserRequest extends Request {
  user?: {
    id: string;
  };
}

export interface StockInput {
  symbol: string;
  weight: number;
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

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
}