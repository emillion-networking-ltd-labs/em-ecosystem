"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminRoute from "@/components/guards/AdminRoute";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Divider from "@/components/ui/Divider";
import UsersTable from "@/components/admin/UsersTable";
import Pagination from "@/components/ui/Pagination";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Search } from "lucide-react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import Accordion from "@/components/ui/Accordion";
import AlertBox from "@/components/ui/AlertBox";
import { apiClient, SessionExpiredError } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { ADMIN_TOAST } from "@/lib/toast-messages";
import MetricCard from "@/components/dashboard/MetricCard";
import type {
  SafeUser,
  PaginatedResponse,
  UserRole,
  AdminUpdateUserDto,
} from "@/lib/types";

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 rows" },
  { value: "20", label: "20 rows" },
  { value: "50", label: "50 rows" },
];

export default function AdminPage() {
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [initialLoading, setInitialLoading] = useState(true);

  // Sync search from URL params (when navigating from command palette)
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    if (urlSearch && urlSearch !== search) {
      setSearch(urlSearch);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps
  const [isFetching, setIsFetching] = useState(false);

  // Modal state
  const [modalType, setModalType] = useState<
    "role" | "lock" | "unlock" | "delete" | null
  >(null);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("USER");
  const [modalLoading, setModalLoading] = useState(false);

  // Stats for metric cards
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    locked: 0,
    admins: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [total, active, admins] = await Promise.all([
        apiClient.get<PaginatedResponse<SafeUser>>("/users?limit=1"),
        apiClient.get<PaginatedResponse<SafeUser>>(
          "/users?isActive=true&limit=1",
        ),
        apiClient.get<PaginatedResponse<SafeUser>>("/users?role=ADMIN&limit=1"),
      ]);
      setStats({
        total: total.meta.total,
        active: active.meta.total,
        locked: total.meta.total - active.meta.total,
        admins: admins.meta.total,
      });
    } catch {
      // Stats are non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const fetchUsers = useCallback(
    async (page: number, signal?: AbortSignal) => {
      setIsFetching(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
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
        if (!signal?.aborted) {
          setIsFetching(false);
          setInitialLoading(false);
        }
      }
    },
    [search, pageSize, addToast],
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
      fetchStats();
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
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <h1 className="text-h2 font-semibold text-content-primary">
            User Management
          </h1>
          <Divider orientation="vertical" className="hidden sm:block" />
          <Breadcrumbs
            items={[
              { label: "Dashboards", href: "/dashboard" },
              { label: "Admin", href: "/admin" },
              { label: "User Management" },
            ]}
          />
        </div>

        {/* Search */}
        <div className="card-flat mb-6">
          <Input
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            size="md"
            leftIcon={<Search size={16} />}
          />
        </div>

        {/* Content */}
        <div className="card-flat">
          {/* Stats */}
          <Accordion
            className="mb-6"
            items={[
              {
                title: "User Stats",
                children: (
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <MetricCard
                      label="Total Users"
                      value={stats.total.toLocaleString()}
                      colorVariant="purple"
                      loading={statsLoading}
                    />
                    <MetricCard
                      label="Active"
                      value={stats.active.toLocaleString()}
                      colorVariant="blue"
                      loading={statsLoading}
                    />
                    <MetricCard
                      label="Locked"
                      value={stats.locked.toLocaleString()}
                      colorVariant="purple"
                      loading={statsLoading}
                    />
                    <MetricCard
                      label="Admins"
                      value={stats.admins.toLocaleString()}
                      colorVariant="blue"
                      loading={statsLoading}
                    />
                  </div>
                ),
              },
            ]}
          />

          {/* Table */}
          {initialLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-body text-content-tertiary">No users found.</p>
            </div>
          ) : (
            <div
              className={`transition-opacity duration-150 ${isFetching ? "opacity-50 pointer-events-none" : "opacity-100"}`}
            >
              <UsersTable
                users={users}
                onChangeRole={handleChangeRole}
                onToggleLock={handleToggleLock}
                onDelete={handleDelete}
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-caption text-content-tertiary">
                    Rows per page
                  </span>
                  <Select
                    options={PAGE_SIZE_OPTIONS}
                    value={String(pageSize)}
                    onChange={(v) => {
                      setPageSize(Number(v));
                      fetchUsers(1);
                    }}
                    size="sm"
                  />
                  <span className="text-caption text-content-tertiary">
                    {meta.total} total users
                  </span>
                </div>
                {meta.totalPages > 1 && (
                  <Pagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    onPageChange={(page) => fetchUsers(page)}
                  />
                )}
              </div>
            </div>
          )}
        </div>

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
            <div className="mt-3 space-y-3">
              <Select
                options={[
                  { value: "USER", label: "USER" },
                  { value: "ADMIN", label: "ADMIN" },
                ]}
                value={selectedRole}
                onChange={(v) => setSelectedRole(v as UserRole)}
                placeholder="Select role"
              />
              {selectedRole === "ADMIN" && (
                <AlertBox variant="warning">
                  This will give the user access to user management, audit logs
                  and permissions.
                </AlertBox>
              )}
            </div>
          )}
        </ConfirmModal>
      </DashboardLayout>
    </AdminRoute>
  );
}
