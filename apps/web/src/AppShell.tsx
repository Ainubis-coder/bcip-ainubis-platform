import React, { useState, useEffect, useCallback } from 'react';
import { ModuleId } from './types/navigation';
import { TenantContext } from './types/tenant';
import { AVAILABLE_TENANTS, CURRENT_USER, INITIAL_NOTIFICATIONS } from './data/mock-notifications-data';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { MobileNavigation } from './components/MobileNavigation';
import { DashboardView } from './components/DashboardView';
import { ModulePlaceholderView } from './components/ModulePlaceholderView';
import { AinubisIntelligencePanel } from './components/AinubisIntelligencePanel';
import { ApiStatusModal } from './components/ApiStatusModal';
import { DesignSystemShowcase } from './components/DesignSystemShowcase';
import { CrmPipelinePage, LeadsPage, OrganisationsPage, SchemeProspectsPage, ActivitiesPage, TasksPage } from './components/crm';
import { AinubisIntelligencePage } from './components/ainubis';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { NotificationPanel } from './components/NotificationPanel';
import { TenantContextModal } from './components/TenantContextModal';
import { AinubisDrawer } from './components/AinubisDrawer';
import { ShellErrorBoundary } from './components/ShellStates';

export function AppShell() {
  // Navigation & Route State
  const [currentModule, setCurrentModule] = useState<ModuleId>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      let hash = window.location.hash.replace('#', '') as ModuleId;
      if (hash === ('crm/organisations' as any)) hash = 'organisations';
      if (hash === ('crm/scheme-prospects' as any)) hash = 'scheme_prospects';
      if (hash === ('crm/activities' as any)) hash = 'activities';
      if (hash === ('crm/tasks' as any)) hash = 'tasks';
      const validModules: ModuleId[] = [
        'dashboard', 'crm', 'leads', 'organisations', 'scheme_prospects', 'activities', 'schemes', 'properties',
        'finance', 'invoices', 'payments', 'maintenance', 'contractors',
        'governance', 'documents', 'integrations', 'analytics', 'ainubis',
        'alerts', 'recommendations', 'tasks', 'notifications', 'administration', 'design_system'
      ];
      if (validModules.includes(hash)) return hash;
    }
    return 'dashboard';
  });

  // Shell Layout & Overlays State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bcip_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isAinubisDrawerOpen, setIsAinubisDrawerOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Tenant & User Context State
  const [activeTenant, setActiveTenant] = useState<TenantContext>(AVAILABLE_TENANTS[0]);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [apiHealthy, setApiHealthy] = useState<boolean>(true);

  // Synchronize route navigation with URL hash
  const navigateTo = useCallback((module: ModuleId) => {
    setCurrentModule(module);
    if (typeof window !== 'undefined') {
      window.location.hash = module;
    }
  }, []);

  // Listen to browser hash changes (Back/Forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ModuleId;
      if (hash && hash !== currentModule) {
        setCurrentModule(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentModule]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Persist sidebar collapsed state
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('bcip_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  // Poll API health quietly
  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch('/health');
        if (res.ok) {
          setApiHealthy(true);
        } else {
          setApiHealthy(false);
        }
      } catch {
        setApiHealthy(true);
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Global Top Bar (3-Zone Contract) */}
      <TopBar
        currentModule={currentModule}
        onNavigate={navigateTo}
        onOpenStatusModal={() => setIsStatusModalOpen(true)}
        apiHealthy={apiHealthy}
        activeTenant={activeTenant}
        onOpenTenantModal={() => setIsTenantModalOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenAinubisDrawer={() => setIsAinubisDrawerOpen(true)}
        user={CURRENT_USER}
        onToggleMobileNav={() => setIsMobileNavOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebarCollapse={handleToggleSidebar}
      />

      {/* Main Structural Layout: Sidebar + Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Enterprise Collapsible Sidebar Navigation */}
        <Sidebar
          currentModule={currentModule}
          onNavigate={navigateTo}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          onOpenAinubisDrawer={() => setIsAinubisDrawerOpen(true)}
        />

        {/* Accessible Mobile Navigation Drawer */}
        <MobileNavigation
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          currentModule={currentModule}
          onNavigate={navigateTo}
          activeTenant={activeTenant}
          onOpenTenantModal={() => setIsTenantModalOpen(true)}
          user={CURRENT_USER}
        />

        {/* Primary Application Workspace wrapped in Error Boundary */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          <ShellErrorBoundary onNavigateHome={() => navigateTo('dashboard')}>
            <div className="flex-1 p-4 sm:p-6 lg:p-8">
              {currentModule === 'dashboard' && (
                <DashboardView
                  onNavigate={navigateTo}
                  onOpenStatusModal={() => setIsStatusModalOpen(true)}
                  apiHealthy={apiHealthy}
                />
              )}

              {currentModule === 'crm' && (
                <CrmPipelinePage
                  activeTenant={activeTenant}
                  user={CURRENT_USER}
                  onNavigate={navigateTo}
                  onOpenStatusModal={() => setIsStatusModalOpen(true)}
                />
              )}

              {currentModule === 'leads' && (
                <LeadsPage
                  activeTenant={activeTenant}
                  user={CURRENT_USER}
                  onNavigate={navigateTo}
                  onOpenStatusModal={() => setIsStatusModalOpen(true)}
                />
              )}

              {currentModule === 'organisations' && (
                <OrganisationsPage
                  activeTenant={activeTenant}
                  user={CURRENT_USER}
                  onNavigate={navigateTo}
                  onOpenStatusModal={() => setIsStatusModalOpen(true)}
                />
              )}

              {currentModule === 'scheme_prospects' && (
                <SchemeProspectsPage
                  activeTenant={activeTenant}
                  user={CURRENT_USER}
                  onNavigate={navigateTo}
                  onOpenStatusModal={() => setIsStatusModalOpen(true)}
                />
              )}

              {currentModule === 'activities' && (
                <ActivitiesPage
                  activeTenant={activeTenant}
                  user={CURRENT_USER}
                  onNavigate={navigateTo}
                  onOpenStatusModal={() => setIsStatusModalOpen(true)}
                />
              )}

              {currentModule === 'tasks' && (
                <TasksPage
                  activeTenant={activeTenant}
                  user={CURRENT_USER}
                  onNavigate={navigateTo}
                  onOpenStatusModal={() => setIsStatusModalOpen(true)}
                />
              )}

              {currentModule === 'ainubis' && (
                <AinubisIntelligencePage
                  activeTenant={activeTenant}
                  user={CURRENT_USER}
                  onNavigate={navigateTo}
                  onOpenStatusModal={() => setIsStatusModalOpen(true)}
                />
              )}

              {currentModule === 'design_system' && (
                <DesignSystemShowcase />
              )}

              {currentModule !== 'dashboard' &&
                currentModule !== 'crm' &&
                currentModule !== 'leads' &&
                currentModule !== 'organisations' &&
                currentModule !== 'scheme_prospects' &&
                currentModule !== 'activities' &&
                currentModule !== 'tasks' &&
                currentModule !== 'ainubis' &&
                currentModule !== 'design_system' && (
                  <ModulePlaceholderView
                    moduleId={currentModule}
                    onNavigateBack={() => navigateTo('dashboard')}
                    onOpenStatusModal={() => setIsStatusModalOpen(true)}
                  />
                )}
            </div>
          </ShellErrorBoundary>
        </main>
      </div>

      {/* Global Overlays & Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={(mod) => navigateTo(mod)}
      />

      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onSelectNotification={(actionUrl) => {
          if (actionUrl) navigateTo(actionUrl as ModuleId);
        }}
      />

      <TenantContextModal
        isOpen={isTenantModalOpen}
        onClose={() => setIsTenantModalOpen(false)}
        activeTenant={activeTenant}
        onSwitchTenant={(tenant) => setActiveTenant(tenant)}
      />

      <AinubisDrawer
        isOpen={isAinubisDrawerOpen}
        onClose={() => setIsAinubisDrawerOpen(false)}
        onNavigate={navigateTo}
      />

      <ApiStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />
    </div>
  );
}
