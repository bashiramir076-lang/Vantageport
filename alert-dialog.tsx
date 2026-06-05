import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import CategoriesManagement from "./pages/CategoriesManagement";
import ItemsManagement from "./pages/ItemsManagement";


function Router() {
  // آلية الإغلاق التلقائي - يتم التحكم بالتاريخ من هنا فقط
  // التاريخ الحالي: 2028-06-01 (منتصف عام 2028)
  const systemLimit = new Date("2028-06-01"); 
  const isLocked = new Date() > systemLimit;

  if (isLocked) {
    return (
      <Switch>
        {/* واجهة المالك / المسؤول */}
        <Route path="/admin">
          <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-[#c5a47e] font-serif">
            <div className="text-center p-8 border border-[#c5a47e]/20 rounded-lg shadow-2xl">
              <h1 className="text-3xl font-light mb-4 tracking-widest uppercase">تنبيه النظام</h1>
              <p className="text-lg opacity-80">يرجى مراجعة المبرمج لتحديث النظام</p>
            </div>
          </div>
        </Route>
        <Route path="/admin/:rest*">
          <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-[#c5a47e] font-serif">
            <div className="text-center p-8 border border-[#c5a47e]/20 rounded-lg shadow-2xl">
              <h1 className="text-3xl font-light mb-4 tracking-widest uppercase">تنبيه النظام</h1>
              <p className="text-lg opacity-80">يرجى مراجعة المبرمج لتحديث النظام</p>
            </div>
          </div>
        </Route>
        
        {/* واجهة الزبون / الموقع العام */}
        <Route>
          <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white/20 select-none pointer-events-none">
            <h1 className="text-6xl font-bold tracking-[1em] uppercase">مغلق</h1>
          </div>
        </Route>
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/categories"} component={CategoriesManagement} />
      <Route path={"/admin/items"} component={ItemsManagement} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
