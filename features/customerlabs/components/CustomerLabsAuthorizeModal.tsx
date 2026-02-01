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

// localStorage key - must match callback route
const STORAGE_KEY = "clabs_auth_state";

// Modal states
type ModalState = "idle" | "authorizing" | "data_received" | "saving" | "error";

// Account data received from CustomerLabs
export interface CustomerLabsAccountData {
  app_id: string;
  account_id: number;
  account_name: string;
  user_id: number;
  user_email: string;
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

  // Use ref for popup - doesn't trigger re-renders
  const popupRef = useRef<Window | null>(null);
  // Track if authorization is in progress (ref won't be reset by re-renders)
  const isAuthorizingRef = useRef(false);

  // Listen for native storage events from popup
  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !event.newValue) return;

      try {
        const data = JSON.parse(event.newValue);
        if (data.state === "data_received" && data.accountData) {
          isAuthorizingRef.current = false;
          setState("data_received");
          setAccountData(data.accountData);
        } else if (data.state === "error") {
          isAuthorizingRef.current = false;
          setState("error");
          setError(data.error || "Authorization failed.");
        }
        // Clear localStorage after reading
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Invalid JSON, ignore
      }
    }

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Monitor popup closed
  useEffect(() => {
    if (!isAuthorizingRef.current) return;

    const checkPopup = setInterval(() => {
      const popup = popupRef.current;
      if (!popup) {
        clearInterval(checkPopup);
        return;
      }

      try {
        if (popup.closed) {
          clearInterval(checkPopup);
          // Only reset to idle if still authorizing (no data received)
          if (isAuthorizingRef.current) {
            isAuthorizingRef.current = false;
            setState("idle");
          }
        }
      } catch {
        // Cross-origin error - continue monitoring
      }
    }, 500);

    return () => clearInterval(checkPopup);
  }, [state]); // Re-run when state changes to "authorizing"

  const handleAuthorize = useCallback(() => {
    // Mark as authorizing using ref (won't be reset by re-renders)
    isAuthorizingRef.current = true;
    setState("authorizing");
    setError(null);

    const redirectUri = `${window.location.origin}/api/auth/clabs/callback?workspace_id=${workspaceId}`;
    const selectorUrl =
      process.env.NEXT_PUBLIC_CLABS_ACCOUNT_SELECTOR_URL ||
      "https://app.customerlabs.com/external_api/accounts/select/";
    const url = `${selectorUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;

    const popup = window.open(url, "clabs_account", "width=500,height=600,popup=yes");

    if (popup) {
      popupRef.current = popup;
    } else {
      isAuthorizingRef.current = false;
      setState("error");
      setError("Popup blocked. Please allow popups for this site and try again.");
    }
  }, [workspaceId]);

  const handleSave = useCallback(async () => {
    if (!accountData) return;

    setState("saving");
    setError(null);

    try {
      const account = await createCustomerLabsAccount(
        workspaceId,
        accountData,
        templateId
      );
      onAccountCreated(account.id);
    } catch (err) {
      setState("error");
      setError(
        err instanceof Error ? err.message : "Failed to create account. Please try again."
      );
    }
  }, [accountData, workspaceId, templateId, onAccountCreated]);

  const handleRetry = useCallback(() => {
    setState("idle");
    setError(null);
    setAccountData(null);
  }, []);

  const handleClose = useCallback(() => {
    // Close popup if still open
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
    isAuthorizingRef.current = false;
    localStorage.removeItem(STORAGE_KEY);
    setState("idle");
    setAccountData(null);
    setError(null);
    onClose();
  }, [onClose]);

  // Only allow closing via overlay/escape when NOT authorizing
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isAuthorizingRef.current) {
        handleClose();
      }
    },
    [handleClose]
  );

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="space-y-1.5">
          <SheetTitle className="text-xl font-semibold">Connect CustomerLabs</SheetTitle>
          <SheetDescription>
            Authorize access to your CustomerLabs account to sync your data.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 py-6 overflow-y-auto">
          {/* Idle State */}
          {state === "idle" && (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <ExternalLink className="size-5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    A popup window will open for you to log in and select a CustomerLabs account.
                  </p>
                  <Button onClick={handleAuthorize} className="w-full">
                    Authorize with CustomerLabs
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Authorizing State */}
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
                <p className="text-sm text-muted-foreground">
                  Complete the process in the popup window.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Do not close this panel until finished.
                </p>
              </div>
            </div>
          )}

          {/* Data Received State */}
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
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="divide-y divide-border">
                    <div className="flex items-center justify-between p-3 bg-muted/30">
                      <span className="text-sm text-muted-foreground">Account Name</span>
                      <span className="text-sm font-medium text-foreground">
                        {accountData.account_name}
                      </span>
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
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Saving State */}
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

          {/* Error State */}
          {state === "error" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 shrink-0 text-destructive" />
                  <div>
                    <h3 className="font-medium text-foreground">Authorization Failed</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Common Issues</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground/50">-</span>
                    <span>Popup blocker prevented the window from opening</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground/50">-</span>
                    <span>The popup was closed before completing authorization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground/50">-</span>
                    <span>Session expired or network connection was lost</span>
                  </li>
                </ul>
              </div>

              <Button onClick={handleRetry} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <SheetFooter
          className={cn("border-t pt-4", state === "data_received" ? "flex" : "hidden")}
        >
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
