'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatCurrency, cn } from '@/lib/utils';
import type { DeliveryZone } from '@/lib/types';

interface ZoneForm {
  name: string;
  cities: string;
  fee: string;
  is_active: boolean;
}

const emptyForm: ZoneForm = {
  name: '',
  cities: '',
  fee: '',
  is_active: true,
};

// Map MongoDB _id to id so the rest of the code works with a uniform `id` field
function mapZone(raw: Record<string, unknown>): DeliveryZone {
  return {
    id: (raw._id as string) || (raw.id as string),
    name: raw.name as string,
    cities: (raw.cities as string[]) || [],
    fee: (raw.fee as number) || 0,
    is_active: raw.is_active as boolean,
    created_at: (raw.created_at as string) || '',
  };
}

export default function AdminDeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ZoneForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/delivery-zones?all=true');
      if (res.ok) {
        const json = await res.json();
        const rawList: Record<string, unknown>[] = Array.isArray(json.data) ? json.data : [];
        setZones(rawList.map(mapZone));
      }
    } catch (err) {
      console.error('Failed to fetch delivery zones', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const openAddDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (zone: DeliveryZone) => {
    setEditingId(zone.id);
    setForm({
      name: zone.name,
      cities: (zone.cities || []).join(', '),
      fee: zone.fee?.toString() || '0',
      is_active: zone.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        cities: form.cities.split(',').map((c) => c.trim()).filter(Boolean),
        fee: parseFloat(form.fee) || 0,
        is_active: form.is_active,
      };

      const url = editingId ? `/api/delivery-zones/${editingId}` : '/api/delivery-zones';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchZones();
      }
    } catch (err) {
      console.error('Failed to save delivery zone', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery zone?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/delivery-zones/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchZones();
      }
    } catch (err) {
      console.error('Failed to delete delivery zone', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Delivery Zones</h1>
        <Button onClick={openAddDialog} className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Zone
        </Button>
      </div>

      {/* Zones List */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
        </div>
      ) : zones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-gray-400">
            <MapPin className="h-8 w-8 mb-2" />
            <p className="text-xs">No delivery zones yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone) => (
            <Card key={zone.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-900">{zone.name}</h3>
                    <p className="text-xs text-gray-500">
                      Fee: <span className="font-medium text-gray-900">{formatCurrency(zone.fee)}</span>
                    </p>
                  </div>
                  <Badge className={cn('text-xs', zone.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                    {zone.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {(zone.cities || []).map((city, idx) => (
                    <span key={idx} className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {city}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-1 border-t pt-3">
                  <button
                    onClick={() => openEditDialog(zone)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(zone.id)}
                    disabled={deletingId === zone.id}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editingId ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Zone Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="h-8 text-xs"
                placeholder="e.g. Dhaka Metro"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Cities (comma separated)</Label>
              <Input
                value={form.cities}
                onChange={(e) => setForm((prev) => ({ ...prev, cities: e.target.value }))}
                className="h-8 text-xs"
                placeholder="Dhaka, Gazipur, Narayanganj"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Delivery Fee</Label>
              <Input
                type="number"
                value={form.fee}
                onChange={(e) => setForm((prev) => ({ ...prev, fee: e.target.value }))}
                className="h-8 text-xs"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(val) => setForm((prev) => ({ ...prev, is_active: val }))} />
              <Label className="text-sm text-gray-700">Active</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
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
