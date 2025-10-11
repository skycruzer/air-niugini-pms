/**
 * Pilot Authentication Utilities
 * Handles pilot user authentication, separate from admin authentication
 */

import { supabase, getSupabaseAdmin } from './supabase';
import type { Database } from '@/types/supabase';

type PilotUser = Database['public']['Tables']['pilot_users']['Row'];

export interface PilotAuthUser extends PilotUser {
  user_type: 'pilot';
}

class PilotAuthService {
  private currentUser: PilotAuthUser | null = null;

  /**
   * Login pilot with email and password
   */
  async login(email: string, password: string): Promise<PilotAuthUser | null> {
    try {
      // Step 1: Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        console.error('Pilot auth error:', authError);
        return null;
      }

      // Step 2: Get pilot_users record
      const { data: pilotUser, error: pilotError } = await supabase
        .from('pilot_users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (pilotError || !pilotUser) {
        console.error('Pilot user not found:', pilotError);
        // Sign out if pilot_users record not found
        await supabase.auth.signOut();
        return null;
      }

      // Step 3: Check if registration is approved
      if (!pilotUser.registration_approved) {
        console.warn('Pilot registration not approved');
        await supabase.auth.signOut();
        throw new Error('Your registration is pending approval. Please wait for administrator approval.');
      }

      // Step 4: Update last login timestamp
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin
        .from('pilot_users')
        .update({
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', authData.user.id);

      // Step 5: Create PilotAuthUser object
      const pilotAuthUser: PilotAuthUser = {
        ...pilotUser,
        user_type: 'pilot',
      };

      this.currentUser = pilotAuthUser;
      this.saveToSessionStorage(pilotAuthUser);

      console.log('✅ Pilot login successful:', pilotAuthUser.email);

      return pilotAuthUser;
    } catch (error) {
      console.error('Pilot login error:', error);
      throw error;
    }
  }

  /**
   * Logout pilot
   */
  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.currentUser = null;
      this.clearSessionStorage();
      console.log('✅ Pilot logged out');
    } catch (error) {
      console.error('Pilot logout error:', error);
      throw error;
    }
  }

  /**
   * Get current pilot user from session
   */
  async getSession(): Promise<PilotAuthUser | null> {
    try {
      // Check Supabase session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        this.currentUser = null;
        this.clearSessionStorage();
        return null;
      }

      // Get pilot_users record
      const { data: pilotUser, error: pilotError } = await supabase
        .from('pilot_users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (pilotError || !pilotUser) {
        this.currentUser = null;
        this.clearSessionStorage();
        return null;
      }

      // Check if still approved
      if (!pilotUser.registration_approved) {
        await this.logout();
        return null;
      }

      const pilotAuthUser: PilotAuthUser = {
        ...pilotUser,
        user_type: 'pilot',
      };

      this.currentUser = pilotAuthUser;
      this.saveToSessionStorage(pilotAuthUser);

      return pilotAuthUser;
    } catch (error) {
      console.error('Get pilot session error:', error);
      return null;
    }
  }

  /**
   * Get current user from memory
   */
  getCurrentUser(): PilotAuthUser | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to restore from sessionStorage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('pilot_user');
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
          return this.currentUser;
        } catch {
          this.clearSessionStorage();
        }
      }
    }

    return null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Save user to session storage
   */
  private saveToSessionStorage(user: PilotAuthUser): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pilot_user', JSON.stringify(user));
    }
  }

  /**
   * Clear session storage
   */
  private clearSessionStorage(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pilot_user');
    }
  }
}

export const pilotAuthService = new PilotAuthService();
