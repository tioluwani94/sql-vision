"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface SqlCodeBlockProps {
  code: string;
}

export function SqlCodeBlock({ code }: SqlCodeBlockProps) {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.info("SQL query copied to clipboard");
    } catch (error) {
      console.error("Failed to copy code:", error);
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <div className="relative">
      <div className="absolute right-2 top-2">
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="h-7 w-7 p-0"
        >
          <Copy className="h-3.5 w-3.5" />
          <span className="sr-only">Copy code</span>
        </Button>
      </div>
      <pre className="bg-secondary p-4 rounded-md overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}
