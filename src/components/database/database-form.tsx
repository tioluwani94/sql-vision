"use client";

import { useState } from "react";
import { addDatabase } from "@/app/actions/database-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { TestConnectionButton } from "./test-connection-button";
import { TestSSHConnectionButton } from "./test-ssh-connection-button";

export function DatabaseForm() {
  const [useSSH, setUseSSH] = useState(false);
  const [useSSL, setUseSSL] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sshAdvancedOpen, setSSHAdvancedOpen] = useState(false);
  const [sshAuthType, setSSHAuthType] = useState<string>("password");
  const [databaseType, setDatabaseType] = useState<string>("postgresql");
  const [privateKeyContent, setPrivateKeyContent] = useState<string>("");

  const handlePrivateKeyFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Check file size (max 50KB)
    if (file.size > 50 * 1024) {
      toast.error("Private key file should be less than 50KB.");
      return;
    }

    // Read the file content
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result) {
        const content = event.target.result as string;
        setPrivateKeyContent(content);

        toast.success("Private key file has been loaded successfully.");
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read the private key file.");
    };

    reader.readAsText(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);

      formData.set("ssl", useSSL ? "on" : "off");

      // If not using SSH, remove SSH fields to avoid validation errors
      if (!useSSH) {
        formData.delete("sshHost");
        formData.delete("sshPort");
        formData.delete("sshUsername");
        formData.delete("sshPassword");
        formData.delete("sshPrivateKey");
        formData.delete("sshPassphrase");
      }

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
          <Switch
            id="ssl"
            name="ssl"
            checked={useSSL}
            onCheckedChange={setUseSSL}
          />
          <Label htmlFor="ssl">Use SSL</Label>
        </div>

        {/* SSH Tunnel Section */}
        <div className="pt-4 border-t">
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              id="useSSH"
              name="useSSH"
              checked={useSSH}
              onCheckedChange={setUseSSH}
            />
            <Label htmlFor="useSSH">Connect via SSH Tunnel</Label>
          </div>

          {useSSH && (
            <div className="space-y-4 pl-6 border-l-2 border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sshHost">SSH Host</Label>
                  <Input
                    id="sshHost"
                    name="sshHost"
                    placeholder="ssh.example.com"
                    required={useSSH}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="sshPort">SSH Port</Label>
                  <Input
                    id="sshPort"
                    name="sshPort"
                    type="number"
                    placeholder="22"
                    defaultValue="22"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sshUsername">SSH Username</Label>
                <Input
                  id="sshUsername"
                  name="sshUsername"
                  placeholder="username"
                  required={useSSH}
                  className="mt-1"
                />
              </div>

              <Tabs
                defaultValue="password"
                value={sshAuthType}
                onValueChange={setSSHAuthType}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="password">Password</TabsTrigger>
                  <TabsTrigger value="privateKey">Private Key</TabsTrigger>
                </TabsList>

                <TabsContent value="password" className="pt-4">
                  <div>
                    <Label htmlFor="sshPassword">SSH Password</Label>
                    <Input
                      id="sshPassword"
                      name="sshPassword"
                      type="password"
                      placeholder="••••••••"
                      required={useSSH && sshAuthType === "password"}
                      className="mt-1"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="privateKey" className="pt-4 space-y-4">
                  <div>
                    <Label htmlFor="sshPrivateKey" className="mb-1">
                      Private Key
                    </Label>
                    <div className="flex flex-col gap-2">
                      <Textarea
                        id="sshPrivateKey"
                        name="sshPrivateKey"
                        placeholder="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
                        required={useSSH && sshAuthType === "privateKey"}
                        className="font-mono text-sm"
                        rows={6}
                        value={privateKeyContent}
                        onChange={(e) => setPrivateKeyContent(e.target.value)}
                      />
                      <div className="flex items-center">
                        <Input
                          id="sshPrivateKeyFile"
                          name="sshPrivateKeyFile"
                          type="file"
                          accept=".pem,.key,.ppk"
                          className="max-w-xs"
                          onChange={handlePrivateKeyFileUpload}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Supported formats: OpenSSH, PEM, PPK (Putty). Maximum
                        file size: 50KB.
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sshPassphrase">Passphrase (Optional)</Label>
                    <Input
                      id="sshPassphrase"
                      name="sshPassphrase"
                      type="password"
                      placeholder="Private key passphrase"
                      className="mt-1"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Collapsible
                open={sshAdvancedOpen}
                onOpenChange={setSSHAdvancedOpen}
                className="w-full"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center justify-between w-full"
                  >
                    <span>Advanced SSH Options</span>
                    {sshAdvancedOpen ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <p className="text-sm text-gray-500 mb-2">
                    These options are for advanced users who need specific SSH
                    configurations.
                  </p>
                  {/* Add advanced SSH options here if needed */}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <TestSSHConnectionButton
          formId="database-form"
          disabled={isSubmitting}
        />
        <TestConnectionButton formId="database-form" disabled={isSubmitting} />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Connecting..." : "Connect Database"}
        </Button>
      </div>
    </form>
  );
}
