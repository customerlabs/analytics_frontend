import type { CustomerLabsAccountData } from "@/features/customerlabs/components/CustomerLabsAuthorizeModal";

// Channel name for CustomerLabs auth
export const CLABS_AUTH_CHANNEL = "clabs_auth";

export interface AuthChannelMessage {
  type: "AUTH_SUCCESS" | "AUTH_ERROR";
  payload: {
    accountData?: CustomerLabsAccountData;
    error?: string;
  };
}
