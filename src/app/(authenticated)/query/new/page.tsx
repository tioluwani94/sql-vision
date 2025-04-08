// src/app/(authenticated)/query/new/page.tsx
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { QueryForm } from "@/components/query/query-form";
import { auth } from "@/lib/auth";

interface NewQueryPageProps {
  searchParams: {
    db?: string;
  };
}

export default async function NewQueryPage({
  searchParams,
}: NewQueryPageProps) {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  // Get user's databases
  const databases = await prisma.database.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  if (databases.length === 0) {
    redirect("/databases/add?message=You need to add a database first");
  }

  // Pre-selected database (from query param)
  let selectedDatabase = searchParams?.db;

  // If specified database doesn't exist or doesn't belong to user, ignore it
  if (selectedDatabase) {
    const dbExists = databases.some((db) => db.id === selectedDatabase);
    if (!dbExists) {
      selectedDatabase = undefined;
    }
  }

  // If no database selected, use the first one
  if (!selectedDatabase) {
    selectedDatabase = databases[0].id;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">New Natural Language Query</h1>
      <QueryForm
        databases={databases}
        initialSelectedDatabase={selectedDatabase}
      />
    </div>
  );
}
