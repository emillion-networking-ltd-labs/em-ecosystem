"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminRoute from "@/components/guards/AdminRoute";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Divider from "@/components/ui/Divider";
import UsersTable from "@/components/admin/UsersTable";
import Pagination from "@/components/ui/Pagination";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { apiClient, SessionExpiredError } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { ADMIN_TOAST } from "@/lib/toast-messages";
import type {
  SafeUser,
  PaginatedResponse,
  UserRole,
  AdminUpdateUserDto,
} from "@/lib/types";

const LIMIT = 10;

export default function AdminPage() {
  const { addToast } = useToast();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: LIMIT,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalType, setModalType] = useState<
    "role" | "lock" | "unlock" | "delete" | null
  >(null);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("USER");
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUsers = useCallback(
    async (page: number, signal?: AbortSignal) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(LIMIT),
        });
        if (search) params.set("search", search);
        const res = await apiClient.get<PaginatedResponse<SafeUser>>(
          `/users?${params}`,
          { signal },
        );
        if (signal?.aborted) return;
        setUsers(res.data);
        setMeta(res.meta);
      } catch (err) {
        if (signal?.aborted) return;
        if (err instanceof SessionExpiredError) return;
        addToast(ADMIN_TOAST.LOAD_USERS_FAILED);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [search, addToast],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(1, controller.signal);
    return () => controller.abort();
  }, [fetchUsers]);

  const handleChangeRole = (user: SafeUser) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setModalType("role");
  };

  const handleToggleLock = (user: SafeUser) => {
    setSelectedUser(user);
    setModalType(user.isActive ? "lock" : "unlock");
  };

  const handleDelete = (user: SafeUser) => {
    setSelectedUser(user);
    setModalType("delete");
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
    setModalLoading(false);
  };

  const handleConfirm = async () => {
    if (!selectedUser) return;
    setModalLoading(true);

    try {
      if (modalType === "role") {
        await apiClient.patch<SafeUser>(`/users/${selectedUser.id}`, {
          role: selectedRole,
        } as AdminUpdateUserDto);
      } else if (modalType === "lock") {
        await apiClient.patch<SafeUser>(`/users/${selectedUser.id}`, {
          isActive: false,
        } as AdminUpdateUserDto);
      } else if (modalType === "unlock") {
        await apiClient.patch<SafeUser>(`/users/${selectedUser.id}`, {
          isActive: true,
        } as AdminUpdateUserDto);
      } else if (modalType === "delete") {
        await apiClient.delete(`/users/${selectedUser.id}`);
      }
      await fetchUsers(meta.page);
      closeModal();
    } catch {
      addToast({
        variant: "error",
        title: "Action failed",
        description: `Could not ${modalType} user.`,
      });
      setModalLoading(false);
    }
  };

  const modalConfig = {
    role: {
      title: "Change user role",
      description: `Change role for ${selectedUser?.email || ""}`,
      confirmLabel: "Change Role",
      variant: "primary" as const,
    },
    lock: {
      title: "Lock user account",
      description: `This will prevent ${selectedUser?.email || ""} from logging in.`,
      confirmLabel: "Lock Account",
      variant: "danger" as const,
    },
    unlock: {
      title: "Unlock user account",
      description: `This will restore login access for ${selectedUser?.email || ""}.`,
      confirmLabel: "Unlock",
      variant: "primary" as const,
    },
    delete: {
      title: "Delete user",
      description: `This will permanently delete ${selectedUser?.email || ""}. This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger" as const,
    },
  };

  const currentModal = modalType ? modalConfig[modalType] : null;

  return (
    <AdminRoute>
      <DashboardLayout>
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-h2 font-semibold text-content-primary">
              User Management
            </h1>
            <Divider orientation="vertical" className="h-6" />
            <Breadcrumbs
              items={[
                { label: "Dashboards", href: "/dashboard" },
                { label: "Admin", href: "/admin" },
                { label: "User Management" },
              ]}
            />
          </div>
          <div className="w-64">
            <Input
              name="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              size="md"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-body text-content-tertiary">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-border-default bg-surface-primary">
            <p className="text-body text-content-tertiary">No users found.</p>
          </div>
        ) : (
          <>
            <UsersTable
              users={users}
              onChangeRole={handleChangeRole}
              onToggleLock={handleToggleLock}
              onDelete={handleDelete}
            />
            {meta.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={(page) => fetchUsers(page)}
                />
              </div>
            )}
          </>
        )}

        {/* Confirm modal */}
        <ConfirmModal
          open={!!modalType}
          onClose={closeModal}
          onConfirm={handleConfirm}
          title={currentModal?.title || ""}
          description={currentModal?.description || ""}
          confirmLabel={currentModal?.confirmLabel}
          variant={currentModal?.variant}
          loading={modalLoading}
        >
          {modalType === "role" && (
            <div className="mt-3">
              <Select
                options={[
                  { value: "USER", label: "USER" },
                  { value: "ADMIN", label: "ADMIN" },
                  { value: "SUPERADMIN", label: "SUPERADMIN" },
                ]}
                value={selectedRole}
                onChange={(v) => setSelectedRole(v as UserRole)}
                placeholder="Select role"
              />
            </div>
          )}
        </ConfirmModal>
      </DashboardLayout>
    </AdminRoute>
  );
}
