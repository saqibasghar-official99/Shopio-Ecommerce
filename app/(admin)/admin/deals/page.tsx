"use client";

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Plus,
    Pencil,
    Trash2,
    Flame,
    Upload,
    Link as LinkIcon,
    Eye,
    EyeOff,
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

import { cn } from "@/lib/utils";

interface Deal {
    id: string;
    name: string;
    subtitle: string;
    image: string;
    href: string;
    badge: string;
    is_active: boolean;
    sort_order: number;
    created_at?: string;
}

interface DealForm {
    name: string;
    subtitle: string;
    image: string;
    href: string;
    badge: string;
    is_active: boolean;
    sort_order: string;
}

const emptyForm: DealForm = {
    name: "",
    subtitle: "",
    image: "",
    href: "/products",
    badge: "",
    is_active: true,
    sort_order: "0",
};

function mapDeal(raw: Record<string, unknown>): Deal {
    return {
        id: (raw._id as string) || (raw.id as string),
        name: (raw.name as string) || "",
        subtitle: (raw.subtitle as string) || "",
        image: (raw.image as string) || "",
        href: (raw.href as string) || "/products",
        badge: (raw.badge as string) || "",
        is_active:
            typeof raw.is_active === "boolean"
                ? raw.is_active
                : true,
        sort_order:
            typeof raw.sort_order === "number"
                ? raw.sort_order
                : 0,
        created_at: (raw.created_at as string) || "",
    };
}

