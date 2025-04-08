// src/app/(authenticated)/query-history/page.tsx
import Link from "next/link";
import { getQueryHistory } from "@/app/actions/database-actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, truncate } from "@/lib/utils";
import { History, Plus } from "lucide-react";

export default async function QueryHistoryPage() {
  const queries = await getQueryHistory();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Query History</h1>
        <Link href="/query/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Query
          </Button>
        </Link>
      </div>

      {queries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <History className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No queries yet</h3>
          <p className="text-gray-500 mb-4">
            Run your first natural language query to see the history.
          </p>
          <Link href="/query/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Query
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead>Database</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queries.map((query) => (
                  <TableRow key={query.id}>
                    <TableCell>{truncate(query.naturalText, 70)}</TableCell>
                    <TableCell>{query.database.name}</TableCell>
                    <TableCell>{formatDate(query.createdAt)}</TableCell>
                    <TableCell>
                      <Link href={`/query/${query.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
