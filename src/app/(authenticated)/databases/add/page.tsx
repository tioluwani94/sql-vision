// src/app/(authenticated)/databases/add/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatabaseForm } from "@/components/database/database-form";
import { ChevronLeft } from "lucide-react";

export default function AddDatabasePage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/databases">
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Databases
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Add New Database</h1>
        <p className="text-gray-500 mt-1">
          Connect to your SQL database to start querying with natural language
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Connection Details</CardTitle>
          <CardDescription>
            Enter the connection details for your database. Your credentials are
            encrypted before storing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DatabaseForm />
        </CardContent>
      </Card>
    </div>
  );
}
