"use client";

import { useQuery } from "@tanstack/react-query";
import {
  listAccountTemplates,
  listAccountTemplatesByCategory,
  getAccountTemplate,
  getAccountTemplateBySlug,
} from "../services";
import type { AccountTemplate } from "../types";

interface UseAccountTemplatesOptions {
  workspaceId: string;
  category?: string;
  enabled?: boolean;
}

export function useAccountTemplates(options: UseAccountTemplatesOptions) {
  const { workspaceId, category, enabled = true } = options;

  return useQuery<AccountTemplate[]>({
    queryKey: ["account-templates", workspaceId, category],
    queryFn: () =>
      category
        ? listAccountTemplatesByCategory(workspaceId, category)
        : listAccountTemplates(workspaceId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!workspaceId,
  });
}

export function useAccountTemplate(id: string | undefined) {
  return useQuery<AccountTemplate | null>({
    queryKey: ["account-template", id],
    queryFn: () => (id ? getAccountTemplate(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useAccountTemplateBySlug(
  slug: string | undefined,
  workspaceId: string | undefined
) {
  return useQuery<AccountTemplate | null>({
    queryKey: ["account-template-slug", slug, workspaceId],
    queryFn: () =>
      slug && workspaceId
        ? getAccountTemplateBySlug(slug, workspaceId)
        : Promise.resolve(null),
    enabled: !!slug && !!workspaceId,
  });
}
