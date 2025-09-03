import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Calendar, Mail, Menu, X, LogOut, ListTodo, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/SessionContext";

const navItems = [
  { href: "/admin/dashboard", label: "דשבורד", icon: LayoutDashboard },
  { href: "/admin/calendar", label: "יומן", icon: Calendar },
  { href: "/admin/requests", label: "אישור תורים / תיאום מחדש", icon: Mail },
  { href: "/admin/appointments", label: "ניהול תורים", icon: ListTodo },
  { href: "/admin/clients", label: "ניהול לקוחות", icon: Users },
];

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-primary">ניהול</h2>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
          <X className="h-6 w-6" />
        </Button>
      </div>
      <nav className="flex-1 flex flex-col gap-2" dir="rtl">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary justify-center text-center rtl:text-center",
                isActive && "bg-primary/10 text-primary"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span className="w-full text-center">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto">
        <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-2 text-muted-foreground hover:text-primary" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          התנתקות
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen md:flex">
      {/* Mobile-specific overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (works for both mobile and desktop) */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-30 w-full bg-background p-4 transform transition-transform duration-300 ease-in-out sm:w-64 md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
          <div className="w-10" /> {/* Spacer */}
          <h2 className="text-xl font-bold text-primary text-center">ניהול</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
        </header>
        
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;