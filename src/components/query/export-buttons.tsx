"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { downloadAsCSV, downloadAsJSON } from "@/lib/utils";

interface ExportButtonsProps {
  results: any[] | null;
  fileName: string;
}

export function ExportButtons({ results, fileName }: ExportButtonsProps) {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => downloadAsCSV(results, `${fileName}.csv`)}
        >
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => downloadAsJSON(results, `${fileName}.json`)}
        >
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
