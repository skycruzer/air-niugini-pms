/**
 * @fileoverview Presence Indicator Component
 * Displays avatars of users currently viewing the same entity
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-07
 */

'use client';

import { usePresence } from '@/contexts/PresenceContext';
import { Users } from 'lucide-react';

interface PresenceIndicatorProps {
  entityType?: 'task' | 'disciplinary_matter' | 'pilot';
  entityId?: string;
  showAll?: boolean; // Show all active users, not filtered by entity
}

export function PresenceIndicator({ entityType, entityId, showAll = false }: PresenceIndicatorProps) {
  const { presences } = usePresence();

  // Filter presences based on current entity
  const relevantPresences = Array.from(presences.values()).filter((presence) => {
    if (showAll) return true;
    if (!entityType || !entityId) return false;
    return presence.currentEntityType === entityType && presence.currentEntityId === entityId;
  });

  if (relevantPresences.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Users className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">{relevantPresences.length} viewing</span>
      </div>
      <div className="flex -space-x-2">
        {relevantPresences.slice(0, 5).map((presence) => (
          <div
            key={presence.userId}
            className="relative group"
            title={`${presence.userName}${presence.isTyping ? ' (typing...)' : ''}`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white shadow-sm"
              style={{ backgroundColor: presence.color }}
            >
              {presence.userName.charAt(0).toUpperCase()}
            </div>
            {presence.isTyping && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>
        ))}
        {relevantPresences.length > 5 && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-300 text-gray-700 text-xs font-medium border-2 border-white shadow-sm">
            +{relevantPresences.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
