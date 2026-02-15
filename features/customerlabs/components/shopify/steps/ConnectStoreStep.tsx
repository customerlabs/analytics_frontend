"use client";

import { useState } from "react";
import { Store, Key, ExternalLink, AlertCircle, X, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useShopifyImport } from "@/features/customerlabs/hooks/useShopifyImport";
import { isValidShopifyDomain } from "@/features/customerlabs/utils/shopify-helpers";

// Shopify App Store URL - replace with actual URL
const SHOPIFY_APP_STORE_URL = "https://apps.shopify.com/customerlabs-1pd-capi-tracking";

export function ConnectStoreStep() {
  const {
    customAppForm,
    updateCustomAppForm,
    connectStore,
    isConnecting,
    error,
    setError,
  } = useShopifyImport();

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!customAppForm.shopifyDomain) {
      errors.shopifyDomain = "Shopify domain is required";
    } else if (!isValidShopifyDomain(customAppForm.shopifyDomain)) {
      errors.shopifyDomain = "Please enter a valid Shopify domain (e.g., mystore.myshopify.com)";
    }

    if (!customAppForm.clientId) {
      errors.clientId = "Client ID is required";
    }

    if (!customAppForm.clientSecret) {
      errors.clientSecret = "Client Secret is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    connectStore(customAppForm);
  };

  // Open Shopify App Store
  const openAppStore = () => {
    window.open(SHOPIFY_APP_STORE_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium">Connect Your Shopify Store</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you&apos;d like to connect your store
        </p>
      </div>

      {/* Tabs: CustomerLabs App | Custom App */}
      <Tabs defaultValue="custom-app" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="customerlabs-app" className="flex-1">
            <Store className="w-4 h-4 mr-2" />
            CustomerLabs App
          </TabsTrigger>
          <TabsTrigger value="custom-app" className="flex-1">
            <Key className="w-4 h-4 mr-2" />
            Custom App
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: CustomerLabs App */}
        <TabsContent value="customerlabs-app" className="mt-4 space-y-4">
          <div className="rounded-lg border border-border p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium flex items-center gap-2">
                  Install Shopify App
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Quick setup - Install our app from the Shopify App Store
                </p>
              </div>
            </div>
            <Button onClick={openAppStore} variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Install from Shopify App Store
            </Button>
          </div>
        </TabsContent>

        {/* Tab 2: Custom App */}
        <TabsContent value="custom-app" className="mt-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="shrink-0 text-destructive/70 hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="rounded-lg border border-border p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Connect via Custom App</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Manually enter your Shopify app credentials
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Shopify Domain */}
              <div className="space-y-2">
                <Label htmlFor="shopifyDomain">
                  Shopify Domain <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="shopifyDomain"
                  placeholder="mystore.myshopify.com"
                  value={customAppForm.shopifyDomain}
                  onChange={(e) => {
                    updateCustomAppForm({ shopifyDomain: e.target.value });
                    setValidationErrors((prev) => ({ ...prev, shopifyDomain: "" }));
                  }}
                  className={cn(validationErrors.shopifyDomain && "border-destructive")}
                />
                {validationErrors.shopifyDomain && (
                  <p className="text-xs text-destructive">{validationErrors.shopifyDomain}</p>
                )}
              </div>

              {/* Client ID */}
              <div className="space-y-2">
                <Label htmlFor="clientId">
                  Client ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="clientId"
                  placeholder="Enter your Shopify Client ID"
                  value={customAppForm.clientId}
                  onChange={(e) => {
                    updateCustomAppForm({ clientId: e.target.value });
                    setValidationErrors((prev) => ({ ...prev, clientId: "" }));
                  }}
                  className={cn(validationErrors.clientId && "border-destructive")}
                />
                {validationErrors.clientId && (
                  <p className="text-xs text-destructive">{validationErrors.clientId}</p>
                )}
              </div>

              {/* Client Secret */}
              <div className="space-y-2">
                <Label htmlFor="clientSecret">
                  Client Secret <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="clientSecret"
                  type="password"
                  placeholder="Enter your Shopify Client Secret"
                  value={customAppForm.clientSecret}
                  onChange={(e) => {
                    updateCustomAppForm({ clientSecret: e.target.value });
                    setValidationErrors((prev) => ({ ...prev, clientSecret: "" }));
                  }}
                  className={cn(validationErrors.clientSecret && "border-destructive")}
                />
                {validationErrors.clientSecret && (
                  <p className="text-xs text-destructive">{validationErrors.clientSecret}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Connect with Custom App"}
              </Button>
            </form>
          </div>

          {/* Instructions Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="instructions" className="border rounded-lg px-4 bg-muted/70">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium">How to Create a Shopify App and Get Credentials?</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Follow these steps to create an app using the Shopify Dev Dashboard
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm">
                <ol className="list-decimal list-outside ml-5 space-y-5">
                  <li>
                    <span className="font-semibold text-foreground">Access Dev Dashboard</span>
                    <p className="text-muted-foreground mt-1.5">
                      Open shopify admin panel and click on{" "}
                      <a
                        href="https://admin.shopify.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-primary/80"
                      >
                        Apps
                      </a>
                      .
                    </p>
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Build from Dev Dashboard</span>
                    <p className="text-muted-foreground mt-1.5">
                      Click on &quot;Build an app from Dev Dashboard&quot;.
                    </p>
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Create a New App</span>
                    <p className="text-muted-foreground mt-1.5">
                      Click <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">&quot;Create app&quot;</code> in the top right corner of the screen. In the{" "}
                      <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">&quot;Start from Dev Dashboard&quot;</code> section, name your app (e.g.,{" "}
                      <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">&quot;CustomerLabs Integration&quot;</code>), then click{" "}
                      <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">&quot;Create&quot;</code>.
                    </p>
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Create a Version</span>
                    <p className="text-muted-foreground mt-1.5">
                      From the <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">&quot;Versions&quot;</code> tab of your app, complete the following:
                    </p>
                    <div className="ml-0 mt-2 space-y-3">
                      <ul className="list-disc list-outside ml-5 text-muted-foreground">
                        <li>Enter or select your app scopes. Enable these required permissions:</li>
                      </ul>
                      <div className="flex flex-wrap gap-2 ml-5">
                        <div className="flex items-center gap-2 bg-muted border border-border px-3 py-1.5 rounded">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <code className="text-xs font-mono">read_orders</code>
                        </div>
                        <div className="flex items-center gap-2 bg-muted border border-border px-3 py-1.5 rounded">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <code className="text-xs font-mono">read_products</code>
                        </div>
                        <div className="flex items-center gap-2 bg-muted border border-border px-3 py-1.5 rounded">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <code className="text-xs font-mono">read_customers</code>
                        </div>
                      </div>
                      <p className="text-muted-foreground">
                        Click <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">&quot;Release&quot;</code> to create the version.
                      </p>
                    </div>
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Install Your App</span>
                    <p className="text-muted-foreground mt-1.5">To install your app using custom distribution:</p>
                    <ol className="list-decimal list-outside ml-5 mt-3 space-y-2 text-muted-foreground">
                      <li>From your app, select <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">&quot;Home&quot;</code> in the left panel</li>
                      <li>In the home screen, select <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">&quot;Distribution&quot;</code></li>
                      <li>Select <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">&quot;Custom distribution&quot;</code></li>
                      <li>Enter your Shopify store URL (e.g., <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">https://your-store.myshopify.com</code>)</li>
                      <li>Click <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">&quot;Create link&quot;</code> to generate an installation link</li>
                      <li>Use the generated installation link to install the app on your Shopify store</li>
                    </ol>
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Retrieve Client ID and Client Secret</span>
                    <p className="text-muted-foreground mt-1.5">To get your app credentials:</p>
                    <ol className="list-decimal list-outside ml-5 mt-3 space-y-2 text-muted-foreground">
                      <li>In the Dev Dashboard, click <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">&quot;Apps&quot;</code> and select your app</li>
                      <li>Click <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">&quot;Settings&quot;</code></li>
                      <li>View or copy your <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">Client ID</code> and <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">Client Secret</code></li>
                    </ol>
                    <p className="text-muted-foreground mt-3 text-xs">
                      <strong className="text-foreground">Note:</strong> Keep your Client Secret secure. You can rotate credentials from the Settings page if needed. When you rotate the credentials, you need to update the Client ID and Client Secret in the CustomerLabs source configuration.
                    </p>
                  </li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
}
