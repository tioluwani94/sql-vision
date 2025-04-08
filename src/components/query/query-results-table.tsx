"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface QueryResultsTableProps {
  results: {
    columns: string[];
    rows: Record<string, any>[];
  };
}

export function QueryResultsTable({ results }: QueryResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  if (!results.rows.length) {
    return <div className="text-center py-8">No data returned from query</div>;
  }

  const totalPages = Math.ceil(results.rows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = results.rows.slice(startIndex, startIndex + rowsPerPage);

  // Format cell value for display
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "object") {
      if (value instanceof Date) return value.toLocaleString();
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {results.columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {results.columns.map((column) => (
                  <TableCell key={`${rowIndex}-${column}`}>
                    {formatCellValue(row[column])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <div className="text-sm text-gray-500 mt-2">
        Showing {startIndex + 1}-
        {Math.min(startIndex + rowsPerPage, results.rows.length)} of{" "}
        {results.rows.length} results
      </div>
    </div>
  );
}
