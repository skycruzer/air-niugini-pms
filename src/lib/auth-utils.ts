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
      console.log('🔐 LOGIN ATTEMPT - Starting...');
      console.log('📧 Email:', email);
      console.log('🔑 Password length:', password.length);

      const {
        data: { user: authUser, session },
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔍 Auth Response:');
      console.log('  - User:', authUser ? '✅ Exists' : '❌ Null');
      console.log('  - Session:', session ? '✅ Exists' : '❌ Null');
      console.log('  - Error:', signInError ? signInError.message : 'None');

      if (signInError || !authUser) {
        console.error('❌ AUTHENTICATION FAILED');
        console.error('Error details:', signInError);
        return null;
      }

      console.log('✅ SUPABASE AUTH SUCCESSFUL');
      console.log('User ID:', authUser.id);
      console.log('Email:', authUser.email);
      console.log('Fetching user profile from an_users...');

      // Get user profile from our users table
      const { data: userData, error: userError } = await supabase
        .from('an_users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (userError || !userData) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Failed to get user profile');
        }
        return null;
      }

      const user: AuthUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role as UserRole,
        created_at: userData.created_at,
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Login successful');
      }

      // Store minimal user data in sessionStorage (more secure than localStorage)
      // Session storage is cleared when tab closes, reducing exposure window
      if (typeof window !== 'undefined') {
        const sessionData = {
          id: user.id,
          name: user.name,
          role: user.role,
          // Don't store email - fetch from Supabase session when needed
        };
        sessionStorage.setItem('auth-user', JSON.stringify(sessionData));
      }

      return user;
    } catch (error) {
      console.error('🚨 Login error:', error);
      return null;
    }
  },

  // Get current user (try from sessionStorage first, then Supabase)
  getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;

    const stored = sessionStorage.getItem('auth-user');
    if (stored) {
      try {
        const sessionData = JSON.parse(stored);
        // Reconstruct AuthUser with stored data
        // Email will be fetched from Supabase session when needed
        return {
          id: sessionData.id,
          name: sessionData.name,
          role: sessionData.role,
          email: '', // Will be populated by getSession if needed
          created_at: sessionData.created_at || '',
        } as AuthUser;
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

      // Update sessionStorage with minimal data
      if (typeof window !== 'undefined') {
        const sessionData = {
          id: user.id,
          name: user.name,
          role: user.role,
        };
        sessionStorage.setItem('auth-user', JSON.stringify(sessionData));
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
        sessionStorage.removeItem('auth-user');
        // Also clear any legacy localStorage data
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
