"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Upload,
  Link,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn, slugify } from "@/lib/utils";
import type { Category } from "@/lib/types";

interface CategoryForm {
  name: string;
  slug: string;
  image: string;
  parent_id: string;
  is_active: boolean;
  sort_order: string;
}

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  image: "",
  parent_id: "",
  is_active: true,
  sort_order: "0",
};

// Map MongoDB _id to id so the rest of the code works with a uniform `id` field
function mapCategory(raw: Record<string, unknown>): Category {
  return {
    id: (raw._id as string) || (raw.id as string),
    name: raw.name as string,
    slug: raw.slug as string,
    image: (raw.image as string) || "",
    parent_id: (raw.parent_id as string) || null,
    is_active: raw.is_active as boolean,
    sort_order: (raw.sort_order as number) || 0,
    created_at: (raw.created_at as string) || "",
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Image upload
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const json = await res.json();
        const rawList: Record<string, unknown>[] = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];
        setCategories(rawList.map(mapCategory));
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Build tree
  const rootCategories = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAddDialog = (parentId: string = "") => {
    setEditingId(null);
    setForm({ ...emptyForm, parent_id: parentId });
    setImageMode("url");
    setDialogOpen(true);
  };

  const openEditDialog = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      image: cat.image || "",
      parent_id: cat.parent_id || "",
      is_active: cat.is_active,
      sort_order: cat.sort_order?.toString() || "0",
    });
    setImageMode(cat.image ? "url" : "url");
    setDialogOpen(true);
  };

  // const handleFileUpload = async (file: File) => {
  //   setUploading(true);
  //   try {
  //     const formData = new FormData();
  //     formData.append('file', file);
  //     const res = await fetch('/api/upload', {
  //       method: 'POST',
  //       body: formData,
  //     });
  //     if (res.ok) {
  //       const data = await res.json();
  //       setForm((prev) => ({ ...prev, image: data.url }));
  //     }
  //   } catch (err) {
  //     console.error('Failed to upload image', err);
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  const handleFileUpload = async (file: File) => {
    setUploading(true);

    try {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () => {
        setForm((prev) => ({
          ...prev,
          image: reader.result as string,
        }));

        setUploading(false);
      };

      reader.onerror = () => {
        console.error("Failed to convert image");
        setUploading(false);
      };
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        image: form.image,
        parent_id: form.parent_id || null,
        is_active: form.is_active,
        sort_order: parseInt(form.sort_order) || 0,
      };

      const url = editingId
        ? `/api/categories/${editingId}`
        : "/api/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchCategories();
      }
    } catch (err) {
      console.error("Failed to save category", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? Subcategories will become root categories.",
      )
    )
      return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCategories();
      }
    } catch (err) {
      console.error("Failed to delete category", err);
    } finally {
      setDeletingId(null);
    }
  };

  const renderTree = (cats: Category[], depth: number = 0) => {
    return cats.map((cat) => {
      const children = getChildren(cat.id);
      const hasChildren = children.length > 0;
      const isExpanded = expandedIds.has(cat.id);

      return (
        <div key={cat.id}>
          <div
            className={cn(
              "flex items-center gap-2 border-b py-2.5 px-4 hover:bg-gray-50 transition-colors",
              depth > 0 && "bg-gray-50/50",
            )}
            style={{ paddingLeft: `${16 + depth * 24}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(cat.id)}
                className="text-gray-400 hover:text-gray-600 shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}

            {cat.image && (
              <img
                src={cat.image}
                alt=""
                className="h-6 w-6 rounded object-cover shrink-0"
              />
            )}

            <span
              className={cn(
                "flex-1 text-xs font-medium",
                cat.is_active ? "text-gray-900" : "text-gray-400 line-through",
              )}
            >
              {cat.name}
            </span>

            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                cat.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500",
              )}
            >
              {cat.is_active ? "Active" : "Inactive"}
            </span>

            <span className="text-xs text-gray-400">
              Sort: {cat.sort_order}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => openAddDialog(cat.id)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-green-600"
                title="Add subcategory"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => openEditDialog(cat)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                disabled={deletingId === cat.id}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {hasChildren && isExpanded && renderTree(children, depth + 1)}
        </div>
      );
    });
  };

  const parentOptions = categories.filter((c) => !c.parent_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Categories</h1>
        <Button
          onClick={() => openAddDialog()}
          className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Category
        </Button>
      </div>

      {/* Tree View */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400">
              <FolderTree className="h-8 w-8 mb-2" />
              <p className="text-xs">No categories yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">{renderTree(rootCategories)}</div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editingId ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      name,
                      slug: editingId ? prev.slug : slugify(name),
                    }));
                  }}
                  className="h-8 text-xs"
                  placeholder="Category name"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  className="h-8 text-xs"
                  placeholder="category-slug"
                />
              </div>
            </div>

            {/* Image: URL or Upload */}
            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Image</Label>
              <div className="flex gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => setImageMode("url")}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
                    imageMode === "url"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  )}
                >
                  <Link className="h-3 w-3" />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("upload")}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
                    imageMode === "upload"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  )}
                >
                  <Upload className="h-3 w-3" />
                  Upload
                </button>
              </div>

              {imageMode === "url" ? (
                <Input
                  value={form.image}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, image: e.target.value }))
                  }
                  className="h-8 text-xs"
                  placeholder="https://..."
                />
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-8 text-xs"
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    {uploading ? "Uploading..." : "Choose File"}
                  </Button>
                  {form.image && (
                    <span className="text-xs text-gray-500 truncate max-w-[200px]">
                      {form.image}
                    </span>
                  )}
                </div>
              )}

              {form.image && (
                <div className="mt-2">
                  <img
                    src={form.image}
                    alt="Preview"
                    className="h-12 w-12 rounded object-cover border"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Parent Category</Label>
              <Select
                value={form.parent_id || "none"}
                onValueChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    parent_id: val === "none" ? "" : val,
                  }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="None (Root)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">
                    None (Root)
                  </SelectItem>
                  {parentOptions
                    .filter((c) => c.id !== editingId)
                    .map((cat) => (
                      <SelectItem
                        key={cat.id}
                        value={cat.id}
                        className="text-xs"
                      >
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(val) =>
                    setForm((prev) => ({ ...prev, is_active: val }))
                  }
                />
                <Label className="text-sm text-gray-700">Active</Label>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sort_order: e.target.value }))
                  }
                  className="h-8 text-xs"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
