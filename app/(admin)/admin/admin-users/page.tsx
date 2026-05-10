'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, UserCog } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface AdminUserData {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
}

interface AdminUserForm {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
}

const emptyForm: AdminUserForm = { name: '', email: '', password: '', phone: '', role: 'admin' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminUserForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-users');
      if (res.ok) {
        const json = await res.json();
        const data: AdminUserData[] = (json.data || []).map((u: AdminUserData & { _id?: string }) => ({ ...u, id: u._id || u.id }));
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch admin users', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openAddDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (user: AdminUserData) => {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, password: '', phone: user.phone, role: user.role });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/admin-users/${editingId}` : '/api/admin-users';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { name: form.name, email: form.email, phone: form.phone, role: form.role, ...(form.password ? { password: form.password } : {}) }
        : { name: form.name, email: form.email, password: form.password, phone: form.phone, role: form.role };

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setDialogOpen(false);
        fetchUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to save');
      }
    } catch {
      alert('Failed to save admin user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: AdminUserData) => {
    if (!confirm(`Delete admin user "${user.name}"?`)) return;
    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/admin-users/${user.id}`, { method: 'DELETE' });
      if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      console.error('Failed to delete admin user', err);
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-gray-900">{row.name as string}</span>
      ),
    },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'role',
      label: 'Role',
      render: (row: Record<string, unknown>) => {
        const role = row.role as string;
        return (
          <Badge className={cn('text-xs', role === 'super_admin' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
            {role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </Badge>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (row: Record<string, unknown>) => {
        const d = row.created_at as string;
        return d ? new Date(d).toLocaleDateString() : '--';
      },
    },
    {
      key: 'actions',
      label: '',
      render: (row: Record<string, unknown>) => {
        const user = row as unknown as AdminUserData;
        return (
          <div className="flex items-center gap-1">
            <button onClick={() => openEditDialog(user)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => handleDelete(user)} disabled={deletingId === user.id} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Admin Users</h1>
        <Button onClick={openAddDialog} className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Admin User
        </Button>
      </div>

      <DataTable columns={columns} data={users as unknown as Record<string, unknown>[]} loading={loading} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editingId ? 'Edit Admin User' : 'Add Admin User'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="h-8 text-xs" placeholder="Full name" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="h-8 text-xs" placeholder="admin@example.com" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-gray-700">{editingId ? 'New Password (leave blank to keep current)' : 'Password'}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="h-8 text-xs" placeholder={editingId ? 'Leave blank to keep' : 'Password'} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="h-8 text-xs" placeholder="+1 234 567 890" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Role</Label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                className="h-8 w-full rounded-md border border-gray-200 px-2 text-xs"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-8 text-xs">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
