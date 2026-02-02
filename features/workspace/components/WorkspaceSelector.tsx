"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDown,
  Check,
  Search,
  Grid3X3,
  X,
  FolderOpen,
} from "lucide-react";
import { useWorkspaceRouter } from "@/hooks/useWorkspaceRouter";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useCreateWorkspaceSheet } from "@/hooks/useCreateWorkspaceSheet";
import { useWorkspaceList } from "@/hooks/useWorkspaceList";
import { cn } from "@/lib/utils";
import type { Workspace, Organization } from "@/types/workspace";

interface WorkspaceSelectorProps {
  currentWorkspace?: Workspace;
  workspaces: Workspace[];
  organizations?: Organization[];
  className?: string;
}

// Role badge styling - using semantic classes from theme.css
const ROLE_COLORS: Record<string, string> = {
  "workspace-admin": "badge-admin",
  "workspace-billing": "badge-billing",
  "workspace-member": "badge-member",
};

const ROLE_LABELS: Record<string, string> = {
  "workspace-admin": "Admin",
  "workspace-billing": "Billing",
  "workspace-member": "Member",
};

// Special value for "No Organization" filter
const NO_ORG_ID = "__no_org__";

export function WorkspaceSelector({
  currentWorkspace,
  workspaces,
  organizations = [],
  className,
}: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { switchWorkspace } = useWorkspaceRouter();
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const { open: openCreateSheet } = useCreateWorkspaceSheet();

  // Fetch workspaces client-side to ensure fresh data when dropdown opens
  const {
    workspaces: workspaceList,
    isLoading: isLoadingWorkspaces,
    refetch: refetchWorkspaces,
  } = useWorkspaceList({ fallbackData: workspaces });

  // Use store's activeWorkspace if available, otherwise fall back to prop
  const effectiveCurrentWorkspace = activeWorkspace ?? currentWorkspace;

  // Derive organizations from workspaces if not provided
  const derivedOrganizations = useMemo(() => {
    if (organizations.length > 0) return organizations;

    const orgMap = new Map<string, Organization>();
    workspaceList.forEach((ws) => {
      if (ws.organization_id) {
        orgMap.set(ws.organization_id, {
          id: ws.organization_id,
          name: ws.organization_id, // Fallback to ID if name not available
        });
      }
    });
    return Array.from(orgMap.values());
  }, [workspaceList, organizations]);

  // Check if any workspaces have no organization
  const hasNoOrgWorkspaces = useMemo(() => {
    return workspaceList.some((ws) => !ws.organization_id);
  }, [workspaceList]);

  // Focus search input when modal opens and refetch workspaces
  useEffect(() => {
    if (isOpen) {
      refetchWorkspaces();
      if (searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, refetchWorkspaces]);

  // Close org dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        orgDropdownRef.current &&
        !orgDropdownRef.current.contains(event.target as Node)
      ) {
        setOrgDropdownOpen(false);
      }
    }

    if (orgDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [orgDropdownOpen]);

  // Close modal on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setOrgDropdownOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Get selected organization name
  const selectedOrgName = useMemo(() => {
    if (selectedOrgId === NO_ORG_ID) return "No Organization";
    if (selectedOrgId) {
      return (
        derivedOrganizations.find((o) => o.id === selectedOrgId)?.name ||
        "Unknown Organization"
      );
    }
    return "All Organizations";
  }, [selectedOrgId, derivedOrganizations]);

  // Filter workspaces by selected org and search
  const filteredWorkspaces = useMemo(() => {
    let filtered = workspaceList;

    // Filter by selected organization
    if (selectedOrgId === NO_ORG_ID) {
      filtered = filtered.filter((ws) => !ws.organization_id);
    } else if (selectedOrgId) {
      filtered = filtered.filter((ws) => ws.organization_id === selectedOrgId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ws) =>
          ws.name.toLowerCase().includes(query) ||
          ws.slug.toLowerCase().includes(query)
      );
    }

    // Sort alphabetically
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [workspaceList, selectedOrgId, searchQuery]);

  const handleWorkspaceSwitch = async (workspace: Workspace) => {
    if (effectiveCurrentWorkspace && workspace.id === effectiveCurrentWorkspace.id) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);

    try {
      // Update local state
      setActiveWorkspace(workspace);

      // Navigate to dashboard with new workspace
      switchWorkspace(workspace.slug);

      // Close modal after a brief delay to allow navigation to start
      setTimeout(() => {
        setIsOpen(false);
        setIsSwitching(false);
      }, 500);
    } catch (error) {
      console.error("Failed to switch workspace:", error);
      setIsSwitching(false);
    }
  };

  const handleCreateWorkspace = () => {
    setIsOpen(false);
    openCreateSheet();
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        disabled={isSwitching}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-secondary hover:bg-accent transition-colors",
          "text-sm font-medium text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-[180px] truncate">{effectiveCurrentWorkspace?.name ?? "Select Workspace"}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-14 z-100">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div
            ref={modalRef}
            className="absolute left-1/2 top-8 -translate-x-1/2 bg-card rounded-lg shadow-2xl w-full max-w-3xl max-h-[calc(100vh-8rem)] flex flex-col border border-border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-selector-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2
                id="workspace-selector-title"
                className="text-lg font-normal text-foreground"
              >
                Select a workspace
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleCreateWorkspace}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  New workspace
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Organization Dropdown */}
            {(derivedOrganizations.length > 0 || hasNoOrgWorkspaces) && (
              <div className="px-6 py-3 border-b border-border/50">
                <div className="relative" ref={orgDropdownRef}>
                  <button
                    onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-primary rounded text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
                  >
                    {selectedOrgName}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        orgDropdownOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Org Dropdown Menu */}
                  {orgDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10 min-w-[200px]">
                      {/* All Organizations option */}
                      <button
                        onClick={() => {
                          setSelectedOrgId(null);
                          setOrgDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors",
                          selectedOrgId === null
                            ? "bg-primary/10 text-primary"
                            : "text-foreground"
                        )}
                      >
                        All Organizations
                      </button>

                      {/* Organization list */}
                      {derivedOrganizations.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => {
                            setSelectedOrgId(org.id);
                            setOrgDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors",
                            selectedOrgId === org.id
                              ? "bg-primary/10 text-primary"
                              : "text-foreground"
                          )}
                        >
                          {org.name}
                        </button>
                      ))}

                      {/* No Organization option */}
                      {hasNoOrgWorkspaces && (
                        <button
                          onClick={() => {
                            setSelectedOrgId(NO_ORG_ID);
                            setOrgDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors",
                            selectedOrgId === NO_ORG_ID
                              ? "bg-primary/10 text-primary"
                              : "text-foreground"
                          )}
                        >
                          No Organization
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="px-6 py-3 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search workspaces"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Workspace List */}
            <div className="flex-1 overflow-y-auto">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_80px_140px] gap-4 px-6 py-2 text-xs font-medium text-muted-foreground border-b border-border/50 sticky top-0 bg-card">
                <span className="flex items-center gap-2">
                  Name
                  {isLoadingWorkspaces && (
                    <span className="h-3 w-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  )}
                </span>
                <span>Role</span>
                <span>ID</span>
              </div>

              {filteredWorkspaces.length === 0 ? (
                <div className="px-6 py-12 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="font-medium">No workspaces found</p>
                  <p className="text-sm mt-1">
                    Try a different search term or organization
                  </p>
                </div>
              ) : (
                filteredWorkspaces.map((workspace) => {
                  const isSelected = effectiveCurrentWorkspace && workspace.id === effectiveCurrentWorkspace.id;

                  return (
                    <button
                      key={workspace.id}
                      onClick={() => handleWorkspaceSwitch(workspace)}
                      disabled={isSwitching}
                      className={cn(
                        "w-full grid grid-cols-[1fr_80px_140px] gap-4 px-6 py-2.5 items-center text-left hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                        isSelected && "bg-primary/10"
                      )}
                    >
                      {/* Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        {isSelected ? (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <div className="w-4" />
                        )}
                        <Grid3X3 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span
                          className={cn(
                            "text-sm truncate",
                            isSelected
                              ? "text-foreground font-medium"
                              : "text-primary hover:underline"
                          )}
                        >
                          {workspace.name}
                        </span>
                      </div>

                      {/* Role */}
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded font-medium w-fit",
                          ROLE_COLORS[workspace.role] || "badge-member"
                        )}
                      >
                        {ROLE_LABELS[workspace.role] || workspace.role}
                      </span>

                      {/* ID */}
                      <span className="text-xs text-muted-foreground font-mono truncate">
                        {workspace.slug}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-3 border-t border-border">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay - shown over the modal when switching */}
      {isSwitching && isOpen && (
        <div className="fixed inset-0 top-14 z-102 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="bg-card rounded-lg p-6 shadow-lg flex items-center gap-3 border border-border">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Switching workspace...</span>
          </div>
        </div>
      )}
    </>
  );
}
