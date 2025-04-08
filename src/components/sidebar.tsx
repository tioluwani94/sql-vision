// src/components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Database, Home, History, LogOut, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      icon: Home,
      name: "Dashboard",
      href: "/dashboard",
      isSelected: pathname === "/dashboard",
    },
    {
      icon: Database,
      name: "Databases",
      href: "/databases",
      isSelected: pathname.includes("/databases"),
    },
    {
      icon: History,
      href: "/query",
      name: "Query History",
      isSelected: pathname.includes("/query"),
    },
    {
      icon: Settings,
      name: "Settings",
      href: "/settings",
      isSelected: pathname.includes("/settings"),
    },
  ];

  return (
    <div className="flex flex-col h-full w-64 bg-white shadow-md">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold text-primary">SQLVision</h1>
        <p className="text-sm text-gray-500">
          Natural language database queries
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
              item.isSelected
                ? "bg-primary/10 text-primary"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.name}
          </Link>
        ))}

        <div className="pt-4">
          <Link href="/databases/add">
            <Button className="w-full flex items-center justify-center">
              <Plus className="mr-2 h-4 w-4" />
              Add Database
            </Button>
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
