// src/app/(authenticated)/query/[id]/page.tsx
import Link from "next/link";
import { getQueryById } from "@/app/actions/database-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { QueryResultsTable } from "@/components/query/query-results-table";
import { QueryDataChart } from "@/components/query/query-data-chart";
import { SqlCodeBlock } from "@/components/query/sql-code-block";
import { ExportButtons } from "@/components/query/export-buttons";

interface QueryResultPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function QueryResultPage({
  params,
}: QueryResultPageProps) {
  const { id } = await params;
  const query = await getQueryById(id);

  // Parse the JSON result into a format usable by the components
  const results = {
    columns: Object.keys(query.result[0] || {}),
    rows: query.result,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <Link href="/query">
            <Button variant="ghost" size="sm" className="mb-2">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{query.naturalText}</h1>
          <p className="text-gray-500 mt-1">
            {query.database.name} • {formatDate(query.createdAt)}
          </p>
        </div>

        <div className="flex gap-2 self-end sm:self-auto">
          <Link href={`/query/new?db=${query.databaseId}`}>
            <Button>New Query</Button>
          </Link>
          <ExportButtons results={query.result} fileName={`query-${id}`} />
        </div>
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="query">SQL Query</TabsTrigger>
          <TabsTrigger value="explanation">Explanation</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Results</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryResultsTable results={results} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryDataChart
                data={query.result}
                chartConfig={query.chartConfig}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="query" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated SQL Query</CardTitle>
            </CardHeader>
            <CardContent>
              <SqlCodeBlock code={query.sqlQuery} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explanation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p>{query.explanation}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
