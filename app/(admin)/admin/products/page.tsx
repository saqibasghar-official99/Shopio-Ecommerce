"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Upload,
  Link as LinkIcon,
} from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, cn, slugify } from "@/lib/utils";
import type { Product, Category, Variant } from "@/lib/types";
import imageCompression from "browser-image-compression";

interface MongoProduct {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  images?: string[];
  category_id: string | { _id: string; name: string; slug: string };
  category?: { _id: string; name: string; slug: string } | null;
  price: number;
  compare_price: number;
  cost?: number;
  stock: number;
  sku?: string;
  weight?: number;
  is_active: boolean;
  is_featured: boolean;
  tags?: string[];
  variants?: Variant[];
  specifications?: { key: string; value: string }[];
  ratings_avg?: number;
  ratings_count?: number;
  created_at?: string;
}

interface MongoCategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  parent_id?: string | null;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
}

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category_id: string;
  price: string;
  compare_price: string;
  cost: string;
  stock: string;
  sku: string;
  weight: string;
  is_featured: boolean;
  is_active: boolean;
  tags: string;
  images: string[];
  variants: Variant[];
  specifications: { key: string; value: string }[];
}

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  short_description: "",
  category_id: "",
  price: "",
  compare_price: "",
  cost: "",
  stock: "",
  sku: "",
  weight: "",
  is_featured: false,
  is_active: true,
  tags: "",
  images: [],
  variants: [],
  specifications: [],
};

