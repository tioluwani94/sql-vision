// src/app/not-found.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Database className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="text-3xl font-semibold mt-2 mb-4">Page Not Found</h2>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Oops! It looks like the page you&apos;re looking for doesn&apos;t
          exist or has been moved.
        </p>
        <Link href="/">
          <Button>Return to Home</Button>
        </Link>
      </div>
    </div>
  );
}
