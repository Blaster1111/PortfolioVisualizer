'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Portfolio } from "@/types";
import { getAllPortfolios } from "@/lib/api/dashboard";
import Navbar from "@/components/dashboard/Navbar";
import PortfolioList from "@/components/dashboard/PortfolioList";
import CreatePortfolioDialog from "@/components/dashboard/CreatePortfolioDialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useMemo, useCallback } from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  //memo token 
  const token = useMemo(() => session?.backendAccessToken, [session]);

  //memo portfolios for avoid re rendering purpose
  const handlePortfolioCreated = useCallback((newPortfolio: Portfolio) => {
    setPortfolios((prev) => [newPortfolio, ...prev]);
    setIsCreateDialogOpen(false);
  }, []);

  const handlePortfolioDeleted = useCallback((id: string) => {
    setPortfolios((prev) => prev.filter((portfolio) => portfolio.id !== id));
  }, []);

  const handlePortfolioUpdated = useCallback((updatedPortfolio: Portfolio) => {
    setPortfolios((prev) =>
      prev.map((portfolio) =>
        portfolio.id === updatedPortfolio.id ? updatedPortfolio : portfolio
      )
    );
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    let isSubscribed = true;

    const fetchPortfolios = async () => {
      if (!token) {
        console.warn("No backendAccessToken found");
        return;
      }

      try {
        setLoading(true);
        const data = await getAllPortfolios(token);
        if (isSubscribed) {
          setPortfolios(data);
        }
      } catch (err) {
        console.error("Error fetching portfolios:", err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    if (status === "authenticated") {
      fetchPortfolios();
    }

    return () => {
      isSubscribed = false;
    };
  }, [status, token]); 

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (portfolios.length === 0) {
      return (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No portfolios found</h3>
          <p className="text-gray-500 mb-4">Create your first portfolio to get started</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create Portfolio
          </Button>
        </div>
      );
    }

    return (
      <PortfolioList 
        portfolios={portfolios}
        onDelete={handlePortfolioDeleted}
        onUpdate={handlePortfolioUpdated}
      />
    );
  }, [loading, portfolios, handlePortfolioDeleted, handlePortfolioUpdated]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Portfolios</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create Portfolio
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : portfolios.length > 0 ? (
          <PortfolioList 
            portfolios={portfolios}
            onDelete={handlePortfolioDeleted}
            onUpdate={handlePortfolioUpdated}
          />
        ) : (
          <div className="text-center py-10 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-700 mb-2">No portfolios found</h3>
            <p className="text-gray-500 mb-4">Create your first portfolio to get started</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create Portfolio
            </Button>
          </div>
        )}
      </div>
      
      {status === "authenticated" && (
        <CreatePortfolioDialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onPortfolioCreated={handlePortfolioCreated}
          token={session?.backendAccessToken || ""}
        />
      )}
    </div>
  );
}