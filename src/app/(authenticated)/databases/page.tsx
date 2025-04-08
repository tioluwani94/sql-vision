// src/app/(authenticated)/databases/page.tsx
import { DeleteDatabaseButton } from "@/components/database/delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Database, Plus, Search } from "lucide-react";
import Link from "next/link";

export default async function DatabasesPage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email ?? "" },
  });

  if (!user) {
    return <div>User not found</div>;
  }

  const databases = await prisma.database.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Count queries for each database
  const databaseStats = await Promise.all(
    databases.map(async (db) => {
      const queryCount = await prisma.query.count({
        where: { databaseId: db.id },
      });

      return {
        ...db,
        queryCount,
      };
    })
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Databases</h1>
        <Link href="/databases/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Database
          </Button>
        </Link>
      </div>

      {databases.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium">No databases added yet</h3>
              <p className="text-gray-500">
                Connect a database to start running natural language queries.
              </p>
              <Link href="/databases/add">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Database
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {databaseStats.map((db) => (
            <Card key={db.id}>
              <CardHeader>
                <CardTitle>{db.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm">
                    <p>
                      <span className="font-medium">Type:</span> {db.type}
                    </p>
                    <p>
                      <span className="font-medium">Host:</span> {db.host}:
                      {db.port}
                    </p>
                    <p>
                      <span className="font-medium">Database:</span> {db.dbName}
                    </p>
                    {db.useSSH && (
                      <p>
                        <span className="font-medium">SSH:</span> {db.sshHost}:
                        {db.sshPort || 22}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Added:</span>{" "}
                      {formatDate(db.createdAt)}
                    </p>
                    <p>
                      <span className="font-medium">Queries run:</span>{" "}
                      {db.queryCount}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Link href={`/query/new?db=${db.id}`} className="flex-1">
                      <Button variant="default" className="w-full">
                        <Search className="mr-2 h-4 w-4" />
                        Query
                      </Button>
                    </Link>
                    <DeleteDatabaseButton id={db.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
