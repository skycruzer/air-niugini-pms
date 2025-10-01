// Define User interface directly to avoid import issues
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export type UserRole = 'admin' | 'manager';

export interface AuthUser extends User {
  role: UserRole;
}

/**
 * Permission utilities for role-based access control
 */
export const permissions = {
  // Create permissions
  canCreate: (user: AuthUser | null): boolean => {
    return user?.role === 'admin' || false;
  },

  // Edit permissions
  canEdit: (user: AuthUser | null): boolean => {
    return !!(user && ['admin', 'manager'].includes(user.role));
  },

  // Delete permissions
  canDelete: (user: AuthUser | null): boolean => {
    return user?.role === 'admin' || false;
  },

  // Approve leave requests
  canApprove: (user: AuthUser | null): boolean => {
    return !!(user && ['admin', 'manager'].includes(user.role));
  },

  // View reports
  canViewReports: (user: AuthUser | null): boolean => {
    return !!(user && ['admin', 'manager'].includes(user.role));
  },

  // Manage system settings
  canManageSettings: (user: AuthUser | null): boolean => {
    return user?.role === 'admin' || false;
  },
};

import { supabase } from './supabase';

/**
 * Supabase authentication service for production
 */
export const authService = {
  // Login with Supabase Auth
  async login(email: string, password: string): Promise<AuthUser | null> {
    try {
      console.log('🔐 Starting login attempt for:', email);

      const {
        data: { user: authUser },
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔍 Supabase Auth response:', {
        hasUser: !!authUser,
        userId: authUser?.id,
        email: authUser?.email,
        error: signInError?.message,
      });

      if (signInError || !authUser) {
        console.error('❌ Authentication failed:', signInError?.message);
        return null;
      }

      console.log('✅ Supabase Auth successful, fetching user profile...');

      // Get user profile from our users table
      const { data: userData, error: userError } = await supabase
        .from('an_users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      console.log('🔍 User profile query result:', {
        hasData: !!userData,
        userEmail: userData?.email,
        userRole: userData?.role,
        error: userError?.message,
      });

      if (userError || !userData) {
        console.error('❌ Failed to get user profile:', userError?.message);
        return null;
      }

      const user: AuthUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role as UserRole,
        created_at: userData.created_at,
      };

      console.log('✅ Login successful for user:', {
        name: user.name,
        email: user.email,
        role: user.role,
      });

      // Store user in localStorage for quick access
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-user', JSON.stringify(user));
      }

      return user;
    } catch (error) {
      console.error('🚨 Login error:', error);
      return null;
    }
  },

  // Get current user (try from localStorage first, then Supabase)
  getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem('auth-user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Get user session from Supabase
  async getSession(): Promise<AuthUser | null> {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        return null;
      }

      // Get user profile from our users table
      const { data: userData, error: userError } = await supabase
        .from('an_users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (userError || !userData) {
        return null;
      }

      const user: AuthUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role as UserRole,
        created_at: userData.created_at,
      };

      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-user', JSON.stringify(user));
      }

      return user;
    } catch (error) {
      console.error('Session error:', error);
      return null;
    }
  },

  // Logout from Supabase
  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-user');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },
};

/**
 * Role display utilities
 */
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'manager':
      return 'Manager';
    default:
      return 'User';
  }
};

export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'manager':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
