'use client';

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { PortfolioInput, Portfolio } from "@/types";
import { createPortfolio, searchStocks } from "@/lib/api/dashboard";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface SearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

interface CreatePortfolioDialogProps {
  open: boolean;
  onClose: () => void;
  onPortfolioCreated: (portfolio: Portfolio) => void;
  token: string;
}

function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

export default function CreatePortfolioDialog({
  open,
  onClose,
  onPortfolioCreated,
  token,
}: CreatePortfolioDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stocks, setStocks] = useState<{ symbol: string; weight: number }[]>([]);
  const [stockSymbol, setStockSymbol] = useState("");
  const [stockWeight, setStockWeight] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [benchmarkSearch, setBenchmarkSearch] = useState("");
  const [benchmarkResults, setBenchmarkResults] = useState<SearchResult[]>([]);
  const [isBenchmarkSearching, setIsBenchmarkSearching] = useState(false);
  const [isBenchmarkFocused, setIsBenchmarkFocused] = useState(false);

  const today = new Date();
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(today.getDate() - 2);
  const maxEndDate = format(twoDaysAgo, "yyyy-MM-dd");

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const benchmarkSearchContainerRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<PortfolioInput>();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
      if (benchmarkSearchContainerRef.current && !benchmarkSearchContainerRef.current.contains(event.target as Node)) {
        setIsBenchmarkFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchQuery.trim().length < 1) {
        setSearchResults([]);
        return;
      }
      try {
        setIsSearching(true);
        const results = await searchStocks(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error("Error searching stocks:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(searchTimer);
  }, [searchQuery, token]);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (benchmarkSearch.trim().length < 1) {
        setBenchmarkResults([]);
        return;
      }
      try {
        setIsBenchmarkSearching(true);
        const results = await searchStocks(benchmarkSearch);
        const filteredResults = results.filter((item: { type: string }) => item.type === "ETP");
        setBenchmarkResults(filteredResults);
      } catch (err) {
        console.error("Error searching benchmarks:", err);
      } finally {
        setIsBenchmarkSearching(false);
      }
    }, 300);
    return () => clearTimeout(searchTimer);
  }, [benchmarkSearch, token]);

  const selectStock = (stock: SearchResult) => {
    setStockSymbol(stock.symbol);
    setSearchQuery(stock.description);
    setIsFocused(false);
  };

  const selectBenchmark = (benchmark: SearchResult) => {
    setValue("benchmark", benchmark.symbol);
    setBenchmarkSearch(benchmark.description);
    setIsBenchmarkFocused(false);
  };

  const addStock = () => {
    if (!stockSymbol.trim()) {
      setError("Stock symbol cannot be empty");
      return;
    }
    if (stockWeight <= 0 || stockWeight > 100) {
      setError("Stock weight must be between 1 and 100");
      return;
    }
    const totalWeight = stocks.reduce((sum, stock) => sum + stock.weight, 0) + stockWeight;
    if (totalWeight > 100) {
      setError("Total weight cannot exceed 100%");
      return;
    }
    setStocks([...stocks, { symbol: stockSymbol.toUpperCase(), weight: stockWeight }]);
    setStockSymbol("");
    setStockWeight(0);
    setSearchQuery("");
    setError(null);
  };

  const removeStock = (index: number) => {
    setStocks(stocks.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: PortfolioInput) => {
    try {
      if (stocks.length === 0) {
        setError("You must add at least one stock");
        return;
      }
      const totalWeight = stocks.reduce((sum, stock) => sum + stock.weight, 0);
      if (totalWeight !== 100) {
        setError(`Total weight must equal 100% (currently ${totalWeight}%)`);
        return;
      }

      setIsSubmitting(true);
      setError(null);

      const portfolioData: PortfolioInput = {
        ...data,
        stocks: stocks,
      };

      const newPortfolio = await createPortfolio(portfolioData, token);
      onPortfolioCreated(newPortfolio);
      reset();
      setStocks([]);
    } catch (err: unknown) {
      if (isErrorWithMessage(err)) {
        setError(err.message);
      } else {
        setError("Failed to create portfolio");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    if (!isSubmitting) {
      reset();
      setStocks([]);
      setStockSymbol("");
      setStockWeight(0);
      setSearchQuery("");
      setBenchmarkSearch("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Portfolio</DialogTitle>
          <DialogDescription>
            Create a new investment portfolio with custom allocation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Portfolio Name</Label>
            <Input
              id="name"
              placeholder="My Investment Portfolio"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Portfolio description..."
              {...register("description")}
            />
          </div>

          <div className="space-y-2" ref={benchmarkSearchContainerRef}>
            <Label htmlFor="benchmark">Benchmark (Optional)</Label>
            <div className="relative">
              <Input
                id="benchmarkSearch"
                placeholder="Search for a benchmark (ETPs only)..."
                value={benchmarkSearch}
                onChange={(e) => setBenchmarkSearch(e.target.value)}
                onFocus={() => setIsBenchmarkFocused(true)}
              />
              <input 
                type="hidden" 
                {...register("benchmark")} 
              />
              {isBenchmarkSearching && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              
              {isBenchmarkFocused && benchmarkResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                  {benchmarkResults.map((result) => (
                    <div
                      key={result.symbol}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectBenchmark(result)}
                    >
                      <div className="font-medium">{result.symbol}</div>
                      <div className="text-sm text-gray-500">{result.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date (Optional)</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                max={maxEndDate}
                {...register("endDate")}
              />
              <p className="text-xs text-gray-500">Maximum date: {maxEndDate} (Today - 2 days)</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Stocks</Label>
            <div className="relative" ref={searchContainerRef}>
              <div className="flex space-x-2 mb-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Search for a stock..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>
                <Input
                  type="number"
                  placeholder="Weight (%)"
                  min="0"
                  max="100"
                  value={stockWeight || ""}
                  onChange={(e) => setStockWeight(Number(e.target.value))}
                  className="w-24"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={addStock}
                  disabled={!stockSymbol}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {isFocused && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                  {searchResults.map((result) => (
                    <div
                      key={result.symbol}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectStock(result)}
                    >
                      <div className="font-medium">{result.symbol}</div>
                      <div className="text-sm text-gray-500">{result.description}</div>
                      <div className="text-xs text-gray-400">{result.type}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {stocks.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-2">
                  Total weight: {stocks.reduce((sum, stock) => sum + stock.weight, 0)}% (must equal 100%)
                </p>
                <div className="flex flex-wrap gap-2">
                  {stocks.map((stock, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {stock.symbol}: {stock.weight}%
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => removeStock(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Portfolio"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}