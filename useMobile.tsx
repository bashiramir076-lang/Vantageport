import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle, User } from "lucide-react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredAuth: boolean;
}

export default function ProtectedRoute({ children, requiredAuth }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already authenticated in session
    const authToken = sessionStorage.getItem("adminAuth");
    if (authToken) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.valid) {
        sessionStorage.setItem("adminAuth", "true");
        setIsAuthenticated(true);
        toast.success("✅ تم تسجيل الدخول بنجاح");
      } else {
        toast.error("❌ بيانات الدخول غير صحيحة", {
          description: "تأكد من اسم المستخدم وكلمة المرور",
          icon: <AlertTriangle className="w-5 h-5" />,
        });
      }
    } catch (error) {
      toast.error("❌ حدث خطأ في التحقق", {
        icon: <AlertTriangle className="w-5 h-5" />,
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!requiredAuth) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 flex items-center justify-center" dir="rtl">
        <div className="max-w-md w-full">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Lock className="w-6 h-6 text-blue-400" />
                <CardTitle className="text-white">الدخول المحمي</CardTitle>
              </div>
              <CardDescription className="text-center">أدخل بيانات المسؤول للوصول إلى لوحة التحكم</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-200">
                    اسم المستخدم
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder="أدخل اسم المستخدم"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 pr-10"
                      required
                    />
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">
                    كلمة المرور
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !username || !password}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      جاري التحقق...
                    </>
                  ) : (
                    "دخول"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  العودة للرئيسية
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
