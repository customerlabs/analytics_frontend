"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Building2,
} from "lucide-react";
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
import {
  listFacebookAdAccounts,
  createFacebookAdsAccount,
  clearFacebookToken,
  type AccountResponse,
} from "../../server/actions";
import type { FacebookAdAccount } from "../../server/metaGraph";

type ModalState =
  | "idle"
  | "authorizing"
  | "loading_accounts"
  | "accounts_loaded"
  | "saving"
  | "error";

interface FacebookAuthorizeModalProps {
  workspaceId: string;
  templateId: string;
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated: (account: AccountResponse) => void;
}

export function FacebookAuthorizeModal({
  workspaceId,
  templateId,
  isOpen,
  onClose,
  onAccountCreated,
}: FacebookAuthorizeModalProps) {
  const [state, setState] = useState<ModalState>("idle");
  const [adAccounts, setAdAccounts] = useState<FacebookAdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<FacebookAdAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const authTabRef = useRef<Window | null>(null);

  // Listen for postMessage and BroadcastChannel from auth popup
  useEffect(() => {
    if (!isOpen) return;

    const handleAuthMessage = async (data: { type: string; payload: { error?: string } }) => {
      const { type, payload } = data;

      if (!type || !payload) return;

      if (type === "AUTH_SUCCESS") {
        authTabRef.current = null;
        setState("loading_accounts");
        try {
          const { accounts } = await listFacebookAdAccounts();
          setAdAccounts(accounts);
          setState("accounts_loaded");

          if (accounts.length === 1) {
            setSelectedAccount(accounts[0]);
          }
        } catch (err) {
          setState("error");
          setError(
            err instanceof Error ? err.message : "Failed to load ad accounts."
          );
        }
      } else if (type === "AUTH_ERROR") {
        authTabRef.current = null;
        setState("error");
        setError(payload.error || "Authorization failed.");
      }
    };

    // Listen for postMessage (when window.opener is available)
    const handlePostMessage = (event: MessageEvent) => {
      if (event.data?.type && event.data?.payload) {
        handleAuthMessage(event.data);
      }
    };

    // Listen for BroadcastChannel (fallback when window.opener is null)
    const channel = new BroadcastChannel("fb_auth");
    channel.onmessage = (event) => {
      handleAuthMessage(event.data);
    };

    window.addEventListener("message", handlePostMessage);

    return () => {
      window.removeEventListener("message", handlePostMessage);
      channel.close();
    };
  }, [isOpen]);

  const handleAuthorize = useCallback(() => {
    setState("authorizing");
    setError(null);
    setAdAccounts([]);
    setSelectedAccount(null);

    // Build Facebook OAuth URL directly (no /start route)
    const FB_API_VERSION =
      process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION || "v24.0";
    const oauthUrl = new URL(
      `https://www.facebook.com/${FB_API_VERSION}/dialog/oauth`
    );
    oauthUrl.searchParams.set(
      "client_id",
      process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!
    );
    oauthUrl.searchParams.set(
      "config_id",
      process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID!
    );
    oauthUrl.searchParams.set("response_type", "code");
    oauthUrl.searchParams.set(
      "redirect_uri",
      `https://beta.customerlabs.co/integrations/fb-su-cb-dummy/`
    );
    // State param required by Facebook OAuth (random value for CSRF)
    oauthUrl.searchParams.set("state", crypto.randomUUID());

    const authTab = window.open(oauthUrl.toString(), "_blank");

    if (authTab) {
      authTabRef.current = authTab;
    } else {
      setState("error");
      setError(
        "Could not open authorization window. Please check your popup blocker."
      );
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedAccount) return;

    setState("saving");
    setError(null);

    try {
      const account = await createFacebookAdsAccount({
        workspaceId,
        templateId,
        adAccount: selectedAccount,
      });
      onAccountCreated(account);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Failed to create account.");
    }
  }, [selectedAccount, workspaceId, templateId, onAccountCreated]);

  const handleClose = useCallback(async () => {
    authTabRef.current?.close();
    authTabRef.current = null;
    setState("idle");
    setAdAccounts([]);
    setSelectedAccount(null);
    setError(null);

    // Clear encrypted token cookie
    await clearFacebookToken();

    onClose();
  }, [onClose]);

  const getAccountStatusLabel = (status: number) => {
    switch (status) {
      case 1:
        return "Active";
      case 2:
        return "Disabled";
      case 3:
        return "Unsettled";
      default:
        return "Unknown";
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) =>
        !open && state !== "authorizing" && state !== "saving" && handleClose()
      }
    >
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="space-y-1.5">
          <SheetTitle className="text-xl font-semibold">
            Connect Meta Ads
          </SheetTitle>
          <SheetDescription>
            Authorize access to your Meta Business ad accounts.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 py-6 overflow-y-auto">
          {state === "idle" && (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#1877F2]/10">
                  <ExternalLink className="size-5 text-[#1877F2]" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    A new tab will open for you to log in to Facebook and
                    authorize access to your ad accounts.
                  </p>
                  <Button
                    onClick={handleAuthorize}
                    className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90"
                  >
                    Continue with Facebook
                  </Button>
                </div>
              </div>
            </div>
          )}

          {state === "authorizing" && (
            <div className="flex h-full min-h-75 flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-[#1877F2]/20" />
                <div className="relative flex size-16 items-center justify-center rounded-full bg-[#1877F2]/10">
                  <Loader2 className="size-8 animate-spin text-[#1877F2]" />
                </div>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-medium text-foreground">
                  Waiting for Authorization
                </h3>
                <p className="text-sm text-muted-foreground">
                  Complete the process in the new tab.
                </p>
              </div>
            </div>
          )}

          {state === "loading_accounts" && (
            <div className="flex h-full min-h-75 flex-col items-center justify-center gap-6">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#1877F2]/10">
                <Loader2 className="size-8 animate-spin text-[#1877F2]" />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-medium text-foreground">
                  Loading Ad Accounts
                </h3>
                <p className="text-sm text-muted-foreground">
                  Fetching your available ad accounts...
                </p>
              </div>
            </div>
          )}

          {state === "accounts_loaded" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-900/20">
                <div className="flex items-start gap-3">
                  <CheckCircle className="size-5 shrink-0 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="font-medium text-green-900 dark:text-green-300">
                      Authorization Successful
                    </h3>
                    <p className="mt-1 text-sm text-green-700 dark:text-green-400/80">
                      Select an ad account to connect.
                    </p>
                  </div>
                </div>
              </div>

              {adAccounts.length === 0 ? (
                <div className="rounded-lg border border-border p-6 text-center">
                  <Building2 className="mx-auto size-8 text-muted-foreground/50" />
                  <h3 className="mt-3 text-sm font-medium text-foreground">
                    No Ad Accounts Found
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You don&apos;t have access to any active ad accounts.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">
                    Select an Ad Account ({adAccounts.length})
                  </h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {adAccounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => setSelectedAccount(account)}
                        className={cn(
                          "w-full rounded-lg border p-4 text-left transition-all",
                          selectedAccount?.id === account.id
                            ? "border-[#1877F2] bg-[#1877F2]/5 ring-1 ring-[#1877F2]"
                            : "border-border hover:border-[#1877F2]/30 hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h5 className="truncate font-medium text-foreground">
                              {account.name}
                            </h5>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              ID: {account.account_id}
                            </p>
                            {account.business_name && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Business: {account.business_name}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              {getAccountStatusLabel(account.account_status)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {account.currency}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {state === "saving" && (
            <div className="flex h-full min-h-75 flex-col items-center justify-center gap-6">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#1877F2]/10">
                <Loader2 className="size-8 animate-spin text-[#1877F2]" />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-medium text-foreground">
                  Connecting Account
                </h3>
                <p className="text-sm text-muted-foreground">
                  Setting up your ad account connection...
                </p>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="flex h-full min-h-75 flex-col items-center justify-center gap-6">
              <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="size-8 text-destructive" />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-medium text-foreground">
                  Connection Failed
                </h3>
                <p className="text-sm text-muted-foreground max-w-70">
                  {error}
                </p>
              </div>
              <Button
                onClick={() => {
                  setState("idle");
                  setError(null);
                }}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        <SheetFooter
          className={cn(
            "border-t pt-4",
            state === "accounts_loaded" && adAccounts.length > 0 ? "flex" : "hidden"
          )}
        >
          <div className="flex w-full gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedAccount}
              className="flex-1 bg-[#1877F2] hover:bg-[#1877F2]/90"
            >
              Connect Account
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