function mapMongoProduct(mp: MongoProduct): Product {
  // Handle populated category_id (Mongoose replaces ObjectId with document)
  let categoryId = "";
  let categoryObj: Product["category"] = undefined;

  if (typeof mp.category_id === "object" && mp.category_id !== null) {
    // category_id was populated by Mongoose
    categoryId = mp.category_id._id;
    categoryObj = {
      id: mp.category_id._id,
      name: mp.category_id.name,
      slug: mp.category_id.slug,
      image: "",
      parent_id: null,
      is_active: true,
      sort_order: 0,
      created_at: "",
    };
  } else if (typeof mp.category_id === "string") {
    categoryId = mp.category_id;
    // Also check mp.category (from separate populate)
    if (mp.category) {
      categoryObj = {
        id: mp.category._id,
        name: mp.category.name,
        slug: mp.category.slug,
        image: "",
        parent_id: null,
        is_active: true,
        sort_order: 0,
        created_at: "",
      };
    }
  }

  return {
    id: mp._id,
    name: mp.name,
    slug: mp.slug,
    description: mp.description || "",
    short_description: mp.short_description || "",
    images: mp.images || [],
    category_id: categoryId,
    sub_category: "",
    price: mp.price,
    compare_price: mp.compare_price,
    cost_price: mp.cost || 0,
    stock: mp.stock,
    sku: mp.sku || "",
    weight: mp.weight || 0,
    is_active: mp.is_active,
    is_featured: mp.is_featured,
    tags: mp.tags || [],
    variants: mp.variants || [],
    specifications: mp.specifications || [],
    ratings_avg: mp.ratings_avg || 0,
    ratings_count: mp.ratings_count || 0,
    created_at: mp.created_at || "",
    category: categoryObj,
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("category_id", categoryFilter);
      if (statusFilter !== "all") params.set("is_active", statusFilter);

      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const json = await res.json();
        const raw: MongoProduct[] =
          json.data || json.products || (Array.isArray(json) ? json : []);
        const mapped = raw.map(mapMongoProduct);
        setProducts(mapped);
        const pagination = json.pagination || {};
        setTotal(pagination.total ?? json.total ?? mapped.length);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, categoryFilter, statusFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const json = await res.json();
        const raw: MongoCategory[] =
          json.data || (Array.isArray(json) ? json : []);
        const mapped: Category[] = raw.map((c) => ({
          id: c._id,
          name: c.name,
          slug: c.slug,
          image: c.image || "",
          parent_id: c.parent_id || null,
          is_active: c.is_active ?? true,
          sort_order: c.sort_order ?? 0,
          created_at: c.created_at || "",
        }));
        setCategories(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // const uploadImage = async (file: File): Promise<string | null> => {
  //   setUploadingImage(true);
  //   try {
  //     const formData = new FormData();
  //     formData.append('file', file);
  //     const res = await fetch('/api/upload', { method: 'POST', body: formData });
  //     if (res.ok) {
  //       const json = await res.json();
  //       return json.url || null;
  //     }
  //     return null;
  //   } catch (err) {
  //     console.error('Failed to upload image', err);
  //     return null;
  //   } finally {
  //     setUploadingImage(false);
  //   }
  // };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploadingImage(true);

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1000,
        useWebWorker: true,
      });

      return await new Promise((resolve) => {
        const reader = new FileReader();

        reader.readAsDataURL(compressedFile);

        reader.onload = () => {
          resolve(reader.result as string);
        };

        reader.onerror = () => {
          console.error("Failed to convert image");
          resolve(null);
        };
      });
    } catch (err) {
      console.error("Failed to process image", err);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (form.images.length >= 5) return;
    const url = await uploadImage(file);
    if (url) {
      setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openAddDialog = () => {
    setEditingSlug(null);
    setForm(emptyForm);
    setImageUrlInput("");
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingSlug(product.slug);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      short_description: product.short_description || "",
      category_id: product.category_id,
      price: product.price.toString(),
      compare_price: product.compare_price.toString(),
      cost: product.cost_price?.toString() || "",
      stock: product.stock.toString(),
      sku: product.sku || "",
      weight: product.weight?.toString() || "",
      is_featured: product.is_featured,
      is_active: product.is_active,
      tags: (product.tags || []).join(", "),
      images: product.images || [],
      variants: product.variants || [],
      specifications: product.specifications || [],
    });
    setImageUrlInput("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description,
        short_description: form.short_description,
        category_id: form.category_id,
        price: parseFloat(form.price) || 0,
        compare_price: parseFloat(form.compare_price) || 0,
        cost: parseFloat(form.cost) || 0,
        stock: parseInt(form.stock) || 0,
        sku: form.sku,
        weight: parseFloat(form.weight) || 0,
        is_featured: form.is_featured,
        is_active: form.is_active,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),

        // images: form.images,
        // specifications: form.specifications.filter(
        //   (s) => s.key.trim() && s.value.trim(),
        // ),

        images: form.images,

        specifications: form.specifications.filter(
          (s) => s.key.trim() && s.value.trim(),
        ),

        variants: form.variants.filter(
          (v) => v.label.trim() && v.options.length > 0,
        ),

      };

      console.log("PRODUCT PAYLOAD:", JSON.stringify(payload, null, 2));

      const url = editingSlug
        ? `/api/products/${editingSlug}`
        : "/api/products";
      const method = editingSlug ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchProducts();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Save failed:", errData);
      }
    } catch (err) {
      console.error("Failed to save product", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setDeletingId(product.id);
    try {
      const res = await fetch(`/api/products/${product.slug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
      }
    } catch (err) {
      console.error("Failed to delete product", err);
    } finally {
      setDeletingId(null);
    }
  };

  const addImageByURL = () => {
    if (imageUrlInput.trim() && form.images.length < 5) {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, imageUrlInput.trim()],
      }));
      setImageUrlInput("");
    }
  };

  const removeImage = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const addVariantGroup = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { label: "", options: [] }],
    }));
  };

  const removeVariantGroup = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx),
    }));
  };

  const updateVariantGroup = (
    idx: number,
    field: "label" | "options",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === idx
          ? field === "options"
            ? {
              ...v,
              options: value
                .split(",")
                .map((o) => o.trim())
                .filter(Boolean),
            }
            : { ...v, label: value }
          : v,
      ),
    }));
  };

  const addSpecification = () => {
    setForm((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { key: "", value: "" }],
    }));
  };

  const removeSpecification = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== idx),
    }));
  };

  const updateSpecification = (
    idx: number,
    field: "key" | "value",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.map((s, i) =>
        i === idx ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const columns = [
    {
      key: "image",
      label: "Image",
      render: (row: Record<string, unknown>) => {
        const images = row.images as string[];
        return images?.[0] ? (
          <img
            src={images[0]}
            alt=""
            className="h-8 w-8 rounded object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
            --
          </div>
        );
      },
    },
    {
      key: "name",
      label: "Name",
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-gray-900">{row.name as string}</span>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (row: Record<string, unknown>) => {
        const cat = row.category as Record<string, unknown> | undefined;
        return cat?.name ? (cat.name as string) : "--";
      },
    },
    {
      key: "price",
      label: "Price",
      render: (row: Record<string, unknown>) =>
        formatCurrency(row.price as number),
    },
    {
      key: "stock",
      label: "Stock",
      render: (row: Record<string, unknown>) => {
        const stock = row.stock as number;
        return (
          <span
            className={cn(
              "font-medium",
              stock <= 0
                ? "text-red-600"
                : stock <= 10
                  ? "text-yellow-600"
                  : "text-green-600",
            )}
          >
            {stock}
          </span>
        );
      },
    },
    {
      key: "specifications",
      label: "Specs",
      render: (row: Record<string, unknown>) => {
        const specs = row.specifications as
          | { key: string; value: string }[]
          | undefined;
        const count = specs?.length || 0;
        return count > 0 ? (
          <Badge variant="secondary" className="text-[10px]">
            {count}
          </Badge>
        ) : (
          <span className="text-gray-400 text-xs">--</span>
        );
      },
    },
    {
      key: "is_active",
      label: "Status",
      render: (row: Record<string, unknown>) => (
        <Badge
          variant={row.is_active ? "default" : "secondary"}
          className={cn(
            "text-xs",
            row.is_active
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500",
          )}
        >
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row: Record<string, unknown>) => {
        const product = row as unknown as Product;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => openEditDialog(product)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDelete(product)}
              disabled={deletingId === product.id}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            >
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
        <h1 className="text-lg font-semibold text-gray-900">Products</h1>
        <Button
          onClick={openAddDialog}
          className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Product name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-8 w-48 pl-8 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Category</label>
            <Select
              value={categoryFilter}
              onValueChange={(val) => {
                setCategoryFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Categories
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-xs">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Status</label>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All
                </SelectItem>
                <SelectItem value="true" className="text-xs">
                  Active
                </SelectItem>
                <SelectItem value="false" className="text-xs">
                  Inactive
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={products as unknown as Record<string, unknown>[]}
        loading={loading}
      />
      <Pagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
      />

      {/* Add/Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editingSlug ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name + Slug */}
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
                      slug: editingSlug ? prev.slug : slugify(name),
                    }));
                  }}
                  className="h-8 text-xs"
                  placeholder="Product name"
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
                  placeholder="product-slug"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="text-xs"
                rows={3}
                placeholder="Product description"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Short Description</Label>
              <Textarea
                value={form.short_description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    short_description: e.target.value,
                  }))
                }
                className="text-xs"
                rows={2}
                placeholder="Brief product summary"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Category</Label>
              <Select
                value={form.category_id}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, category_id: val }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Price</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, price: e.target.value }))
                  }
                  className="h-8 text-xs"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Compare Price</Label>
                <Input
                  type="number"
                  value={form.compare_price}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      compare_price: e.target.value,
                    }))
                  }
                  className="h-8 text-xs"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Cost</Label>
                <Input
                  type="number"
                  value={form.cost}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, cost: e.target.value }))
                  }
                  className="h-8 text-xs"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            {/* Stock, SKU, Weight */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Stock</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, stock: e.target.value }))
                  }
                  className="h-8 text-xs"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">SKU</Label>
                <Input
                  value={form.sku}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sku: e.target.value }))
                  }
                  className="h-8 text-xs"
                  placeholder="SKU-001"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Weight (g)</Label>
                <Input
                  type="number"
                  value={form.weight}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, weight: e.target.value }))
                  }
                  className="h-8 text-xs"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_featured}
                  onCheckedChange={(val) =>
                    setForm((prev) => ({ ...prev, is_featured: val }))
                  }
                />
                <Label className="text-sm text-gray-700">Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(val) =>
                    setForm((prev) => ({ ...prev, is_active: val }))
                  }
                />
                <Label className="text-sm text-gray-700">Active</Label>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <Label className="text-sm text-gray-700">
                Tags (comma separated)
              </Label>
              <Input
                value={form.tags}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tags: e.target.value }))
                }
                className="h-8 text-xs"
                placeholder="tag1, tag2, tag3"
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-700">Images</Label>
                <span className="text-[10px] text-gray-400">
                  Up to 5 images. First image is the main image.
                </span>
              </div>

              <div className="rounded-md border border-dashed border-gray-300 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <Upload className="h-3.5 w-3.5" />
                  Upload from device
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    disabled={uploadingImage || form.images.length >= 5}
                  />
                  {uploadingImage && (
                    <span className="text-xs text-gray-400">Uploading...</span>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-dashed border-gray-300 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <LinkIcon className="h-3.5 w-3.5" />
                  Paste URL
                </div>
                <div className="flex gap-2">
                  <Input
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="https://example.com/image.jpg"
                    disabled={form.images.length >= 5}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addImageByURL())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addImageByURL}
                    variant="outline"
                    className="h-8 text-xs shrink-0"
                    disabled={form.images.length >= 5}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.images.map((url, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={url}
                        alt=""
                        className="h-14 w-14 rounded border object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-[8px] text-center py-0.5 rounded-b font-medium">
                          Main
                        </span>
                      )}
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Specifications */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-700">Specifications</Label>
                <Button
                  type="button"
                  onClick={addSpecification}
                  variant="outline"
                  className="h-7 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Spec
                </Button>
              </div>
              {form.specifications.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={spec.key}
                    onChange={(e) =>
                      updateSpecification(idx, "key", e.target.value)
                    }
                    className="h-8 text-xs flex-1"
                    placeholder="Key (e.g. Color)"
                  />
                  <Input
                    value={spec.value}
                    onChange={(e) =>
                      updateSpecification(idx, "value", e.target.value)
                    }
                    className="h-8 text-xs flex-1"
                    placeholder="Value (e.g. Red)"
                  />
                  <button
                    onClick={() => removeSpecification(idx)}
                    className="text-gray-400 hover:text-red-500 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <Separator />

            {/* Variants */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-700">Variants</Label>
                <Button
                  type="button"
                  onClick={addVariantGroup}
                  variant="outline"
                  className="h-7 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Variant Group
                </Button>
              </div>
              {form.variants.map((variant, idx) => (
                <div key={idx} className="rounded border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">
                      Variant {idx + 1}
                    </span>
                    <button
                      onClick={() => removeVariantGroup(idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={variant.label}
                      onChange={(e) =>
                        updateVariantGroup(idx, "label", e.target.value)
                      }
                      className="h-8 text-xs"
                      placeholder="Label (e.g. Size)"
                    />
                    <Input
                      value={variant.options.join(", ")}
                      onChange={(e) =>
                        updateVariantGroup(idx, "options", e.target.value)
                      }
                      className="h-8 text-xs"
                      placeholder="Options (e.g. S, M, L)"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
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
                {saving
                  ? "Saving..."
                  : editingSlug
                    ? "Update Product"
                    : "Create Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
