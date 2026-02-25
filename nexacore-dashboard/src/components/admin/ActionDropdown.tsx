'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal,
  ShieldCheck,
  Lock,
  Unlock,
  Trash2,
} from 'lucide-react';
import type { SafeUser } from '@/lib/types';

type ActionDropdownProps = {
  user: SafeUser;
  onChangeRole: (user: SafeUser) => void;
  onToggleLock: (user: SafeUser) => void;
  onDelete: (user: SafeUser) => void;
};

export default function ActionDropdown({
  user,
  onChangeRole,
  onToggleLock,
  onDelete,
}: ActionDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isLocked = !!user.lockedUntil && new Date(user.lockedUntil) > new Date();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-subtle"
      >
        <MoreHorizontal size={16} className="text-content-primary" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-[241px] rounded-3xl border border-border-default bg-surface-primary p-6 shadow-card">
          <button
            onClick={() => {
              setOpen(false);
              onChangeRole(user);
            }}
            className="flex w-full items-center gap-2 rounded-3xl p-2 text-caption text-content-primary hover:bg-surface-subtle"
          >
            <ShieldCheck size={16} />
            Change Role
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onToggleLock(user);
            }}
            className="flex w-full items-center gap-2 rounded-3xl p-2 text-caption text-content-primary hover:bg-surface-subtle"
          >
            {isLocked ? <Unlock size={16} /> : <Lock size={16} />}
            {isLocked ? 'Unlock Account' : 'Lock Account'}
          </button>
          <div className="my-2 h-px bg-border-default" />
          <button
            onClick={() => {
              setOpen(false);
              onDelete(user);
            }}
            className="flex w-full items-center gap-2 rounded-3xl p-2 text-caption text-error hover:bg-surface-subtle"
          >
            <Trash2 size={16} />
            Delete User
          </button>
        </div>
      )}
    </div>
  );
}
