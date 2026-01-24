// Workspace types for UI components
// These are generic types that work with any backend

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  role: string;
  organization_id?: string | null;
}

export interface Organization {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}
