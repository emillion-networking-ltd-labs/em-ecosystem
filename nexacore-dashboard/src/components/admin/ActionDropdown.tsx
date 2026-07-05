"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MoreHorizontal,
  ShieldCheck,
  Lock,
  Unlock,
  Trash2,
} from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import type { SafeUser } from "@/lib/types";
import Can from "@/components/guards/Can";

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
  const btnRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<React.CSSProperties>({});

  const openDropdown = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuH = 160;
    const spaceBelow = window.innerHeight - rect.bottom;
    const right = window.innerWidth - rect.right;

    setPos(
      spaceBelow < menuH + 8 && rect.top > menuH
        ? { bottom: window.innerHeight - rect.top + 4, right }
        : { top: rect.bottom + 4, right },
    );
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    const closeOnScroll = () => setOpen(false);

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", closeOnScroll);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", closeOnScroll);
    };
  }, [open]);

  const isLocked = !user.isActive;

  return (
    <Can anyPermission={["users:write", "users:delete"]}>
      <div ref={btnRef}>
        <IconButton
          variant="boxed"
          size="sm"
          tooltip={!open}
          onClick={() => (open ? setOpen(false) : openDropdown())}
          aria-label="Actions"
        >
          <MoreHorizontal size={16} />
        </IconButton>
      </div>

      {open && (
        <div
          ref={menuRef}
          className="fixed z-50 w-[241px] rounded-xl border border-border-strong bg-surface-primary p-2 shadow-card"
          style={pos}
        >
          <Can permission="users:write">
            <button
              onClick={() => {
                setOpen(false);
                onChangeRole(user);
              }}
              className="flex w-full items-center gap-2 rounded-md p-2 text-body font-normal text-content-primary hover:bg-surface-subtle"
            >
              <ShieldCheck size={16} />
              Change Role
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onToggleLock(user);
              }}
              className="flex w-full items-center gap-2 rounded-md p-2 text-body font-normal text-content-primary hover:bg-surface-subtle"
            >
              {isLocked ? <Unlock size={16} /> : <Lock size={16} />}
              {isLocked ? "Unlock Account" : "Lock Account"}
            </button>
          </Can>
          <Can permission="users:delete">
            <div className="my-2 h-px bg-border-default" />
            <button
              onClick={() => {
                setOpen(false);
                onDelete(user);
              }}
              className="flex w-full items-center gap-2 rounded-md p-2 text-body font-normal text-error hover:bg-surface-subtle"
            >
              <Trash2 size={16} />
              Delete User
            </button>
          </Can>
        </div>
      )}
    </Can>
  );
}
