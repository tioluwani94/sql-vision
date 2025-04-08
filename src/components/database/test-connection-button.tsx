"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface TestConnectionButtonProps {
  formId: string;
  disabled?: boolean;
}

export function TestConnectionButton({
  formId,
  disabled,
}: TestConnectionButtonProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null
  );

  const handleTestConnection = async () => {
    // Reset state
    setIsTesting(true);
    setTestResult(null);

    try {
      // Get the form data
      const form = document.getElementById(formId) as HTMLFormElement;
      if (!form) {
        throw new Error("Form not found");
      }

      console.log(form, "form");

      const formData = new FormData(form);

      // Send request to test connection endpoint
      const response = await fetch("/api/databases/test-connection", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to test connection");
      }

      // Show success message
      setTestResult("success");
      toast.success("Database connection test was successful.");
    } catch (error) {
      console.error("Error testing connection:", error);

      // Show error message
      setTestResult("error");
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to connect to the database. Please check your credentials."
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleTestConnection}
      disabled={disabled || isTesting}
      className="flex items-center gap-2"
    >
      {isTesting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Testing...
        </>
      ) : testResult === "success" ? (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          Connection Successful
        </>
      ) : testResult === "error" ? (
        <>
          <XCircle className="h-4 w-4 text-red-500" />
          Connection Failed
        </>
      ) : (
        "Test Connection"
      )}
    </Button>
  );
}