export default function AdminDealsPage() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);

    const [sectionVisible, setSectionVisible] =
        useState(true);

    const [savingSection, setSavingSection] =
        useState(false);

    const [dialogOpen, setDialogOpen] =
        useState(false);

    const [editingId, setEditingId] =
        useState<string | null>(null);

    const [form, setForm] =
        useState<DealForm>(emptyForm);

    const [saving, setSaving] =
        useState(false);

    const [deletingId, setDeletingId] =
        useState<string | null>(null);

    const [uploading, setUploading] =
        useState(false);

    const [imageMode, setImageMode] =
        useState<"url" | "upload">("url");

    const fileInputRef =
        useRef<HTMLInputElement>(null);

    /*
     * ============================================================
     * FETCH DEALS
     * ============================================================
     */

    const fetchDeals = useCallback(async () => {
        setLoading(true);

        try {
            const [dealsRes, settingsRes] =
                await Promise.all([
                    fetch("/api/deals", {
                        cache: "no-store",
                    }),
                    fetch("/api/deals/settings", {
                        cache: "no-store",
                    }),
                ]);

            if (!dealsRes.ok) {
                throw new Error(
                    "Failed to fetch deals",
                );
            }

            const dealsJson =
                await dealsRes.json();

            const rawList: Record<string, unknown>[] =
                Array.isArray(dealsJson.data)
                    ? dealsJson.data
                    : Array.isArray(dealsJson)
                        ? dealsJson
                        : [];

            setDeals(rawList.map(mapDeal));

            if (settingsRes.ok) {
                const settingsJson =
                    await settingsRes.json();

                setSectionVisible(
                    settingsJson.show_section !== false,
                );
            }
        } catch (error) {
            console.error(
                "Failed to fetch deals:",
                error,
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDeals();
    }, [fetchDeals]);

    /*
     * ============================================================
     * OPEN ADD
     * ============================================================
     */

    const openAddDialog = () => {
        setEditingId(null);
        setForm({
            ...emptyForm,
            sort_order: String(deals.length),
        });
        setImageMode("url");
        setDialogOpen(true);
    };

    /*
     * ============================================================
     * OPEN EDIT
     * ============================================================
     */

    const openEditDialog = (deal: Deal) => {
        setEditingId(deal.id);

        setForm({
            name: deal.name,
            subtitle: deal.subtitle,
            image: deal.image,
            href: deal.href,
            badge: deal.badge,
            is_active: deal.is_active,
            sort_order: String(deal.sort_order),
        });

        setImageMode("url");
        setDialogOpen(true);
    };

    /*
     * ============================================================
     * IMAGE UPLOAD
     * ============================================================
     */

    const handleFileUpload = async (file: File) => {
        setUploading(true);

        try {
            const formData = new FormData();

            formData.append("file", file);

            const res = await fetch("/api/upload/deal", {
                method: "POST",
                body: formData,
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message || "Failed to upload image",
                );
            }

            setForm((prev) => ({
                ...prev,
                image: json.url,
            }));
        } catch (error) {
            console.error(
                "Failed to upload image:",
                error,
            );

            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to upload image",
            );
        } finally {
            setUploading(false);
        }
    };

    /*
     * ============================================================
     * SAVE DEAL
     * ============================================================
     */

    const handleSave = async () => {
        if (!form.name.trim()) {
            alert("Please enter a deal name.");
            return;
        }

        setSaving(true);

        try {
            const badge = form.badge.trim();

            /*
             * Automatically generate the products URL
             * from the Deal badge.
             *
             * Example:
             *
             * badge = "SALE"
             *
             * href = "/products?badge=SALE"
             */
            const dealHref = badge
                ? `/products?badge=${encodeURIComponent(badge)}`
                : "/products";

            const payload = {
                name: form.name.trim(),
                subtitle: form.subtitle.trim(),
                image: form.image,

                /*
                 * Automatically connect Deal → Product badge.
                 */
                href: dealHref,

                badge,

                is_active: form.is_active,

                sort_order:
                    parseInt(form.sort_order, 10) || 0,
            };

            const url = editingId
                ? `/api/deals/${editingId}`
                : "/api/deals";

            const method = editingId
                ? "PUT"
                : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(
                    json.message ||
                    "Failed to save deal"
                );
            }

            setDialogOpen(false);
            setForm(emptyForm);
            setEditingId(null);

            await fetchDeals();
        } catch (error) {
            console.error(
                "Failed to save deal:",
                error
            );

            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to save deal"
            );
        } finally {
            setSaving(false);
        }
    };

    /*
     * ============================================================
     * DELETE DEAL
     * ============================================================
     */

    const handleDelete = async (
        id: string,
    ) => {
        const confirmed = confirm(
            "Are you sure you want to delete this deal?",
        );

        if (!confirmed) return;

        setDeletingId(id);

        try {
            const res = await fetch(
                `/api/deals/${id}`,
                {
                    method: "DELETE",
                },
            );

            const json = await res.json();

            if (!res.ok) {
                throw new Error(
                    json.message ||
                    "Failed to delete deal",
                );
            }

            await fetchDeals();
        } catch (error) {
            console.error(
                "Failed to delete deal:",
                error,
            );

            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to delete deal",
            );
        } finally {
            setDeletingId(null);
        }
    };

    /*
     * ============================================================
     * TOGGLE INDIVIDUAL DEAL
     * ============================================================
     */

    const toggleDealStatus = async (
        deal: Deal,
    ) => {
        try {
            const res = await fetch(
                `/api/deals/${deal.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        name: deal.name,
                        subtitle: deal.subtitle,
                        image: deal.image,
                        href: deal.href,
                        badge: deal.badge,
                        is_active: !deal.is_active,
                        sort_order: deal.sort_order,
                    }),
                },
            );

            if (!res.ok) {
                throw new Error(
                    "Failed to update deal status",
                );
            }

            await fetchDeals();
        } catch (error) {
            console.error(
                "Failed to toggle deal status:",
                error,
            );
        }
    };

    /*
     * ============================================================
     * TOGGLE WHOLE DEAL SECTION
     * ============================================================
     *
     * This is the important new feature.
     *
     * We save this through:
     *
     * PUT /api/deals/settings
     *
     */

    const toggleSectionVisibility = async (
        value: boolean,
    ) => {
        setSavingSection(true);

        try {
            const res = await fetch(
                "/api/deals/settings",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        show_section: value,
                    }),
                },
            );

            const json = await res.json();

            if (!res.ok) {
                throw new Error(
                    json.message ||
                    "Failed to update section visibility",
                );
            }

            setSectionVisible(value);
        } catch (error) {
            console.error(
                "Failed to update section visibility:",
                error,
            );

            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to update section visibility",
            );
        } finally {
            setSavingSection(false);
        }
    };

    /*
     * ============================================================
     * RENDER
     * ============================================================
     */

    return (
        <div className="space-y-4">

            {/* ======================================================
          HEADER
      ======================================================= */}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                        Deals
                    </h1>

                    <p className="text-xs text-gray-500 mt-0.5">
                        Manage the deals displayed on your
                        storefront.
                    </p>
                </div>

                <Button
                    onClick={openAddDialog}
                    className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
                >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Deal
                </Button>
            </div>

            {/* ======================================================
          SECTION VISIBILITY
      ======================================================= */}

            <Card>
                <CardContent className="p-4">

                    <div className="flex items-center justify-between gap-4">

                        <div className="flex items-center gap-3">

                            <div
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-full",
                                    sectionVisible
                                        ? "bg-green-100"
                                        : "bg-gray-100",
                                )}
                            >
                                {sectionVisible ? (
                                    <Eye className="h-4 w-4 text-green-600" />
                                ) : (
                                    <EyeOff className="h-4 w-4 text-gray-500" />
                                )}
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    Show Deals Section
                                </p>

                                <p className="text-xs text-gray-500">
                                    {sectionVisible
                                        ? "The Deals section is currently visible on the website."
                                        : "The Deals section is hidden from the website."}
                                </p>
                            </div>

                        </div>

                        <Switch
                            checked={sectionVisible}
                            disabled={savingSection}
                            onCheckedChange={
                                toggleSectionVisibility
                            }
                        />

                    </div>

                </CardContent>
            </Card>

            {/* ======================================================
          DEALS LIST
      ======================================================= */}

            <Card>
                <CardContent className="p-0">

                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        </div>
                    ) : deals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-10 text-gray-400">

                            <Flame className="h-8 w-8 mb-2" />

                            <p className="text-xs">
                                No deals yet
                            </p>

                            <Button
                                onClick={openAddDialog}
                                variant="outline"
                                className="mt-3 h-8 text-xs"
                            >
                                <Plus className="mr-1 h-3.5 w-3.5" />
                                Add First Deal
                            </Button>

                        </div>
                    ) : (
                        <div className="overflow-x-auto">

                            {deals.map((deal) => (
                                <div
                                    key={deal.id}
                                    className="flex items-center gap-3 border-b px-4 py-3 hover:bg-gray-50 transition-colors"
                                >

                                    {/* IMAGE */}

                                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border bg-gray-100">

                                        {deal.image ? (
                                            <img
                                                src={deal.image}
                                                alt={deal.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <Flame className="h-5 w-5 text-[#7A1F3D]" />
                                            </div>
                                        )}

                                    </div>

                                    {/* NAME */}

                                    <div className="min-w-0 flex-1">

                                        <div className="flex items-center gap-2">

                                            <p
                                                className={cn(
                                                    "text-sm font-medium truncate",
                                                    deal.is_active
                                                        ? "text-gray-900"
                                                        : "text-gray-400 line-through",
                                                )}
                                            >
                                                {deal.name}
                                            </p>

                                            {deal.badge && (
                                                <span className="rounded-full bg-[#7A1F3D] px-1.5 py-0.5 text-[8px] font-bold text-white">
                                                    {deal.badge}
                                                </span>
                                            )}

                                        </div>

                                        <p className="text-xs text-gray-500 truncate">
                                            {deal.subtitle ||
                                                "No subtitle"}
                                        </p>

                                    </div>

                                    {/* LINK */}

                                    <div className="hidden md:block w-[180px]">

                                        <p className="text-[10px] text-gray-400">
                                            Link
                                        </p>

                                        <p className="text-xs text-gray-600 truncate">
                                            {deal.href}
                                        </p>

                                    </div>

                                    {/* SORT */}

                                    <div className="hidden sm:block w-[70px] text-center">

                                        <p className="text-[10px] text-gray-400">
                                            Sort
                                        </p>

                                        <p className="text-xs text-gray-600">
                                            {deal.sort_order}
                                        </p>

                                    </div>

                                    {/* STATUS */}

                                    <button
                                        onClick={() =>
                                            toggleDealStatus(deal)
                                        }
                                        className={cn(
                                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                            deal.is_active
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-500",
                                        )}
                                    >
                                        {deal.is_active
                                            ? "Active"
                                            : "Inactive"}
                                    </button>

                                    {/* ACTIONS */}

                                    <div className="flex items-center gap-1">

                                        <button
                                            onClick={() =>
                                                openEditDialog(deal)
                                            }
                                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                            title="Edit"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleDelete(deal.id)
                                            }
                                            disabled={
                                                deletingId === deal.id
                                            }
                                            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>

                                    </div>

                                </div>
                            ))}

                        </div>
                    )}

                </CardContent>
            </Card>

            {/* ======================================================
          ADD / EDIT DIALOG
      ======================================================= */}

            <Dialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            >
                <DialogContent className="max-w-md">

                    <DialogHeader>
                        <DialogTitle className="text-sm font-semibold">
                            {editingId
                                ? "Edit Deal"
                                : "Add Deal"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">

                        {/* NAME + SUBTITLE */}

                        <div className="grid grid-cols-2 gap-3">

                            <div className="space-y-1">
                                <Label className="text-sm text-gray-700">
                                    Name
                                </Label>

                                <Input
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    className="h-8 text-xs"
                                    placeholder="Flash Sale"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-sm text-gray-700">
                                    Subtitle
                                </Label>

                                <Input
                                    value={form.subtitle}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            subtitle:
                                                e.target.value,
                                        }))
                                    }
                                    className="h-8 text-xs"
                                    placeholder="Up to 30% OFF"
                                />
                            </div>

                        </div>

                        {/* IMAGE */}

                        <div className="space-y-1">

                            <Label className="text-sm text-gray-700">
                                Image
                            </Label>

                            <div className="flex gap-2 mb-1">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setImageMode("url")
                                    }
                                    className={cn(
                                        "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium",
                                        imageMode === "url"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                                    )}
                                >
                                    <LinkIcon className="h-3 w-3" />
                                    URL
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setImageMode("upload")
                                    }
                                    className={cn(
                                        "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium",
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
                                        setForm((prev) => ({
                                            ...prev,
                                            image: e.target.value,
                                        }))
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
                                            const file =
                                                e.target.files?.[0];

                                            if (file) {
                                                handleFileUpload(file);
                                            }
                                        }}
                                    />

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        disabled={uploading}
                                        className="h-8 text-xs"
                                    >
                                        <Upload className="mr-1.5 h-3.5 w-3.5" />

                                        {uploading
                                            ? "Uploading..."
                                            : "Choose File"}
                                    </Button>

                                </div>
                            )}

                            {form.image && (
                                <div className="mt-2">

                                    <img
                                        src={form.image}
                                        alt="Preview"
                                        className="h-16 w-16 rounded-full object-cover border"
                                    />

                                </div>
                            )}

                        </div>

                        {/* LINK */}

                        {/* BADGE */}

                        <div className="space-y-1">

                            <Label className="text-sm text-gray-700">
                                Badge
                            </Label>

                            <Input
                                value={form.badge}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        badge: e.target.value,
                                    }))
                                }
                                className="h-8 text-xs"
                                placeholder="HOT, SALE, NEW, LIMITED"
                            />

                        </div>

                        {/* ACTIVE + SORT */}

                        <div className="grid grid-cols-2 gap-3">

                            <div className="flex items-center gap-2">

                                <Switch
                                    checked={form.is_active}
                                    onCheckedChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            is_active: value,
                                        }))
                                    }
                                />

                                <Label className="text-sm text-gray-700">
                                    Active
                                </Label>

                            </div>

                            <div className="space-y-1">

                                <Label className="text-sm text-gray-700">
                                    Sort Order
                                </Label>

                                <Input
                                    type="number"
                                    value={form.sort_order}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            sort_order:
                                                e.target.value,
                                        }))
                                    }
                                    className="h-8 text-xs"
                                    placeholder="0"
                                />

                            </div>

                        </div>

                        {/* BUTTONS */}

                        <div className="flex justify-end gap-2 pt-2">

                            <Button
                                variant="outline"
                                onClick={() =>
                                    setDialogOpen(false)
                                }
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
                                    : editingId
                                        ? "Update"
                                        : "Create"}
                            </Button>

                        </div>

                    </div>

                </DialogContent>
            </Dialog>

        </div>
    );
}