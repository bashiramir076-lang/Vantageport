// Items Management - CRUD operations with interactive feedback
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Loader2, AlertCircle, Image as ImageIcon, Upload, X, CheckCircle, AlertTriangle, FileVideo, FileImage, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import ProtectedRoute from "@/components/ProtectedRoute";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface PortfolioItem {
  id: number;
  categoryId: number;
  category?: Category;
  title: string;
  description?: string;
  fileUrl: string;
  fileKey: string;
  fileType: string;
  thumbnail?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  categoryId: string;
  title: string;
  description: string;
  fileUrl: string;
  fileKey: string;
  fileType: string;
  thumbnail: string;
  order: string;
}

function ItemsManagementContent() {
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    categoryId: "",
    title: "",
    description: "",
    fileUrl: "",
    fileKey: "",
    fileType: "image",
    thumbnail: "",
    order: "0",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [itemsRes, categoriesRes] = await Promise.all([
        fetch("/api/portfolio/items"),
        fetch("/api/portfolio/categories"),
      ]);

      if (!itemsRes.ok || !categoriesRes.ok) {
        throw new Error("فشل في جلب البيانات");
      }

      const itemsData = await itemsRes.json();
      const categoriesData = await categoriesRes.json();

      setItems(itemsData);
      setCategories(categoriesData);
    } catch (error) {
      toast.error("❌ حدث خطأ في جلب البيانات", {
        description: "يرجى المحاولة مرة أخرى",
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file matches selected type
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (formData.fileType === "image" && !isImage) {
      toast.error("❌ خطأ في نوع الملف", {
        description: "لقد اخترت 'صورة' ولكن الملف المرفوع ليس صورة",
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (formData.fileType === "video" && !isVideo) {
      toast.error("❌ خطأ في نوع الملف", {
        description: "لقد اخترت 'فيديو' ولكن الملف المرفوع ليس فيديو",
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      toast.loading("⏳ جاري رفع الملف...", { id: "upload" });
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "فشل في رفع الملف");
      }

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        fileUrl: data.fileUrl,
        fileKey: data.fileKey,
        // Update fileType based on server response to ensure consistency
        fileType: data.fileType || prev.fileType, 
      }));
      
      toast.success("✅ تم رفع الملف بنجاح", {
        id: "upload",
        description: `تم رفع: ${file.name}`,
        icon: <CheckCircle className="w-5 h-5" />,
      });
    } catch (error) {
      toast.error("❌ فشل رفع الملف", {
        description: error instanceof Error ? error.message : "تأكد من أن الملف صورة أو فيديو صحيح",
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      console.error(error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleOpenDialog = (item?: PortfolioItem) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        categoryId: item.categoryId.toString(),
        title: item.title,
        description: item.description || "",
        fileUrl: item.fileUrl,
        fileKey: item.fileKey,
        fileType: item.fileType,
        thumbnail: item.thumbnail || "",
        order: item.order.toString(),
      });
    } else {
      setEditingId(null);
      setFormData({
        categoryId: "",
        title: "",
        description: "",
        fileUrl: "",
        fileKey: "",
        fileType: "image",
        thumbnail: "",
        order: "0",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId) {
      toast.error("❌ الفئة مطلوبة", {
        description: "يرجى اختيار فئة للعمل",
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      return;
    }

    if (!formData.title.trim()) {
      toast.error("❌ العنوان مطلوب", {
        description: "يرجى إدخال عنوان للعمل",
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      return;
    }

    if (!formData.fileUrl.trim()) {
      toast.error("❌ الملف مطلوب", {
        description: "يرجى رفع صورة أو فيديو",
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      return;
    }

    setIsSaving(true);
    const isEditing = !!editingId;
    const toastId = `save-${Date.now()}`;

    try {
      toast.loading(isEditing ? "⏳ جاري تحديث العمل..." : "⏳ جاري إضافة العمل...", { id: toastId });

      const url = editingId ? `/api/portfolio/items/${editingId}` : "/api/portfolio/items";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: parseInt(formData.categoryId),
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          fileUrl: formData.fileUrl.trim(),
          fileKey: formData.fileKey.trim(),
          fileType: formData.fileType,
          thumbnail: formData.thumbnail.trim() || undefined,
          order: parseInt(formData.order) || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "فشل في حفظ العمل");
      }

      const successMessage = isEditing ? "✅ تم تحديث العمل بنجاح" : "✅ تم إضافة العمل بنجاح";
      toast.success(successMessage, {
        id: toastId,
        description: `"${formData.title}" ${isEditing ? "تم تحديثه" : "تمت إضافته"} بنجاح`,
        icon: <CheckCircle className="w-5 h-5" />,
      });

      handleCloseDialog();
      await fetchData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ في حفظ العمل";
      toast.error("❌ فشل في حفظ العمل", {
        id: toastId,
        description: errorMessage,
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingId) return;

    setIsSaving(true);
    const toastId = `delete-${Date.now()}`;

    try {
      toast.loading("⏳ جاري حذف العمل...", { id: toastId });

      const response = await fetch(`/api/portfolio/items/${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "فشل في حذف العمل");
      }

      toast.success("✅ تم حذف العمل بنجاح", {
        id: toastId,
        description: "تم حذف العمل من المحفظة",
        icon: <CheckCircle className="w-5 h-5" />,
      });

      setIsDeleteDialogOpen(false);
      setDeletingId(null);
      await fetchData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ في حذف العمل";
      toast.error("❌ فشل في حذف العمل", {
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
            <h1 className="text-3xl font-bold">إدارة الأعمال</h1>
            <p className="text-slate-400">إضافة وتعديل وحذف أعمال المحفظة</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-green-600 hover:bg-green-700 gap-2 text-white font-semibold w-full md:w-auto"
            >
              <Plus className="w-4 h-4" /> إضافة عمل جديد
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
                <p className="text-slate-400 text-lg">⏳ جاري تحميل الأعمال...</p>
              </div>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card className="border-slate-700 bg-slate-800">
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 mb-6 text-lg">لا توجد أعمال حالياً</p>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-green-600 hover:bg-green-700 gap-2 text-white font-semibold"
                >
                  <Plus className="w-4 h-4" /> إضافة أول عمل
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
                  <TableHead className="text-slate-300 font-bold">العمل</TableHead>
                  <TableHead className="text-slate-300 font-bold">الفئة</TableHead>
                  <TableHead className="text-slate-300 font-bold">النوع</TableHead>
                  <TableHead className="text-slate-300 font-bold">الترتيب</TableHead>
                  <TableHead className="text-slate-300 font-bold text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="border-slate-700 hover:bg-slate-700/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded overflow-hidden bg-slate-700 flex-shrink-0">
                          {item.fileType === "image" ? (
                            <img src={item.fileUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <FileVideo className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="font-semibold truncate max-w-[200px]">{item.title}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="bg-slate-700 px-2 py-1 rounded text-xs text-slate-300">
                        {item.category?.name || "بدون فئة"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.fileType === "image" ? (
                        <div className="flex items-center gap-1 text-xs text-blue-400">
                          <FileImage className="w-3 h-3" /> صورة
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-purple-400">
                          <FileVideo className="w-3 h-3" /> فيديو
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-400">{item.order}</TableCell>
                    <TableCell className="text-left">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(item)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 transition-colors"
                          title="تعديل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingId(item.id);
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

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingId ? "تعديل العمل" : "إضافة عمل جديد"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                أدخل تفاصيل العمل وقم برفع الملف (صورة أو فيديو)
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveItem} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">العنوان</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="مثال: شعار شركة تقنية"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">الفئة</Label>
                  <select
                    id="category"
                    value={formData.categoryId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full h-10 rounded-md bg-slate-700 border border-slate-600 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">اختر فئة...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>نوع الملف</Label>
                <RadioGroup
                  value={formData.fileType}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, fileType: val }))}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="image" id="type-image" className="border-slate-400 text-green-500" />
                    <Label htmlFor="type-image" className="cursor-pointer">صورة</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="video" id="type-video" className="border-slate-400 text-green-500" />
                    <Label htmlFor="type-video" className="cursor-pointer">فيديو</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label>الملف (صورة أو فيديو)</Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
                    formData.fileUrl ? "border-green-500/50 bg-green-500/5" : "border-slate-600 hover:border-slate-500 bg-slate-700/50"
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
                      <p className="text-slate-400">جاري الرفع...</p>
                    </div>
                  ) : formData.fileUrl ? (
                    <div className="relative group w-full max-w-[200px] aspect-video rounded-lg overflow-hidden bg-slate-900">
                      {formData.fileType === "image" ? (
                        <img src={formData.fileUrl} alt="Preview" className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <FileVideo className="w-10 h-10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-bold">تغيير الملف</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-slate-200">اضغط للرفع</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formData.fileType === "image" ? "PNG, JPG, GIF حتى 10MB" : "MP4 حتى 50MB"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept={formData.fileType === "image" ? "image/*" : "video/*"}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف (اختياري)</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full min-h-[100px] rounded-md bg-slate-700 border border-slate-600 text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="أضف تفاصيل إضافية عن العمل..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="order">الترتيب</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, order: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thumbnail">رابط الصورة المصغرة (للفيديو فقط)</Label>
                  <Input
                    id="thumbnail"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, thumbnail: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="رابط الصورة المصغرة"
                    disabled={formData.fileType !== "video"}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      جاري الحفظ...
                    </>
                  ) : (
                    editingId ? "تحديث العمل" : "إضافة العمل"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">هل أنت متأكد من حذف هذا العمل؟</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                لا يمكن التراجع عن هذا الإجراء. سيتم حذف العمل نهائياً من المحفظة.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 mt-4">
              <AlertDialogCancel className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white">
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteItem}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                حذف العمل
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function ItemsManagement() {
  return (
    <ProtectedRoute requiredAuth={true}>
      <ItemsManagementContent />
    </ProtectedRoute>
  );
}
