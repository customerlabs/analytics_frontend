'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, User as UserIcon, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@/types/workspace';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
  className?: string;
}

// Hoist static data outside component to prevent recreation on every render
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-600',
  'bg-green-100 text-green-600',
  'bg-amber-100 text-amber-600',
  'bg-purple-100 text-purple-600',
  'bg-pink-100 text-pink-600',
  'bg-indigo-100 text-indigo-600',
] as const;

// Pure functions moved outside component
function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(email: string | null | undefined): string {
  if (!email) return AVATAR_COLORS[0];
  const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function UserProfile({ user, onLogout, className }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 p-1 rounded-lg',
          'hover:bg-gray-100 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            'text-sm font-medium',
            getAvatarColor(user.email)
          )}
        >
          {getInitials(user.name)}
        </div>

        {/* User info */}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900 max-w-[120px] truncate">
            {user.name || 'User'}
          </div>
        </div>

        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-500 transition-transform hidden sm:block',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full right-0 mt-1 w-56',
            'bg-white rounded-lg shadow-xl border border-gray-200',
            'z-50 py-1'
          )}
        >
          {/* User Info Header */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-900">{user.name || 'User'}</div>
            <div className="text-xs text-gray-500 truncate">{user.email || ''}</div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <a
              href="/profile"
              className={cn(
                'flex items-center gap-2 px-3 py-2',
                'text-sm text-gray-700 hover:bg-gray-50 transition-colors'
              )}
              onClick={() => setIsOpen(false)}
            >
              <UserIcon className="w-4 h-4" />
              <span>Profile</span>
            </a>

            <a
              href="/profile/preferences"
              className={cn(
                'flex items-center gap-2 px-3 py-2',
                'text-sm text-gray-700 hover:bg-gray-50 transition-colors'
              )}
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              <span>Preferences</span>
            </a>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Logout */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2',
                'text-sm text-red-600 hover:bg-red-50 transition-colors'
              )}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
