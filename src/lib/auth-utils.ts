// Define User interface directly to avoid import issues
export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export type UserRole = 'admin' | 'manager'

export interface AuthUser extends User {
  role: UserRole
}

/**
 * Permission utilities for role-based access control
 */
export const permissions = {
  // Create permissions
  canCreate: (user: AuthUser | null) => {
    return user?.role === 'admin'
  },

  // Edit permissions
  canEdit: (user: AuthUser | null) => {
    return user && ['admin', 'manager'].includes(user.role)
  },

  // Delete permissions
  canDelete: (user: AuthUser | null) => {
    return user?.role === 'admin'
  },

  // Approve leave requests
  canApprove: (user: AuthUser | null) => {
    return user && ['admin', 'manager'].includes(user.role)
  },

  // View reports
  canViewReports: (user: AuthUser | null) => {
    return user && ['admin', 'manager'].includes(user.role)
  },

  // Manage system settings
  canManageSettings: (user: AuthUser | null) => {
    return user?.role === 'admin'
  }
}

import { supabase } from './supabase'

/**
 * Supabase authentication service for production
 */
export const authService = {
  // Login with Supabase Auth
  async login(email: string, password: string): Promise<AuthUser | null> {
    try {
      // TEMPORARY TEST MODE: Allow specific emails with any password for testing
      if ((email === 'admin@airniugini.com' || email === 'skycruzer@icloud.com') && process.env.NODE_ENV === 'development') {
        console.log('🚀 Using TEST MODE authentication for development')

        // Get the correct user profile from database for test mode
        let user: AuthUser
        if (email === 'skycruzer@icloud.com') {
          user = {
            id: '73d6a362-1ef5-46e5-90d4-92473d1be3c9',
            email: 'skycruzer@icloud.com',
            name: 'Sky Cruzer',
            role: 'admin' as UserRole,
            created_at: new Date().toISOString()
          }
        } else {
          user = {
            id: 'ea5e67c8-f5a9-4455-a477-316874478d12',
            email: 'admin@airniugini.com',
            name: 'Admin User',
            role: 'admin' as UserRole,
            created_at: new Date().toISOString()
          }
        }

        // Store user in localStorage for quick access
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-user', JSON.stringify(user))
        }

        return user
      }

      const { data: { user: authUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError || !authUser) {
        console.error('Authentication failed:', signInError?.message)
        return null
      }

      // Get user profile from our users table
      const { data: userData, error: userError } = await supabase
        .from('an_users')
        .select('*')
        .eq('email', authUser.email)
        .single()

      if (userError || !userData) {
        console.error('Failed to get user profile:', userError?.message)
        return null
      }

      const user: AuthUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role as UserRole,
        created_at: userData.created_at
      }

      // Store user in localStorage for quick access
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-user', JSON.stringify(user))
      }

      return user
    } catch (error) {
      console.error('Login error:', error)
      return null
    }
  },

  // Get current user (try from localStorage first, then Supabase)
  getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null

    const stored = localStorage.getItem('auth-user')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
    return null
  },

  // Get user session from Supabase
  async getSession(): Promise<AuthUser | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session?.user) {
        return null
      }

      // Get user profile from our users table
      const { data: userData, error: userError } = await supabase
        .from('an_users')
        .select('*')
        .eq('email', session.user.email)
        .single()

      if (userError || !userData) {
        return null
      }

      const user: AuthUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role as UserRole,
        created_at: userData.created_at
      }

      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-user', JSON.stringify(user))
      }

      return user
    } catch (error) {
      console.error('Session error:', error)
      return null
    }
  },

  // Logout from Supabase
  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-user')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }
}

/**
 * Role display utilities
 */
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'manager':
      return 'Manager'
    default:
      return 'User'
  }
}

export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800'
    case 'manager':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}