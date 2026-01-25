/**
 * Account Template Types
 * Matches backend accounts_templates table schema
 */

export type AccountType = "ads" | "customerlabs";

export interface AccountTemplateAssets {
  icon?: string; // e.g., "facebook.svg"
  color?: string; // e.g., "#1877F2"
}

export interface AccountTemplate {
  id: string;
  name: string;
  system_name: string;
  account_type: AccountType;
  platform: string;
  sub_product: string;
  supported_auth_types: string[];
  assets: AccountTemplateAssets;
  additional_data: Record<string, unknown>;
  required_data: string[];
  is_beta: boolean;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
  // Connection status fields (populated when workspace_id provided)
  allows_multiple: boolean; // True for 'ads', False for 'customerlabs'
  is_connected: boolean; // True if workspace already has this connected
  connected_account_id?: string; // The connected account ID if applicable
}

export interface AccountTemplateListResponse {
  templates: AccountTemplate[];
  total: number;
}

export interface AccountTemplateCategory {
  id: string;
  name: string;
  templates: AccountTemplate[];
}
