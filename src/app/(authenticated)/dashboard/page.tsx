// src/app/(authenticated)/dashboard/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Database, History, Search } from "lucide-react";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email },
  });

  if (!user) {
    return <div>User not found</div>;
  }

  // Get user's databases
  const databases = await prisma.database.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // Get recent queries
  const recentQueries = await prisma.query.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      database: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Databases</CardTitle>
            <CardDescription>Your connected databases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{databases.length}</div>
            <div className="mt-4">
              <Link href="/databases">
                <Button variant="outline" size="sm">
                  <Database className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Queries</CardTitle>
            <CardDescription>Queries executed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {await prisma.query.count({
                where: { userId: user.id },
              })}
            </div>
            <div className="mt-4">
              <Link href="/query">
                <Button variant="outline" size="sm">
                  <History className="mr-2 h-4 w-4" />
                  View History
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Link href="/query/new">
                <Button className="w-full justify-start" variant="outline">
                  <Search className="mr-2 h-4 w-4" />
                  New Query
                </Button>
              </Link>
              <Link href="/databases/add">
                <Button className="w-full justify-start" variant="outline">
                  <Database className="mr-2 h-4 w-4" />
                  Add Database
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Databases</CardTitle>
            <CardDescription>Your recently added databases</CardDescription>
          </CardHeader>
          <CardContent>
            {databases.length === 0 ? (
              <p className="text-sm text-gray-500">No databases added yet.</p>
            ) : (
              <div className="space-y-4">
                {databases.map((db) => (
                  <div
                    key={db.id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">{db.name}</p>
                      <p className="text-sm text-gray-500">
                        {db.type} • {db.host}
                      </p>
                    </div>
                    <Link href={`/query/new?db=${db.id}`}>
                      <Button size="sm" variant="outline">
                        Query
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href="/databases">
                <Button variant="outline" size="sm">
                  View All Databases
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Queries</CardTitle>
            <CardDescription>Your recently executed queries</CardDescription>
          </CardHeader>
          <CardContent>
            {recentQueries.length === 0 ? (
              <p className="text-sm text-gray-500">No queries executed yet.</p>
            ) : (
              <div className="space-y-4">
                {recentQueries.map((query) => (
                  <div
                    key={query.id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">
                        {query.naturalText.substring(0, 40)}...
                      </p>
                      <p className="text-sm text-gray-500">
                        {query.database.name} • {formatDate(query.createdAt)}
                      </p>
                    </div>
                    <Link href={`/query/${query.id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href="/query">
                <Button variant="outline" size="sm">
                  View All Queries
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
