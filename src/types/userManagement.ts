// types/userManagement.ts

export type UserStatus = 'active' | 'suspended' | 'inactive';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  initials: string;
  plan: string;
  status: UserStatus;
  campaigns: number;
  totalSpend: number;
  joined: string;
  lastActive: string;
  isAdmin?: boolean; // Added admin flag
  role: 'Admin' | 'User';
}

export interface ActionMenuPosition {
  vertical: 'top' | 'bottom';
  horizontal: 'left' | 'right';
}

export interface UserStats {
  total_users: {
    value: number;
    last_week: number;
    trend_percentage: string;
    trend_direction: 'up' | 'down' | 'neutral';
  };
  active_users: {
    value: number;
    previous_period: number;
    trend_percentage: string;
    trend_direction: 'up' | 'down' | 'neutral';
  };
  suspended_users: {
    value: number;
    previous_period: number;
    trend_percentage: string;
    trend_direction: 'up' | 'down' | 'neutral';
  };
  trial_users: {
    value: number;
    previous_period: number;
    trend_percentage: string;
    trend_direction: 'up' | 'down' | 'neutral';
  };
}

// API Response Types
export interface ApiUser {
  id?: string; // Make id optional for fallback
  email: string;
  full_name: string | null;
  status: string;
  last_login: string | null;
  joined_at: string;
  is_active: boolean;
  is_suspended: boolean;
  is_admin?: boolean; // Added admin flag for API response
  role?: string;
  subscription_tier?: string;
  campaigns_count?: number;
  total_spend?: number;
}

export interface UserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiUser[];
}

// API Request Types
export interface UpdateUserStatusRequest {
  status: UserStatus;
}

// Props Types
export interface StatCardProps {
  title: string;
  value: number;
  sub: string;
  variant?: 'green' | 'yellow' | 'blue';
  loading?: boolean;
}

export interface ActionProps {
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}

// Admin context type (if using context)
export interface AdminContextType {
  adminEmail: string;
  setAdminEmail: (email: string) => void;
}