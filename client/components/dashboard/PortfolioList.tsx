'use client';

import { Portfolio } from "@/types";
import PortfolioItem from "./PortfolioItem";

interface PortfolioListProps {
  portfolios: Portfolio[];
  onDelete: (id: string) => void;
  onUpdate: (portfolio: Portfolio) => void;
}

export default function PortfolioList({ portfolios, onDelete, onUpdate }: PortfolioListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {portfolios.map((portfolio) => (
        <PortfolioItem
          key={portfolio.id}
          portfolio={portfolio}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}