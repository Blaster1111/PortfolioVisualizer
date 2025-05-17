import { Portfolio, PortfolioInput } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const FINHUBIO = process.env.NEXT_PUBLIC_FINHUBIO;

const handleApiError = (error: any) => {
  console.error("API Error:", error);
  throw error;
};

export async function searchStocks(query: string, token: string) {
  try {
    console.log(process.env.FINHUBIO);
    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINHUBIO}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error("Error searching stocks:", error);
    return [];
  }
}

const getAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

export const getAllPortfolios = async (token: string): Promise<Portfolio[]> => {
  try {
    const response = await fetch(`${API_URL}/portfolios`, {
      method: "GET",
      headers: getAuthHeader(token),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch portfolios");
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    return handleApiError(error);
  }
};

export const getPortfolioById = async (
  id: string,
  token: string
): Promise<Portfolio> => {
  try {
    const response = await fetch(`${API_URL}/portfolios/${id}`, {
      method: "GET",
      headers: getAuthHeader(token),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch portfolio");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const createPortfolio = async (
  portfolio: PortfolioInput,
  token: string
): Promise<Portfolio> => {
  try {
    const response = await fetch(`${API_URL}/portfolios`, {
      method: "POST",
      headers: getAuthHeader(token),
      body: JSON.stringify(portfolio),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create portfolio");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const updatePortfolio = async (
  id: string,
  portfolio: PortfolioInput,
  token: string
): Promise<Portfolio> => {
  try {
    const response = await fetch(`${API_URL}/portfolios/${id}`, {
      method: "PUT",
      headers: getAuthHeader(token),
      body: JSON.stringify(portfolio),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update portfolio");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const deletePortfolio = async (
  id: string,
  token: string
): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/portfolios/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(token),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete portfolio");
    }
  } catch (error) {
    handleApiError(error);
  }
};