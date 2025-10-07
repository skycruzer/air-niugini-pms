/**
 * @fileoverview Collaborative Cursors Component
 * Displays cursors of other users viewing the same page
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-07
 */

'use client';

import { usePresence } from '@/contexts/PresenceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { MousePointer2 } from 'lucide-react';

interface CursorData {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

export function CollaborativeCursors() {
  const { presences, updateCursorPosition } = usePresence();
  const { user } = useAuth();
  const [cursors, setCursors] = useState<CursorData[]>([]);

  // Update cursors from presence data
  useEffect(() => {
    const newCursors: CursorData[] = [];

    presences.forEach((presence) => {
      // Don't show own cursor
      if (presence.userId === user?.id) return;

      // Only show cursors with position data on the same page
      if (presence.cursorPosition && presence.currentPage === window.location.pathname) {
        newCursors.push({
          userId: presence.userId,
          userName: presence.userName,
          x: presence.cursorPosition.x,
          y: presence.cursorPosition.y,
          color: presence.color,
        });
      }
    });

    setCursors(newCursors);
  }, [presences, user]);

  // Track own cursor movements (throttled)
  useEffect(() => {
    let rafId: number;
    let lastUpdate = 0;
    const THROTTLE_MS = 50; // Update every 50ms

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdate < THROTTLE_MS) return;

      lastUpdate = now;
      rafId = requestAnimationFrame(() => {
        updateCursorPosition(e.clientX, e.clientY);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [updateCursorPosition]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-transform duration-100 ease-out"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            transform: 'translate(-2px, -2px)',
          }}
        >
          {/* Cursor icon */}
          <MousePointer2
            className="w-5 h-5 drop-shadow-lg"
            style={{ color: cursor.color }}
            fill={cursor.color}
          />

          {/* User name label */}
          <div
            className="absolute top-6 left-2 px-2 py-1 rounded text-xs text-white whitespace-nowrap shadow-lg"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.userName}
          </div>
        </div>
      ))}
    </div>
  );
}
