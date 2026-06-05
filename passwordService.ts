// Categories Management - CRUD operations with interactive feedback
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Loader2, AlertCircle, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
}

function CategoriesManagementContent() {
  const [, setLocation] = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    slug: "",
    description: "",
    icon: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/portfolio/categories");
      if (!response.ok) throw new Error("فشل في جلب الفئات");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toast.error("❌ حدث خطأ في جلب الفئات", {
        description: "يرجى المحاولة مرة أخرى",
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
    }));
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        icon: category.icon || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        icon: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("❌ الاسم مطلوب", {
        description: "يرجى إدخال اسم الفئة",
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      return;
    }

    if (!formData.slug.trim()) {
      toast.error("❌ الـ Slug مطلوب", {
        description: "يرجى إدخال slug صحيح للفئة",
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      return;
    }

    setIsSaving(true);
    const isEditing = !!editingId;
    const toastId = `save-cat-${Date.now()}`;

    try {
      toast.loading(isEditing ? "⏳ جاري تحديث الفئة..." : "⏳ جاري إضافة الفئة...", { id: toastId });

      const url = editingId ? `/api/portfolio/categories/${editingId}` : "/api/portfolio/categories";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || undefined,
          icon: formData.icon.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "فشل في حفظ الفئة");
      }

      const successMessage = isEditing ? "✅ تم تحديث الفئة بنجاح" : "✅ تم إضافة الفئة بنجاح";
      toast.success(successMessage, {
        id: toastId,
        description: `"${formData.name}" ${isEditing ? "تم تحديثها" : "تمت إضافتها"} بنجاح`,
        icon: <CheckCircle className="w-5 h-5" />,
      });

      handleCloseDialog();
      await fetchCategories();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ في حفظ الفئة";
      toast.error("❌ فشل في حفظ الفئة", {
        id: toastId,
        description: errorMessage,
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingId) return;

    setIsSaving(true);
    const toastId = `delete-cat-${Date.now()}`;

    try {
      toast.loading("⏳ جاري حذف الفئة...", { id: toastId });

      const response = await fetch(`/api/portfolio/categories/${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "فشل في حذف الفئة");
      }

      toast.success("✅ تم حذف الفئة بنجاح", {
        id: toastId,
        description: "تم حذف الفئة من المحفظة",
        icon: <CheckCircle className="w-5 h-5" />,
      });

      setIsDeleteDialogOpen(false);
      setDeletingId(null);
      await fetchCategories();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ في حذف الفئة";
      toast.error("❌ فشل في حذف الفئة", {
        id: toastId,
        description: errorMessage,
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">إدارة الفئات</h1>
            <p className="text-slate-400">إضافة وتعديل وحذف فئات المحفظة</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-green-600 hover:bg-green-700 gap-2 text-white font-semibold w-full md:w-auto"
            >
              <Plus className="w-4 h-4" /> إضافة فئة جديدة
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/admin")}
              className="text-slate-400 hover:text-white hover:bg-slate-800 gap-2 px-2"
            >
              <ArrowRight className="w-4 h-4" /> العودة للوحة التحكم
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card className="border-slate-700 bg-slate-800">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                <p className="text-slate-400 text-lg">⏳ جاري تحميل الفئات...</p>
              </div>
            </CardContent>
          </Card>
        ) : categories.length === 0 ? (
          <Card className="border-slate-700 bg-slate-800">
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 mb-6 text-lg">لا توجد فئات حالياً</p>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-green-600 hover:bg-green-700 gap-2 text-white font-semibold"
                >
                  <Plus className="w-4 h-4" /> إنشاء أول فئة
                </Button>
                <div className="mt-6">
                  <Button
                    variant="link"
                    onClick={() => setLocation("/admin")}
                    className="text-slate-500 hover:text-slate-300 gap-2"
                  >
                    <ArrowRight className="w-4 h-4" /> العودة للوحة التحكم
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent bg-slate-700/50">
                  <TableHead className="text-slate-300 font-bold">الاسم</TableHead>
                  <TableHead className="text-slate-300 font-bold">الـ Slug</TableHead>
                  <TableHead className="text-slate-300 font-bold">الوصف</TableHead>
                  <TableHead className="text-slate-300 font-bold text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} className="border-slate-700 hover:bg-slate-700/50 transition-colors">
                    <TableCell className="font-semibold">{category.name}</TableCell>
                    <TableCell>
                      <code className="bg-slate-700 px-2 py-1 rounded text-sm text-slate-300">
                        {category.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-slate-400 max-w-xs truncate">
                      {category.description || "-"}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(category)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 transition-colors"
                          title="تعديل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingId(category.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingId ? "✏️ تعديل الفئة" : "➕ إضافة فئة جديدة"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingId ? "قم بتعديل بيانات الفئة" : "أدخل بيانات الفئة الجديدة"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label className="text-slate-200 font-semibold">اسم الفئة *</Label>
                <Input
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="مثال: تصميم ويب"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500"
                  required
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label className="text-slate-200 font-semibold">الـ Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={handleSlugChange}
                  placeholder="web-design"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500"
                  required
                />
                <p className="text-xs text-slate-400">يتم إنشاؤه تلقائياً من الاسم</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-slate-200 font-semibold">الوصف</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف الفئة (اختياري)"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500"
                />
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label className="text-slate-200 font-semibold">الأيقونة</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="رابط الأيقونة (اختياري)"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving || !formData.name.trim() || !formData.slug.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      {editingId ? "جاري التحديث..." : "جاري الإضافة..."}
                    </>
                  ) : editingId ? (
                    "✅ تحديث"
                  ) : (
                    "✅ إضافة"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isSaving}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  ❌ إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">⚠️ تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400 text-base">
                هل أنت متأكد من حذف هذه الفئة؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-3 mt-6">
              <AlertDialogCancel
                disabled={isSaving}
                className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                ❌ إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCategory}
                disabled={isSaving}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2 inline" />
                    جاري الحذف...
                  </>
                ) : (
                  "🗑️ حذف نهائياً"
                )}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function CategoriesManagement() {
  return (
    <ProtectedRoute requiredAuth={true}>
      <CategoriesManagementContent />
    </ProtectedRoute>
  );
}
