"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface TestSSHConnectionButtonProps {
  formId: string;
  disabled?: boolean;
}

export function TestSSHConnectionButton({
  formId,
  disabled,
}: TestSSHConnectionButtonProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null
  );

  const handleTestSSHConnection = async () => {
    // Reset state
    setIsTesting(true);
    setTestResult(null);

    try {
      // Get the form data
      const form = document.getElementById(formId) as HTMLFormElement;
      if (!form) {
        throw new Error("Form not found");
      }

      const formData = new FormData(form);

      // Send request to test SSH connection endpoint
      const response = await fetch("/api/databases/test-ssh", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to test SSH connection");
      }

      // Show success message
      setTestResult("success");
      toast.success("Successfully established SSH tunnel connection.");
    } catch (error) {
      console.error("Error testing SSH connection:", error);

      // Show error message
      setTestResult("error");
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to establish SSH tunnel. Please check your SSH credentials."
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleTestSSHConnection}
      disabled={disabled || isTesting}
      className="flex items-center gap-2"
    >
      {isTesting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Testing SSH...
        </>
      ) : testResult === "success" ? (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          SSH Successful
        </>
      ) : testResult === "error" ? (
        <>
          <XCircle className="h-4 w-4 text-red-500" />
          SSH Failed
        </>
      ) : (
        "Test SSH Connection"
      )}
    </Button>
  );
}
