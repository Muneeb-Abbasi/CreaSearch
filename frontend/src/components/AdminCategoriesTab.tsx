import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    adminCategoryApi,
    type Category,
    type Niche,
} from "@/lib/api";
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    FolderTree,
    Tag,
    ChevronDown,
    ChevronRight,
    Save,
    X,
} from "lucide-react";

// Slugify helper
function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

export function AdminCategoriesTab() {
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [niches, setNiches] = useState<Niche[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

    // Category form
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryName, setCategoryName] = useState("");
    const [categorySlug, setCategorySlug] = useState("");
    const [categorySortOrder, setCategorySortOrder] = useState(0);

    // Niche form
    const [showNicheForm, setShowNicheForm] = useState<string | null>(null); // category_id
    const [editingNiche, setEditingNiche] = useState<Niche | null>(null);
    const [nicheName, setNicheName] = useState("");
    const [nicheSlug, setNicheSlug] = useState("");
    const [nicheSortOrder, setNicheSortOrder] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [cats, nicheList] = await Promise.all([
                adminCategoryApi.getCategories(),
                adminCategoryApi.getNiches(),
            ]);
            setCategories(cats);
            setNiches(nicheList);
        } catch {
            toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Category CRUD ──────────────────────────────

    const resetCategoryForm = () => {
        setShowCategoryForm(false);
        setEditingCategory(null);
        setCategoryName("");
        setCategorySlug("");
        setCategorySortOrder(0);
    };

    const handleCategorySave = async () => {
        if (!categoryName.trim()) return;
        const slug = categorySlug.trim() || slugify(categoryName);

        try {
            if (editingCategory) {
                await adminCategoryApi.updateCategory(editingCategory.id, {
                    name: categoryName.trim(),
                    slug,
                    sort_order: categorySortOrder,
                });
                toast({ title: "Category updated" });
            } else {
                await adminCategoryApi.createCategory({
                    name: categoryName.trim(),
                    slug,
                    sort_order: categorySortOrder,
                });
                toast({ title: "Category created" });
            }
            resetCategoryForm();
            fetchData();
        } catch {
            toast({ title: "Error", description: "Operation failed", variant: "destructive" });
        }
    };

    const handleCategoryDelete = async (id: string) => {
        if (!confirm("Deactivate this category? It will be hidden from public listings.")) return;
        try {
            await adminCategoryApi.deleteCategory(id);
            toast({ title: "Category deactivated" });
            fetchData();
        } catch {
            toast({ title: "Error", description: "Failed to deactivate", variant: "destructive" });
        }
    };

    const handleCategoryToggleActive = async (cat: Category) => {
        try {
            await adminCategoryApi.updateCategory(cat.id, { is_active: !cat.is_active });
            toast({ title: cat.is_active ? "Category deactivated" : "Category reactivated" });
            fetchData();
        } catch {
            toast({ title: "Error", description: "Toggle failed", variant: "destructive" });
        }
    };

    const startEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setCategoryName(cat.name);
        setCategorySlug(cat.slug);
        setCategorySortOrder(cat.sort_order);
        setShowCategoryForm(true);
    };

    // ── Niche CRUD ────────────────────────────────

    const resetNicheForm = () => {
        setShowNicheForm(null);
        setEditingNiche(null);
        setNicheName("");
        setNicheSlug("");
        setNicheSortOrder(0);
    };

    const handleNicheSave = async () => {
        if (!nicheName.trim() || !showNicheForm) return;
        const slug = nicheSlug.trim() || slugify(nicheName);

        try {
            if (editingNiche) {
                await adminCategoryApi.updateNiche(editingNiche.id, {
                    name: nicheName.trim(),
                    slug,
                    sort_order: nicheSortOrder,
                });
                toast({ title: "Niche updated" });
            } else {
                await adminCategoryApi.createNiche({
                    category_id: showNicheForm,
                    name: nicheName.trim(),
                    slug,
                    sort_order: nicheSortOrder,
                });
                toast({ title: "Niche created" });
            }
            resetNicheForm();
            fetchData();
        } catch {
            toast({ title: "Error", description: "Operation failed", variant: "destructive" });
        }
    };

    const handleNicheDelete = async (id: string) => {
        if (!confirm("Deactivate this niche?")) return;
        try {
            await adminCategoryApi.deleteNiche(id);
            toast({ title: "Niche deactivated" });
            fetchData();
        } catch {
            toast({ title: "Error", description: "Failed to deactivate", variant: "destructive" });
        }
    };

    const handleNicheToggleActive = async (niche: Niche) => {
        try {
            await adminCategoryApi.updateNiche(niche.id, { is_active: !niche.is_active });
            toast({ title: niche.is_active ? "Niche deactivated" : "Niche reactivated" });
            fetchData();
        } catch {
            toast({ title: "Error", description: "Toggle failed", variant: "destructive" });
        }
    };

    const startEditNiche = (niche: Niche) => {
        setEditingNiche(niche);
        setShowNicheForm(niche.category_id);
        setNicheName(niche.name);
        setNicheSlug(niche.slug);
        setNicheSortOrder(niche.sort_order);
    };

    // ── Helpers ────────────────────────────────────

    const getNichesForCategory = (catId: string) =>
        niches.filter((n) => n.category_id === catId);

    if (loading && categories.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <FolderTree className="w-5 h-5" />
                        Categories & Niches Management
                    </CardTitle>
                    <Button
                        size="sm"
                        onClick={() => {
                            resetCategoryForm();
                            setShowCategoryForm(true);
                        }}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Category
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Manage categories and their niches. Deleting only soft-deactivates items.
                        Total: {categories.length} categories, {niches.length} niches
                    </p>
                </CardContent>
            </Card>

            {/* Create / Edit Category Form */}
            {showCategoryForm && (
                <Card className="border-primary/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            {editingCategory ? "Edit Category" : "New Category"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                placeholder="Category name"
                                value={categoryName}
                                onChange={(e) => {
                                    setCategoryName(e.target.value);
                                    if (!editingCategory) setCategorySlug(slugify(e.target.value));
                                }}
                            />
                            <Input
                                placeholder="slug (auto-generated)"
                                value={categorySlug}
                                onChange={(e) => setCategorySlug(e.target.value)}
                            />
                            <Input
                                type="number"
                                placeholder="Sort order"
                                value={categorySortOrder}
                                onChange={(e) => setCategorySortOrder(Number(e.target.value))}
                            />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button size="sm" onClick={handleCategorySave}>
                                <Save className="w-4 h-4 mr-1" />
                                {editingCategory ? "Update" : "Create"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={resetCategoryForm}>
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Category List */}
            {categories.map((cat) => {
                const catNiches = getNichesForCategory(cat.id);
                const isExpanded = expandedCategoryId === cat.id;

                return (
                    <Card key={cat.id} className={!cat.is_active ? "opacity-60" : ""}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() =>
                                        setExpandedCategoryId(isExpanded ? null : cat.id)
                                    }
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                    <FolderTree className="w-4 h-4 text-primary" />
                                    <span className="font-semibold">{cat.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                        {cat.slug}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                        {catNiches.length} niches
                                    </Badge>
                                    {!cat.is_active && (
                                        <Badge variant="destructive" className="text-xs">
                                            Inactive
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEditCategory(cat)}
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleCategoryToggleActive(cat)}
                                    >
                                        {cat.is_active ? "Deactivate" : "Reactivate"}
                                    </Button>
                                    {!cat.is_active && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive"
                                            onClick={() => handleCategoryDelete(cat.id)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>

                        {isExpanded && (
                            <CardContent className="pt-0">
                                <div className="ml-6 border-l-2 border-muted pl-4 space-y-3">
                                    {/* Niche Add button */}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="mb-2"
                                        onClick={() => {
                                            resetNicheForm();
                                            setShowNicheForm(cat.id);
                                        }}
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                        Add Niche
                                    </Button>

                                    {/* Niche form */}
                                    {showNicheForm === cat.id && (
                                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                            <p className="text-sm font-medium">
                                                {editingNiche ? "Edit Niche" : "New Niche"}
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <Input
                                                    placeholder="Niche name"
                                                    value={nicheName}
                                                    onChange={(e) => {
                                                        setNicheName(e.target.value);
                                                        if (!editingNiche)
                                                            setNicheSlug(slugify(e.target.value));
                                                    }}
                                                />
                                                <Input
                                                    placeholder="slug (auto)"
                                                    value={nicheSlug}
                                                    onChange={(e) => setNicheSlug(e.target.value)}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Sort order"
                                                    value={nicheSortOrder}
                                                    onChange={(e) =>
                                                        setNicheSortOrder(Number(e.target.value))
                                                    }
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={handleNicheSave}>
                                                    <Save className="w-3.5 h-3.5 mr-1" />
                                                    {editingNiche ? "Update" : "Create"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={resetNicheForm}
                                                >
                                                    <X className="w-3.5 h-3.5 mr-1" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Niche list */}
                                    {catNiches.length === 0 ? (
                                        <p className="text-sm text-muted-foreground py-2">
                                            No niches in this category yet.
                                        </p>
                                    ) : (
                                        catNiches.map((niche) => (
                                            <div
                                                key={niche.id}
                                                className={`flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 ${!niche.is_active ? "opacity-50" : ""}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span className="text-sm font-medium">
                                                        {niche.name}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {niche.slug}
                                                    </Badge>
                                                    {!niche.is_active && (
                                                        <Badge
                                                            variant="destructive"
                                                            className="text-xs"
                                                        >
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-xs"
                                                        onClick={() => startEditNiche(niche)}
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-xs"
                                                        onClick={() =>
                                                            handleNicheToggleActive(niche)
                                                        }
                                                    >
                                                        {niche.is_active
                                                            ? "Deactivate"
                                                            : "Reactivate"}
                                                    </Button>
                                                    {!niche.is_active && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 text-xs text-destructive"
                                                            onClick={() =>
                                                                handleNicheDelete(niche.id)
                                                            }
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                );
            })}

            {categories.length === 0 && !loading && (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <FolderTree className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>No categories yet. Click "Add Category" to create one.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
