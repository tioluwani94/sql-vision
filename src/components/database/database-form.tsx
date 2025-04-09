"use client";

import { addDatabase } from "@/app/actions/database-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { TestConnectionButton } from "./test-connection-button";

export function DatabaseForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [databaseType, setDatabaseType] = useState<string>("postgresql");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);

      await addDatabase(formData);
      toast.error("Your database has been successfully connected.");
    } catch (error) {
      console.error("Error adding database:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add the database"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form id="database-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Database Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="My Production Database"
            required
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            A friendly name to identify this connection
          </p>
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            name="description"
            placeholder="Production database with customer data"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="type" className="mb-1">
            Database Type
          </Label>
          <Select
            name="type"
            defaultValue={databaseType}
            onValueChange={setDatabaseType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select database type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="postgresql">PostgreSQL</SelectItem>
              <SelectItem value="mysql">MySQL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              name="host"
              placeholder="localhost or 127.0.0.1"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              name="port"
              type="number"
              placeholder={databaseType === "postgresql" ? "5432" : "3306"}
              defaultValue={databaseType === "postgresql" ? "5432" : "3306"}
              required
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="dbName">Database Name</Label>
          <Input
            id="dbName"
            name="dbName"
            placeholder="my_database"
            required
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              placeholder="postgres"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="ssl" name="ssl" />
          <Label htmlFor="ssl">Use SSL</Label>
        </div>
      </div>

      <div className="flex justify-between">
        <TestConnectionButton formId="database-form" disabled={isSubmitting} />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Connecting..." : "Connect Database"}
        </Button>
      </div>
    </form>
  );
}
