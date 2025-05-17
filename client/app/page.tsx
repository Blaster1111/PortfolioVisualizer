'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LoginButton from "@/components/login/LoginButton";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") return <div>Loading...</div>;

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoginButton />
      </main>
    );
  }

  return null; 
}
