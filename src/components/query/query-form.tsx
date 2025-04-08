"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { executeNaturalLanguageQuery } from "@/app/actions/database-actions";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface QueryFormProps {
  databases: any[];
  initialSelectedDatabase: string;
}

export function QueryForm({
  databases,
  initialSelectedDatabase,
}: QueryFormProps) {
  const [selectedDatabase, setSelectedDatabase] = useState(
    initialSelectedDatabase
  );
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!query.trim()) {
      toast.error("Please enter a natural language query");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await executeNaturalLanguageQuery(selectedDatabase, query);

      // Navigate to the query result page
      router.push(`/query/${result.id}`);
    } catch (error) {
      console.error("Error executing query:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to execute query"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="database">Select Database</Label>
            <Select
              value={selectedDatabase}
              onValueChange={setSelectedDatabase}
              disabled={isSubmitting}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a database" />
              </SelectTrigger>
              <SelectContent>
                {databases.map((db) => (
                  <SelectItem key={db.id} value={db.id}>
                    {db.name} ({db.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="query">Natural Language Query</Label>
            <Textarea
              id="query"
              placeholder="Example: Show me the top 10 customers by revenue for the past month"
              className="min-h-[120px] mt-1"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-sm text-gray-500 mt-1">
              Ask questions in plain English, and SQLVision will convert them
              into SQL queries.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Run Query"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
