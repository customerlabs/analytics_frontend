"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createCustomerLabsAccount } from "@/lib/api/accounts";
import { CLABS_AUTH_CHANNEL, type AuthChannelMessage } from "@/lib/broadcast-channel";

type ModalState = "idle" | "authorizing" | "data_received" | "saving" | "error";

export interface CustomerLabsAccountData {
  app_id: string;
  account_id: number;
  account_name: string;
  user_id: number;
  user_email: string;
  timezone?: string;
  region?: string;
}

interface CustomerLabsAuthorizeModalProps {
  workspaceId: string;
  templateId: string;
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated: (accountId: string) => void;
}

export function CustomerLabsAuthorizeModal({
  workspaceId,
  templateId,
  isOpen,
  onClose,
  onAccountCreated,
}: CustomerLabsAuthorizeModalProps) {
  const [state, setState] = useState<ModalState>("idle");
  const [accountData, setAccountData] = useState<CustomerLabsAccountData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const authTabRef = useRef<Window | null>(null);

  // Listen for BroadcastChannel messages from auth tab
  useEffect(() => {
    const channel = new BroadcastChannel(CLABS_AUTH_CHANNEL);

    channel.onmessage = (event: MessageEvent<AuthChannelMessage>) => {
      const { type, payload } = event.data;

      if (type === "AUTH_SUCCESS" && payload.accountData) {
        setState("data_received");
        setAccountData(payload.accountData);
      } else if (type === "AUTH_ERROR") {
        setState("error");
        setError(payload.error || "Authorization failed.");
      }
    };

    return () => channel.close();
  }, []);

  // Monitor if auth tab is closed manually
  useEffect(() => {
    if (state !== "authorizing") return;

    const interval = setInterval(() => {
      if (authTabRef.current?.closed) {
        setState("error");
        setError("Authorization was cancelled. The tab was closed before completing.");
        authTabRef.current = null;
      }
    }, 500);

    return () => clearInterval(interval);
  }, [state]);

  const handleAuthorize = useCallback(() => {
    setState("authorizing");
    setError(null);

    const redirectUri = `${window.location.origin}/api/auth/clabs/callback?workspace_id=${workspaceId}`;
    const selectorUrl =
      process.env.NEXT_PUBLIC_CLABS_ACCOUNT_SELECTOR_URL ||
      "https://app.customerlabs.com/external_api/accounts/select/";

    const authTab = window.open(`${selectorUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`, "_blank");

    if (authTab) {
      authTabRef.current = authTab;
    } else {
      setState("error");
      setError("Could not open authorization tab. Please check your browser settings.");
    }
  }, [workspaceId]);

  const handleSave = useCallback(async () => {
    if (!accountData) return;

    setState("saving");
    setError(null);

    try {
      const account = await createCustomerLabsAccount(workspaceId, accountData, templateId);
      onAccountCreated(account.id);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Failed to create account.");
    }
  }, [accountData, workspaceId, templateId, onAccountCreated]);

  const handleClose = useCallback(() => {
    authTabRef.current?.close();
    authTabRef.current = null;
    setState("idle");
    setAccountData(null);
    setError(null);
    onClose();
  }, [onClose]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && state !== "authorizing" && handleClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="space-y-1.5">
          <SheetTitle className="text-xl font-semibold">Connect CustomerLabs</SheetTitle>
          <SheetDescription>
            Authorize access to your CustomerLabs account to sync your data.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 px-6 py-6 overflow-y-auto">
          {state === "idle" && (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <ExternalLink className="size-5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    A new tab will open for you to log in and select a CustomerLabs account.
                  </p>
                  <Button onClick={handleAuthorize} className="w-full">
                    Authorize with CustomerLabs
                  </Button>
                </div>
              </div>
            </div>
          )}

          {state === "authorizing" && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <div className="relative flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-medium text-foreground">Waiting for Authorization</h3>
                <p className="text-sm text-muted-foreground">Complete the process in the new tab.</p>
              </div>
            </div>
          )}

          {state === "data_received" && accountData && (
            <div className="space-y-6">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-900/20">
                <div className="flex items-start gap-3">
                  <CheckCircle className="size-5 shrink-0 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="font-medium text-green-900 dark:text-green-300">
                      Authorization Successful
                    </h3>
                    <p className="mt-1 text-sm text-green-700 dark:text-green-400/80">
                      Review the account details below and save to continue.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Account Details</h4>
                <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
                  <div className="flex items-center justify-between p-3 bg-muted/30">
                    <span className="text-sm text-muted-foreground">Account Name</span>
                    <span className="text-sm font-medium text-foreground">{accountData.account_name}</span>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <span className="text-sm text-muted-foreground">App ID</span>
                    <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-foreground">
                      {accountData.app_id}
                    </code>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30">
                    <span className="text-sm text-muted-foreground">Connected User</span>
                    <span className="text-sm text-foreground">{accountData.user_email}</span>
                  </div>
                  {accountData.timezone && (
                    <div className="flex items-center justify-between p-3">
                      <span className="text-sm text-muted-foreground">Timezone</span>
                      <span className="text-sm text-foreground">{accountData.timezone}</span>
                    </div>
                  )}
                  {accountData.region && (
                    <div className="flex items-center justify-between p-3 bg-muted/30">
                      <span className="text-sm text-muted-foreground">Region</span>
                      <span className="text-sm text-foreground">{accountData.region}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {state === "saving" && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-6">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-medium text-foreground">Creating Account</h3>
                <p className="text-sm text-muted-foreground">Setting up your workspace account...</p>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-6">
              <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="size-8 text-destructive" />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-medium text-foreground">Authorization Failed</h3>
                <p className="text-sm text-muted-foreground max-w-[280px]">{error}</p>
              </div>
              <Button onClick={() => { setState("idle"); setError(null); }} variant="outline">
                Try Again
              </Button>
            </div>
          )}
        </div>

        <SheetFooter className={cn("border-t pt-4", state === "data_received" ? "flex" : "hidden")}>
          <div className="flex w-full gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={state !== "data_received"} className="flex-1">
              Save & Continue
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
