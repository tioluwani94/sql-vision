// src/app/page.tsx
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import {
  BarChart3,
  Database,
  MessageSquareText,
  PieChart,
  Search,
  Terminal,
} from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SQLVision</span>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-primary">
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-gray-600 hover:text-primary"
            >
              How It Works
            </a>
          </nav>

          <div className="flex items-center space-x-2">
            {session?.user ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Query Your Databases with{" "}
            <span className="text-primary">Natural Language</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform how you interact with your SQL databases. Ask questions in
            plain English and get instant visualizations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8">
                Get Started
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="px-8">
                Learn More
              </Button>
            </Link>
          </div>

          <div className="mt-16 border rounded-lg overflow-hidden shadow-xl bg-white max-w-4xl mx-auto">
            <div className="border-b bg-gray-50 p-3 flex items-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 text-center text-sm text-gray-600">
                SQLVision Demo
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="text-gray-700 font-medium mb-2">
                  Ask in plain English:
                </div>
                <div className="border rounded-md p-3 bg-gray-50">
                  Show me the top 5 products by revenue for the last quarter
                </div>
              </div>
              <div className="mb-4">
                <div className="text-gray-700 font-medium mb-2">
                  Generated SQL:
                </div>
                <div className="border rounded-md p-3 bg-gray-50 font-mono text-sm overflow-x-auto">
                  SELECT p.product_name, SUM(oi.quantity * oi.unit_price) AS
                  revenue
                  <br />
                  FROM products p<br />
                  JOIN order_items oi ON p.product_id = oi.product_id
                  <br />
                  JOIN orders o ON oi.order_id = o.order_id
                  <br />
                  WHERE o.order_date &gt;= DATE_TRUNC(&quot;quarter&quot;,
                  CURRENT_DATE - INTERVAL &quot;3 months&quot;)
                  <br />
                  AND o.order_date &lt; DATE_TRUNC(&quot;quarter&quot;,
                  CURRENT_DATE)
                  <br />
                  GROUP BY p.product_name
                  <br />
                  ORDER BY revenue DESC
                  <br />
                  LIMIT 5;
                </div>
              </div>
              <div>
                <div className="text-gray-700 font-medium mb-2">
                  Visualization:
                </div>
                <div className="border rounded-md p-4 flex justify-center">
                  <BarChart3 className="h-40 w-full text-primary opacity-75" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border rounded-lg p-6 bg-white shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <MessageSquareText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                Natural Language Queries
              </h3>
              <p className="text-gray-600">
                Ask questions in plain English and get accurate SQL queries
                generated by AI.
              </p>
            </div>

            <div className="border rounded-lg p-6 bg-white shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <PieChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Instant Visualizations</h3>
              <p className="text-gray-600">
                Get automatically generated charts and graphs based on your
                query results.
              </p>
            </div>

            <div className="border rounded-lg p-6 bg-white shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Terminal className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">SQL Explanation</h3>
              <p className="text-gray-600">
                Understand exactly what your generated SQL query is doing with
                AI-powered explanations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

          <div className="max-w-3xl mx-auto">
            <ol className="relative border-l border-gray-200 ml-3">
              <li className="mb-10 ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-primary rounded-full -left-4 ring-4 ring-white">
                  1
                </span>
                <h3 className="flex items-center mb-1 text-lg font-semibold">
                  Connect Your Database
                </h3>
                <p className="mb-4 text-gray-600">
                  Securely connect to your PostgreSQL or MySQL database in just
                  a few clicks.
                </p>
              </li>

              <li className="mb-10 ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-primary rounded-full -left-4 ring-4 ring-white">
                  2
                </span>
                <h3 className="flex items-center mb-1 text-lg font-semibold">
                  Ask Your Question
                </h3>
                <p className="mb-4 text-gray-600">
                  Type your question in plain English - no need to remember
                  complex SQL syntax.
                </p>
              </li>

              <li className="mb-10 ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-primary rounded-full -left-4 ring-4 ring-white">
                  3
                </span>
                <h3 className="flex items-center mb-1 text-lg font-semibold">
                  Get Instant Results
                </h3>
                <p className="mb-4 text-gray-600">
                  See your results in both table format and as automatically
                  generated visualizations.
                </p>
              </li>

              <li className="ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-primary rounded-full -left-4 ring-4 ring-white">
                  4
                </span>
                <h3 className="flex items-center mb-1 text-lg font-semibold">
                  Understand the SQL
                </h3>
                <p className="mb-4 text-gray-600">
                  Review the generated SQL and read an AI-generated explanation
                  of how it works.
                </p>
              </li>
            </ol>
          </div>

          <div className="mt-12 text-center">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8">
                <Search className="mr-2 h-4 w-4" />
                Try SQLVision Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Database className="h-5 w-5" />
              <span className="text-lg font-bold">SQLVision</span>
            </div>

            <div className="text-sm">
              © {new Date().getFullYear()} SQLVision. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
