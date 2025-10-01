'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { supabase } from '@/lib/supabase';
import {
  Search,
  Users,
  FileCheck,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Clock,
  Home,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Pilot {
  id: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  role: string;
}

interface RecentItem {
  id: string;
  type: 'page' | 'pilot' | 'action';
  label: string;
  path?: string;
  icon?: string;
  timestamp: Date;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load recent items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('air-niugini-recent-items');
    if (stored) {
      try {
        const items = JSON.parse(stored);
        setRecentItems(
          items.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }))
        );
      } catch (error) {
        console.error('Failed to load recent items:', error);
      }
    }
  }, [isOpen]);

  // Search pilots when query changes
  useEffect(() => {
    if (searchQuery.length > 1) {
      searchPilots(searchQuery);
    } else {
      setPilots([]);
    }
  }, [searchQuery]);

  const searchPilots = async (query: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pilots')
        .select('id, first_name, last_name, employee_id, role')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,employee_id.ilike.%${query}%`)
        .limit(5);

      if (!error && data) {
        setPilots(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRecentItem = (item: Omit<RecentItem, 'timestamp'>) => {
    const newItem = { ...item, timestamp: new Date() };
    const updated = [newItem, ...recentItems.filter((i) => i.id !== item.id)].slice(0, 10);
    setRecentItems(updated);
    localStorage.setItem('air-niugini-recent-items', JSON.stringify(updated));
  };

  const handleSelect = useCallback(
    (callback: () => void) => {
      callback();
      onClose();
      setSearchQuery('');
    },
    [onClose]
  );

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Parent component should handle opening
        }
      }

      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigation = [
    { label: 'Dashboard', path: '/dashboard', icon: Home, shortcut: 'D' },
    { label: 'Pilots', path: '/dashboard/pilots', icon: Users, shortcut: 'P' },
    { label: 'Certifications', path: '/dashboard/certifications', icon: FileCheck, shortcut: 'C' },
    { label: 'Leave Management', path: '/dashboard/leave', icon: Calendar, shortcut: 'L' },
    { label: 'Analytics', path: '/dashboard/analytics', icon: BarChart3, shortcut: 'A' },
    { label: 'Reports', path: '/dashboard/reports', icon: BarChart3, shortcut: 'R' },
    { label: 'Settings', path: '/dashboard/settings', icon: Settings, shortcut: 'S' },
  ];

  const quickActions = [
    {
      label: 'Add New Pilot',
      action: () => router.push('/dashboard/pilots?action=add'),
      icon: Plus,
    },
    {
      label: 'Add Certification',
      action: () => router.push('/dashboard/certifications?action=add'),
      icon: Plus,
    },
    {
      label: 'Create Leave Request',
      action: () => router.push('/dashboard/leave?action=create'),
      icon: Plus,
    },
    {
      label: 'View Expiring Certifications',
      action: () => router.push('/dashboard/certifications?filter=expiring'),
      icon: Clock,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="fixed top-[20%] left-1/2 transform -translate-x-1/2 w-full max-w-2xl z-50 animate-slide-down">
        <Command className="rounded-xl border border-[#E4002B]/20 shadow-2xl bg-white overflow-hidden">
          <div className="flex items-center border-b border-gray-200 px-4">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <Command.Input
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Search pilots, navigate, or run commands..."
              className="w-full py-4 text-base bg-transparent border-0 outline-none placeholder:text-gray-400"
            />
            <div className="flex items-center space-x-2 ml-4">
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded">
                ESC
              </kbd>
            </div>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            {searchQuery.length === 0 && recentItems.length > 0 && (
              <Command.Group heading="Recent">
                {recentItems.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={() =>
                      handleSelect(() => {
                        if (item.path) {
                          router.push(item.path);
                        }
                      })
                    }
                    className="flex items-center px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-100 aria-selected:bg-[#E4002B]/10 aria-selected:text-[#E4002B]"
                  >
                    <Clock className="w-4 h-4 mr-3" />
                    <span className="flex-1">{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Navigation">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.path}
                    value={item.label}
                    onSelect={() =>
                      handleSelect(() => {
                        router.push(item.path);
                        addRecentItem({
                          id: item.path,
                          type: 'page',
                          label: item.label,
                          path: item.path,
                        });
                      })
                    }
                    className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-100 aria-selected:bg-[#E4002B]/10 aria-selected:text-[#E4002B]"
                  >
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-3" />
                      <span>{item.label}</span>
                    </div>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
                      {item.shortcut}
                    </kbd>
                  </Command.Item>
                );
              })}
            </Command.Group>

            {searchQuery.length === 0 && (
              <Command.Group heading="Quick Actions">
                {quickActions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.label}
                      value={item.label}
                      onSelect={() =>
                        handleSelect(() => {
                          item.action();
                          addRecentItem({
                            id: item.label,
                            type: 'action',
                            label: item.label,
                          });
                        })
                      }
                      className="flex items-center px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-100 aria-selected:bg-[#E4002B]/10 aria-selected:text-[#E4002B]"
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      <span>{item.label}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            {searchQuery.length > 1 && (
              <Command.Group heading={loading ? 'Searching...' : 'Pilots'}>
                {pilots.length === 0 && !loading && (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No pilots found</p>
                  </div>
                )}
                {pilots.map((pilot) => (
                  <Command.Item
                    key={pilot.id}
                    value={`${pilot.first_name} ${pilot.last_name} ${pilot.employee_id}`}
                    onSelect={() =>
                      handleSelect(() => {
                        router.push(`/dashboard/pilots/${pilot.id}`);
                        addRecentItem({
                          id: pilot.id,
                          type: 'pilot',
                          label: `${pilot.first_name} ${pilot.last_name} (${pilot.employee_id})`,
                          path: `/dashboard/pilots/${pilot.id}`,
                        });
                      })
                    }
                    className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-100 aria-selected:bg-[#E4002B]/10 aria-selected:text-[#E4002B]"
                  >
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-3" />
                      <div>
                        <div className="font-medium">
                          {pilot.first_name} {pilot.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {pilot.employee_id} • {pilot.role}
                        </div>
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {searchQuery.length === 0 && (
              <div className="px-4 py-3 mt-2 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded mr-1">
                        ↑
                      </kbd>
                      <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded mr-1">
                        ↓
                      </kbd>
                      Navigate
                    </span>
                    <span className="flex items-center">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded mr-1">
                        Enter
                      </kbd>
                      Select
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>Powered by</span>
                    <span className="font-semibold text-[#E4002B]">Air Niugini</span>
                  </div>
                </div>
              </div>
            )}
          </Command.List>
        </Command>
      </div>
    </>
  );
}
