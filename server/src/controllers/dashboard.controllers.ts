import { Response } from "express";
import { PrismaClient, Prisma } from "../../generated/prisma";
import { sendResponse } from "../utils/responseHandler";
import { UserRequest, PortfolioInput, PortfolioUpdateInput } from "../types";
import { asyncHandler } from "../utils/asyncHandler";

const prisma = new PrismaClient();

export const createPortfolio = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const {
      name,
      description,
      benchmark,
      startDate,
      endDate,
      stocks,
    }: PortfolioInput = req.body;

    const totalWeight = stocks.reduce((sum, stock) => sum + stock.weight, 0);
    if (totalWeight !== 100) {
      return res.status(400).json({ error: "Total stock weights must equal 100%" });
    }

    // Create portfolio with properly typed data
    const portfolioData: Prisma.PortfolioUncheckedCreateInput = {
      name,
      description: description || null,
      benchmark: benchmark || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      userId,
      stocks: {
        create: stocks.map((stock) => ({
          symbol: stock.symbol,
          weight: stock.weight,
        })),
      },
    };

    const portfolio = await prisma.portfolio.create({
      data: portfolioData,
      include: { stocks: true },
    });

    sendResponse(res, 201, true, portfolio, "Portfolio created successfully");
  }
);

export const getAllPortfolios = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: { stocks: true },
    });

    sendResponse(res, 200, true, portfolios);
  }
);

export const getPortfolioById = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const { id } = req.params;

    const portfolio = await prisma.portfolio.findFirst({
      where: { id, userId },
      include: { stocks: true },
    });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    sendResponse(res, 200, true, portfolio);
  }
);

export const updatePortfolio = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const { id } = req.params;
    const {
      name,
      description,
      benchmark,
      startDate,
      endDate,
      stocks,
    }: PortfolioInput = req.body;

    const totalWeight = stocks.reduce((sum, stock) => sum + stock.weight, 0);
    if (totalWeight !== 100) {
      return res.status(400).json({ error: "Total stock weights must equal 100%" });
    }

    const existing = await prisma.portfolio.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // Update portfolio with properly typed data
    const portfolioUpdateData: Prisma.PortfolioUncheckedUpdateInput = {
      name,
      description: description || null,
      benchmark: benchmark || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      stocks: {
        deleteMany: {},
        create: stocks.map((stock) => ({
          symbol: stock.symbol,
          weight: stock.weight,
        })),
      },
    };

    const updatedPortfolio = await prisma.portfolio.update({
      where: { id },
      data: portfolioUpdateData,
      include: { stocks: true },
    });

    sendResponse(res, 200, true, updatedPortfolio, "Portfolio updated successfully");
  }
);

export const deletePortfolio = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    
    const { id } = req.params;

    const portfolio = await prisma.portfolio.findFirst({ where: { id, userId } });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    await prisma.portfolio.delete({ where: { id } });

    sendResponse(res, 200, true, null, "Portfolio deleted successfully");
  }
);