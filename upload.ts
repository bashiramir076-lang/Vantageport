// Admin Dashboard - Password management and WhatsApp settings
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Lock, ArrowRight, FolderOpen, FileText, MessageCircle, Loader2, AlertTriangle, CheckCircle, User } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import ProtectedRoute from "@/components/ProtectedRoute";

interface AdminSettings {
  username?: string;
  whatsappNumber?: string;
}

const COUNTRY_CODES = {
  SA: { name: "🇸🇦 السعودية", code: "966", prefix: "+966" },
  YE: { name: "🇾🇪 اليمن", code: "967", prefix: "+967" },
};

function AdminDashboardContent() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"verify" | "change" | "whatsapp">("verify");
  
  // WhatsApp settings
  const [whatsappCountry, setWhatsappCountry] = useState<"SA" | "YE">("SA");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<AdminSettings>({});

  useEffect(() => {
    fetchAdminSettings();
  }, []);

  const fetchAdminSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setCurrentSettings(data);
        setNewUsername(data.username || "Ali");
        
        // Parse existing WhatsApp number
        if (data.whatsappNumber) {
          const num = data.whatsappNumber;
          if (num.startsWith("966")) {
            setWhatsappCountry("SA");
            setWhatsappNumber(num.substring(3));
          } else if (num.startsWith("967")) {
            setWhatsappCountry("YE");
            setWhatsappNumber(num.substring(3));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: currentSettings.username || "Ali", 
          password: currentPassword 
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setIsAuthenticated(true);
        toast.success("✅ تم التحقق من كلمة المرور بنجاح", {
          icon: <CheckCircle className="w-5 h-5" />,
        });
        setActiveTab("change");
      } else {
        toast.error("❌ كلمة المرور غير صحيحة", {
          icon: <AlertTriangle className="w-5 h-5" />,
        });
      }
    } catch (error) {
      toast.error("❌ حدث خطأ في التحقق من كلمة المرور", {
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      toast.error("❌ كلمات المرور الجديدة غير متطابقة", {
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error("❌ كلمة المرور ضعيفة", {
        description: "يجب أن تكون كلمة المرور 6 خانات على الأقل",
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      return;
    }

    if (!newUsername.trim()) {
      toast.error("❌ اسم المستخدم مطلوب", {
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/change-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPassword || "",
          newUsername: newUsername.trim(),
          newPassword: newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("✅ تم تحديث بيانات الدخول بنجاح", {
          icon: <CheckCircle className="w-5 h-5" />,
        });
        setIsAuthenticated(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setActiveTab("verify");
        fetchAdminSettings();
      } else {
        toast.error("❌ " + (data.error || "حدث خطأ في التحديث"), {
          icon: <AlertTriangle className="w-5 h-5" />,
        });
      }
    } catch (error) {
      toast.error("❌ حدث خطأ في تحديث البيانات", {
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminPassword) {
      toast.error("❌ كلمة المرور مطلوبة", {
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      return;
    }

    if (!whatsappNumber.trim()) {
      toast.error("❌ رقم الواتساب مطلوب", {
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      return;
    }

    const cleanNumber = whatsappNumber.replace(/\D/g, "");
    if (cleanNumber.length !== 9) {
      toast.error("❌ رقم الواتساب يجب أن يكون 9 أرقام", {
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      return;
    }

    setIsSavingWhatsapp(true);
    const toastId = `whatsapp-${Date.now()}`;

    try {
      toast.loading("⏳ جاري حفظ رقم الواتساب...", { id: toastId });

      const countryCode = COUNTRY_CODES[whatsappCountry].code;
      const fullNumber = countryCode + cleanNumber;

      const response = await fetch("/api/admin/update-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentSettings.username || "Ali",
          password: adminPassword,
          whatsappNumber: fullNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("✅ تم حفظ رقم الواتساب بنجاح", {
          id: toastId,
          description: `${COUNTRY_CODES[whatsappCountry].prefix}${cleanNumber}`,
          icon: <CheckCircle className="w-5 h-5" />,
        });
        setAdminPassword("");
        setCurrentSettings(prev => ({ ...prev, whatsappNumber: fullNumber }));
      } else {
        toast.error("❌ " + (data.error || "فشل في حفظ الرقم"), {
          id: toastId,
          icon: <AlertTriangle className="w-5 h-5" />,
        });
      }
    } catch (error) {
      toast.error("❌ حدث خطأ في حفظ رقم الواتساب", {
        id: toastId,
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      console.error(error);
    } finally {
      setIsSavingWhatsapp(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Lock className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">لوحة التحكم</h1>
          </div>
          <p className="text-slate-400">إدارة بيانات الدخول والإعدادات والواتساب</p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {!isAuthenticated ? (
            // Step 1: Verify Password
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-right">الخطوة 1: التحقق من الهوية</CardTitle>
                <CardDescription className="text-right">أدخل كلمة المرور الحالية للمتابعة</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyPassword} className="space-y-4">
                  <div className="space-y-2 text-right">
                    <Label htmlFor="current-password" className="text-slate-200">
                      كلمة المرور الحالية
                    </Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="أدخل كلمة المرور الحالية"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 text-right"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading || !currentPassword}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        جاري التحقق...
                      </>
                    ) : (
                      "التحقق"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            // Step 2: Change Auth Info
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <CardTitle className="text-white">تعديل بيانات الدخول</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-right">يمكنك تغيير اسم المستخدم وكلمة المرور من هنا</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangeAuth} className="space-y-4">
                  <div className="space-y-2 text-right">
                    <Label htmlFor="new-username" className="text-slate-200">
                      اسم المستخدم الجديد
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-username"
                        type="text"
                        placeholder="أدخل اسم المستخدم الجديد"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 text-right pr-10"
                        required
                      />
                      <User className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Label htmlFor="new-password" className="text-slate-200">
                      كلمة المرور الجديدة (اختياري)
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="اتركها فارغة إذا لم ترد التغيير"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 text-right"
                    />
                  </div>
                  <div className="space-y-2 text-right">
                    <Label htmlFor="confirm-password" className="text-slate-200">
                      تأكيد كلمة المرور الجديدة
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="أعد كتابة كلمة المرور الجديدة"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 text-right"
                      required={!!newPassword}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAuthenticated(false)}
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          جاري الحفظ...
                        </>
                      ) : (
                        "حفظ التغييرات"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* WhatsApp Settings */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                <CardTitle className="text-white">إعدادات الواتساب</CardTitle>
              </div>
              <CardDescription className="text-right">تعديل رقم التواصل الذي يظهر للعملاء</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveWhatsapp} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-right">
                    <Label className="text-slate-200">الدولة</Label>
                    <div className="flex gap-2">
                      {(Object.keys(COUNTRY_CODES) as Array<keyof typeof COUNTRY_CODES>).map((key) => (
                        <Button
                          key={key}
                          type="button"
                          variant={whatsappCountry === key ? "default" : "outline"}
                          onClick={() => setWhatsappCountry(key)}
                          className={`flex-1 ${
                            whatsappCountry === key 
                              ? "bg-blue-600 hover:bg-blue-700 text-white" 
                              : "border-slate-600 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {COUNTRY_CODES[key].name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Label htmlFor="whatsapp-number" className="text-slate-200">
                      رقم الواتساب (9 أرقام)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="whatsapp-number"
                        type="text"
                        placeholder="77xxxxxxx"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 text-left flex-1"
                        required
                      />
                      <div className="bg-slate-700 border border-slate-600 rounded-md px-3 flex items-center text-slate-400 text-sm">
                        {COUNTRY_CODES[whatsappCountry].prefix}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-right">
                  <Label htmlFor="admin-password" className="text-slate-200">
                    كلمة مرور المسؤول (للتأكيد)
                  </Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="أدخل كلمة المرور لحفظ التغيير"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 text-right"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSavingWhatsapp || !whatsappNumber || !adminPassword}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  {isSavingWhatsapp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "💾 حفظ رقم الواتساب"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Admin Menu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => setLocation("/admin/categories")}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2 h-auto py-4"
            >
              <FolderOpen className="w-5 h-5" />
              <div className="text-right">
                <div className="font-semibold">إدارة الفئات</div>
                <div className="text-xs opacity-90">إضافة وتعديل وحذف الفئات</div>
              </div>
            </Button>
            <Button
              onClick={() => setLocation("/admin/items")}
              className="bg-green-600 hover:bg-green-700 text-white gap-2 h-auto py-4"
            >
              <FileText className="w-5 h-5" />
              <div className="text-right">
                <div className="font-semibold">إدارة الأعمال</div>
                <div className="text-xs opacity-90">إضافة وتعديل وحذف الأعمال</div>
              </div>
            </Button>
          </div>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 gap-2"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredAuth={true}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
