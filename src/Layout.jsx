import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { WorkspaceProvider, useWorkspace } from '@/components/workspace/WorkspaceContext';
import WorkspaceSwitcher from '@/components/workspace/WorkspaceSwitcher';
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Factory, 
  Tag, 
  FolderKanban,
  Settings,
  LogOut,
  Shield,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useState } from 'react';
import { cn } from "@/lib/utils";

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const { user, isPlatformAdmin, activeWorkspace, loading, workspaces, isClientUser, activeAccountId, accountAssignments } = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  // CRM Navigation items (for consultants)
  const crmNavItems = [
    { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
    { name: 'Accounts', page: 'Accounts', icon: Building2 },
    { name: 'Contacts', page: 'Contacts', icon: Users },
    { name: 'Facilities', page: 'Facilities', icon: Factory },
    { name: 'Brands', page: 'Brands', icon: Tag },
    { name: 'Projects', page: 'Projects', icon: FolderKanban },
  ];

  // Client Portal Navigation items
  const clientNavItems = [
    { name: 'Dashboard', page: 'ClientDashboard', icon: LayoutDashboard },
    { name: 'My Company', page: 'ClientAccountView', icon: Building2 },
    { name: 'Projects', page: 'ClientProjects', icon: FolderKanban },
  ];

  // Platform Admin items
  const platformAdminItems = [
    { name: 'SaaS Dashboard', page: 'SaaSDashboard', icon: TrendingUp },
    { name: 'Control Center', page: 'ControlCenter', icon: Shield },
    { name: 'Opportunities', page: 'Opportunities', icon: TrendingUp },
  ];

  // Don't show layout for onboarding
  if (currentPageName === 'Onboarding' || currentPageName === 'CreateWorkspace') {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  // Redirect to onboarding if no workspaces
  if (!loading && workspaces.length === 0 && currentPageName !== 'Onboarding' && currentPageName !== 'CreateWorkspace') {
    window.location.href = createPageUrl('Onboarding');
    return null;
  }

  // Client users with multiple accounts and no active account - show picker
  const clientPages = ['ClientDashboard', 'ClientAccountView', 'ClientProjects'];
  if (!loading && isClientUser && accountAssignments.length > 1 && !activeAccountId && clientPages.includes(currentPageName)) {
    return <AccountPicker />;
  }

  // Client users with no account assignments - show error
  if (!loading && isClientUser && accountAssignments.length === 0 && clientPages.includes(currentPageName)) {
    return <AccountPicker />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-50">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-semibold text-slate-900 hidden sm:block">MOCRA 360</span>
            </Link>
            <div className="hidden md:block ml-2">
              <WorkspaceSwitcher />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isPlatformAdmin && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium hidden lg:block whitespace-nowrap">
                Platform Admin
              </span>
            )}
            <span className="text-sm text-slate-600 hidden lg:block">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-14 bottom-0 w-64 bg-white border-r border-slate-200 z-40 transition-transform lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 md:hidden">
          <WorkspaceSwitcher />
        </div>
        <nav className="p-4 space-y-1">
          {activeWorkspace && !isClientUser && (
            <>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 mb-2">
                CRM
              </p>
              {crmNavItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-slate-100 text-slate-900" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </>
          )}

          {activeWorkspace && isClientUser && (
            <>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 mb-2">
                Client Portal
              </p>
              {clientNavItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-blue-100 text-blue-900" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </>
          )}

          {isPlatformAdmin && (
            <>
              <div className="pt-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 mb-2">
                  Platform Admin
                </p>
                {platformAdminItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-amber-100 text-amber-900" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {!isClientUser && (
            <div className="pt-4">
              <Link
                to={createPageUrl('WorkspaceSettings')}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  currentPageName === 'WorkspaceSettings'
                    ? "bg-slate-100 text-slate-900" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Settings className="h-4 w-4" />
                Workspace Settings
              </Link>
            </div>
          )}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:pl-64 pt-14">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <WorkspaceProvider>
      <LayoutContent currentPageName={currentPageName}>
        {children}
      </LayoutContent>
    </WorkspaceProvider>
  );
}