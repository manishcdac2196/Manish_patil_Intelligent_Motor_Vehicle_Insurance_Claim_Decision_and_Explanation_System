import React, { useState } from "react";
import { Menu, X, ShieldAlert, LayoutDashboard, FileText, LogOut, Users, Building2, BarChart3 } from "lucide-react";
import { APP_NAME } from "../../constants";
import { useAuth } from "@/context/AuthContext";
import { Link, Outlet, useLocation } from "react-router-dom";


interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // const [localMocksOn, setLocalMocksOn] = useState<boolean>(USE_LOCAL); // REMOVED

  const location = useLocation();
  const path = location.pathname;
  const isCompany = user?.role === "company";

  const pageTitle = () => {
    if (path.includes("/dashboard/claims/new")) return "New Claim";
    if (path.includes("/dashboard/claims/")) return "Claim Details";
    if (path === "/company/dashboard") return "Company Dashboard";
    if (path === "/company/customers") return "Customers";
    return isCompany ? "Company Portal" : "Dashboard";
  };

  const NavItem = ({ icon: Icon, label, to }: any) => {
    return (
      <Link
        to={to}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${isCompany
          ? "text-slate-300 hover:bg-slate-800 hover:text-white"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
      >
        <Icon size={20} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${isCompany ? "bg-slate-100" : "bg-slate-50"}`}>
      {/* Mobile Header */}
      <header
        className={`md:hidden border-b p-4 flex justify-between items-center sticky top-0 z-20 ${isCompany ? "bg-slate-900 text-white border-slate-700" : "bg-white border-slate-200"}`}
      >
        <div
          className={`flex items-center space-x-2 font-bold text-xl ${isCompany ? "text-white" : "text-primary-700"}`}
        >
          <ShieldAlert className="fill-current" />
          <span>
            {APP_NAME} {isCompany && <span className="text-xs font-normal opacity-70">Enterprise</span>}
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`p-2 ${isCompany ? "text-slate-300" : "text-slate-600"}`}
        >
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen w-64 border-r
          transform transition-transform duration-200 ease-in-out z-40
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isCompany ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"}
        `}
      >
        <div className="p-6">
          <div
            className={`flex items-center space-x-2 font-bold text-2xl mb-8 ${isCompany ? "text-white" : "text-primary-700"}`}
          >
            {isCompany ? (
              <Building2 className="w-8 h-8 text-blue-500" />
            ) : (
              <ShieldAlert className="fill-current w-8 h-8" />
            )}
            <span>{APP_NAME}</span>
          </div>

          <nav className="space-y-2">
            {!isCompany && (
              <>
                <NavItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" />
                <NavItem icon={FileText} label="Claims" to="/dashboard/claims-list" />
              </>
            )}

            {isCompany && (
              <>
                <NavItem icon={LayoutDashboard} label="Overview" to="/dashboard/company" />
                <NavItem icon={BarChart3} label="Analytics" to="/dashboard/company/analytics" />
                <NavItem icon={Users} label="Customers" to="/dashboard/company/customers" />
              </>
            )}
          </nav>
        </div>

        {/* User Footer */}
        {user && (
          <div
            className={`absolute bottom-0 w-full p-4 border-t ${isCompany ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-slate-50"}`}
          >
            <div className="flex items-center space-x-3 mb-4">

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isCompany ? "text-white" : "text-slate-900"}`}>
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.company || user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-slate-500 hover:text-red-600 text-sm w-full"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
        {/* Desktop Header */}
        <div
          className={`hidden md:flex justify-between items-center p-6 backdrop-blur sticky top-0 z-10 border-b ${isCompany ? "bg-slate-100/80 border-slate-200" : "bg-white/50 border-slate-200/50"}`}
        >
          <h1 className="text-xl font-semibold text-slate-800">{pageTitle()}</h1>
          <div className="flex items-center space-x-3">
            <Link to="/dashboard/profile" className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600">
              <span className="hidden md:inline">My Profile</span>
            </Link>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
