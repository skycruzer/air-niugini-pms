/**
 * @fileoverview Presence Context - Real-time user presence tracking
 * Tracks which users are viewing tasks/disciplinary matters and their cursor positions
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-07
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface CursorPosition {
  x: number;
  y: number;
}

interface UserPresence {
  userId: string;
  userName: string;
  currentPage: string;
  currentEntityType?: 'task' | 'disciplinary_matter' | 'pilot';
  currentEntityId?: string;
  cursorPosition?: CursorPosition;
  isTyping?: boolean;
  lastSeenAt: string;
  color: string; // Assigned color for this user's cursor
}

interface PresenceContextType {
  presences: Map<string, UserPresence>;
  updatePresence: (data: Partial<UserPresence>) => void;
  setCurrentEntity: (entityType: string, entityId: string) => void;
  updateCursorPosition: (x: number, y: number) => void;
  setIsTyping: (isTyping: boolean) => void;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

// Assign consistent colors to users
const USER_COLORS = [
  '#E4002B', // Air Niugini Red
  '#FFC72C', // Air Niugini Gold
  '#0066CC', // Blue
  '#28A745', // Green
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#00BCD4', // Cyan
  '#E91E63', // Pink
];

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [presences, setPresences] = useState<Map<string, UserPresence>>(new Map());
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [userColor, setUserColor] = useState<string>('#E4002B');
  const [currentPage, setCurrentPage] = useState<string>('');

  // Initialize presence channel
  useEffect(() => {
    if (!user) return;

    const presenceChannel = supabase.channel('presence:global', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Assign color to current user
    const colorIndex = Math.abs(user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % USER_COLORS.length;
    setUserColor(USER_COLORS[colorIndex]);

    // Listen for presence updates
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const newPresences = new Map<string, UserPresence>();

        Object.entries(state).forEach(([userId, presenceArray]) => {
          if (Array.isArray(presenceArray) && presenceArray.length > 0) {
            const presence = presenceArray[0] as UserPresence;
            newPresences.set(userId, presence);
          }
        });

        setPresences(newPresences);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences: newPresencesArray }) => {
        console.log('User joined:', key, newPresencesArray);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track initial presence
          await presenceChannel.track({
            userId: user.id,
            userName: user.name || user.email || 'Anonymous',
            currentPage: window.location.pathname,
            lastSeenAt: new Date().toISOString(),
            color: userColor,
          });
        }
      });

    setChannel(presenceChannel);

    // Update current page on navigation
    const updatePage = () => {
      setCurrentPage(window.location.pathname);
      if (presenceChannel) {
        presenceChannel.track({
          userId: user.id,
          userName: user.name || user.email || 'Anonymous',
          currentPage: window.location.pathname,
          lastSeenAt: new Date().toISOString(),
          color: userColor,
        });
      }
    };

    window.addEventListener('popstate', updatePage);

    // Heartbeat to keep presence alive
    const heartbeat = setInterval(() => {
      if (presenceChannel) {
        presenceChannel.track({
          userId: user.id,
          userName: user.name || user.email || 'Anonymous',
          currentPage: window.location.pathname,
          lastSeenAt: new Date().toISOString(),
          color: userColor,
        });
      }
    }, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('popstate', updatePage);
      clearInterval(heartbeat);
      presenceChannel.unsubscribe();
    };
  }, [user]);

  // Update presence data
  const updatePresence = useCallback(
    (data: Partial<UserPresence>) => {
      if (!channel || !user) return;

      channel.track({
        userId: user.id,
        userName: user.name || user.email || 'Anonymous',
        currentPage: window.location.pathname,
        ...data,
        lastSeenAt: new Date().toISOString(),
        color: userColor,
      });
    },
    [channel, user, userColor]
  );

  // Set current entity being viewed
  const setCurrentEntity = useCallback(
    (entityType: string, entityId: string) => {
      updatePresence({
        currentEntityType: entityType as 'task' | 'disciplinary_matter' | 'pilot',
        currentEntityId: entityId,
      });
    },
    [updatePresence]
  );

  // Update cursor position
  const updateCursorPosition = useCallback(
    (x: number, y: number) => {
      updatePresence({
        cursorPosition: { x, y },
      });
    },
    [updatePresence]
  );

  // Set typing indicator
  const setIsTyping = useCallback(
    (isTyping: boolean) => {
      updatePresence({
        isTyping,
      });
    },
    [updatePresence]
  );

  const value: PresenceContextType = {
    presences,
    updatePresence,
    setCurrentEntity,
    updateCursorPosition,
    setIsTyping,
  };

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}
