'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Portfolio } from "@/types";
import { deletePortfolio } from "@/lib/api/dashboard";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, ExternalLink, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditPortfolioDialog from "./EditPortfolioDialog";

interface PortfolioItemProps {
  portfolio: Portfolio;
  onDelete: (id: string) => void;
  onUpdate: (portfolio: Portfolio) => void;
}

export default function PortfolioItem({ portfolio, onDelete, onUpdate }: PortfolioItemProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    try {
      const token = session?.backendAccessToken;
      if (!token) return;

      setIsDeleting(true);
      await deletePortfolio(portfolio.id, token);
      onDelete(portfolio.id);
    } catch (err) {
      console.error("Error deleting portfolio:", err);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };


  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{portfolio.name}</CardTitle>
              {portfolio.description && (
                <CardDescription>{portfolio.description}</CardDescription>
              )}
            </div>
            {portfolio.benchmark && (
              <Badge variant="outline">Benchmark: {portfolio.benchmark}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
              <p>{(formatDate(portfolio.startDate))}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">End Date</h3>
              <p>{(formatDate(portfolio.endDate))}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Stocks</h3>
            {portfolio.stocks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {portfolio.stocks.slice(0, 5).map((stock) => (
                  <Badge key={stock.id} variant="secondary">
                    {stock.symbol}: {stock.weight}%
                  </Badge>
                ))}
                {portfolio.stocks.length > 5 && (
                  <Badge variant="secondary">
                    +{portfolio.stocks.length - 5} more
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No stocks defined</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/portfolio/${portfolio.id}`)}
          >
            View Details <ExternalLink className="ml-1 h-4 w-4" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the portfolio
              &quot;{portfolio.name}&quot; and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditPortfolioDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onPortfolioUpdated={onUpdate}
        token={session?.backendAccessToken || ""}
        portfolio={portfolio}
      />
    </>
  );
}