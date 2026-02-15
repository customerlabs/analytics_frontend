"use client";

import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import {
  AccountTemplateCard,
  type AccountTemplateCardProps,
} from "./AccountTemplateCard";
import type { AccountTemplate, AccountTemplateCategory } from "../types";

interface AccountTemplateGridProps {
  templates: AccountTemplate[];
  selectedId?: string;
  onSelect?: (template: AccountTemplate) => void;
  groupByCategory?: boolean;
  showSearch?: boolean;
  showCategoryFilter?: boolean;
  cardProps?: Partial<
    Omit<AccountTemplateCardProps, "template" | "onSelect" | "selected">
  >;
  emptyState?: React.ReactNode;
  className?: string;
}

export function AccountTemplateGrid({
  templates,
  selectedId,
  onSelect,
  groupByCategory = false,
  showSearch = true,
  showCategoryFilter = false,
  cardProps,
  emptyState,
  className,
}: AccountTemplateGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Get unique categories (using account_type)
  const categories = useMemo(() => {
    const categorySet = new Set(templates.map((t) => t.account_type));
    return Array.from(categorySet).sort();
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates.filter((t) => t.is_active);

    // Apply search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.platform.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((t) => t.account_type === selectedCategory);
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [templates, debouncedSearch, selectedCategory]);

  // Group by category if requested
  const groupedTemplates = useMemo((): AccountTemplateCategory[] => {
    if (!groupByCategory) {
      return [{ id: "all", name: "All Sources", templates: filteredTemplates }];
    }

    const groups: Record<string, AccountTemplate[]> = {};
    filteredTemplates.forEach((template) => {
      const category = template.account_type || "other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(template);
    });

    return Object.entries(groups)
      .map(([name, items]) => ({
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name: name.charAt(0).toUpperCase() + name.slice(1),
        templates: items,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTemplates, groupByCategory]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search and filters */}
      {(showSearch || showCategoryFilter) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {showSearch && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search source by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {showCategoryFilter && categories.length > 1 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs transition-colors",
                    selectedCategory === null
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs capitalize transition-colors",
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid content */}
      {filteredTemplates.length === 0 ? (
        emptyState || (
          <div className="py-12 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">
              No sources found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter
            </p>
          </div>
        )
      ) : (
        groupedTemplates.map((group) => (
          <div key={group.id}>
            {groupByCategory && groupedTemplates.length > 1 && (
              <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {group.name}
              </h3>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.templates.map((template) => (
                <AccountTemplateCard
                  key={template.id}
                  template={template}
                  selected={selectedId === template.id}
                  onSelect={onSelect}
                  showDescription={true}
                  layout="horizontal"
                  {...cardProps}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
