'use client';
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronRight, LineChart, Lock, BarChart3 } from "lucide-react";

export default function LoginButton() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b px-10">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.07)]">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="inline-flex justify-center mb-5 rounded-full bg-blue-100 p-4 shadow-md">
            <LineChart className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900">Portfolio Analyzer</h1>
          <p className="mt-2 text-gray-600 text-base">Powerful insights for your investments</p>
        </div>
        {/* Feature Highlights */}
        <div className="space-y-5 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-100 shadow-inner">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-700 font-medium">
              Advanced performance analytics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-100 shadow-inner">
              <LineChart className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-700 font-medium">Visual graphs for analysis</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 shadow-inner">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-700 font-medium">Private investment tracking</p>
          </div>
        </div>
        {/* Sign In Button */}
        <div className="pt-2">
          <Button
            onClick={() => signIn("google")}
            variant="default"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 text-white flex items-center justify-center space-x-3 rounded-xl font-semibold shadow-lg transition duration-200"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="currentColor"
              focusable="false"
            >
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              <path fill="none" d="M1 1h22v22H1z" />
            </svg>
            <span>Sign in with Google</span>
            <ChevronRight className="w-5 h-5 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
          <p className="mt-6 text-xs text-center text-gray-500 max-w-xs mx-auto">
            By signing in, you agree to our{' '}
            <a href="/terms" className="underline hover:text-blue-600 transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline hover:text-blue-600 transition-colors">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}