// User role and extended auth model (PocketBase users collection)
export type UserRole = 'student' | 'faculty' | 'admin';

export interface Department {
  id: string;
  name: string;
  code: string;
  created: string;
  updated: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string; // relation id to departments
  /** PocketBase auth: false until OTP or OAuth verification */
  verified?: boolean;
  created: string;
  updated: string;
  avatar?: string;
  expand?: {
    department?: Department;
  };
}

// Tag model
export interface Tag {
  id: string;
  name: string;
  created: string;
  updated: string;
}

// Author: links capstone to a person (system user or name-only)
export interface Author {
  id: string;
  name: string;
  user: string | null; // relation id to users, optional
  created: string;
  updated: string;
  expand?: {
    user?: User;
  };
}

// Capstone status
export type CapstoneStatus = 'pending' | 'approved' | 'rejected';

export interface Capstone {
  id: string;
  title: string;
  abstract: string;
  authors: string[]; // author record ids
  tags: string[];
  pdf_file: string;
  repository_link: string;
  year: number;
  status: CapstoneStatus;
  approved_by: string | null;
  created_by: string | null;
  created: string;
  updated: string;
  expand?: {
    authors?: Author[];
    tags?: Tag[];
    approved_by?: User | null;
    created_by?: User | null;
  };
}

// Search log for faculty analytics
export interface SearchLog {
  id: string;
  query: string;
  user: string;
  tags_clicked: string; // comma-separated or JSON
  created: string;
  expand?: {
    user?: User;
  };
}

// One author entry when creating/updating a capstone (name + optional user link)
export interface AuthorInput {
  name: string;
  user?: string | null; // user record id, optional
}

// Form / API payloads
export interface CapstoneCreateInput {
  title: string;
  abstract: string;
  authors: AuthorInput[];
  tags: string[];
  pdf_file: File | null;
  repository_link: string;
  year: number;
  /** Admin only: set creator (defaults to current user or first author's user) */
  created_by?: string | null;
  /** Admin only: initial status (defaults to 'pending') */
  status?: CapstoneStatus;
}

export interface CapstoneUpdateInput {
  title?: string;
  abstract?: string;
  authors?: string[]; // author record ids (replaces list)
  tags?: string[];
  repository_link?: string;
  year?: number;
  status?: CapstoneStatus;
  approved_by?: string | null;
}

export interface UserCreateInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  department?: string; // department record id, optional
}

export interface UserUpdateInput {
  email?: string;
  name?: string;
  role?: UserRole;
  department?: string | null;
}
