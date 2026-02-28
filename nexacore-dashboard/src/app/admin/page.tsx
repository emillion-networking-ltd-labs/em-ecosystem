'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminRoute from '@/components/guards/AdminRoute';
import UsersTable from '@/components/admin/UsersTable';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import type { SafeUser, PaginatedResponse, UserRole, AdminUpdateUserDto } from '@/lib/types';

const LIMIT = 10;

export default function AdminPage() {
  const { addToast } = useToast();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: LIMIT, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalType, setModalType] = useState<'role' | 'lock' | 'unlock' | 'delete' | null>(null);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUsers = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search) params.set('search', search);
      const res = await apiClient.get<PaginatedResponse<SafeUser>>(`/users?${params}`);
      setUsers(res.data);
      setMeta(res.meta);
    } catch {
      addToast({ variant: 'error', title: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  }, [search, addToast]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleChangeRole = (user: SafeUser) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setModalType('role');
  };

  const handleToggleLock = (user: SafeUser) => {
    const isLocked = !!user.lockedUntil && new Date(user.lockedUntil) > new Date();
    setSelectedUser(user);
    setModalType(isLocked ? 'unlock' : 'lock');
  };

  const handleDelete = (user: SafeUser) => {
    setSelectedUser(user);
    setModalType('delete');
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
      if (modalType === 'role') {
        await apiClient.patch<SafeUser>(`/users/${selectedUser.id}`, { role: selectedRole } as AdminUpdateUserDto);
      } else if (modalType === 'lock') {
        await apiClient.patch<SafeUser>(`/users/${selectedUser.id}`, { isActive: false } as AdminUpdateUserDto);
      } else if (modalType === 'unlock') {
        await apiClient.patch<SafeUser>(`/users/${selectedUser.id}`, { isActive: true } as AdminUpdateUserDto);
      } else if (modalType === 'delete') {
        await apiClient.delete(`/users/${selectedUser.id}`);
      }
      await fetchUsers(meta.page);
      closeModal();
    } catch {
      addToast({ variant: 'error', title: `Failed to ${modalType} user` });
      setModalLoading(false);
    }
  };

  const modalConfig = {
    role: {
      title: 'Change user role',
      description: `Change role for ${selectedUser?.email || ''}`,
      confirmLabel: 'Change Role',
      variant: 'primary' as const,
    },
    lock: {
      title: 'Lock user account',
      description: `This will prevent ${selectedUser?.email || ''} from logging in.`,
      confirmLabel: 'Lock Account',
      variant: 'danger' as const,
    },
    unlock: {
      title: 'Unlock user account',
      description: `This will restore login access for ${selectedUser?.email || ''}.`,
      confirmLabel: 'Unlock',
      variant: 'primary' as const,
    },
    delete: {
      title: 'Delete user',
      description: `This will permanently delete ${selectedUser?.email || ''}. This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger' as const,
    },
  };

  const currentModal = modalType ? modalConfig[modalType] : null;

  return (
    <AdminRoute>
      <DashboardLayout>
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-body-sm font-semibold text-content-primary">User Management</h1>
          <div className="flex w-64 items-center gap-2 rounded-full border border-border-default bg-surface-secondary px-4">
            <Search size={16} className="text-content-tertiary" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 flex-1 bg-transparent text-body-sm text-content-primary outline-none placeholder:text-content-placeholder"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-body-sm text-content-tertiary">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-border-default bg-surface-primary">
            <p className="text-body-sm text-content-tertiary">No users found.</p>
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
          title={currentModal?.title || ''}
          description={currentModal?.description || ''}
          confirmLabel={currentModal?.confirmLabel}
          variant={currentModal?.variant}
          loading={modalLoading}
        >
          {modalType === 'role' && (
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="mt-3 h-10 w-full rounded-lg border border-border-default bg-transparent px-4 text-body-sm text-content-primary outline-none"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPERADMIN">SUPERADMIN</option>
            </select>
          )}
        </ConfirmModal>
      </DashboardLayout>
    </AdminRoute>
  );
}
